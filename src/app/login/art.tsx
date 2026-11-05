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

/** A folk-embroidery style divider: little flowers and diamonds. */
export function Band() {
  const colors = ["#B4623F", "#C99A45", "#8C9471", "#7A2E43", "#869498"];
  return (
    <svg className="band" viewBox="0 0 400 28" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <line x1="0" y1="2" x2="400" y2="2" stroke="#D9C9B4" />
      <line x1="0" y1="26" x2="400" y2="26" stroke="#D9C9B4" />
      {Array.from({ length: 17 }, (_, i) => {
        const x = 12 + i * 24, c = colors[i % 5];
        return i % 2 === 0 ? (
          <g key={i} fill={c}>
            {[0, 90, 180, 270].map((r) => <ellipse key={r} cx={x} cy={9} rx="2.6" ry="4.6" transform={`rotate(${r} ${x} 14)`} />)}
            <circle cx={x} cy="14" r="2.2" fill="#F4ECDF" />
          </g>
        ) : (
          <path key={i} d={`M${x} 8l5 6-5 6-5-6z`} fill="none" stroke={c} strokeWidth="1.6" />
        );
      })}
    </svg>
  );
}

/** Small botanical line icons for the benefit cards. */
export function Icon({ kind }: { kind: "calm" | "goal" | "jar" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="currentColor" fillOpacity=".12" stroke="none" />
      {kind === "calm" && <><path d="M14 27c3 4 7 6 10 6s7-2 10-6" /><path d="M17 20h4M27 20h4" /></>}
      {kind === "goal" && <><path d="M24 36V20" /><path d="M24 26c-6 0-9-4-9-9 6 0 9 4 9 9z" /><path d="M24 22c5 0 8-3 8-8-5 0-8 3-8 8z" /></>}
      {kind === "jar" && <><rect x="15" y="17" width="18" height="19" rx="4" /><path d="M17 13h14v4H17z" /><path d="M19 26h10" /></>}
    </svg>
  );
}
