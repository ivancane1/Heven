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

  // Helper: llamar a Replicate y esperar resultado (polling)
  async function runReplicate(modelVersion, input, timeoutMs = 120000) {
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version: modelVersion, input }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Replicate create error ${createRes.status}: ${err}`)
    }

    const prediction = await createRes.json()
    const pollUrl = prediction.urls?.get
    if (!pollUrl) throw new Error('No poll URL en respuesta de Replicate')

    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 2500))

      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
      })
      const result = await pollRes.json()

      if (result.status === 'succeeded') return result.output
      if (result.status === 'failed' || result.status === 'canceled') {
        throw new Error(`Replicate prediction ${result.status}: ${result.error || 'unknown'}`)
      }
    }
    throw new Error('Timeout esperando resultado de Replicate')
  }

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    // Convertir imagen del producto a base64 si existe
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

    // PASO 1: Grounded SAM — generar máscara de la cama
    let maskUrl = null
    try {
      console.log('Paso 1: Generando máscara con Grounded SAM...')
      const samOutput = await runReplicate(
        'schananas/grounded_sam:7a08e58ca8be9f0fcf09a21c0280d85d1f5ad87b56df1f22e42f9d80f41e8c12',
        {
          image: roomDataUrl,
          prompt: 'bed, mattress, bedspread, quilt, blanket, duvet, comforter',
          box_threshold: 0.3,
          text_threshold: 0.25,
        },
        60000
      )

      if (Array.isArray(samOutput)) {
        maskUrl = samOutput.find(u => typeof u === 'string' && u.includes('mask')) || samOutput[1] || samOutput[0]
      } else if (typeof samOutput === 'string') {
        maskUrl = samOutput
      }
      console.log('Máscara generada:', maskUrl)
    } catch (samErr) {
      console.warn('SAM falló, continuando sin máscara:', samErr.message)
    }

    // PASO 2: Ideogram v3 — inpainting con referencia
    console.log('Paso 2: Generando imagen con Ideogram v3...')

    const ideogramInput = {
      image: roomDataUrl,
      prompt: `Replace the bedding on the bed with a "${productName}" bedspread/quilt. Keep the entire room EXACTLY the same: walls, furniture, headboard, lamps, all objects unchanged. The new bedspread should look photorealistic with natural folds and room lighting. Style: ${style || 'elegant modern interior photography'}.`,
      style: 'REALISTIC',
      resolution: 'RESOLUTION_1024_1024',
      rendering_speed: 'BALANCED',
      magic_prompt_option: 'OFF',
    }

    if (maskUrl) {
      ideogramInput.mask = maskUrl
    }

    if (productDataUrl) {
      ideogramInput.style_reference_images = [productDataUrl]
      ideogramInput.style_reference_strength = 0.8
    }

    const ideogramOutput = await runReplicate(
      'ideogram-ai/ideogram-v3-balanced:2bab9b3c0de0a8d3e8a3b8f88c0d2e5f1a4c7d9e2b5a8f1c4d7e0a3b6c9f2e5',
      ideogramInput,
      120000
    )

    let imageUrl = null
    if (Array.isArray(ideogramOutput)) {
      imageUrl = ideogramOutput[0]
    } else if (typeof ideogramOutput === 'string') {
      imageUrl = ideogramOutput
    } else if (ideogramOutput?.url) {
      imageUrl = ideogramOutput.url
    }

    if (!imageUrl) {
      console.error('Respuesta de Ideogram sin imagen:', JSON.stringify(ideogramOutput))
      res.status(500).json({ error: 'No se recibió imagen de Ideogram' })
      return
    }

    console.log('Imagen generada exitosamente:', imageUrl)
    res.status(200).json({ imageUrl })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
