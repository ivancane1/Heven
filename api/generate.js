export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed')
    return
  }

  const { imageBase64, imageType, productImageUrl, productName, productDescription, style } = req.body

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
    const descriptionText = productDescription || productName

    let inputImage = roomDataUrl
    let prompt

    // Si hay foto del producto, enviar ambas imágenes a Flux Kontext Max (multi-image)
    if (productImageUrl) {
      try {
        console.log('Descargando imagen del producto...')
        const productRes = await fetch(productImageUrl)
        if (productRes.ok) {
          const buf = Buffer.from(await productRes.arrayBuffer())
          const mime = productRes.headers.get('content-type') || 'image/png'
          const productDataUrl = `data:${mime};base64,${buf.toString('base64')}`

          // Usar Flux Kontext Max que acepta múltiples imágenes de referencia
          console.log('Usando Flux Kontext Max con imagen de referencia del producto...')

          const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-max/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${REPLICATE_TOKEN}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait=5',
            },
            body: JSON.stringify({
              input: {
                prompt: `Take the bedspread/quilt shown in the REFERENCE IMAGE and place it on the bed in the INPUT IMAGE. 
Copy the EXACT colors, pattern, texture, lace details, and quilted design from the reference bedspread.
Keep EVERYTHING else in the room unchanged: walls, headboard, pillows, nightstands, lamps, floor.
The bedspread should drape naturally with realistic folds matching the room lighting.
Result must look like a professional interior design photograph. Style: ${style || 'elegant modern interior photography'}.`,
                input_image: roomDataUrl,
                reference_image: productDataUrl,
                output_format: 'jpg',
                safety_tolerance: 2,
              }
            }),
          })

          if (createRes.ok) {
            const prediction = await createRes.json()
            console.log('Predicción Kontext Max creada:', prediction.status)

            const result = await pollPrediction(prediction, REPLICATE_TOKEN)
            if (result) return res.status(200).json({ imageUrl: result })
          } else {
            const errText = await createRes.text()
            console.warn('Flux Kontext Max falló, usando Pro con prompt:', errText)
          }
        }
      } catch (e) {
        console.warn('Error con imagen de referencia:', e.message)
      }
    }

    // Fallback: Flux Kontext Pro con descripción textual detallada
    console.log('Usando Flux Kontext Pro con descripción textual...')
    prompt = `Replace the bedding on the bed with a ${descriptionText}. 
Keep the entire room EXACTLY the same: same walls, furniture, headboard, pillows, nightstands, lamps, floor.
The bedspread must look photorealistic with natural folds and shadows matching the room lighting.
Style: ${style || 'elegant modern interior photography'}.`

    const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=5',
      },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: roomDataUrl,
          output_format: 'jpg',
          safety_tolerance: 2,
        }
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Flux Kontext Pro error:', createRes.status, errText)
      return res.status(500).json({ error: `Error generando imagen: ${createRes.status}` })
    }

    const prediction = await createRes.json()
    const imageUrl = await pollPrediction(prediction, REPLICATE_TOKEN)
    if (imageUrl) return res.status(200).json({ imageUrl })

    res.status(500).json({ error: 'No se pudo generar la imagen' })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}

async function pollPrediction(prediction, token) {
  if (prediction.status === 'succeeded') {
    return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  }
  if (prediction.error || prediction.status === 'failed') return null

  const pollUrl = prediction.urls?.get
  if (!pollUrl) return null

  const deadline = Date.now() + 120000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(pollUrl, {
      headers: { 'Authorization': `Token ${token}` },
    })
    const result = await pollRes.json()
    console.log('Poll status:', result.status)
    if (result.status === 'succeeded') {
      return Array.isArray(result.output) ? result.output[0] : result.output
    }
    if (result.status === 'failed' || result.status === 'canceled') return null
  }
  return null
}
