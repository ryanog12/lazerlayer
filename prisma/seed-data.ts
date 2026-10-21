export const categories = [
  { name: "Figures & Miniatures", slug: "figures-miniatures" },
  { name: "Home & Decor", slug: "home-decor" },
  { name: "Functional Parts", slug: "functional-parts" },
  { name: "Tabletop Gaming", slug: "tabletop-gaming" },
  { name: "Tech Accessories", slug: "tech-accessories" },
];

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  materials: string;
  stock: number | null;
  isCustom: boolean;
  featured: boolean;
  shape: "vase" | "gear" | "dragon" | "tower" | "stand" | "planter" | "dice" | "bracket" | "lamp" | "bust";
};

export const products: SeedProduct[] = [
  {
    name: "Spiral Vase — Twisted Hex",
    slug: "spiral-vase-twisted-hex",
    category: "home-decor",
    price: 3400,
    description:
      "A single-wall spiral vase with a twisted hexagonal profile. Printed in vase mode for a seamless, glass-like finish. Watertight with an optional inner liner.",
    materials: "PLA Silk or PETG · 0.2 mm layers · ~22 cm tall",
    stock: 12,
    isCustom: false,
    featured: true,
    shape: "vase",
  },
  {
    name: "Articulated Dragon",
    slug: "articulated-dragon",
    category: "figures-miniatures",
    price: 2800,
    description:
      "Print-in-place articulated dragon with 40+ moving segments. A desk favorite and a great gift. Choose your color at checkout notes.",
    materials: "PLA+ · Print-in-place · ~35 cm nose to tail",
    stock: 20,
    isCustom: false,
    featured: true,
    shape: "dragon",
  },
  {
    name: "Planetary Gear Fidget",
    slug: "planetary-gear-fidget",
    category: "functional-parts",
    price: 1800,
    description:
      "A fully functional planetary gearbox you can spin in your hand. Demonstrates the precision tolerances we hold on every print.",
    materials: "PETG · 0.12 mm layers · 70 mm diameter",
    stock: 30,
    isCustom: false,
    featured: true,
    shape: "gear",
  },
  {
    name: "Modular Dungeon Tower",
    slug: "modular-dungeon-tower",
    category: "tabletop-gaming",
    price: 5200,
    description:
      "Stackable dungeon tower terrain for 28/32 mm tabletop games. Includes 3 floors, removable roof and a winding stair. Unpainted, primer-ready.",
    materials: "Resin-grade PLA · Supports removed · 3 floors",
    stock: 6,
    isCustom: false,
    featured: true,
    shape: "tower",
  },
  {
    name: "Headphone Stand — Arc",
    slug: "headphone-stand-arc",
    category: "tech-accessories",
    price: 3900,
    description:
      "Minimal arc-shaped headphone stand with a weighted base and cable channel. Fits over-ear headsets up to 450 g.",
    materials: "PETG or Carbon-fiber PLA · Weighted base",
    stock: 15,
    isCustom: false,
    featured: false,
    shape: "stand",
  },
  {
    name: "Self-Watering Planter",
    slug: "self-watering-planter",
    category: "home-decor",
    price: 2600,
    description:
      "Two-part planter with a wicking reservoir that keeps herbs and succulents happy for up to two weeks.",
    materials: "PETG (food-safe grade) · 12 cm diameter",
    stock: 18,
    isCustom: false,
    featured: false,
    shape: "planter",
  },
  {
    name: "Polyhedral Dice Set",
    slug: "polyhedral-dice-set",
    category: "tabletop-gaming",
    price: 2200,
    description:
      "A balanced 7-piece polyhedral dice set (d4–d20) with engraved numerals, printed in high-detail resin.",
    materials: "Tough resin · Hand-finished · 7 pieces",
    stock: 25,
    isCustom: false,
    featured: false,
    shape: "dice",
  },
  {
    name: "Custom Mounting Bracket",
    slug: "custom-mounting-bracket",
    category: "functional-parts",
    price: 4500,
    description:
      "Made-to-order brackets, mounts and enclosures built to your measurements. Price shown is the base design + print fee; we confirm dimensions with you before printing.",
    materials: "PETG, ASA, Nylon or CF-Nylon · Engineered to spec",
    stock: null,
    isCustom: true,
    featured: false,
    shape: "bracket",
  },
  {
    name: "Lithophane Moon Lamp",
    slug: "lithophane-moon-lamp",
    category: "home-decor",
    price: 4800,
    description:
      "A lunar lithophane sphere that reveals realistic crater detail when lit. Includes a warm-white USB-C LED base.",
    materials: "White PLA · USB-C LED base · 15 cm",
    stock: 8,
    isCustom: false,
    featured: false,
    shape: "lamp",
  },
  {
    name: "Custom Portrait Bust",
    slug: "custom-portrait-bust",
    category: "figures-miniatures",
    price: 12000,
    description:
      "Send us photos or a 3D scan and we'll sculpt and print a personalized bust. Made to order — we'll send a digital preview for approval before printing.",
    materials: "High-detail resin · 10–15 cm · Optional paint",
    stock: null,
    isCustom: true,
    featured: false,
    shape: "bust",
  },
];

