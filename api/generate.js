import zlib from 'zlib'

// Genera un PNG de máscara: negro arriba, blanco abajo (zona cama)
function createBedMask(width, height, bedStartFraction = 0.40) {
  const crcTable = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    crcTable[i] = c
  }
  function crc32(buf) {
    let crc = 0xFFFFFFFF
    for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
  }
  function chunk(type, data) {
    const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length)
    const typeBuf = Buffer.from(type, 'ascii')
    const crcVal = crc32(Buffer.concat([typeBuf, data]))
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crcVal)
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
  }

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 0 // 8-bit grayscale

  const bedStartRow = Math.floor(height * bedStartFraction)
  const rawRows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width + 1)
    row[0] = 0 // filter: None
    row.fill(y >= bedStartRow ? 255 : 0, 1)
    rawRows.push(row)
  }
  const compressed = zlib.deflateSync(Buffer.concat(rawRows))

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

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

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
  if (!REPLICATE_TOKEN) {
    res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' })
    return
  }

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`

    // Convertir imagen del producto a base64
    let productDataUrl = null
    if (productImageUrl) {
      try {
        const productRes = await fetch(productImageUrl)
        if (productRes.ok) {
          const buf = Buffer.from(await productRes.arrayBuffer())
          const mime = productRes.headers.get('content-type') || 'image/png'
          productDataUrl = `data:${mime};base64,${buf.toString('base64')}`
        }
      } catch (e) {
        console.warn('No se pudo cargar imagen del producto:', e.message)
      }
    }

    // Generar máscara localmente (sin API call)
    console.log('Generando máscara local...')
    const maskPng = createBedMask(1024, 1024, 0.40)
    const maskDataUrl = `data:image/png;base64,${maskPng.toString('base64')}`
    console.log('Máscara generada, tamaño:', maskPng.length, 'bytes')

    // Ideogram v3 — inpainting con máscara local
    console.log('Generando imagen con Ideogram v3...')

    const ideogramInput = {
      image: roomDataUrl,
      mask: maskDataUrl,
      prompt: `Replace ONLY the bedding on the bed with a "${productName}" quilt/bedspread. Keep the entire room EXACTLY the same: same walls, furniture, headboard, lamps, pillows, floor. The new bedspread must look photorealistic with natural folds and shadows matching the room lighting. Style: ${style || 'elegant modern interior photography'}.`,
      style: 'REALISTIC',
      resolution: '1024x1024',
      rendering_speed: 'BALANCED',
      magic_prompt_option: 'Off',
    }

    if (productDataUrl) {
      ideogramInput.style_reference_images = [productDataUrl]
      ideogramInput.style_reference_strength = 0.8
    }

    const createRes = await fetch('https://api.replicate.com/v1/models/ideogram-ai/ideogram-v3-balanced/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=5',
      },
      body: JSON.stringify({ input: ideogramInput }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Ideogram error:', createRes.status, errText)
      res.status(500).json({ error: `Ideogram error ${createRes.status}: ${errText}` })
      return
    }

    const prediction = await createRes.json()

    if (prediction.status === 'succeeded') {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return res.status(200).json({ imageUrl })
    }

    if (prediction.error) {
      return res.status(500).json({ error: `Ideogram falló: ${prediction.error}` })
    }

    // Polling
    const pollUrl = prediction.urls?.get
    if (!pollUrl) {
      return res.status(500).json({ error: 'No poll URL en respuesta de Replicate' })
    }

    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000))
      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
      })
      const result = await pollRes.json()

      if (result.status === 'succeeded') {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        console.log('Imagen generada:', imageUrl)
        return res.status(200).json({ imageUrl })
      }
      if (result.status === 'failed' || result.status === 'canceled') {
        return res.status(500).json({ error: `Ideogram falló: ${result.error || 'unknown'}` })
      }
    }

    res.status(500).json({ error: 'Timeout esperando resultado de Ideogram' })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
