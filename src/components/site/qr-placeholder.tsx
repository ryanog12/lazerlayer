/** Decorative QR-style placeholder. Replace with real QR images from Zelle/Cash App/Venmo in production. */
export function QrPlaceholder({ seed, size = 132 }: { seed: string; size?: number }) {
  const n = 21;
  let h = 2166136261;
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    cells.push((h & 3) === 0 || (h & 7) === 5);
  }
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox, dy = y - oy;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      }
    }
    return null;
  };
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} width={size} height={size} role="img" aria-label="Payment QR code placeholder" className="rounded-md bg-white">
      {Array.from({ length: n * n }, (_, i) => {
        const x = i % n, y = Math.floor(i / n);
        const f = finder(x, y);
        const on = f === null ? cells[i] : f;
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#111" /> : null;
      })}
    </svg>
  );
}
