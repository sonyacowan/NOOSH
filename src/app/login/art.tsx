// Decorative artwork for the landing page, drawn in code (SVG) so it stays
// crisp at any size and needs no image files.
// Style: a candlelit riad at night. Chocolate, brass and gold, with a pointed
// Moroccan arch framing a sunlit still life.

const GOLD = "#C99A45";

/** The still life: herbs in a vase, a bowl of lemons, a cut fig, on a terracotta table. */
function StillLife() {
  const leaves = [[44, 110, -40], [52, 130, -30], [60, 150, -25], [104, 104, 35], [96, 126, 30], [90, 148, 25], [82, 86, 0], [80, 110, 10], [79, 134, -8]];
  const seeds = [[-6, -3], [4, -5], [7, 3], [-3, 5], [-9, 2], [9, -1]];
  return (
    <g transform="translate(20 70) scale(.94)">
      <rect x="-30" y="282" width="360" height="140" fill="#B4623F" />
      <g stroke="#C9784F" strokeWidth="2">
        {Array.from({ length: 10 }, (_, i) => <line key={i} x1={i * 38} y1="282" x2={i * 38 - 20} y2="420" />)}
      </g>
      <circle cx="205" cy="120" r="34" fill="#F1D9A8" opacity=".9" />
      <path d="M62 282c-14-30-10-62 6-78h20c16 16 20 48 6 78z" fill="#869498" />
      <path d="M70 204c-4-6-4-12 0-16h16c4 4 4 10 0 16z" fill="#6E7C80" />
      <g stroke="#8C9471" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d="M78 190c-6-40-22-70-40-88" /><path d="M78 190c4-44 16-74 34-96" /><path d="M78 190c0-46 2-80 4-110" />
      </g>
      <g fill="#8C9471">
        {leaves.map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="4.2" transform={`rotate(${r} ${x} ${y})`} />)}
      </g>
      <path d="M128 262h112c0 22-25 32-56 32s-56-10-56-32z" fill="#F8F1E6" />
      <ellipse cx="160" cy="254" rx="20" ry="15" fill="#E2B74C" />
      <ellipse cx="196" cy="250" rx="21" ry="16" fill="#D9A93E" />
      <ellipse cx="178" cy="240" rx="18" ry="14" fill="#EAC35A" />
      <ellipse cx="184" cy="236" rx="4" ry="2" fill="#F6DD8E" />
      <g transform="translate(232 292)">
        <ellipse rx="26" ry="22" fill="#5E2A3A" /><ellipse rx="19" ry="16" fill="#F1E3D3" /><ellipse rx="14" ry="11.5" fill="#B4423F" />
        {seeds.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="#F1D9A8" />)}
      </g>
      <g transform="translate(252 274) rotate(-20)">
        <path d="M0 18C-14 14-16-6 0-14 16-6 14 14 0 18z" fill="#6B2C40" />
        <path d="M0-14v-6" stroke="#8C9471" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

// The pointed Moroccan arch, at three sizes: outer frame, inner gold line, and the window.
const OUTER = "M44 430V200C20 136 76 60 170 12C264 60 320 136 296 200V430";
const MIDDLE = "M52 430V200C30 140 82 68 170 23C258 68 310 140 288 200V430";
const WINDOW = "M60 430V200C40 146 88 78 170 34C252 78 300 146 280 200V430Z";

