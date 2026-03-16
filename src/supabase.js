import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard: si faltan las variables mostramos error claro en consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan variables de entorno de Supabase. Verificá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.")
}

export const supabase = createClient(
  supabaseUrl  || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
)

// ── SESSION ID para usuarios anónimos ────────────────────────
export const getSessionId = () => {
  let id = localStorage.getItem("tviz_session_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("tviz_session_id", id)
  }
  return id
}

// ── Chequear si el anónimo ya usó su prueba ──────────────────
export const checkAnonUsage = async () => {
  try {
    const sessionId = getSessionId()
    const { data } = await supabase
      .from("anonymous_usage")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

// ── Registrar uso anónimo ────────────────────────────────────
export const registerAnonUsage = async () => {
  try {
    const sessionId = getSessionId()
    await supabase
      .from("anonymous_usage")
      .insert({ session_id: sessionId })
  } catch (err) {
    console.error("Error registrando uso anónimo:", err)
  }
}

// ── Guardar visualización ────────────────────────────────────
export const saveVisualization = async ({ userId, selectedProducts, aiResult }) => {
  try {
    const sessionId = getSessionId()
    await supabase
      .from("visualizations")
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        selected_products: selectedProducts,
        ai_result: aiResult,
      })
  } catch (err) {
    console.error("Error guardando visualización:", err)
  }
}

// ── Auth: Magic Link ─────────────────────────────────────────
export const sendMagicLink = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({ email })
  return { error }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

// Retorna null si no hay sesión (nunca retorna Promise sin resolver)
export const getUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}
