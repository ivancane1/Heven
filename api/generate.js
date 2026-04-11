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

    // Ideogram v3 — edición directa por prompt (sin máscara)
    console.log('Generando imagen con Ideogram v3...')

    const ideogramInput = {
      image: roomDataUrl,
      prompt: `Replace ONLY the bedding/bedspread on the bed with a "${productName}" quilt. Keep the entire room EXACTLY the same: same walls, furniture, headboard, lamps, pillows, floor — nothing else changes. The new bedspread must look photorealistic with natural folds and shadows matching the room lighting. Style: ${style || 'elegant modern interior photography'}.`,
      style: 'REALISTIC',
      resolution: 'RESOLUTION_1024_1024',
      rendering_speed: 'BALANCED',
      magic_prompt_option: 'OFF',
    }

    if (productDataUrl) {
      ideogramInput.style_reference_images = [productDataUrl]
      ideogramInput.style_reference_strength = 0.8
    }

    // Crear predicción
    const createRes = await fetch('https://api.replicate.com/v1/models/ideogram-ai/ideogram-v3-balanced/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=5',
      },
      body: JSON.stringify({ input: ideogramInput }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Ideogram error:', createRes.status, errText)
      res.status(500).json({ error: `Ideogram error ${createRes.status}: ${errText}` })
      return
    }

    const prediction = await createRes.json()
    if (prediction.status === 'succeeded') {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return res.status(200).json({ imageUrl })
    }

    // Polling
    const pollUrl = prediction.urls?.get
    if (!pollUrl) {
      res.status(500).json({ error: 'No poll URL en respuesta de Replicate' })
      return
    }

    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000))

      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
      })
      const result = await pollRes.json()

      if (result.status === 'succeeded') {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        console.log('Imagen generada:', imageUrl)
        return res.status(200).json({ imageUrl })
      }

      if (result.status === 'failed' || result.status === 'canceled') {
        console.error('Ideogram falló:', result.error)
        return res.status(500).json({ error: `Ideogram falló: ${result.error || 'unknown'}` })
      }
    }

    res.status(500).json({ error: 'Timeout esperando resultado de Ideogram' })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
