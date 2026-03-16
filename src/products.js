// ─────────────────────────────────────────────────────────────
//  CATÁLOGO DE PRODUCTOS
//  Para agregar los tuyos: reemplazá emoji por la ruta a tu
//  imagen, ej:  image: "/products/almohadones/milano.png"
// ─────────────────────────────────────────────────────────────

export const PRODUCTS = {
  Almohadones: [
    {
      id: 1,
      name: "Milano",
      detail: "Lino natural · 50×50",
      emoji: "🟫",
      // image: "/products/almohadones/milano.png",   // ← descomentar cuando tengas la foto
      colors: ["#C4956A", "#8B7355", "#D4C4A8"],
      tags: "almohadón de lino natural color camel con textura tejida",
    },
    {
      id: 2,
      name: "Boho Flecos",
      detail: "Algodón · 45×45",
      emoji: "🟤",
      // image: "/products/almohadones/boho-flecos.png",
      colors: ["#E8D5B7", "#C9A87C", "#6B4C3B"],
      tags: "almohadón boho con flecos en tono arena y bordes decorativos",
    },
    {
      id: 3,
      name: "Nordic Check",
      detail: "Algodón · 50×50",
      emoji: "⬜",
      // image: "/products/almohadones/nordic-check.png",
      colors: ["#F0EDE8", "#2C2C2C", "#9E9589"],
      tags: "almohadón cuadrillé nórdico blanco y negro estilo escandinavo",
    },
    {
      id: 4,
      name: "Velvet Sage",
      detail: "Terciopelo · 45×45",
      emoji: "🟩",
      // image: "/products/almohadones/velvet-sage.png",
      colors: ["#7A8C6E", "#4A5E42", "#B5C4A8"],
      tags: "almohadón de terciopelo verde salvia con acabado suave",
    },
  ],
  Cubrecamas: [
    {
      id: 5,
      name: "Provence",
      detail: "Algodón peinado · 2pl",
      emoji: "🌸",
      // image: "/products/cubrecamas/provence.png",
      colors: ["#E8C4B8", "#D4956A", "#F5EDE8"],
      tags: "cubrecama estampado floral estilo provenzal en tonos rosados y terracota",
    },
    {
      id: 6,
      name: "Minimal Stone",
      detail: "Percal · 2.5pl",
      emoji: "🪨",
      // image: "/products/cubrecamas/minimal-stone.png",
      colors: ["#C4BDB5", "#8B847C", "#F0EDE8"],
      tags: "cubrecama liso color piedra con textura percal de alta densidad",
    },
    {
      id: 7,
      name: "Terra Washed",
      detail: "Lino lavado · 2pl",
      emoji: "🟧",
      // image: "/products/cubrecamas/terra-washed.png",
      colors: ["#B5603A", "#D4835F", "#E8C4A8"],
      tags: "cubrecama de lino lavado en tono terracota con efecto natural arrugado",
    },
    {
      id: 8,
      name: "Indigo Stripe",
      detail: "Algodón · 2.5pl",
      emoji: "🟦",
      // image: "/products/cubrecamas/indigo-stripe.png",
      colors: ["#4A5E8C", "#8B9EC4", "#F0F2F5"],
      tags: "cubrecama a rayas azul índigo y blanco estilo marinero contemporáneo",
    },
  ],
  Sábanas: [
    {
      id: 9,
      name: "Premium White",
      detail: "300 hilos · 2pl",
      emoji: "🤍",
      // image: "/products/sabanas/premium-white.png",
      colors: ["#FDFAF5", "#F0EDE8", "#E8E4DC"],
      tags: "juego de sábanas blancas premium 300 hilos algodón egipcio",
    },
    {
      id: 10,
      name: "Sage Dream",
      detail: "200 hilos · 2pl",
      emoji: "💚",
      // image: "/products/sabanas/sage-dream.png",
      colors: ["#7A8C6E", "#B5C4A8", "#E8EDE4"],
      tags: "juego de sábanas verde salvia suave 200 hilos algodón peinado",
    },
    {
      id: 11,
      name: "Durazno",
      detail: "Ranforce · 2pl",
      emoji: "🍑",
      // image: "/products/sabanas/durazno.png",
      colors: ["#E8A87C", "#F5D0B5", "#F0E8E0"],
      tags: "juego de sábanas color durazno suave ranforce calidez y confort",
    },
    {
      id: 12,
      name: "Gris Marengo",
      detail: "Percal · 2.5pl",
      emoji: "🩶",
      // image: "/products/sabanas/gris-marengo.png",
      colors: ["#6B6B6B", "#9E9E9E", "#D4D4D4"],
      tags: "juego de sábanas gris marengo percal moderno y sofisticado",
    },
  ],
}

export const CATEGORIES = Object.keys(PRODUCTS)
