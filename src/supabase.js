import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── SESSION ID (para usuarios anónimos) ──────────────────────
export const getSessionId = () => {
  let id = localStorage.getItem('tviz_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tviz_session_id', id)
  }
  return id
}

// ── CHEQUEAR SI EL ANÓNIMO YA USÓ SU PRUEBA ─────────────────
export const checkAnonUsage = async () => {
  const sessionId = getSessionId()
  const { data, error } = await supabase
    .from('anonymous_usage')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) return false
  return !!data
}

// ── REGISTRAR USO ANÓNIMO ────────────────────────────────────
export const registerAnonUsage = async () => {
  const sessionId = getSessionId()
  await supabase
    .from('anonymous_usage')
    .insert({ session_id: sessionId })
}

// ── GUARDAR VISUALIZACIÓN ────────────────────────────────────
export const saveVisualization = async ({ userId, selectedProducts, aiResult }) => {
  const sessionId = getSessionId()
  const { error } = await supabase
    .from('visualizations')
    .insert({
      user_id: userId || null,
      session_id: sessionId,
      selected_products: selectedProducts,
      ai_result: aiResult,
    })
  if (error) console.error('Error guardando visualización:', error)
}

// ── AUTH: MAGIC LINK ─────────────────────────────────────────
export const sendMagicLink = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({ email })
  return { error }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
