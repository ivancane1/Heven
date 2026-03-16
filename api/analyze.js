export const config = { runtime: "nodejs" }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).end("Method Not Allowed")
    return
  }

  const { imageBase64, imageType, productList } = req.body

  if (!imageBase64 || !productList) {
    res.status(400).json({ error: "Faltan parámetros" })
    return
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageType || "image/jpeg",
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `Sos un experto en diseño de interiores y textiles del hogar. Analizá esta foto del espacio del cliente y estos productos que quiere visualizar:\n\n${productList}\n\nRespondé SOLO en JSON con esta estructura exacta (sin markdown, sin explicaciones):\n{\n  "harmony": "Descripción poética de 2-3 líneas de cómo estos productos transformarían el espacio de la foto",\n  "style": "Nombre del estilo decorativo del espacio (ej: Nórdico Cálido, Rústico Moderno)",\n  "suggestions": ["consejo específico 1", "consejo específico 2", "consejo específico 3"],\n  "colorNote": "Observación sobre la paleta de colores del espacio y cómo los productos la complementan"\n}`,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()
    res.status(200).json(data)
  } catch (err) {
    console.error("Error llamando a Anthropic:", err)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}
