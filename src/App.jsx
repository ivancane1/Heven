import { useState, useRef, useCallback, useEffect } from "react"
import { PRODUCTS, CATEGORIES } from "./products.js"
import { STYLES } from "./styles.js"
import {
  supabase,
  getSessionId,
  checkAnonUsage,
  registerAnonUsage,
  saveVisualization,
  sendMagicLink,
  getUser,
} from "./supabase.js"

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY

export default function App() {
  const [screen, setScreen]                 = useState(1)
  const [imageFile, setImageFile]           = useState(null)
  const [imagePreview, setImagePreview]     = useState(null)
  const [imageBase64, setImageBase64]       = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [result, setResult]                 = useState(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)

  // Auth & usage
  const [user, setUser]                     = useState(null)
  const [anonUsed, setAnonUsed]             = useState(false)
  const [showModal, setShowModal]           = useState(false)   // modal registro
  const [modalState, setModalState]         = useState("form")  // "form" | "sent"
  const [email, setEmail]                   = useState("")
  const [sendingLink, setSendingLink]       = useState(false)

  const fileRef = useRef()

  // ── Chequear sesión y uso anónimo al cargar ──────────────────
  useEffect(() => {
    getUser().then(setUser)
    checkAnonUsage().then(setAnonUsed)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Handlers ─────────────────────────────────────────────────
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target.result)
      setImageBase64(ev.target.result.split(",")[1])
    }
    reader.readAsDataURL(file)
  }, [])

  const toggleProduct = (product) => {
    setSelectedProducts(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : prev.length < 4 ? [...prev, product] : prev
    )
  }

  // ── Análisis con IA ──────────────────────────────────────────
  const analyzeWithAI = async () => {
    // Si no está logueado y ya usó su prueba → mostrar modal
    if (!user && anonUsed) {
      setShowModal(true)
      return
    }

    setLoading(true)
    setError(null)

    const productList = selectedProducts
      .map(p => `• ${p.name} (${p.detail}): ${p.tags}`)
      .join("\n")

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: imageFile.type || "image/jpeg", data: imageBase64 }
              },
              {
                type: "text",
                text: `Sos un experto en diseño de interiores y textiles del hogar. Analizá esta foto del espacio del cliente y estos productos que quiere visualizar:\n\n${productList}\n\nRespondé SOLO en JSON con esta estructura exacta (sin markdown, sin explicaciones):\n{\n  "harmony": "Descripción poética de 2-3 líneas de cómo estos productos transformarían el espacio de la foto",\n  "style": "Nombre del estilo decorativo del espacio (ej: Nórdico Cálido, Rústico Moderno)",\n  "suggestions": ["consejo específico 1", "consejo específico 2", "consejo específico 3"],\n  "colorNote": "Observación sobre la paleta de colores del espacio y cómo los productos la complementan"\n}`
              }
            ]
          }]
        })
      })

      const data = await res.json()
      const text = data.content?.find(b => b.type === "text")?.text || ""
      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)

      setResult(parsed)

      // Guardar en Supabase
      await saveVisualization({
        userId: user?.id,
        selectedProducts,
        aiResult: parsed,
      })

      // Registrar uso anónimo si corresponde
      if (!user) {
        await registerAnonUsage()
        setAnonUsed(true)
      }

      setScreen(3)
    } catch (err) {
      console.error(err)
      setError("Hubo un problema al analizar tu espacio. Verificá tu conexión e intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // ── Magic Link ───────────────────────────────────────────────
  const handleSendMagicLink = async () => {
    if (!email) return
    setSendingLink(true)
    const { error } = await sendMagicLink(email)
    setSendingLink(false)
    if (!error) setModalState("sent")
  }

  const reset = () => {
    setScreen(1); setImageFile(null); setImagePreview(null)
    setImageBase64(null); setSelectedProducts([]); setResult(null); setError(null)
  }

  const whatsappMessage = () => {
    const list = selectedProducts.map(p => `- ${p.name} (${p.detail})`).join("\n")
    return encodeURIComponent(`Hola! Usé el visualizador y me interesa:\n\n${list}\n\n¿Me podés dar más info?`)
  }

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* Banner si ya usó prueba anónima */}
        {anonUsed && !user && (
          <div className="banner-used">
            Ya usaste tu prueba gratis. <strong>Registrate</strong> para visualizar sin límites →{" "}
            <span style={{textDecoration:"underline", cursor:"pointer"}} onClick={() => setShowModal(true)}>
              Ingresar
            </span>
          </div>
        )}

        {/* HEADER */}
        <div className="header">
          {screen > 1 && !loading && (
            <button className="header-back" onClick={() => screen === 3 ? setScreen(2) : setScreen(1)}>←</button>
          )}
          <span className="header-title">
            {screen === 1 ? "Mi Espacio" : screen === 2 ? "Elegí tus productos" : "Tu visualización"}
          </span>
          <span className="header-step">
            {user
              ? <span style={{fontSize:10,color:"var(--sage)"}}>✦ {user.email.split("@")[0]}</span>
              : `${screen}/3`
            }
          </span>
        </div>

        {/* STEP INDICATOR */}
        <div className="steps">
          <div className={`step-line ${screen >= 1 ? "active" : ""}`} />
          <div style={{width:4}} />
          <div className={`step-line ${screen >= 2 ? "active" : ""}`} />
          <div style={{width:4}} />
          <div className={`step-line ${screen >= 3 ? "active" : ""}`} />
        </div>

        {/* ── PANTALLA 1: SUBIR FOTO ── */}
        {screen === 1 && (
          <div className="screen">
            <div className="eyebrow">Paso 1 de 3</div>
            <h1 className="headline">Mostranos tu<br /><em>espacio</em></h1>
            <p className="subtext">
              Sacale una foto a tu habitación, living o ambiente. La IA analizará colores, estilo y luz para mostrarte cómo quedarían nuestros productos.
            </p>

            <div className={`upload-zone ${imagePreview ? "has-image" : ""}`}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="preview-img" alt="Tu espacio" />
                  <div className="preview-overlay" onClick={() => fileRef.current?.click()}>✎ Cambiar</div>
                </>
              ) : (
                <>
                  <span className="upload-icon">📷</span>
                  <div className="upload-text">Subí una foto de tu ambiente</div>
                  <div className="upload-hint">JPG · PNG · WEBP · galería o cámara</div>
                </>
              )}
            </div>

            <button className="btn-primary" disabled={!imagePreview} onClick={() => setScreen(2)}>
              Continuar →
            </button>

            <div className="tip-box">
              <span className="tip-icon">💡</span>
              <span className="tip-text">
                <strong>Tip:</strong> Las fotos con buena luz natural dan mejores resultados. Incluí la cama o el sillón donde irían los productos.
              </span>
            </div>

            {!user && (
              <p style={{textAlign:"center", marginTop:20, fontSize:12, color:"var(--warm-gray)"}}>
                ¿Ya tenés cuenta?{" "}
                <span style={{color:"var(--terracotta)", cursor:"pointer", textDecoration:"underline"}}
                  onClick={() => setShowModal(true)}>
                  Ingresá acá
                </span>
              </p>
            )}
          </div>
        )}

        {/* ── PANTALLA 2: PRODUCTOS ── */}
        {screen === 2 && (
          <div className="screen">
            <div className="eyebrow">Paso 2 de 3</div>
            <h1 className="headline">¿Qué querés <em>ver</em>?</h1>
            <p className="subtext">Elegí hasta 4 productos. La IA los combinará con tu espacio.</p>

            {selectedProducts.length > 0 && (
              <div className="selection-bar">
                <div>
                  <div className="selection-info">productos seleccionados</div>
                  <div className="selection-count">{selectedProducts.length} de 4</div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  {selectedProducts.map(p => <span key={p.id} style={{fontSize:20}}>{p.emoji}</span>)}
                </div>
              </div>
            )}

            <div className="category-tabs">
              {CATEGORIES.map(cat => (
                <button key={cat} className={`tab ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}>{cat}</button>
              ))}
            </div>

            <div className="products-grid">
              {PRODUCTS[activeCategory].map(product => {
                const isSelected = selectedProducts.find(p => p.id === product.id)
                return (
                  <div key={product.id}
                    className={`product-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleProduct(product)}
                  >
                    <div className="product-swatch" style={{
                      background: `linear-gradient(135deg, ${product.colors[2]}88, ${product.colors[0]}cc)`
                    }}>
                      {/* Si tenés imagen real, usá: <img src={product.image} className="product-img" alt={product.name} /> */}
                      <span>{product.emoji}</span>
                      <div className="product-check">✓</div>
                    </div>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-detail">{product.detail}</div>
                      <div className="color-dots">
                        {product.colors.map((c, i) => (
                          <div key={i} className="color-dot" style={{background: c}} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {error && <div className="error-box">⚠️ {error}</div>}

            <button className="btn-primary"
              disabled={selectedProducts.length === 0 || loading}
              onClick={analyzeWithAI}
            >
              {loading ? "Analizando..." : "Visualizar en mi espacio →"}
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="screen">
            <div className="loading-screen">
              <div className="spinner" />
              <div className="loading-text">Analizando tu espacio…</div>
              <div className="loading-sub">La IA está combinando colores y texturas</div>
            </div>
          </div>
        )}

        {/* ── PANTALLA 3: RESULTADO ── */}
        {screen === 3 && result && !loading && (
          <div className="screen">
            <div className="eyebrow">Tu visualización</div>
            <h1 className="headline">Así <em>quedaría</em></h1>

            <div className="result-image-wrap">
              <img src={imagePreview} className="result-image" alt="Tu espacio" />
              <div className="result-badge">✦ {result.style}</div>
            </div>

            <div className="selected-chips">
              {selectedProducts.map(p => (
                <span key={p.id} className="chip">{p.emoji} {p.name}</span>
              ))}
            </div>

            <div className="result-card">
              <div className="result-card-label">✦ Análisis de tu espacio</div>
              <p className="result-text">{result.harmony}</p>
            </div>

            {result.colorNote && (
              <div style={{marginBottom:20}}>
                <div className="section-title">Paleta de colores</div>
                <p style={{fontSize:13, color:"var(--charcoal)", lineHeight:1.6, fontWeight:300}}>
                  {result.colorNote}
                </p>
              </div>
            )}

            {result.suggestions?.length > 0 && (
              <div style={{marginBottom:24}}>
                <div className="section-title">Consejos de estilismo</div>
                <ul className="suggestions-list">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="suggestion-item">
                      <div className="suggestion-dot" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a href={`https://wa.me/?text=${whatsappMessage()}`}
              target="_blank" rel="noopener noreferrer"
              style={{textDecoration:"none", display:"block", marginBottom:10}}>
              <button className="btn-whatsapp">
                <span>💬</span> Quiero estos productos
              </button>
            </a>

            <div className="cta-grid">
              <button className="btn-secondary" onClick={() => setScreen(2)}>← Cambiar</button>
              <button className="btn-secondary" onClick={reset}>Nueva foto</button>
            </div>

            {!user && (
              <div style={{textAlign:"center", marginTop:16, padding:"14px 16px",
                background:"var(--linen)", borderRadius:12}}>
                <p style={{fontSize:12, color:"var(--charcoal)", lineHeight:1.6, marginBottom:8}}>
                  Guardá tus visualizaciones y accedé sin límites
                </p>
                <button className="btn-primary" style={{margin:0}}
                  onClick={() => setShowModal(true)}>
                  Crear cuenta gratis
                </button>
              </div>
            )}

            <p style={{textAlign:"center", fontSize:11, color:"var(--warm-gray)", marginTop:12, lineHeight:1.5}}>
              Hacé captura de pantalla para guardar tu visualización 📸
            </p>
          </div>
        )}

        {/* ── MODAL DE REGISTRO / LOGIN ── */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal">
              <div className="modal-handle" />

              {modalState === "form" ? (
                <>
                  <div className="modal-title">Seguí <em>visualizando</em></div>
                  <p className="modal-sub">
                    Ingresá tu email y te mandamos un link mágico para acceder — sin contraseña, rápido y seguro.
                  </p>
                  <input
                    className="modal-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMagicLink()}
                  />
                  <button className="btn-primary" style={{margin:0}}
                    disabled={!email || sendingLink}
                    onClick={handleSendMagicLink}>
                    {sendingLink ? "Enviando..." : "Enviar link de acceso →"}
                  </button>
                  <button className="modal-skip" onClick={() => setShowModal(false)}>
                    Cerrar
                  </button>
                </>
              ) : (
                <div className="modal-success">
                  <div className="modal-success-icon">📬</div>
                  <div className="modal-success-text">¡Revisá tu email!</div>
                  <p className="modal-success-sub">
                    Te mandamos un link a <strong>{email}</strong>.<br />
                    Tocalo para acceder y visualizar sin límites.
                  </p>
                  <button className="modal-skip" onClick={() => { setShowModal(false); setModalState("form") }}>
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
