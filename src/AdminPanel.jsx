import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase.js'

const A = `
  .adm{max-width:430px;min-height:100vh;margin:0 auto;background:#FDFAF5;font-family:'Jost',sans-serif}
  .adm-hdr{padding:16px 20px;border-bottom:1px solid #EDE6D6;display:flex;align-items:center;justify-content:space-between;background:#FDFAF5;position:sticky;top:0;z-index:50}
  .adm-title{font-family:'Cormorant Garamond',serif;font-size:20px;color:#2C2C2C}
  .adm-back{background:none;border:1px solid #EDE6D6;border-radius:20px;padding:6px 14px;font-size:11px;color:#9E9589;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:.08em}
  .adm-tabs{display:flex;border-bottom:1px solid #EDE6D6;background:#FDFAF5;position:sticky;top:57px;z-index:40}
  .adm-tab{flex:1;padding:12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9E9589;background:none;border:none;cursor:pointer;font-family:'Jost',sans-serif;border-bottom:2px solid transparent;transition:.2s}
  .adm-tab.on{color:#B5603A;border-bottom-color:#B5603A}
  .adm-body{padding:20px}
  .adm-sec{margin-bottom:28px}
  .adm-lbl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#9E9589;margin-bottom:8px;font-weight:500}
  .adm-input{width:100%;padding:11px 14px;border:1.5px solid #EDE6D6;border-radius:10px;font-family:'Jost',sans-serif;font-size:13px;color:#2C2C2C;background:#F5F0E8;outline:none;box-sizing:border-box;transition:.2s}
  .adm-input:focus{border-color:#B5603A}
  .adm-select{width:100%;padding:11px 14px;border:1.5px solid #EDE6D6;border-radius:10px;font-family:'Jost',sans-serif;font-size:13px;color:#2C2C2C;background:#F5F0E8;outline:none;box-sizing:border-box}
  .adm-textarea{width:100%;padding:11px 14px;border:1.5px solid #EDE6D6;border-radius:10px;font-family:'Jost',sans-serif;font-size:13px;color:#2C2C2C;background:#F5F0E8;outline:none;box-sizing:border-box;min-height:90px;resize:vertical;line-height:1.5}
  .adm-textarea:focus{border-color:#B5603A}
  .adm-btn{width:100%;padding:13px;background:#B5603A;color:#fff;border:none;border-radius:10px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:.2s;margin-top:8px}
  .adm-btn:hover{background:#9E4E2C}
  .adm-btn:disabled{background:#9E9589;cursor:not-allowed}
  .adm-btn2{width:100%;padding:11px;background:none;border:1.5px solid #B5603A;color:#B5603A;border-radius:10px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:.2s;margin-top:8px}
  .adm-btn2:hover{background:#FEF4EF}
  .adm-btn2:disabled{border-color:#9E9589;color:#9E9589;cursor:not-allowed}
  .adm-upload{border:1.5px dashed #D4835F;border-radius:12px;padding:20px;text-align:center;cursor:pointer;background:#FBF7F0;position:relative;overflow:hidden;transition:.2s}
  .adm-upload:hover{background:#F5EDE0}
  .adm-upimg{width:100%;height:160px;object-fit:cover;border-radius:10px;display:block}
  .adm-utxt{font-size:13px;color:#9E9589}
  .adm-card{background:#F5F0E8;border-radius:12px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
  .adm-card-img{width:52px;height:52px;border-radius:8px;object-fit:cover;background:#EDE6D6;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px}
  .adm-card-name{font-family:'Cormorant Garamond',serif;font-size:16px;color:#2C2C2C}
  .adm-card-det{font-size:11px;color:#9E9589;margin-top:2px}
  .adm-card-cat{font-size:10px;color:#B5603A;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
  .adm-del{margin-left:auto;background:none;border:1px solid #EDE6D6;border-radius:8px;padding:5px 10px;font-size:11px;color:#9E9589;cursor:pointer;flex-shrink:0}
  .adm-del:hover{border-color:#E24B4A;color:#E24B4A}
  .adm-edit{background:none;border:1px solid #EDE6D6;border-radius:8px;padding:5px 10px;font-size:11px;color:#9E9589;cursor:pointer;flex-shrink:0}
  .adm-edit:hover{border-color:#B5603A;color:#B5603A}
  .adm-empty{text-align:center;padding:32px;color:#9E9589;font-size:13px}
  .adm-msg{padding:10px 14px;border-radius:8px;font-size:12px;margin-bottom:12px}
  .adm-msg.ok{background:#EAF3DE;color:#3B6D11}
  .adm-msg.err{background:#FCEBEB;color:#A32D2D}
  .adm-row{display:flex;gap:8px}
  .adm-row .adm-input{flex:1}
  .adm-analyzing{display:flex;align-items:center;gap:8px;font-size:12px;color:#B5603A;margin-top:6px}
  .adm-spin{width:14px;height:14px;border:2px solid #EDE6D6;border-top-color:#B5603A;border-radius:50%;animation:spin 1s linear infinite;flex-shrink:0}
  @keyframes spin{to{transform:rotate(360deg)}}
  .adm-toggle{display:flex;align-items:center;gap:10px;margin-top:8px}
  .adm-toggle input[type=checkbox]{width:16px;height:16px;accent-color:#B5603A;cursor:pointer}
  .adm-toggle label{font-size:13px;color:#2C2C2C;cursor:pointer}
  .adm-divider{border:none;border-top:1px solid #EDE6D6;margin:20px 0}
  .adm-form-title{font-family:'Cormorant Garamond',serif;font-size:18px;color:#2C2C2C;margin-bottom:16px}
`

