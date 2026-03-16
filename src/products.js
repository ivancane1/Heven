// ─────────────────────────────────────────────────────────────
//  CATÁLOGO DE PRODUCTOS
//
//  Para agregar tus productos reales:
//  1. Subí las fotos PNG a public/products/cubrecamas/ (o almohadones/ o sabanas/)
//  2. Reemplazá el campo image: con la ruta, ej: "/products/cubrecamas/mi-foto.png"
//  3. Actualizá name, detail, colors y tags con tus datos reales
//
//  colors: array de 3 colores HEX que representan el producto
//  tags: descripción del producto para la IA (en español, detallada)
// ─────────────────────────────────────────────────────────────

export const PRODUCTS = {
  Cubrecamas: [
    {
      id: 1,
      name: 'Mi Cubrecama 1',       // ← cambiá por el nombre real
      detail: 'Algodón · 2 plazas', // ← material y medida
      image: '/products/cubrecamas/cubrecama.png', // ← reemplazá con tu foto real, ej: '/products/cubrecamas/provence.png'
      emoji: '🛏️',                  // ← se usa si no hay imagen
      colors: ['#E8C4B8', '#D4956A', '#F5EDE8'],
      tags: 'cubrecama de algodón en tono natural, textura suave, estilo moderno', // ← describí el producto para la IA
    },
    // Copiá y pegá el bloque de arriba para agregar más cubrecamas
  ],

  Almohadones: [
    {
      id: 10,
      name: 'Mi Almohadón 1',
      detail: 'Lino · 50×50',
      image: null, // ← null hasta que tengas la foto
      emoji: '🟫',
      colors: ['#C4956A', '#8B7355', '#D4C4A8'],
      tags: 'almohadón de lino natural color camel con textura tejida',
    },
    // Agregá más acá
  ],

  Sábanas: [
    {
      id: 20,
      name: 'Mi Juego de Sábanas 1',
      detail: '200 hilos · 2 plazas',
      image: null,
      emoji: '🤍',
      colors: ['#FDFAF5', '#F0EDE8', '#E8E4DC'],
      tags: 'juego de sábanas blancas suaves 200 hilos algodón peinado',
    },
    // Agregá más acá
  ],
}

export const CATEGORIES = Object.keys(PRODUCTS)
