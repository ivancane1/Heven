export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed')
    return
  }

  const { imageBase64, imageType, productList } = req.body

  if (!imageBase64 || !productList) {
    res.status(400).json({ error: 'Faltan parámetros' })
    return
  }

  // Verificar que la imagen no sea demasiado grande (max ~4MB en base64)
  if (imageBase64.length > 5_500_000) {
    res.status(400).json({ error: 'La imagen es demasiado grande. Usá una foto de menos de 4MB.' })
    return
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `Sos un experto en diseño de interiores y textiles del hogar. Analizá esta foto del espacio del cliente y estos productos que quiere visualizar:\n\n${productList}\n\nRespondé SOLO en JSON con esta estructura exacta, sin markdown, sin texto antes o después:\n{"harmony":"descripción poética de 2-3 líneas de cómo estos productos transformarían el espacio","style":"nombre del estilo decorativo (ej: Nórdico Cálido)","suggestions":["consejo 1","consejo 2","consejo 3"],"colorNote":"observación sobre la paleta de colores del espacio y cómo los productos la complementan"}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API error:', response.status, errBody)
      res.status(502).json({ error: `Error de la API de análisis: ${response.status}` })
      return
    }

    const data = await response.json()

    // Extraer y validar el JSON de la respuesta
    const rawText = data.content?.find(b => b.type === 'text')?.text || ''
    const clean = rawText.replace(/```json|```/g, '').trim()

    if (!clean) {
      res.status(502).json({ error: 'La IA no devolvió una respuesta válida' })
      return
    }

    // Parsear acá en el servidor para dar mejor error si falla
    try {
      const parsed = JSON.parse(clean)
      res.status(200).json({ result: parsed })
    } catch (parseErr) {
      console.error('JSON parse error, raw text:', clean)
      res.status(502).json({ error: 'Error procesando la respuesta de la IA' })
    }

  } catch (err) {
    console.error('Error en /api/analyze:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
