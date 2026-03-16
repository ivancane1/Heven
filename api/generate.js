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

    let falEndpoint
    let requestBody
    let prompt

    if (productImageUrl) {
      // ── Multi-image: habitación + foto real del producto ─────
      // Descargamos la imagen del producto para convertirla a base64
      let productDataUrl = null
      try {
        const productRes = await fetch(productImageUrl)
        if (productRes.ok) {
          const buf = Buffer.from(await productRes.arrayBuffer())
          const mime = productRes.headers.get('content-type') || 'image/png'
          productDataUrl = `data:${mime};base64,${buf.toString('base64')}`
        }
      } catch (e) {
        console.warn('No se pudo cargar la imagen del producto:', e.message)
      }

      if (productDataUrl) {
        // Usamos el endpoint multi-image de Kontext Max
        falEndpoint = 'https://fal.run/fal-ai/flux-pro/kontext/max/multi'
        prompt = `Image 1 is a bedroom. Image 2 is a product photo of a "${productName}" bedspread/quilt.

Task: Place the EXACT bedspread from Image 2 onto the bed in Image 1.

Critical requirements:
- Preserve ALL visual details of the bedspread: exact colors, patterns, lace borders, quilted texture, geometric designs
- Keep the bedroom in Image 1 COMPLETELY UNCHANGED: same walls, furniture, lamps, headboard, pillows
- The bedspread should drape naturally over the bed with realistic folds and shadows
- Match the lighting of the room onto the bedspread surface
- The result must look like a real professional interior design photo
- Style: ${style || 'elegant modern'}`

        requestBody = {
          image_url: [roomDataUrl, productDataUrl],  // array de imágenes
          prompt,
          num_inference_steps: 50,
          guidance_scale: 6,
          num_images: 1,
          output_format: 'jpeg',
          safety_tolerance: '2',
        }
      } else {
        // Fallback: solo la habitación con prompt descriptivo
        falEndpoint = 'https://fal.run/fal-ai/flux-pro/kontext'
        prompt = `Professional interior photo. Keep this bedroom EXACTLY the same. Only change the bedding: place a ${productName} bedspread on the bed. Style: ${style || 'elegant modern'}. Photorealistic.`
        requestBody = {
          image_url: roomDataUrl,
          prompt,
          num_inference_steps: 40,
          guidance_scale: 5,
          num_images: 1,
          output_format: 'jpeg',
          safety_tolerance: '2',
        }
      }
    } else {
      // Sin imagen de producto
      falEndpoint = 'https://fal.run/fal-ai/flux-pro/kontext'
      prompt = `Professional interior photo. Keep this bedroom EXACTLY the same. Only add a ${productName} on the bed. Style: ${style || 'elegant modern'}. Photorealistic, natural lighting.`
      requestBody = {
        image_url: roomDataUrl,
        prompt,
        num_inference_steps: 40,
        guidance_scale: 5,
        num_images: 1,
        output_format: 'jpeg',
        safety_tolerance: '2',
      }
    }

    console.log('Llamando a:', falEndpoint)
    console.log('Con', Array.isArray(requestBody.image_url) ? requestBody.image_url.length : 1, 'imagen(es)')

    const response = await fetch(falEndpoint, {
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
      res.status(500).json({ error: `Error Fal.ai: ${response.status}` })
      return
    }

    const data = await response.json()
    const imageUrl = data.images?.[0]?.url

    if (!imageUrl) {
      console.error('Respuesta de Fal.ai sin imagen:', JSON.stringify(data))
      res.status(500).json({ error: 'No se recibió imagen de Fal.ai' })
      return
    }

    res.status(200).json({ imageUrl })
  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
