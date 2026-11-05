// Decorative artwork for the landing page, drawn in code (SVG) so it stays
// crisp at any size and needs no image files.

/** A still life (herbs, lemons, a cut fig) inside an arch. */
export function Arch() {
  return (
    <svg className="arch" viewBox="0 0 300 360" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9C9A6" /><stop offset="1" stopColor="#D99A6C" />
        </linearGradient>
        <clipPath id="archClip"><path d="M10 360V150a140 140 0 0 1 280 0v210z" /></clipPath>
      </defs>
      <path d="M10 360V150a140 140 0 0 1 280 0v210z" fill="url(#sky)" />
      <g clipPath="url(#archClip)">
        <circle cx="205" cy="120" r="34" fill="#F1D9A8" opacity=".9" />
        <rect x="0" y="282" width="300" height="80" fill="#B4623F" />
        <g stroke="#C9784F" strokeWidth="2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <line key={i} x1={i * 38} y1="282" x2={i * 38 - 20} y2="360" />)}
        </g>
        <path d="M62 282c-14-30-10-62 6-78h20c16 16 20 48 6 78z" fill="#869498" />
        <path d="M70 204c-4-6-4-12 0-16h16c4 4 4 10 0 16z" fill="#6E7C80" />
        <g stroke="#8C9471" strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M78 190c-6-40-22-70-40-88" /><path d="M78 190c4-44 16-74 34-96" /><path d="M78 190c0-46 2-80 4-110" />
        </g>
        <g fill="#8C9471">
          {[[44, 110, -40], [52, 130, -30], [60, 150, -25], [104, 104, 35], [96, 126, 30], [90, 148, 25], [82, 86, 0], [80, 110, 10], [79, 134, -8]].map(([x, y, r], i) =>
            <ellipse key={i} cx={x} cy={y} rx="9" ry="4.2" transform={`rotate(${r} ${x} ${y})`} />)}
        </g>
        <path d="M128 262h112c0 22-25 32-56 32s-56-10-56-32z" fill="#F8F1E6" />
        <ellipse cx="160" cy="254" rx="20" ry="15" fill="#E2B74C" />
        <ellipse cx="196" cy="250" rx="21" ry="16" fill="#D9A93E" />
        <ellipse cx="178" cy="240" rx="18" ry="14" fill="#EAC35A" />
        <ellipse cx="184" cy="236" rx="4" ry="2" fill="#F6DD8E" />
        <g transform="translate(232 292)">
          <ellipse rx="26" ry="22" fill="#5E2A3A" /><ellipse rx="19" ry="16" fill="#F1E3D3" /><ellipse rx="14" ry="11.5" fill="#B4423F" />
          {[[-6, -3], [4, -5], [7, 3], [-3, 5], [0, 0], [-9, 2], [9, -1]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="#F1D9A8" />)}
        </g>
        <g transform="translate(252 274) rotate(-20)">
          <path d="M0 18C-14 14-16-6 0-14 16-6 14 14 0 18z" fill="#6B2C40" />
          <path d="M0-14v-6" stroke="#8C9471" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      <path d="M10 360V150a140 140 0 0 1 280 0v210" fill="none" stroke="#362825" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  );
}

/** An embroidered vine: a wavy stitched stem with leaves and berry clusters. */
export function Band() {
  // [x, y, angle, color] for leaves, placed by hand so it feels irregular
  const leaves: [number, number, number, string][] = [
    [30, 9, -35, "#8C9471"], [58, 19, 30, "#8C9471"], [96, 8, -20, "#C99A45"], [128, 20, 40, "#8C9471"],
    [170, 9, -40, "#8C9471"], [204, 19, 25, "#B4623F"], [246, 8, -25, "#8C9471"], [276, 20, 35, "#C99A45"],
    [318, 9, -30, "#8C9471"], [352, 19, 30, "#8C9471"], [388, 9, -35, "#B4623F"],
  ];
  const berries: [number, number, string][] = [[76, 22, "#7A2E43"], [150, 6, "#B4623F"], [226, 22, "#7A2E43"], [300, 6, "#C99A45"], [372, 22, "#7A2E43"]];
  return (
    <svg className="band" viewBox="0 0 400 28" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d={"M0 14" + Array.from({ length: 8 }, (_, i) => ` q25 ${i % 2 ? 8 : -8} 50 0`).join("")}
        fill="none" stroke="#8C9471" strokeWidth="1.4" strokeDasharray="4 3" strokeLinecap="round" />
      {leaves.map(([x, y, r, c], i) => (
        <path key={i} d={`M${x - 7} ${y}c4-5 10-5 14 0c-4 5-10 5-14 0z`} fill={c} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {berries.map(([x, y, c], i) => (
        <g key={i} fill={c}><circle cx={x} cy={y} r="2.3" /><circle cx={x + 4} cy={y - 2.5} r="1.8" /><circle cx={x + 4.5} cy={y + 2.5} r="1.6" /></g>
      ))}
    </svg>
  );
}

/** A tiny hand-drawn sprig, used to frame short labels. */
export function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg className="sprig" viewBox="0 0 34 14" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M1 7h31" stroke="#8C9471" strokeWidth="1.2" strokeDasharray="3 2" strokeLinecap="round" />
      <path d="M8 7c2-4 6-5 9-4c-2 3-6 4-9 4z" fill="#8C9471" />
      <path d="M17 7c2 4 6 5 9 4c-2-3-6-4-9-4z" fill="#C99A45" />
      <circle cx="30" cy="7" r="1.8" fill="#B4623F" />
    </svg>
  );
}

/** Small hand-drawn icons in a scalloped badge, for the benefit cards. */
const scallop = "M" + Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, b = ((i + 1) / 12) * Math.PI * 2, m = (a + b) / 2;
  const p = (r: number, t: number) => `${(24 + r * Math.cos(t)).toFixed(1)} ${(24 + r * Math.sin(t)).toFixed(1)}`;
  return `${i === 0 ? p(20, a) : ""} Q${p(25, m)} ${p(20, b)}`;
}).join(" ") + "Z";

export function Icon({ kind }: { kind: "sun" | "goal" | "jar" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={scallop} fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
      {kind === "sun" && <><circle cx="24" cy="24" r="5.5" />{[0, 45, 90, 135, 180, 225, 270, 315].map((r) => <path key={r} d="M24 14.5v-2.5" transform={`rotate(${r} 24 24)`} />)}</>}
      {kind === "goal" && <><path d="M24 35V20" /><path d="M24 26c-6 0-9-4-9-9 6 0 9 4 9 9z" /><path d="M24 22c5 0 8-3 8-8-5 0-8 3-8 8z" /></>}
      {kind === "jar" && <><rect x="16" y="18" width="16" height="17" rx="4" /><path d="M18 14h12v4H18z" /><path d="M20 26c1.5-1.5 6.5-1.5 8 0" /></>}
    </svg>
  );
}
