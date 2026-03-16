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

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    // Si tenemos imagen del producto, la mandamos junto con el espacio
    // Flux Kontext acepta múltiples imágenes y es mucho más preciso
    let imageUrls
    let prompt

    if (productImageUrl) {
      // Modo con 2 imágenes: espacio + producto real
      imageUrls = [roomDataUrl, productImageUrl]
      prompt = `You are given two images. Image 1 is a bedroom or living space. Image 2 is a product photo of "${productName}" (a home textile product). 
      
Your task: Place the exact textile product from Image 2 onto the bed/furniture in Image 1. 
- Keep the room architecture, walls, furniture, and lighting EXACTLY the same
- Replace or add the textile product naturally on the bed, maintaining realistic perspective and lighting
- The product should look like it truly belongs in the room
- Preserve all details of the product pattern, colors and texture from Image 2
- Style: ${style || 'elegant and modern'}
- Result should look like a professional interior design photo`
    } else {
      // Modo fallback con solo 1 imagen y descripción
      imageUrls = roomDataUrl
      prompt = `Professional interior design photo. Add ${productName} as a home textile product naturally placed on the bed in this room. Style: ${style || 'elegant and modern'}. Keep the room architecture exactly the same. Photorealistic, natural lighting.`
    }

    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrls,
        prompt,
        num_inference_steps: 35,
        guidance_scale: 4,
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