/** The hero: lattice, gold-lined pointed arch, still life inside, brass lantern on top. */
export function Arch() {
  return (
    <svg className="arch" viewBox="0 -14 340 444" aria-hidden="true">
      <defs>
        <pattern id="lattice" width="28" height="28" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={GOLD} strokeWidth=".8">
            <g transform="translate(14 14)">
              <rect x="-7" y="-7" width="14" height="14" /><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
            </g>
            <path d="M0 0L4 4M28 0L24 4M0 28L4 24M28 28L24 24M14 0V4M14 28V24M0 14H4M28 14H24" />
          </g>
        </pattern>
        {/* the lattice fades out toward the middle */}
        <radialGradient id="latticeFade" cx=".5" cy=".45" r=".6"><stop offset=".55" stopColor="#000" /><stop offset="1" stopColor="#fff" /></radialGradient>
        <mask id="latticeMask"><rect width="340" height="430" fill="url(#latticeFade)" /></mask>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9C9A6" /><stop offset="1" stopColor="#D99A6C" /></linearGradient>
        <radialGradient id="glow"><stop offset="0" stopColor="#FFE3A6" stopOpacity=".55" /><stop offset="1" stopColor="#FFE3A6" stopOpacity="0" /></radialGradient>
        <clipPath id="window"><path d={WINDOW} /></clipPath>
      </defs>
      <rect width="340" height="430" fill="url(#lattice)" mask="url(#latticeMask)" opacity=".5" />
      <path d={OUTER} fill="#2A201D" />
      <path d={OUTER} fill="none" stroke={GOLD} strokeWidth="1.4" />
      <path d={MIDDLE} fill="none" stroke={GOLD} strokeOpacity=".45" strokeWidth=".8" />
      <path d={WINDOW} fill="url(#sky)" />
      <g clipPath="url(#window)"><StillLife /></g>
      {/* brass lantern */}
      <circle cx="170" cy="22" r="46" fill="url(#glow)" />
      <g transform="translate(170 -4)">
        <path d="M-5 8h10l3 5h-16z" fill="#9C7430" />
        <path d="M-9 13h18c3 9 3 17 0 24h-18c-3-7-3-15 0-24z" fill={GOLD} />
        <g fill="#FFF0C8"><path d="M0 18l1.6 3 3 .8-3 .8-1.6 3-1.6-3-3-.8 3-.8z" /><circle cy="31" r="1.3" /></g>
        <path d="M-6 37h12l-4 5h-4z" fill="#9C7430" />
      </g>
    </svg>
  );
}

/** An eight-point star: two overlapping squares, a classic Moroccan geometric motif. */
function Star({ size = 6, hole = true }: { size?: number; hole?: boolean }) {
  return (
    <g>
      <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={GOLD} />
      <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={GOLD} transform="rotate(45)" />
      {hole && <circle r={size * 0.38} fill="#2A201D" />}
    </g>
  );
}

/** A thin gold divider with a star in the middle. */
export function Divider() {
  return (
    <svg className="divider" viewBox="0 0 400 24" aria-hidden="true">
      <line x1="40" y1="12" x2="180" y2="12" stroke={GOLD} />
      <line x1="220" y1="12" x2="360" y2="12" stroke={GOLD} />
      <circle cx="190" cy="12" r="1.6" fill={GOLD} />
      <circle cx="210" cy="12" r="1.6" fill={GOLD} />
      <g transform="translate(200 12)"><Star /></g>
    </svg>
  );
}

/** Line icons framed by an outlined eight-point star, for the benefit cards. */
export function Icon({ kind }: { kind: "tea" | "sprout" | "jar" }) {
  return (
    <svg viewBox="-20 -20 40 40" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".8">
        <rect x="-14" y="-14" width="28" height="28" /><rect x="-14" y="-14" width="28" height="28" transform="rotate(45)" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {kind === "tea" && <path d="M-6 4h12M-4 4c0-5 1.5-7 4-7s4 2 4 7M7 1c2.5 0 3.5 1 3.5 2s-1 2-3.5 2M-1-5c0-1.5 1-1.5 1-3" />}
        {kind === "sprout" && <path d="M0 8V-2M0 2c-4 0-6-3-6-6 4 0 6 3 6 6zM0-1c3 0 5-2 5-5-3 0-5 2-5 5z" />}
        {kind === "jar" && <path d="M-5-4h10M-4-4c-3 3-3 8-1 11h10c2-3 2-8-1-11M-4-7h8v3h-8z" />}
      </g>
    </svg>
  );
}
