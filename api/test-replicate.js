export default async function handler(req, res) {
  const token = process.env.REPLICATE_API_TOKEN

  if (!token) {
    return res.status(200).json({ error: 'REPLICATE_API_TOKEN no está definida en Vercel' })
  }

  // Mostrar los primeros y últimos 4 caracteres para verificar que es el token correcto
  const tokenPreview = `${token.slice(0, 6)}...${token.slice(-4)}`

  try {
    // Llamada simple a la API de Replicate: obtener info de la cuenta
    const accountRes = await fetch('https://api.replicate.com/v1/account', {
      headers: { 'Authorization': `Token ${token}` },
    })
    const accountData = await accountRes.json()

    // También probar crear una predicción mínima para ver el rate limit real
    const testRes = await fetch('https://api.replicate.com/v1/models/stability-ai/stable-diffusion/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: { prompt: 'test' } }),
    })
    const testData = await testRes.json()

    return res.status(200).json({
      token_preview: tokenPreview,
      token_length: token.length,
      account_status: accountRes.status,
      account: accountData,
      prediction_test_status: testRes.status,
      prediction_test_response: testData,
    })
  } catch (err) {
    return res.status(200).json({
      token_preview: tokenPreview,
      error: err.message,
    })
  }
}
