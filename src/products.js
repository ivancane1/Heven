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
      name: 'Gris Encaje',
      detail: 'Quilt · 2.5 plazas',
      image: '/products/cubrecamas/cubrecama.png',
      emoji: '🛏️',
      colors: ['#6B7280', '#9CA3AF', '#F9FAFB'],
      tags: 'cubrecama quilt gris oscuro con bordado de encaje blanco en franjas verticales, acolchado con textura geométrica, incluye almohadones a juego, estilo clásico elegante',
    },
    // Agregá más cubrecamas acá copiando el bloque de arriba
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
