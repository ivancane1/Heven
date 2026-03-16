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

    let prompt
    let requestBody

    if (productImageUrl) {
      // ── Con imagen real del producto ─────────────────────────
      // Flux Kontext acepta una sola imagen de referencia.
      // Estrategia: mandamos la foto del PRODUCTO como imagen base
      // y le pedimos que la coloque en la habitación descripta.
      // Alternativamente, hacemos dos llamadas encadenadas.

      // Fetch de la imagen del producto para convertirla a base64
      let productBase64 = null
      let productMime = 'image/png'
      try {
        const productRes = await fetch(productImageUrl)
        if (productRes.ok) {
          const arrayBuf = await productRes.arrayBuffer()
          const buffer = Buffer.from(arrayBuf)
          productBase64 = buffer.toString('base64')
          productMime = productRes.headers.get('content-type') || 'image/png'
        }
      } catch (e) {
        console.warn('No se pudo cargar la imagen del producto:', e.message)
      }

      if (productBase64) {
        // Llamada 1: usar foto del producto como referencia + prompt descriptivo
        prompt = `This is a product photo of "${productName}". 
Now place this exact textile product onto a bed in a bedroom with this style: ${style || 'elegant modern'}.
The bedroom has the following characteristics based on the customer's room photo.
Keep all the product details: colors, patterns, textures, lace borders exactly as shown.
The result should look like a professional lifestyle photo of the product in a real bedroom.
Photorealistic, natural lighting, high quality interior photography.`

        requestBody = {
          image_url: `data:${productMime};base64,${productBase64}`,
          prompt,
          num_inference_steps: 40,
          guidance_scale: 5,
          num_images: 1,
          output_format: 'jpeg',
          safety_tolerance: '2',
        }
      } else {
        // Fallback si no se pudo cargar el producto
        prompt = `Professional interior design photo. Place a ${productName} (${style || 'elegant'} style home textile) naturally on the bed. Keep the room exactly the same. Photorealistic.`
        requestBody = {
          image_url: roomDataUrl,
          prompt,
          num_inference_steps: 35,
          guidance_scale: 4,
          num_images: 1,
          output_format: 'jpeg',
          safety_tolerance: '2',
        }
      }
    } else {
      // ── Sin imagen de producto, solo texto ───────────────────
      prompt = `Professional interior design photo. Place a ${productName} home textile product naturally on the bed in this room. Keep the room architecture exactly the same. Style: ${style || 'elegant modern'}. Photorealistic, natural lighting.`
      requestBody = {
        image_url: roomDataUrl,
        prompt,
        num_inference_steps: 35,
        guidance_scale: 4,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
      }
    }

    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Fal.ai error:', response.status, errText)
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
