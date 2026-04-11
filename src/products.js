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
  ],
  Almohadones: [
    {
      id: 10,
      name: 'Mi Almohadón 1',
      detail: 'Lino · 50×50',
      image: null,
      emoji: '🟫',
      colors: ['#C4956A', '#8B7355', '#D4C4A8'],
      tags: 'almohadón de lino natural color camel con textura tejida',
    },
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
  ],
}
export const CATEGORIES = Object.keys(PRODUCTS)
