// Pipeline: Grounded SAM (máscara automática) + Ideogram v3 (inpainting con referencia visual)

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { imageBase64, imageType, productImageUrl, productDescription, productName, style } = req.body
  if (!imageBase64) { res.status(400).json({ error: 'Faltan parámetros' }); return }

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    // ── PASO 1: Grounded SAM genera máscara de la cama ──────────
    console.log('Paso 1: Generando máscara con Grounded SAM...')

    let maskUrl = null
    try {
      const samRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'v2',
          model: 'schananas/grounded_sam',
          input: {
            image: roomDataUrl,
            mask_prompt: 'bed, mattress, bedspread, bedding, quilt, blanket on bed',
            invert_mask: false,
            return_mask: true,
          }
        })
      })

      if (samRes.ok) {
        const samPrediction = await samRes.json()
        maskUrl = await pollReplicate(samPrediction.urls.get, REPLICATE_TOKEN, 60)
        console.log('SAM OK, máscara:', maskUrl ? 'generada' : 'no disponible')
      }
    } catch (e) {
      console.warn('SAM falló:', e.message)
    }

    // ── PASO 2: Ideogram v3 inpainting ──────────────────────────
    console.log('Paso 2: Inpainting con Ideogram v3...')

    const prompt = buildPrompt(productDescription, productName, style)

    const ideogramInput = {
      prompt,
      image: roomDataUrl,
      style_type: 'REALISTIC',
      magic_prompt_option: 'OFF',
      rendering_speed: 'QUALITY',
    }

    // Agregar máscara si SAM la generó
    if (maskUrl) {
      ideogramInput.mask = maskUrl
    }

    // Agregar foto real del producto como referencia visual
    if (productImageUrl) {
      ideogramInput.style_reference_images = [productImageUrl]
    }

    const ideogramRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'ideogram-ai/ideogram-v3-balanced',
        input: ideogramInput,
      })
    })

    if (!ideogramRes.ok) {
      const errText = await ideogramRes.text()
      console.error('Ideogram error:', ideogramRes.status, errText)
      res.status(500).json({ error: `Error en Ideogram: ${ideogramRes.status}` })
      return
    }

    const ideogramPrediction = await ideogramRes.json()
    const imageUrl = await pollReplicate(ideogramPrediction.urls.get, REPLICATE_TOKEN, 120)

    if (!imageUrl) {
      res.status(500).json({ error: 'Timeout esperando resultado de Ideogram' })
      return
    }

    console.log('Imagen generada OK')
    res.status(200).json({ imageUrl })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

function buildPrompt(productDescription, productName, style) {
  const desc = productDescription || `${productName} bedspread, home textile`
  return `Professional interior design photo of a bedroom. Replace ONLY the bedding on the bed with this exact product: ${desc}. Keep all room elements (walls, furniture, lamps, headboard, pillows) completely unchanged. The bedspread should drape naturally with realistic folds, matching the room lighting and shadows. Photorealistic, high quality interior photography. Style: ${style || 'elegant modern'}.`
}

async function pollReplicate(url, token, maxSeconds = 60) {
  const start = Date.now()
  while ((Date.now() - start) / 1000 < maxSeconds) {
    await new Promise(r => setTimeout(r, 2500))
    const r = await fetch(url, { headers: { 'Authorization': `Token ${token}` } })
    const data = await r.json()
    if (data.status === 'succeeded') {
      const output = data.output
      if (typeof output === 'string') return output
      if (Array.isArray(output) && output.length > 0) return output[0]
      return null
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      console.error('Prediction failed:', data.error)
      return null
    }
  }
  console.error('Timeout after', maxSeconds, 'seconds')
  return null
}
