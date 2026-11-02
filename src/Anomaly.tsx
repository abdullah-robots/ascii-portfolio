// A deliberately imperfect aperture. Fixed noise avoids random changes on React renders.
function boundary(radius: number, phase: number): string {
  return (
    Array.from({ length: 180 }, (_, index) => {
      const angle = (index / 180) * Math.PI * 2;
      const roughness =
        Math.sin(angle * 13 + phase) * 3 +
        Math.sin(angle * 37 + phase) * 2 +
        Math.sin(angle * 71) * 1.8;
      const r = radius + roughness;
      return `${index === 0 ? 'M' : 'L'}${200 + Math.cos(angle) * r},${200 + Math.sin(angle) * r}`;
    }).join(' ') + 'Z'
  );
}

const APERTURE = boundary(157, 0);
const FRINGE = boundary(165, 2);

export function Anomaly({ paused }: { paused: boolean }) {
  return (
    <div className={`anomaly${paused ? ' anomaly-paused' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 400 400" fill="none">
        <path className="anomaly-fringe" d={FRINGE} stroke="#777" strokeWidth="1" />
        <path
          className="anomaly-aperture"
          d={APERTURE}
          fill="#f1f1ee"
          stroke="#151515"
          strokeWidth="9"
        />
        <path d={APERTURE} stroke="#fff" strokeWidth="1" strokeDasharray="1 9 3 13" />
        <g className="anomaly-interior">
          {/* Interrupted horizontal lines suggest a space with no visible horizon. */}
          <path
            d="M62 227h36m-26 9h22m206-9h36m-42 9h29M91 279h27m162 0h29M126 315h148"
            stroke="#cececa"
            strokeWidth=".7"
          />
          <ellipse cx="201" cy="299" rx="76" ry="9" fill="#131313" opacity=".09" />
          <g
            className="anomaly-figure"
            fill="#fff"
            stroke="#191919"
            strokeWidth="2.1"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {/* A seated, anonymous figure: bent knees, one resting arm, one grounded hand. */}
            <path d="M180 169 Q163 170 152 187 L128 215 Q123 224 131 234 L150 245 L141 269 Q126 283 129 291 Q133 298 148 295 L168 285 L188 272 L212 278 Q234 296 264 293 Q281 290 279 282 Q277 274 262 267 L239 252 L230 200 Q227 177 213 171Z" />
            <path d="M177 164 L179 178 Q196 188 211 175 L211 159" />
            <path d="M174 132 Q171 111 182 102 Q199 92 213 104 Q224 114 221 135 L218 151 Q213 167 199 168 Q183 168 178 151Z" />
            <path d="M163 184 Q151 198 143 217 L169 230 L182 239 Q189 240 188 234 L177 224 L157 213 L174 199" />
            <path d="M216 185 Q226 201 224 226 L223 256 L232 274 L230 281 L219 277 L209 260 L208 227" />
            <path d="M151 246 Q157 232 171 237 Q182 244 188 263 L194 277 M168 285 L176 266 M234 264 Q247 274 260 280 M191 276 Q207 281 220 279" />
          </g>
        </g>
        <path
          className="anomaly-scar"
          d="M42 185l8-6-4-11m308 61-7 4 3 12M174 40l5 7 11-5M216 360l-7-8-8 5"
          stroke="#9d9d94"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
