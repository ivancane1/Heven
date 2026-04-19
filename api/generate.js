import zlib from 'zlib'

// Genera máscara PNG: negro arriba, blanco en la zona de la cama (60% inferior)
function createBedMask(width, height, bedStart = 0.35) {
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
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 0
  const bedStartRow = Math.floor(height * bedStart)
  const rawRows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width + 1)
    row[0] = 0
    row.fill(y >= bedStartRow ? 255 : 0, 1)
    rawRows.push(row)
  }
  const compressed = zlib.deflateSync(Buffer.concat(rawRows))
  return Buffer.concat([PNG_SIG, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

async function pollPrediction(prediction, token, timeoutMs = 120000) {
  if (prediction.status === 'succeeded') {
    return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  }
  if (prediction.error || prediction.status === 'failed') {
    throw new Error(prediction.error || 'Prediction failed')
  }
  const pollUrl = prediction.urls?.get
  if (!pollUrl) throw new Error('No poll URL')

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(pollUrl, { headers: { 'Authorization': `Token ${token}` } })
    const result = await pollRes.json()
    console.log('Poll status:', result.status)
    if (result.status === 'succeeded') {
      return Array.isArray(result.output) ? result.output[0] : result.output
    }
    if (result.status === 'failed' || result.status === 'canceled') {
      throw new Error(result.error || 'Prediction failed')
    }
  }
  throw new Error('Timeout')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { imageBase64, imageType, productImageUrl, productName, productDescription, style } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'Faltan parámetros' })

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
  if (!REPLICATE_TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado' })

  try {
    const roomDataUrl = `data:${imageType || 'image/jpeg'};base64,${imageBase64}`
    const descriptionText = productDescription || productName

    // Máscara local: blanco sobre zona de la cama
    const maskPng = createBedMask(1024, 1024, 0.35)
    const maskDataUrl = `data:image/png;base64,${maskPng.toString('base64')}`

    const prompt = `Fill the white masked area (the bed surface) with a realistic ${descriptionText} bedspread/quilt.
The bedspread must have: the exact colors, pattern, texture, and lace details described.
It should drape naturally over the bed with realistic folds and shadows that match the existing room lighting.
Keep everything outside the masked area completely unchanged.
Result must look like a professional interior design photograph. Style: ${style || 'elegant modern interior photography'}.`

    console.log('Llamando a Flux Fill...')
    console.log('Prompt:', prompt)

    const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-fill-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=5',
      },
      body: JSON.stringify({
        input: {
          image: roomDataUrl,
          mask: maskDataUrl,
          prompt,
          output_format: 'jpg',
          safety_tolerance: 2,
          prompt_upsampling: false,
        }
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Flux Fill error:', createRes.status, errText)
      return res.status(500).json({ error: `Flux Fill error ${createRes.status}: ${errText}` })
    }

    const prediction = await createRes.json()
    console.log('Predicción creada:', prediction.id, prediction.status)

    const imageUrl = await pollPrediction(prediction, REPLICATE_TOKEN)
    console.log('Imagen generada:', imageUrl)
    return res.status(200).json({ imageUrl })

  } catch (err) {
    console.error('Error en /api/generate:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
}
