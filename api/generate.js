// ─────────────────────────────────────────────────────────────
//  Pipeline de 3 pasos:
//  1. Grounded SAM  → máscara automática de la cama
//  2. IP-Adapter + ControlNet → inpainting con foto del producto
//  3. Fallback a Fal.ai si Replicate falla
// ─────────────────────────────────────────────────────────────

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
const FAL_KEY = process.env.FAL_KEY

// ── Helper: esperar resultado de Replicate (polling) ─────────
async function waitForReplicate(predictionId, maxWaitMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 2500))
    const r = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` }
    })
    const data = await r.json()
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed') throw new Error(`Replicate falló: ${data.error}`)
  }
  throw new Error('Timeout esperando Replicate')
}

// ── Helper: URL a base64 ──────────────────────────────────────
async function urlToBase64(url) {
  const r = await fetch(url)
  const buf = Buffer.from(await r.arrayBuffer())
  const mime = r.headers.get('content-type') || 'image/png'
  return { base64: buf.toString('base64'), mime, dataUrl: `data:${mime};base64,${buf.toString('base64')}` }
}

// ── PASO 1: Generar máscara de la cama con Grounded SAM ───────
async function generateBedMask(imageDataUrl) {
  console.log('Paso 1: Generando máscara de cama con SAM...')

  const r = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '8a5b4e8a2a27d4b1fbbb7e5e6b0b4c8e2a0f2c3d',  // grounded-sam
      input: {
        image: imageDataUrl,
        text_prompt: 'bed, mattress, bedding',
      }
    })
  })

  // Si SAM falla, usamos una máscara genérica de la zona inferior central
  if (!r.ok) {
    console.warn('SAM no disponible, usando máscara genérica')
    return null
  }

  try {
    const pred = await r.json()
    const output = await waitForReplicate(pred.id, 45000)
    // SAM devuelve la máscara como imagen
    return Array.isArray(output) ? output[0] : output
  } catch (e) {
    console.warn('SAM falló:', e.message)
    return null
  }
}

// ── PASO 2: IP-Adapter inpainting con foto del producto ───────
async function ipAdapterInpaint({ roomDataUrl, maskUrl, productDataUrl, productDescription, style }) {
  console.log('Paso 2: IP-Adapter inpainting...')

  const prompt = `${productDescription}, placed naturally on bed, photorealistic interior design photo, professional photography, ${style} style, natural lighting, high quality`
  const negativePrompt = 'blurry, deformed, distorted, ugly, low quality, cartoonish, different pattern, different color'

  const r = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '764ec92e7710ad7a063aca4486037b43c5dc7e0456c7141dca91e1e37c6dfd5f',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        inpainting_image: roomDataUrl,
        mask_image: maskUrl || roomDataUrl,  // si no hay máscara, usa imagen completa
        ip_adapter_image: productDataUrl,
        ip_adapter_scale: 0.9,           // alta fidelidad al producto
        sorted_controlnets: 'inpainting',
        num_inference_steps: 40,
        guidance_scale: 8,
        num_outputs: 1,
        scheduler: 'DPMSolverMultistep',
      }
    })
  })

  if (!r.ok) {
    const err = await r.text()
    throw new Error(`IP-Adapter error: ${r.status} ${err}`)
  }

  const pred = await r.json()
  const output = await waitForReplicate(pred.id, 90000)
  const resultUrl = Array.isArray(output) ? output[0] : output
  if (!resultUrl) throw new Error('IP-Adapter no devolvió imagen')
  return resultUrl
}

// ── FALLBACK: Fal.ai Kontext Max multi-image ──────────────────
async function falAiFallback({ roomDataUrl, productDataUrl, productName, style }) {
  console.log('Fallback: Usando Fal.ai Kontext Max multi...')

  const prompt = `Image 1 is a bedroom. Image 2 is a product photo of "${productName}". Place the EXACT bedspread from Image 2 onto the bed in Image 1. Keep the bedroom COMPLETELY UNCHANGED. Preserve ALL product details: colors, patterns, lace borders, quilted texture. Photorealistic, professional interior photography.`

  const body = productDataUrl
    ? { image_url: [roomDataUrl, productDataUrl], prompt, num_inference_steps: 50, guidance_scale: 6, num_images: 1, output_format: 'jpeg', safety_tolerance: '2' }
    : { image_url: roomDataUrl, prompt, num_inference_steps: 40, guidance_scale: 5, num_images: 1, output_format: 'jpeg', safety_tolerance: '2' }

  const endpoint = productDataUrl
    ? 'https://fal.run/fal-ai/flux-pro/kontext/max/multi'
    : 'https://fal.run/fal-ai/flux-pro/kontext'

  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!r.ok) throw new Error(`Fal.ai error: ${r.status}`)
  const data = await r.json()
  const url = data.images?.[0]?.url
  if (!url) throw new Error('Fal.ai no devolvió imagen')
  return url
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { imageBase64, imageType, productImageUrl, productName, productDescription, style } = req.body
  if (!imageBase64) { res.status(400).json({ error: 'Faltan parámetros' }); return }

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    // Obtener imagen del producto
    let productDataUrl = null
    if (productImageUrl) {
      try {
        const p = await urlToBase64(productImageUrl)
        productDataUrl = p.dataUrl
        console.log('Imagen del producto cargada OK')
      } catch (e) {
        console.warn('No se pudo cargar producto:', e.message)
      }
    }

    let resultUrl = null

    // ── Intentar pipeline Replicate ───────────────────────────
    if (REPLICATE_TOKEN && productDataUrl) {
      try {
        // Paso 1: máscara SAM
        const maskUrl = await generateBedMask(roomDataUrl)

        // Paso 2: inpainting con IP-Adapter
        resultUrl = await ipAdapterInpaint({
          roomDataUrl,
          maskUrl,
          productDataUrl,
          productDescription: productDescription || productName,
          style: style || 'elegant modern',
        })
        console.log('Pipeline Replicate exitoso')
      } catch (replicateErr) {
        console.warn('Pipeline Replicate falló, usando fallback Fal.ai:', replicateErr.message)
        resultUrl = null
      }
    }

    // ── Fallback Fal.ai ───────────────────────────────────────
    if (!resultUrl && FAL_KEY) {
      resultUrl = await falAiFallback({ roomDataUrl, productDataUrl, productName, style })
      console.log('Fallback Fal.ai exitoso')
    }

    if (!resultUrl) {
      res.status(500).json({ error: 'No se pudo generar la imagen' })
      return
    }

    res.status(200).json({ imageUrl: resultUrl })
  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