const SHAPES: Record<SeedProduct["shape"], string> = {
  vase: `<path d="M160 60 h80 l-10 40 q40 40 20 120 q-10 50 10 80 h-120 q20-30 10-80 q-20-80 20-120 z" />`,
  gear: `<circle cx="200" cy="200" r="90"/><circle cx="200" cy="200" r="30" fill="url(#bg)"/>${Array.from(
    { length: 10 },
    (_, i) =>
      `<rect x="188" y="92" width="24" height="30" rx="4" transform="rotate(${i * 36} 200 200)"/>`,
  ).join("")}`,
  dragon: `<path d="M80 260 q60-120 140-80 q40-60 100-40 l-30 20 q20 10 10 30 q-40-10-60 20 q-20 60-90 70 q-40 5-70-20z"/>`,
  tower: `<rect x="140" y="110" width="120" height="200" rx="4"/><path d="M130 110 l70-60 l70 60z"/><rect x="185" y="250" width="30" height="60" fill="url(#bg)"/>`,
  stand: `<path d="M120 320 h160 v-20 h-60 v-170 q0-60-20-60 q-20 0-20 60 v170 h-60z"/><path d="M130 120 q70-90 140 0" fill="none" stroke="white" stroke-opacity=".9" stroke-width="18"/>`,
  planter: `<path d="M120 170 h160 l-20 140 h-120z"/><path d="M200 170 q-40-80 -60-90 q50 0 60 60 q10-60 60-60 q-20 10 -60 90z"/>`,
  dice: `<path d="M200 70 l110 60 v130 l-110 60 l-110-60 v-130z"/><path d="M200 70 l0 120 l110 70 M200 190 l-110 70" stroke="url(#bg)" stroke-width="6" fill="none"/>`,
  bracket: `<path d="M110 110 h60 v140 h120 v60 h-180z"/><circle cx="140" cy="150" r="12" fill="url(#bg)"/><circle cx="250" cy="280" r="12" fill="url(#bg)"/>`,
  lamp: `<circle cx="200" cy="180" r="100"/><circle cx="170" cy="150" r="18" fill-opacity=".5" fill="url(#bg)"/><circle cx="230" cy="210" r="12" fill-opacity=".5" fill="url(#bg)"/><rect x="150" y="285" width="100" height="25" rx="6"/>`,
  bust: `<circle cx="200" cy="140" r="55"/><path d="M110 320 q0-110 90-110 q90 0 90 110z"/>`,
};

/** Product artwork in the brand style: graphite backdrop, beveled slate object, laser-red scan line. */
export function productSvg(p: Pick<SeedProduct, "name" | "shape">) {
  const lines = Array.from(
    { length: 20 },
    (_, i) => `<line x1="0" y1="${i * 20}" x2="400" y2="${i * 20}" />`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800">
<defs>
<radialGradient id="bg" cx="65%" cy="30%" r="85%">
<stop offset="0" stop-color="#3a3e45"/><stop offset="1" stop-color="#18191c"/>
</radialGradient>
<linearGradient id="fg" x1="0.2" y1="0" x2="0.8" y2="1">
<stop offset="0" stop-color="#8e96a3"/><stop offset="0.5" stop-color="#4c535d"/><stop offset="1" stop-color="#2a2e34"/>
</linearGradient>
<filter id="glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="shadow"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".6"/></filter>
</defs>
<rect width="400" height="400" fill="url(#bg)"/>
<g stroke="white" stroke-opacity=".035" stroke-width="1">${lines}</g>
<g fill="url(#fg)" stroke="#ffffff" stroke-opacity=".22" stroke-width="1.5" filter="url(#shadow)">${SHAPES[p.shape]}</g>
<g transform="rotate(-18 200 200)">
<rect x="-40" y="196" width="480" height="8" fill="#E01E2B" opacity=".55" filter="url(#glow)"/>
<rect x="-40" y="198.5" width="480" height="3" fill="#ff3b47"/>
<rect x="40" y="199.4" width="330" height="1.2" fill="#ffd9dc"/>
<circle cx="330" cy="200" r="10" fill="#ff5a64" filter="url(#glow)"/>
<circle cx="330" cy="200" r="3.5" fill="#fff"/>
</g>
<text x="20" y="380" fill="#8e96a3" fill-opacity=".8" font-family="monospace" font-size="14"><tspan fill="#E01E2B">LAZER</tspan>LAYER // ${p.name.toUpperCase().replace(/&/g, "&amp;")}</text>
</svg>`;
}
