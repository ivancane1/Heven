import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getSessionId() {
  let id = localStorage.getItem('tviz_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tviz_session_id', id)
  }
  return id
}

export async function checkAnonUsage() {
  try {
    const sessionId = getSessionId()
    const { data } = await supabase
      .from('anonymous_usage')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

export async function registerAnonUsage() {
  try {
    const sessionId = getSessionId()
    await supabase.from('anonymous_usage').insert({ session_id: sessionId })
  } catch (err) {
    console.error('Error registrando uso anónimo:', err)
  }
}

export async function saveVisualization({ userId, selectedProducts, aiResult }) {
  try {
    const sessionId = getSessionId()
    await supabase.from('visualizations').insert({
      user_id: userId || null,
      session_id: sessionId,
      selected_products: selectedProducts,
      ai_result: aiResult,
    })
  } catch (err) {
    console.error('Error guardando visualización:', err)
  }
}

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({ email })
  return { error }
}

export async function signOut() {
  await supabase.auth.signOut()
}

// IMPORTANTE: retorna null sincrónico, nunca una Promise sin resolver
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  } catch {
    return null
  }
}
