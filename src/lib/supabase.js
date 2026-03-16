import { createClient } from '@supabase/supabase-js'

// ── Supabase client ──────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Session ID (usuario anónimo) ─────────────────────────────
export const getSessionId = () => {
  let id = localStorage.getItem('tv_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tv_session_id', id)
  }
  return id
}

// ── Verificar si el anónimo ya usó su prueba gratuita ────────
export const hasUsedFreeTrial = async () => {
  const sessionId = getSessionId()
  try {
    const { data, error } = await supabase
      .from('anonymous_usage')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle()
    if (error) throw error
    return !!data
  } catch {
    return false // si falla, dejamos pasar (mejor experiencia)
  }
}

// ── Registrar uso anónimo ────────────────────────────────────
export const registerFreeTrial = async () => {
  const sessionId = getSessionId()
  try {
    await supabase
      .from('anonymous_usage')
      .insert({ session_id: sessionId })
  } catch {
    // silencioso
  }
}

// ── Guardar visualización ────────────────────────────────────
export const saveVisualization = async ({ userId, selectedProducts, aiResult }) => {
  const sessionId = getSessionId()
  try {
    await supabase.from('visualizations').insert({
      user_id: userId || null,
      session_id: sessionId,
      selected_products: selectedProducts,
      ai_result: aiResult,
    })
  } catch {
    // silencioso — no rompemos la app si falla el guardado
  }
}

// ── Auth: enviar magic link ──────────────────────────────────
export const sendMagicLink = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href,
    }
  })
  return { error }
}

// ── Auth: obtener usuario actual ─────────────────────────────
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Auth: cerrar sesión ──────────────────────────────────────
export const signOut = async () => {
  await supabase.auth.signOut()
}