export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState('productos')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  // Form producto
  const [form, setForm] = useState({ name: '', detail: '', category: '', tags: '', active: true })
  const [editId, setEditId] = useState(null)
  const [imgFile, setImgFile] = useState(null)
  const [imgPrev, setImgPrev] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileRef = useRef()

  // Form categoría
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')

  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // onAuthStateChange se dispara inmediatamente con el estado actual
    // incluso cuando se entra por URL directa con magic link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess)
      setAuthChecked(true)
      if (sess) { loadCategories(); loadProducts() }
    })
    // Timeout fallback: si en 3s no hubo evento, marcamos como verificado (sin sesión)
    const timeout = setTimeout(() => setAuthChecked(true), 3000)
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const showMsg = (text, type = 'ok') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 4000)
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    if (data) setCategories(data)
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  // ── Imagen ────────────────────────────────────────────────
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    // Redimensionar a max 1024px para no superar límite de Vercel (4.5MB)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setImgPrev(dataUrl)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  async function analyzeImage() {
    if (!imgPrev) return
    setAnalyzing(true)
    try {
      let base64, imageType

      if (imgPrev.startsWith('data:')) {
        // Imagen nueva subida localmente
        base64 = imgPrev.split(',')[1]
        const mimeMatch = imgPrev.match(/data:([^;]+);/)
        imageType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      } else {
        // Imagen remota (Supabase Storage) — descargar y convertir
        const response = await fetch(imgPrev)
        const blob = await response.blob()
        imageType = blob.type || 'image/jpeg'
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }

      const res = await fetch('/api/admin-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, imageType }),
      })
      const data = await res.json()
      if (data.description) {
        setForm(f => ({ ...f, tags: data.description }))
        showMsg('Descripción generada por Claude')
      }
    } catch (err) {
      showMsg('Error al analizar imagen: ' + err.message, 'err')
    } finally {
      setAnalyzing(false)
    }
  }

  async function uploadImage() {
    if (!imgFile) return null
    const ext = imgFile.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, imgFile, { contentType: imgFile.type })
    if (error) throw new Error('Error subiendo imagen: ' + error.message)
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path)
    return publicUrl
  }

  // ── Guardar producto ──────────────────────────────────────
  async function saveProduct() {
    if (!form.name || !form.category) {
      showMsg('Nombre y categoría son obligatorios', 'err'); return
    }
    setLoading(true)
    try {
      let imageUrl = form.image_url || null
      if (imgFile) imageUrl = await uploadImage()

      const payload = {
        name: form.name,
        detail: form.detail,
        category: form.category,
        tags: form.tags,
        image_url: imageUrl,
        active: form.active,
      }

      if (editId) {
        await supabase.from('products').update(payload).eq('id', editId)
        showMsg('Producto actualizado')
      } else {
        await supabase.from('products').insert(payload)
        showMsg('Producto guardado')
      }

      resetForm()
      loadProducts()
    } catch (err) {
      showMsg(err.message, 'err')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ name: '', detail: '', category: '', tags: '', active: true })
    setEditId(null)
    setImgFile(null)
    setImgPrev(null)
  }

  function editProduct(p) {
    setForm({ name: p.name, detail: p.detail || '', category: p.category, tags: p.tags || '', active: p.active, image_url: p.image_url })
    setEditId(p.id)
    setImgPrev(p.image_url || null)
    setImgFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    showMsg('Producto eliminado')
    loadProducts()
  }

  // ── Categorías ────────────────────────────────────────────
  async function saveCategory() {
    if (!catName) { showMsg('Nombre requerido', 'err'); return }
    const slug = catSlug || catName.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const { error } = await supabase.from('categories').insert({ name: catName, slug })
    if (error) { showMsg(error.message, 'err'); return }
    setCatName(''); setCatSlug('')
    showMsg('Categoría creada')
    loadCategories()
  }

  async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    showMsg('Categoría eliminada')
    loadCategories()
  }

  const [loginEmail, setLoginEmail] = useState('')
  const [loginSent, setLoginSent] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  async function sendAdminLink() {
    if (!loginEmail) return
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: {
        emailRedirectTo: window.location.origin + '/admin'
      }
    })
    setLoginLoading(false)
    if (error) {
      showMsg('Error: ' + error.message, 'err')
    } else {
      setLoginSent(true)
    }
  }

  if (authChecked && !session) return (
    <>
      <style>{A}</style>
      <div className="adm">
        <div className="adm-hdr">
          <span className="adm-title">Admin · Heven</span>
          <button className="adm-back" onClick={onBack}>← Salir</button>
        </div>
        <div className="adm-body" style={{paddingTop:48}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontSize:32,marginBottom:12}}>🔒</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#2C2C2C',marginBottom:6}}>Acceso admin</div>
            <div style={{fontSize:13,color:'#9E9589'}}>Ingresá tu email para recibir el link de acceso</div>
          </div>
          {loginSent ? (
            <div className="adm-msg ok" style={{textAlign:'center',padding:20}}>
              Link enviado a {loginEmail}. Revisá tu email y hacé click en el link — esta página se va a actualizar automáticamente.
            </div>
          ) : (
            <>
              <div className="adm-lbl">Email</div>
              <input
                className="adm-input"
                type="email"
                placeholder="tu@email.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAdminLink()}
              />
              <button className="adm-btn" onClick={sendAdminLink} disabled={loginLoading || !loginEmail}>
                {loginLoading ? 'Enviando...' : 'Enviar magic link'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )

  if (!authChecked) return <div style={{padding:40,textAlign:'center',color:'#9E9589',fontFamily:"'Jost',sans-serif"}}>Verificando sesión...</div>

  return (
    <>
      <style>{A}</style>
      <div className="adm">
        <div className="adm-hdr">
          <span className="adm-title">Admin · Heven</span>
          <button className="adm-back" onClick={onBack}>← Salir</button>
        </div>

        <div className="adm-tabs">
          {['productos', 'categorias'].map(t => (
            <button key={t} className={`adm-tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
              {t === 'productos' ? 'Productos' : 'Categorías'}
            </button>
          ))}
        </div>

        <div className="adm-body">
          {msg && <div className={`adm-msg ${msg.type}`}>{msg.text}</div>}

          {tab === 'productos' && (
            <>
              {/* Formulario */}
              <div className="adm-sec">
                <div className="adm-form-title">{editId ? 'Editar producto' : 'Nuevo producto'}</div>

                {/* Imagen */}
                <div className="adm-lbl">Foto del producto</div>
                <div className="adm-upload" onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                  {imgPrev
                    ? <img src={imgPrev} className="adm-upimg" alt="preview" />
                    : <div className="adm-utxt">Tocá para subir foto</div>
                  }
                </div>

                {imgPrev && (
                  <button className="adm-btn2" onClick={analyzeImage} disabled={analyzing}>
                    {analyzing ? '...' : 'Analizar con Claude'}
                  </button>
                )}
                {analyzing && (
                  <div className="adm-analyzing">
                    <div className="adm-spin" />
                    Claude está analizando el producto...
                  </div>
                )}

                <hr className="adm-divider" />

                <div className="adm-lbl">Nombre del producto</div>
                <input className="adm-input" placeholder="Ej: Gris Encaje" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

                <div className="adm-lbl" style={{ marginTop: 12 }}>Detalle / subtítulo</div>
                <input className="adm-input" placeholder="Ej: Quilt · 2.5 plazas" value={form.detail}
                  onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} />

                <div className="adm-lbl" style={{ marginTop: 12 }}>Categoría</div>
                <select className="adm-select" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Seleccioná una categoría</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>

                <div className="adm-lbl" style={{ marginTop: 12 }}>Descripción para IA (generada por Claude)</div>
                <textarea className="adm-textarea"
                  placeholder="Hacé click en 'Analizar con Claude' después de subir la foto..."
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />

                <div className="adm-toggle">
                  <input type="checkbox" id="active" checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  <label htmlFor="active">Producto activo (visible en la app)</label>
                </div>

                <button className="adm-btn" onClick={saveProduct} disabled={loading}>
                  {loading ? 'Guardando...' : editId ? 'Actualizar producto' : 'Guardar producto'}
                </button>
                {editId && (
                  <button className="adm-btn2" onClick={resetForm}>Cancelar edición</button>
                )}
              </div>

              <hr className="adm-divider" />

              {/* Lista de productos */}
              <div className="adm-sec">
                <div className="adm-lbl">{products.length} productos</div>
                {products.length === 0
                  ? <div className="adm-empty">No hay productos todavía</div>
                  : products.map(p => (
                    <div key={p.id} className="adm-card">
                      {p.image_url
                        ? <img src={p.image_url} className="adm-card-img" alt={p.name} />
                        : <div className="adm-card-img">🛏</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="adm-card-name">{p.name}</div>
                        <div className="adm-card-det">{p.detail}</div>
                        <div className="adm-card-cat">{p.category} {!p.active && '· Inactivo'}</div>
                      </div>
                      <button className="adm-edit" onClick={() => editProduct(p)}>Editar</button>
                      <button className="adm-del" onClick={() => deleteProduct(p.id)}>✕</button>
                    </div>
                  ))
                }
              </div>
            </>
          )}

          {tab === 'categorias' && (
            <>
              <div className="adm-sec">
                <div className="adm-form-title">Nueva categoría</div>
                <div className="adm-lbl">Nombre</div>
                <input className="adm-input" placeholder="Ej: Cubrecamas" value={catName}
                  onChange={e => setCatName(e.target.value)} />
                <div className="adm-lbl" style={{ marginTop: 12 }}>Slug (opcional, se genera automático)</div>
                <input className="adm-input" placeholder="Ej: cubrecamas" value={catSlug}
                  onChange={e => setCatSlug(e.target.value)} />
                <button className="adm-btn" onClick={saveCategory}>Crear categoría</button>
              </div>

              <hr className="adm-divider" />

              <div className="adm-sec">
                <div className="adm-lbl">{categories.length} categorías</div>
                {categories.length === 0
                  ? <div className="adm-empty">No hay categorías todavía</div>
                  : categories.map(c => (
                    <div key={c.id} className="adm-card">
                      <div style={{ flex: 1 }}>
                        <div className="adm-card-name">{c.name}</div>
                        <div className="adm-card-det">/{c.slug}</div>
                      </div>
                      <button className="adm-del" onClick={() => deleteCategory(c.id)}>✕</button>
                    </div>
                  ))
                }
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
