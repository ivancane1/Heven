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

    // Prompt muy específico para Flux Kontext
    const prompt = `Add a bedspread/quilt on top of the bed mattress surface. The bedspread is: ${descriptionText}. 
The bedspread should cover the entire top surface of the bed, draping naturally over the sides with realistic folds and shadows that match the existing room lighting.
Do NOT change anything else in the room: keep the same walls, headboard, pillows, nightstands, lamps, floor, and all other objects exactly as they are.
The result must look like a professional interior design photograph.`

    console.log('Llamando a Flux Kontext Pro en Replicate...')
    console.log('Prompt:', prompt)

    // Crear predicción con Flux Kontext Pro
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
      console.error('Flux Kontext error:', createRes.status, errText)
      res.status(500).json({ error: `Flux Kontext error ${createRes.status}: ${errText}` })
      return
    }

    const prediction = await createRes.json()
    console.log('Predicción creada, status:', prediction.status)

    if (prediction.status === 'succeeded') {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return res.status(200).json({ imageUrl })
    }

    if (prediction.error) {
      return res.status(500).json({ error: `Flux Kontext falló: ${prediction.error}` })
    }

    // Polling
    const pollUrl = prediction.urls?.get
    if (!pollUrl) return res.status(500).json({ error: 'No poll URL' })

    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000))
      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
      })
      const result = await pollRes.json()

      console.log('Poll status:', result.status)

      if (result.status === 'succeeded') {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        console.log('Imagen generada:', imageUrl)
        return res.status(200).json({ imageUrl })
      }
      if (result.status === 'failed' || result.status === 'canceled') {
        console.error('Flux Kontext falló:', result.error)
        return res.status(500).json({ error: `Flux Kontext falló: ${result.error || 'unknown'}` })
      }
    }

    res.status(500).json({ error: 'Timeout esperando resultado' })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
