export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end('Method Not Allowed'); return }
  const { imageBase64, imageType, productList, productImagesBase64 } = req.body
  if (!imageBase64 || !productList) { res.status(400).json({ error: 'Faltan parámetros' }); return }
  if (imageBase64.length > 5_500_000) { res.status(400).json({ error: 'Imagen demasiado grande. Usá menos de 4MB.' }); return }

  try {
    const content = []
    content.push({ type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } })
    if (productImagesBase64?.length > 0) {
      for (const pi of productImagesBase64) {
        content.push({ type: 'image', source: { type: 'base64', media_type: pi.mimeType || 'image/png', data: pi.base64 } })
      }
      content.push({ type: 'text', text: `La primera imagen es el espacio del cliente. Las siguientes ${productImagesBase64.length} imágenes son los productos: ${productList}\n\nRespondé SOLO en JSON sin markdown:\n{"harmony":"descripción poética 2-3 líneas","style":"estilo decorativo","suggestions":["consejo 1","consejo 2","consejo 3"],"colorNote":"paleta de colores","productDescription":"descripción técnica ultra-detallada en inglés del producto: colores exactos, patrones, texturas, bordes, detalles decorativos para usar como prompt de imagen"}` })
    } else {
      content.push({ type: 'text', text: `Foto del espacio del cliente. Productos: ${productList}\n\nRespondé SOLO en JSON sin markdown:\n{"harmony":"descripción poética 2-3 líneas","style":"estilo decorativo","suggestions":["consejo 1","consejo 2","consejo 3"],"colorNote":"paleta de colores","productDescription":"descripción técnica detallada en inglés del producto"}` })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content }] }),
    })

    if (!response.ok) { res.status(502).json({ error: `Error análisis: ${response.status}` }); return }
    const data = await response.json()
    const clean = (data.content?.find(b => b.type === 'text')?.text || '').replace(/```json|```/g, '').trim()
    try { res.status(200).json({ result: JSON.parse(clean) }) }
    catch { res.status(502).json({ error: 'Error procesando respuesta' }) }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
