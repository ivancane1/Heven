// Vercel Function: llama a Fal.ai Flux Kontext
// Recibe la foto del espacio + descripción de productos
// Devuelve una imagen generada con los productos integrados

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed')
    return
  }

  const { imageBase64, imageType, prompt } = req.body

  if (!imageBase64 || !prompt) {
    res.status(400).json({ error: 'Faltan parámetros' })
    return
  }

  try {
    // Fal.ai acepta data URLs directamente
    const dataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: dataUrl,
        prompt: prompt,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Fal.ai error:', errText)
      res.status(500).json({ error: 'Error generando la imagen' })
      return
    }

    const data = await response.json()
    // Fal devuelve: { images: [{ url: "...", content_type: "..." }] }
    const imageUrl = data.images?.[0]?.url

    if (!imageUrl) {
      res.status(500).json({ error: 'No se recibió imagen de Fal.ai' })
      return
    }

    res.status(200).json({ imageUrl })
  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
