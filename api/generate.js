export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed')
    return
  }

  const { imageBase64, imageType, productImageUrl, productName, style } = req.body

  if (!imageBase64) {
    res.status(400).json({ error: 'Faltan parámetros' })
    return
  }

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
  if (!REPLICATE_TOKEN) {
    res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' })
    return
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  // Helper: polling de una predicción
  async function pollPrediction(pollUrl, timeoutMs = 120000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      await sleep(3000)
      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
      })
      const result = await pollRes.json()
      if (result.status === 'succeeded') return result.output
      if (result.status === 'failed' || result.status === 'canceled') {
        throw new Error(`Prediction ${result.status}: ${result.error || 'unknown'}`)
      }
    }
    throw new Error('Timeout esperando resultado')
  }

  // Helper: crear predicción con version hash
  async function runVersion(versionHash, input, timeoutMs = 90000) {
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version: versionHash, input }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Replicate error ${createRes.status}: ${err}`)
    }

    const prediction = await createRes.json()
    if (prediction.status === 'succeeded') return prediction.output

    const pollUrl = prediction.urls?.get
    if (!pollUrl) throw new Error('No poll URL')
    return pollPrediction(pollUrl, timeoutMs)
  }

  // Helper: crear predicción por nombre de modelo
  async function runModel(owner, name, input, timeoutMs = 90000) {
    const createRes = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=5',
      },
      body: JSON.stringify({ input }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Replicate error ${createRes.status}: ${err}`)
    }

    const prediction = await createRes.json()
    if (prediction.status === 'succeeded') return prediction.output

    const pollUrl = prediction.urls?.get
    if (!pollUrl) throw new Error('No poll URL')
    return pollPrediction(pollUrl, timeoutMs)
  }

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    // Convertir imagen del producto a base64
    let productDataUrl = null
    if (productImageUrl) {
      try {
        const productRes = await fetch(productImageUrl)
        if (productRes.ok) {
          const buf = Buffer.from(await productRes.arrayBuffer())
          const mime = productRes.headers.get('content-type') || 'image/png'
          productDataUrl = `data:${mime};base64,${buf.toString('base64')}`
        }
      } catch (e) {
        console.warn('No se pudo cargar imagen del producto:', e.message)
      }
    }

    // ── PASO 1: SAM2 — generar máscara de la cama ─────────────
    let maskUrl = null
    try {
      console.log('Paso 1: Generando máscara con SAM2...')
      const samOutput = await runModel(
        'meta', 'sam-2',
        {
          image: roomDataUrl,
          point_coords: [[0.5, 0.6]],   // centro-inferior de la imagen (zona cama)
          point_labels: [1],
          use_m2m: true,
        },
        60000
      )
      if (Array.isArray(samOutput)) {
        maskUrl = samOutput[0]
      } else if (typeof samOutput === 'string') {
        maskUrl = samOutput
      }
      console.log('Máscara generada:', maskUrl)
    } catch (samErr) {
      console.warn('SAM falló, continuando sin máscara:', samErr.message)
    }

    // ── ESPERA entre requests para respetar rate limit ────────
    console.log('Esperando 12s entre requests...')
    await sleep(12000)

    // ── PASO 2: Ideogram v3 — inpainting ──────────────────────
    console.log('Paso 2: Generando imagen con Ideogram v3...')

    const ideogramInput = {
      image: roomDataUrl,
      prompt: `Replace ONLY the bedding on the bed with a "${productName}" quilt/bedspread. Keep the entire room EXACTLY the same: same walls, furniture, headboard, lamps, pillows, floor. The new bedspread must look photorealistic with natural folds and shadows matching the room lighting. Style: ${style || 'elegant modern interior photography'}.`,
      style: 'REALISTIC',
      resolution: '1024x1024',
      rendering_speed: 'BALANCED',
      magic_prompt_option: 'Off',
    }

    if (maskUrl) {
      ideogramInput.mask = maskUrl
      console.log('Usando máscara de SAM')
    } else {
      // Sin máscara: Ideogram necesita mask obligatoriamente en modo edición
      // Usamos una máscara sintética que cubre la mitad inferior (zona cama)
      // Generada como data URL de imagen blanca/negra en base64
      const maskBase64 =
        'iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zTAAAAMklEQVR4nO3BMQEAAADCoPVP' +
        '7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBxAABIABnAAAAAElFTkSuQmCC'
      // Fallback: máscara sólida blanca (edita toda la imagen con foco en prompt)
      ideogramInput.mask = `data:image/png;base64,${maskBase64}`
      console.log('Usando máscara fallback (toda la imagen)')
    }

    if (productDataUrl) {
      ideogramInput.style_reference_images = [productDataUrl]
      ideogramInput.style_reference_strength = 0.8
    }

    const ideogramOutput = await runModel('ideogram-ai', 'ideogram-v3-balanced', ideogramInput, 120000)

    let imageUrl = null
    if (Array.isArray(ideogramOutput)) {
      imageUrl = ideogramOutput[0]
    } else if (typeof ideogramOutput === 'string') {
      imageUrl = ideogramOutput
    } else if (ideogramOutput?.url) {
      imageUrl = ideogramOutput.url
    }

    if (!imageUrl) {
      console.error('Sin imagen en respuesta:', JSON.stringify(ideogramOutput))
      res.status(500).json({ error: 'No se recibió imagen de Ideogram' })
      return
    }

    console.log('Imagen generada:', imageUrl)
    res.status(200).json({ imageUrl })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
