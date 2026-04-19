export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { imageBase64, imageType, isStitched, productName, productDescription, style } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'Faltan parámetros' })

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
  if (!REPLICATE_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' })

  try {
    const inputImage = `data:image/jpeg;base64,${imageBase64}`
    const descriptionText = productDescription || productName

    let prompt
    if (isStitched) {
      // Imagen combinada: producto izquierda, habitación derecha
      prompt = `This image has two panels side by side divided by a dark vertical line.
LEFT PANEL: shows the bedspread/quilt product to be used.
RIGHT PANEL: shows the bedroom where the product should be placed.

Task: Edit ONLY the RIGHT PANEL. Place the exact bedspread from the LEFT PANEL onto the bed in the RIGHT PANEL.
- Copy the EXACT colors, pattern, texture, quilting design, and lace details from the LEFT bedspread
- The bedspread must drape naturally over the bed with realistic folds and shadows matching the room lighting
- Keep EVERYTHING else in the RIGHT PANEL completely unchanged: walls, headboard, pillows, nightstands, lamps, floor
- The LEFT PANEL must remain exactly as is
- Final result must look like a professional interior design photograph`
    } else {
      // Sin stitching: solo descripción textual
      prompt = `Replace the bedding on the bed with a ${descriptionText} bedspread/quilt.
Keep the entire room EXACTLY the same: walls, furniture, headboard, pillows, nightstands, lamps, floor.
The bedspread must look photorealistic with natural folds and shadows matching the room lighting.
Style: ${style || 'elegant modern interior photography'}.`
    }

    console.log('isStitched:', isStitched)
    console.log('Prompt:', prompt.slice(0, 120))

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
          input_image: inputImage,
          output_format: 'jpg',
          safety_tolerance: 2,
        }
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Flux Kontext error:', createRes.status, errText)
      return res.status(500).json({ error: `Error: ${createRes.status}` })
    }

    const prediction = await createRes.json()
    const imageUrl = await poll(prediction, REPLICATE_TOKEN)
    if (imageUrl) return res.status(200).json({ imageUrl })

    res.status(500).json({ error: 'No se pudo generar la imagen' })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno' })
  }
}

async function poll(prediction, token) {
  if (prediction.status === 'succeeded')
    return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  if (prediction.error || prediction.status === 'failed') return null

  const pollUrl = prediction.urls?.get
  if (!pollUrl) return null

  const deadline = Date.now() + 120000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const r = await fetch(pollUrl, { headers: { 'Authorization': `Token ${token}` } })
    const result = await r.json()
    console.log('Poll:', result.status)
    if (result.status === 'succeeded')
      return Array.isArray(result.output) ? result.output[0] : result.output
    if (result.status === 'failed' || result.status === 'canceled') return null
  }
  return null
}
