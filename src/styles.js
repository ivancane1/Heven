export const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #F5F0E8;
    --linen: #EDE6D6;
    --terracotta: #B5603A;
    --terra-light: #D4835F;
    --sage: #7A8C6E;
    --charcoal: #2C2C2C;
    --warm-gray: #9E9589;
    --white: #FDFAF5;
  }

  body { background: var(--cream); font-family: 'Jost', sans-serif; }

  .app {
    max-width: 430px;
    min-height: 100vh;
    margin: 0 auto;
    background: var(--white);
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 60px rgba(0,0,0,0.08);
  }

  .header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--linen);
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--white);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-back {
    width: 36px; height: 36px;
    border: 1px solid var(--linen);
    border-radius: 50%;
    background: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--charcoal);
    font-size: 16px;
    transition: all 0.2s;
  }
  .header-back:hover { background: var(--linen); }
  .header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 400;
    color: var(--charcoal);
    letter-spacing: 0.02em;
  }
  .header-step {
    margin-left: auto;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--warm-gray);
    font-weight: 500;
  }

  .steps {
    display: flex;
    gap: 0;
    padding: 0 24px;
    margin: 16px 0 0;
  }
  .step-line { flex: 1; height: 2px; background: var(--linen); transition: background 0.5s; }
  .step-line.active { background: var(--terracotta); }

  .screen { padding: 28px 24px 40px; animation: fadeUp 0.4s ease; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .eyebrow {
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--terracotta); font-weight: 500; margin-bottom: 8px;
  }
  .headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; line-height: 1.15; font-weight: 300;
    color: var(--charcoal); margin-bottom: 12px;
  }
  .headline em { font-style: italic; color: var(--terracotta); }
  .subtext {
    font-size: 13px; color: var(--warm-gray);
    line-height: 1.6; margin-bottom: 28px; font-weight: 300;
  }

  .upload-zone {
    border: 1.5px dashed var(--terra-light);
    border-radius: 16px;
    background: linear-gradient(135deg, #FBF7F0 0%, #F5EDE0 100%);
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover { border-color: var(--terracotta); background: linear-gradient(135deg, #F8F2E8 0%, #F0E4D2 100%); }
  .upload-zone.has-image { padding: 0; border-style: solid; }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .upload-icon { font-size: 36px; margin-bottom: 12px; display: block; }
  .upload-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; color: var(--charcoal); margin-bottom: 6px; }
  .upload-hint { font-size: 11px; color: var(--warm-gray); letter-spacing: 0.08em; }
  .preview-img { width: 100%; height: 240px; object-fit: cover; border-radius: 14px; display: block; }
  .preview-overlay {
    position: absolute; bottom: 12px; right: 12px;
    background: rgba(255,255,255,0.9); border-radius: 20px;
    padding: 6px 12px; font-size: 11px; color: var(--terracotta);
    font-weight: 500; letter-spacing: 0.08em; backdrop-filter: blur(4px); cursor: pointer;
  }

  .btn-primary {
    width: 100%; padding: 16px;
    background: var(--terracotta); color: white;
    border: none; border-radius: 12px;
    font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; margin-top: 20px; transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-primary:hover { background: #9E4E2C; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(181,96,58,0.3); }
  .btn-primary:disabled { background: var(--warm-gray); cursor: not-allowed; transform: none; box-shadow: none; }

  .tip-box {
    background: linear-gradient(135deg, #EEF2EA, #E8EDE4);
    border-radius: 12px; padding: 14px 16px; margin-top: 20px;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .tip-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .tip-text { font-size: 12px; color: var(--sage); line-height: 1.5; font-weight: 400; }

  .category-tabs {
    display: flex; gap: 8px; margin-bottom: 20px;
    overflow-x: auto; padding-bottom: 4px;
  }
  .category-tabs::-webkit-scrollbar { display: none; }
  .tab {
    flex-shrink: 0; padding: 7px 16px; border-radius: 20px;
    border: 1px solid var(--linen); background: none;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    letter-spacing: 0.06em; color: var(--warm-gray); cursor: pointer; transition: all 0.2s;
  }
  .tab.active { background: var(--charcoal); color: white; border-color: var(--charcoal); }

  .products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .product-card {
    border-radius: 12px; overflow: hidden;
    border: 2px solid transparent; cursor: pointer;
    transition: all 0.25s; position: relative; background: var(--linen);
  }
  .product-card.selected { border-color: var(--terracotta); transform: scale(0.97); }
  .product-card:hover { transform: scale(0.98); }
  .product-swatch {
    height: 110px; display: flex; align-items: center;
    justify-content: center; font-size: 42px; position: relative;
  }
  .product-img { width: 100%; height: 110px; object-fit: cover; display: block; }
  .product-check {
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--terracotta); color: white; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
  }
  .product-card.selected .product-check { opacity: 1; }
  .product-info { padding: 10px 12px 12px; }
  .product-name { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 400; color: var(--charcoal); margin-bottom: 2px; }
  .product-detail { font-size: 11px; color: var(--warm-gray); }
  .color-dots { display: flex; gap: 4px; margin-top: 6px; }
  .color-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); }

  .selection-bar {
    background: var(--charcoal); border-radius: 12px;
    padding: 14px 16px; display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 16px;
  }
  .selection-info { font-size: 12px; color: rgba(255,255,255,0.7); }
  .selection-count { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: white; }

  .loading-screen {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 60vh; text-align: center; gap: 20px;
  }
  .spinner {
    width: 48px; height: 48px; border: 2px solid var(--linen);
    border-top-color: var(--terracotta); border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: var(--charcoal); font-weight: 300; }
  .loading-sub { font-size: 12px; color: var(--warm-gray); letter-spacing: 0.08em; }

  .result-image-wrap { position: relative; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
  .result-image { width: 100%; height: 220px; object-fit: cover; display: block; filter: brightness(0.97); }
  .result-badge {
    position: absolute; top: 12px; left: 12px;
    background: rgba(181,96,58,0.92); color: white;
    padding: 5px 12px; border-radius: 20px; font-size: 10px;
    font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; backdrop-filter: blur(4px);
  }

  .selected-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
  .chip {
    background: var(--linen); border-radius: 20px; padding: 5px 12px;
    font-size: 11px; color: var(--charcoal); letter-spacing: 0.04em;
    display: flex; align-items: center; gap: 5px;
  }

  .result-card {
    background: linear-gradient(135deg, #F8F4EE, #F2EBE0);
    border-radius: 16px; padding: 20px; margin-bottom: 16px;
    border-left: 3px solid var(--terracotta);
  }
  .result-card-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--terracotta); font-weight: 500; margin-bottom: 10px; }
  .result-text { font-family: 'Cormorant Garamond', serif; font-size: 17px; line-height: 1.65; color: var(--charcoal); font-weight: 300; }

  .section-title { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--warm-gray); font-weight: 500; margin-bottom: 10px; }

  .suggestions-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .suggestion-item { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: var(--charcoal); line-height: 1.5; }
  .suggestion-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sage); flex-shrink: 0; margin-top: 6px; }

  .cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .btn-secondary {
    padding: 14px; border: 1.5px solid var(--terracotta); border-radius: 12px;
    background: none; color: var(--terracotta); font-family: 'Jost', sans-serif;
    font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { background: var(--terracotta); color: white; }

  .btn-whatsapp {
    width: 100%; padding: 16px; background: #25D366; color: white;
    border: none; border-radius: 12px; font-family: 'Jost', sans-serif;
    font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;
  }
  .btn-whatsapp:hover { background: #1db954; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,211,102,0.3); }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: flex-end; justify-content: center;
    z-index: 200; backdrop-filter: blur(4px);
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--white); border-radius: 24px 24px 0 0;
    padding: 32px 24px 40px; width: 100%; max-width: 430px;
    animation: slideUp 0.35s ease;
  }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-handle { width: 40px; height: 4px; background: var(--linen); border-radius: 2px; margin: 0 auto 24px; }
  .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; color: var(--charcoal); margin-bottom: 8px; }
  .modal-title em { font-style: italic; color: var(--terracotta); }
  .modal-sub { font-size: 13px; color: var(--warm-gray); line-height: 1.6; margin-bottom: 24px; }
  .modal-input {
    width: 100%; padding: 14px 16px;
    border: 1.5px solid var(--linen); border-radius: 12px;
    font-family: 'Jost', sans-serif; font-size: 14px; color: var(--charcoal);
    background: var(--cream); outline: none; margin-bottom: 12px;
    transition: border-color 0.2s;
  }
  .modal-input:focus { border-color: var(--terracotta); }
  .modal-skip {
    width: 100%; padding: 12px; background: none; border: none;
    font-family: 'Jost', sans-serif; font-size: 12px;
    color: var(--warm-gray); cursor: pointer; letter-spacing: 0.08em;
    margin-top: 4px; text-decoration: underline;
  }
  .modal-success { text-align: center; padding: 12px 0; }
  .modal-success-icon { font-size: 40px; margin-bottom: 12px; }
  .modal-success-text { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: var(--charcoal); }
  .modal-success-sub { font-size: 12px; color: var(--warm-gray); margin-top: 6px; }

  .error-box {
    background: #FEF0EC; border: 1px solid #F5C6B4; border-radius: 12px;
    padding: 14px 16px; font-size: 13px; color: var(--terracotta);
    line-height: 1.5; margin-bottom: 16px;
  }

  .banner-used {
    background: var(--charcoal); color: white;
    padding: 14px 20px; text-align: center; font-size: 12px;
    letter-spacing: 0.06em; line-height: 1.6;
  }
  .banner-used strong { color: var(--terra-light); }
`
