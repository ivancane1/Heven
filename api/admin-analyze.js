export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, imageType } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'Falta imagen' })

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_KEY no configurada' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        system: `You are an expert at describing home textile products for AI image generation prompts. 
Analyze the product photo and generate an ultra-detailed visual description optimized for Flux image generation models.
Focus on: exact colors (tones, shades), patterns/designs, textures (quilted, embroidered, smooth), decorative details (lace, borders, stitching), apparent material, and structural composition (stripes, blocks, motif repetition).
Respond ONLY with the description in English. Maximum 3 dense sentences. Do NOT start with "the image shows" or "this is". Start directly with the product description.`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageType || 'image/jpeg',
                data: imageBase64,
              }
            },
            { type: 'text', text: 'Describe this textile product for AI image generation.' }
          ]
        }]
      })
    })

    const data = await response.json()
    const description = data.content?.[0]?.text
    if (!description) return res.status(500).json({ error: 'Sin respuesta de Claude' })

    res.status(200).json({ description })
  } catch (err) {
    console.error('Error en admin-analyze:', err)
    res.status(500).json({ error: err.message })
  }
}
