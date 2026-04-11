import AdminPanel from './AdminPanel.jsx'
import { useState, useRef, useCallback, useEffect } from 'react'
import { PRODUCTS, CATEGORIES } from './products.js'
import {
  supabase,
  checkAnonUsage,
  registerAnonUsage,
  saveVisualization,
  sendMagicLink,
  getCurrentUser,
} from './supabase.js'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --cream:#F5F0E8;--linen:#EDE6D6;--terra:#B5603A;--terra-l:#D4835F;
    --sage:#7A8C6E;--dark:#2C2C2C;--gray:#9E9589;--white:#FDFAF5;
  }
  body{background:var(--cream);font-family:'Jost',sans-serif}
  .app{max-width:430px;min-height:100vh;margin:0 auto;background:var(--white);box-shadow:0 0 60px rgba(0,0,0,.08);overflow:hidden}
  .header{padding:20px 24px 16px;border-bottom:1px solid var(--linen);display:flex;align-items:center;gap:12px;background:var(--white);position:sticky;top:0;z-index:100}
  .hback{width:36px;height:36px;border:1px solid var(--linen);border-radius:50%;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--dark);font-size:16px;transition:.2s}
  .hback:hover{background:var(--linen)}
  .htitle{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--dark)}
  .hstep{margin-left:auto;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gray)}
  .steps{display:flex;gap:4px;padding:0 24px;margin:16px 0 0}
  .sline{flex:1;height:2px;background:var(--linen);transition:background .5s}
  .sline.on{background:var(--terra)}
  .screen{padding:28px 24px 48px;animation:up .4s ease}
  @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .eye{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--terra);font-weight:500;margin-bottom:8px}
  .h1{font-family:'Cormorant Garamond',serif;font-size:32px;line-height:1.15;font-weight:300;color:var(--dark);margin-bottom:12px}
  .h1 em{font-style:italic;color:var(--terra)}
  .sub{font-size:13px;color:var(--gray);line-height:1.6;margin-bottom:28px;font-weight:300}
  .uzone{border:1.5px dashed var(--terra-l);border-radius:16px;background:linear-gradient(135deg,#FBF7F0,#F5EDE0);padding:40px 24px;text-align:center;cursor:pointer;transition:.3s;position:relative;overflow:hidden}
  .uzone:hover{border-color:var(--terra)}
  .uzone.has{padding:0;border-style:solid}
  .uzone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
  .uico{font-size:36px;margin-bottom:12px;display:block}
  .utxt{font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--dark);margin-bottom:6px}
  .uhint{font-size:11px;color:var(--gray)}
  .prev{width:100%;height:240px;object-fit:cover;border-radius:14px;display:block}
  .pover{position:absolute;bottom:12px;right:12px;background:rgba(255,255,255,.9);border-radius:20px;padding:6px 12px;font-size:11px;color:var(--terra);font-weight:500;backdrop-filter:blur(4px);cursor:pointer}
  .btn{width:100%;padding:16px;background:var(--terra);color:#fff;border:none;border-radius:12px;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;margin-top:20px;transition:.25s;display:flex;align-items:center;justify-content:center;gap:8px}
  .btn:hover{background:#9E4E2C;transform:translateY(-1px);box-shadow:0 8px 24px rgba(181,96,58,.3)}
  .btn:disabled{background:var(--gray);cursor:not-allowed;transform:none;box-shadow:none}
  .tip{background:linear-gradient(135deg,#EEF2EA,#E8EDE4);border-radius:12px;padding:14px 16px;margin-top:20px;display:flex;gap:10px}
  .tipico{font-size:16px;flex-shrink:0;margin-top:1px}
  .tiptxt{font-size:12px;color:var(--sage);line-height:1.5}
  .tabs{display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px}
  .tabs::-webkit-scrollbar{display:none}
  .tab{flex-shrink:0;padding:7px 16px;border-radius:20px;border:1px solid var(--linen);background:none;font-family:'Jost',sans-serif;font-size:12px;color:var(--gray);cursor:pointer;transition:.2s}
  .tab.on{background:var(--dark);color:#fff;border-color:var(--dark)}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
  .card{border-radius:12px;overflow:hidden;border:2px solid transparent;cursor:pointer;transition:.25s;position:relative;background:var(--linen)}
  .card.sel{border-color:var(--terra);transform:scale(.97)}
  .card:hover{transform:scale(.98)}
  .swatch{height:130px;display:flex;align-items:center;justify-content:center;font-size:42px;position:relative;overflow:hidden}
  .pimg{width:100%;height:130px;object-fit:cover;display:block}
  .check{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;background:var(--terra);color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s}
  .card.sel .check{opacity:1}
  .cinfo{padding:10px 12px 12px}
  .cname{font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--dark);margin-bottom:2px}
  .cdet{font-size:11px;color:var(--gray)}
  .cdots{display:flex;gap:4px;margin-top:6px}
  .dot{width:10px;height:10px;border-radius:50%;border:1px solid rgba(0,0,0,.1)}
  .selbar{background:var(--dark);border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .selinfo{font-size:12px;color:rgba(255,255,255,.7)}
  .selct{font-family:'Cormorant Garamond',serif;font-size:20px;color:#fff}
  .loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:16px;text-align:center;padding:0 24px}
  .spin{width:52px;height:52px;border:2px solid var(--linen);border-top-color:var(--terra);border-radius:50%;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .ltxt{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--dark);font-weight:300}
  .lsub{font-size:12px;color:var(--gray);letter-spacing:.08em;line-height:1.6}
  .lprog{width:100%;max-width:200px;height:2px;background:var(--linen);border-radius:2px;overflow:hidden;margin-top:4px}
  .lprogbar{height:100%;background:var(--terra);border-radius:2px;animation:prog 25s linear forwards}
  @keyframes prog{from{width:0%}to{width:95%}}
  .genimg-wrap{position:relative;border-radius:16px;overflow:hidden;margin-bottom:12px}
  .genimg{width:100%;display:block;border-radius:16px}
  .genbadge{position:absolute;top:12px;left:12px;background:rgba(181,96,58,.92);color:#fff;padding:5px 12px;border-radius:20px;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;backdrop-filter:blur(4px)}
  .aibadge{position:absolute;top:12px;right:12px;background:rgba(0,0,0,.7);color:#fff;padding:5px 10px;border-radius:20px;font-size:10px;letter-spacing:.06em;backdrop-filter:blur(4px)}
  .toggle-row{display:flex;gap:8px;margin-bottom:20px}
  .tglbtn{flex:1;padding:9px;border-radius:10px;border:1.5px solid var(--linen);background:none;font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--gray);cursor:pointer;transition:.2s;text-transform:uppercase}
  .tglbtn.on{border-color:var(--terra);color:var(--terra);background:#FEF4EF}
  .riwrap{position:relative;border-radius:16px;overflow:hidden;margin-bottom:12px}
  .rimg{width:100%;height:220px;object-fit:cover;display:block}
  .rbadge{position:absolute;top:12px;left:12px;background:rgba(44,44,44,.85);color:#fff;padding:5px 12px;border-radius:20px;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;backdrop-filter:blur(4px)}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
  .chip{background:var(--linen);border-radius:20px;padding:5px 12px;font-size:11px;color:var(--dark)}
  .rcard{background:linear-gradient(135deg,#F8F4EE,#F2EBE0);border-radius:16px;padding:20px;margin-bottom:16px;border-left:3px solid var(--terra)}
  .rlbl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--terra);font-weight:500;margin-bottom:10px}
  .rtxt{font-family:'Cormorant Garamond',serif;font-size:17px;line-height:1.65;color:var(--dark);font-weight:300}
  .stit{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--gray);font-weight:500;margin-bottom:10px}
  .slist{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
  .sitem{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--dark);line-height:1.5}
  .sdot{width:6px;height:6px;border-radius:50%;background:var(--sage);flex-shrink:0;margin-top:6px}
  .btngrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
  .btn2{padding:14px;border:1.5px solid var(--terra);border-radius:12px;background:none;color:var(--terra);font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:.2s}
  .btn2:hover{background:var(--terra);color:#fff}
  .btnwa{width:100%;padding:16px;background:#25D366;color:#fff;border:none;border-radius:12px;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:.25s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;text-decoration:none}
  .btnwa:hover{background:#1db954;transform:translateY(-1px)}
  .moverlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;z-index:200;backdrop-filter:blur(4px)}
  .modal{background:var(--white);border-radius:24px 24px 0 0;padding:32px 24px 40px;width:100%;max-width:430px;animation:sup .35s}
  @keyframes sup{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .mhandle{width:40px;height:4px;background:var(--linen);border-radius:2px;margin:0 auto 24px}
  .mttl{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:300;color:var(--dark);margin-bottom:8px}
  .mttl em{font-style:italic;color:var(--terra)}
  .msub{font-size:13px;color:var(--gray);line-height:1.6;margin-bottom:24px}
  .minput{width:100%;padding:14px 16px;border:1.5px solid var(--linen);border-radius:12px;font-family:'Jost',sans-serif;font-size:14px;color:var(--dark);background:var(--cream);outline:none;margin-bottom:12px;transition:.2s}
  .minput:focus{border-color:var(--terra)}
  .mskip{width:100%;padding:12px;background:none;border:none;font-family:'Jost',sans-serif;font-size:12px;color:var(--gray);cursor:pointer;text-decoration:underline;margin-top:4px}
  .err{background:#FEF0EC;border:1px solid #F5C6B4;border-radius:12px;padding:14px 16px;font-size:13px;color:var(--terra);line-height:1.5;margin-bottom:16px}
  .banner{background:var(--dark);color:#fff;padding:12px 20px;text-align:center;font-size:12px;letter-spacing:.06em;line-height:1.6}
  .banner strong{color:var(--terra-l)}
  .ubox{text-align:center;margin-top:16px;padding:14px 16px;background:var(--linen);border-radius:12px}
`

export default function App() {
  const [screen, setScreen]     = useState(1)
  const [imgFile, setImgFile]   = useState(null)
  const [imgPrev, setImgPrev]   = useState(null)
  const [img64, setImg64]       = useState(null)
  const [sel, setSel]           = useState([])
  const [cat, setCat]           = useState(CATEGORIES[0])
  const [result, setResult]     = useState(null)
  const [genImg, setGenImg]     = useState(null)
  const [showGen, setShowGen]   = useState(true)
  const [loadStep, setLoadStep] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [user, setUser]         = useState(null)
  const [anonUsed, setAnonUsed] = useState(false)
  const [modal, setModal]       = useState(false)
  const [mstate, setMstate]     = useState('form')
  const [email, setEmail]       = useState('')
  const [sending, setSending]   = useState(false)
  const fileRef = useRef()
  const [adminMode, setAdminMode] = useState(false)
  const [dbProducts, setDbProducts] = useState([])
  const allProducts = dbProducts.length > 0 ? dbProducts : PRODUCTS

  useEffect(() => {
    getCurrentUser().then(u => setUser(u))
    checkAnonUsage().then(v => setAnonUsed(v))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    // Cargar productos desde Supabase
      supabase.from('products').select('*').eq('active', true).order('created_at').then(({ data }) => {
        if (data && data.length > 0) setDbProducts(data)
      })
      return () => subscription.unsubscribe()
  }, [])

  const handleImg = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    const r = new FileReader()
    r.onload = (ev) => {
      setImgPrev(ev.target.result)
      setImg64(ev.target.result.split(',')[1])
    }
    r.readAsDataURL(file)
  }, [])

  const toggle = (p) => {
    setSel(prev =>
      prev.find(x => x.id === p.id)
        ? prev.filter(x => x.id !== p.id)
        : prev.length < 4 ? [...prev, p] : prev
    )
  }

  const analyze = async () => {
    if (!user && anonUsed) { setModal(true); return }
    setLoading(true)
    setError(null)
    setGenImg(null)

    const productList = sel.map(p => `• ${p.name} (${p.detail}): ${p.tags}`).join('\n')

    try {
      // PASO 1 — Claude analiza el espacio
      setLoadStep('Analizando tu espacio…')
      const res1 = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: img64,
          imageType: imgFile?.type || 'image/jpeg',
          productList,
        }),
      })

      const data1 = await res1.json()
      if (!res1.ok || data1.error) throw new Error(data1.error || `Error del servidor: ${res1.status}`)
      const parsed = data1.result
      setResult(parsed)

      // PASO 2 — Fal.ai con las DOS imágenes: espacio + foto real del producto
      setLoadStep('Generando la visualización con IA…')

      // Tomar el primer producto con imagen real
      const productWithImage = sel.find(p => p.image)
      const productImageUrl = productWithImage
        ? `${window.location.origin}${productWithImage.image}`
        : null

      const res2 = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: img64,
          imageType: imgFile?.type || 'image/jpeg',
          productImageUrl,
          productName: sel.map(p => p.name).join(', '),
          style: parsed.style,
        }),
      })

      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.imageUrl) { setGenImg(data2.imageUrl); setShowGen(true) }
      } else {
        console.warn('Fal.ai falló')
        setShowGen(false)
      }

      await saveVisualization({ userId: user?.id, selectedProducts: sel, aiResult: parsed })
      if (!user) { await registerAnonUsage(); setAnonUsed(true) }
      setScreen(3)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Hubo un problema. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setLoading(false)
      setLoadStep('')
    }
  }

  const sendLink = async () => {
    if (!email) return
    setSending(true)
    const { error } = await sendMagicLink(email)
    setSending(false)
    if (!error) setMstate('sent')
  }

  const reset = () => {
    setScreen(1); setImgFile(null); setImgPrev(null); setImg64(null)
    setSel([]); setResult(null); setGenImg(null); setError(null)
  }

  const waMsg = () => {
    const list = sel.map(p => `- ${p.name} (${p.detail})`).join('\n')
    return encodeURIComponent(`Hola! Usé el visualizador y me interesa:\n\n${list}\n\n¿Me podés dar más info?`)
  }

  if (adminMode) return <AdminPanel onBack={() => setAdminMode(false)} />

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {anonUsed && !user && (
          <div className="banner">
            Ya usaste tu prueba gratis. <strong>Registrate</strong> para seguir →{' '}
            <span style={{textDecoration:'underline',cursor:'pointer'}} onClick={() => setModal(true)}>Ingresar</span>
          </div>
        )}

        <div className="header">
          {screen > 1 && !loading && (
            <button className="hback" onClick={() => screen === 3 ? setScreen(2) : setScreen(1)}>←</button>
          )}
          <span className="htitle">
            {screen === 1 ? 'Mi Espacio' : screen === 2 ? 'Elegí productos' : 'Tu visualización'}
          </span>
          <span className="hstep">
            {user
              ? <span style={{fontSize:10,color:'var(--sage)'}}>✦ {user.email?.split('@')[0]}</span>
              : `${screen}/3`
            }
          </span>
        </div>

        <div className="steps">
          <div className={`sline ${screen >= 1 ? 'on' : ''}`} />
          <div style={{width:4}} />
          <div className={`sline ${screen >= 2 ? 'on' : ''}`} />
          <div style={{width:4}} />
          <div className={`sline ${screen >= 3 ? 'on' : ''}`} />
        </div>

        {/* ── PANTALLA 1 ── */}
        {screen === 1 && (
          <div className="screen">
            <div className="eye">Paso 1 de 3</div>
            <h1 className="h1">Mostranos tu<br /><em>espacio</em></h1>
            <p className="sub">Sacale una foto a tu habitación o ambiente. La IA generará una visualización real con nuestros productos en tu espacio.</p>

            <div className={`uzone ${imgPrev ? 'has' : ''}`}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} />
              {imgPrev ? (
                <>
                  <img src={imgPrev} className="prev" alt="Tu espacio" />
                  <div className="pover" onClick={() => fileRef.current?.click()}>✎ Cambiar</div>
                </>
              ) : (
                <>
                  <span className="uico">📷</span>
                  <div className="utxt">Subí una foto de tu ambiente</div>
                  <div className="uhint">JPG · PNG · WEBP · galería o cámara</div>
                </>
              )}
            </div>

            <button className="btn" disabled={!imgPrev} onClick={() => setScreen(2)}>Continuar →</button>

            <div className="tip">
              <span className="tipico">💡</span>
              <span className="tiptxt"><strong>Tip:</strong> Las fotos con buena luz natural dan mejores resultados. Incluí la cama o el sillón donde irían los productos.</span>
            </div>

            {!user && (
              <p style={{textAlign:'center',marginTop:20,fontSize:12,color:'var(--gray)'}}>
                ¿Ya tenés cuenta?{' '}
                <span style={{color:'var(--terra)',cursor:'pointer',textDecoration:'underline'}} onClick={() => setModal(true)}>Ingresá acá</span>
              </p>
            )}
          </div>
        )}

        {/* ── PANTALLA 2 ── */}
        {screen === 2 && (
          <div className="screen">
            <div className="eye">Paso 2 de 3</div>
            <h1 className="h1">¿Qué querés <em>ver</em>?</h1>
            <p className="sub">Elegí hasta 4 productos. La IA los integrará en tu foto.</p>

            {sel.length > 0 && (
              <div className="selbar">
                <div>
                  <div className="selinfo">seleccionados</div>
                  <div className="selct">{sel.length} de 4</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  {sel.map(p => <span key={p.id} style={{fontSize:20}}>{p.image ? '🖼️' : p.emoji}</span>)}
                </div>
              </div>
            )}

            <div className="tabs">
              {CATEGORIES.map(c => (
                <button key={c} className={`tab ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>

            <div className="grid">
              {allProducts.filter(p => p.category === cat || cat === 'all').map(p => {
                const isSel = sel.find(x => x.id === p.id)
                const pImage = p.image || p.image_url
                return (
                  <div key={p.id} className={`card ${isSel ? 'sel' : ''}`} onClick={() => toggle(p)}>
                    <div className="swatch" style={!pImage ? {background:`linear-gradient(135deg,${(p.colors||[])[2]||'#EDE6D6'}88,${(p.colors||[])[0]||'#B5603A'}cc)`} : {}}>
                      {pImage
                        ? <img src={pImage} className="pimg" alt={p.name} onError={e => { e.target.style.display='none' }} />
                        : <span>{p.emoji}</span>
                      }
                      <div className="check">✓</div>
                    </div>
                    <div className="cinfo">
                      <div className="cname">{p.name}</div>
                      <div className="cdet">{p.detail}</div>
                      <div className="cdots">
                        {p.colors.map((c, i) => <div key={i} className="dot" style={{background:c}} />)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {error && <div className="err">⚠️ {error}</div>}

            <button className="btn" disabled={sel.length === 0 || loading} onClick={analyze}>
              {loading ? 'Procesando...' : 'Generar visualización →'}
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="screen" style={{padding:0}}>
            <div className="loading">
              <div className="spin" />
              <div className="ltxt">{loadStep || 'Procesando…'}</div>
              <div className="lsub">
                {loadStep.includes('Generando')
                  ? 'Esto puede tardar hasta 20 segundos'
                  : 'Analizando colores, estilo y luz'
                }
              </div>
              <div className="lprog"><div className="lprogbar" /></div>
            </div>
          </div>
        )}

        {/* ── PANTALLA 3 ── */}
        {screen === 3 && result && !loading && (
          <div className="screen">
            <div className="eye">Tu visualización</div>
            <h1 className="h1">Así <em>quedaría</em></h1>

            {genImg && (
              <div className="toggle-row">
                <button className={`tglbtn ${showGen ? 'on' : ''}`} onClick={() => setShowGen(true)}>✦ Con productos</button>
                <button className={`tglbtn ${!showGen ? 'on' : ''}`} onClick={() => setShowGen(false)}>Tu foto original</button>
              </div>
            )}

            {genImg && showGen && (
              <div className="genimg-wrap">
                <img src={genImg} className="genimg" alt="Tu espacio con productos" />
                <div className="genbadge">✦ {result.style}</div>
                <div className="aibadge">Generado con IA</div>
              </div>
            )}

            {(!genImg || !showGen) && (
              <div className="riwrap">
                <img src={imgPrev} className="rimg" style={{height:'auto',maxHeight:280}} alt="Tu espacio" />
                <div className="rbadge">📷 {!genImg ? result.style : 'Foto original'}</div>
              </div>
            )}

            <div className="chips" style={{marginTop:12}}>
              {sel.map(p => <span key={p.id} className="chip">{p.emoji} {p.name}</span>)}
            </div>

            <div className="rcard">
              <div className="rlbl">✦ Análisis de tu espacio</div>
              <p className="rtxt">{result.harmony}</p>
            </div>

            {result.colorNote && (
              <div style={{marginBottom:20}}>
                <div className="stit">Paleta de colores</div>
                <p style={{fontSize:13,color:'var(--dark)',lineHeight:1.6,fontWeight:300}}>{result.colorNote}</p>
              </div>
            )}

            {result.suggestions?.length > 0 && (
              <div style={{marginBottom:24}}>
                <div className="stit">Consejos de estilismo</div>
                <ul className="slist">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="sitem"><div className="sdot" />{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <a href={`https://wa.me/?text=${waMsg()}`} target="_blank" rel="noopener noreferrer" className="btnwa">
              <span>💬</span> Quiero estos productos
            </a>

            <div className="btngrid">
              <button className="btn2" onClick={() => setScreen(2)}>← Cambiar</button>
              <button className="btn2" onClick={reset}>Nueva foto</button>
            </div>

            {!user && (
              <div className="ubox">
                <p style={{fontSize:12,color:'var(--dark)',lineHeight:1.6,marginBottom:8}}>Guardá tus visualizaciones y accedé sin límites</p>
                <button className="btn" style={{margin:0}} onClick={() => setModal(true)}>Crear cuenta gratis</button>
              </div>
            )}

            <p style={{textAlign:'center',fontSize:11,color:'var(--gray)',marginTop:12,lineHeight:1.5}}>
              Hacé captura de pantalla para guardar 📸
            </p>
          </div>
        )}

        {/* ── MODAL ── */}
        {modal && (
          <div className="moverlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="modal">
              <div className="mhandle" />
              {mstate === 'form' ? (
                <>
                  <div className="mttl">Seguí <em>visualizando</em></div>
                  <p className="msub">Ingresá tu email y te mandamos un link para acceder — sin contraseña.</p>
                  <input className="minput" type="email" placeholder="tu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendLink()} />
                  <button className="btn" style={{margin:0}} disabled={!email || sending} onClick={sendLink}>
                    {sending ? 'Enviando...' : 'Enviar link de acceso →'}
                  </button>
                  <button className="mskip" onClick={() => setModal(false)}>Cerrar</button>
                </>
              ) : (
                <div style={{textAlign:'center',padding:'12px 0'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📬</div>
                  <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,color:'var(--dark)'}}>¡Revisá tu email!</div>
                  <p style={{fontSize:12,color:'var(--gray)',marginTop:6,lineHeight:1.6}}>Te mandamos un link a <strong>{email}</strong>.<br />Tocalo para acceder sin límites.</p>
                  <button className="mskip" onClick={() => { setModal(false); setMstate('form') }}>Cerrar</button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
