import { useState } from 'react';
import { UPPER_RIGHT, UPPER_LEFT, LOWER_LEFT, LOWER_RIGHT, TOOTH_STATUSES, SURFACES, SURFACE_CONDITIONS, statusMeta, universalLabel, toothInfo } from '../lib/odontogram.js';

const UPPER_ARCH = [...UPPER_RIGHT, ...UPPER_LEFT];
const LOWER_ARCH = [...LOWER_RIGHT, ...LOWER_LEFT];

const ARCH_H = 150;
const MARGIN = 20;
const RX_PCT = 38;
const MAX_ROT = 17;

const TOOTH_SIZE = {
  incisor: { w: 16, h: 21 },
  canine: { w: 18, h: 23 },
  premolar: { w: 20, h: 23 },
  molar: { w: 24, h: 24 },
};

function arcPos(i, total) {
  const t = (i / (total - 1)) * 2 - 1; // -1 (leftmost) .. 1 (rightmost), evenly spaced
  const xPct = 50 + RX_PCT * t;
  const yNorm = Math.cos((t * Math.PI) / 2); // 1 at center, 0 at the outer ends
  const rot = t * MAX_ROT;
  return { xPct, yNorm, rot };
}

export default function Odontogram({ teeth, onChange, numbering = 'fdi', readOnly = false }) {
  const [sel, setSel] = useState(null);

  const setToothStatus = (num, status) => {
    if (readOnly) return;
    const next = { ...teeth, [num]: { ...(teeth[num] || { surfaces: {} }), status, surfaces: teeth[num]?.surfaces || {} } };
    if (status === 'missing' || status === 'sound') next[num].surfaces = {};
    onChange(next);
  };

  const setSurface = (num, surface, cond) => {
    if (readOnly) return;
    const cur = teeth[num] || { status: 'sound', surfaces: {} };
    const surfaces = { ...cur.surfaces };
    if (cond === 'sound' || cond === null) delete surfaces[surface];
    else surfaces[surface] = cond;
    onChange({ ...teeth, [num]: { ...cur, surfaces } });
  };

  const selTooth = sel ? teeth[sel] : null;
  const selInfo = sel ? toothInfo(sel) : null;

  return (
    <div>
      <div className="odont" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '30px 22px 22px' }}>
        <Arch list={UPPER_ARCH} teeth={teeth} numbering={numbering} sel={sel} onPick={setSel} arch="upper" label="Maxillary" />
        <div style={{ borderTop: '1px dashed var(--line)', margin: '14px 40px' }} />
        <Arch list={LOWER_ARCH} teeth={teeth} numbering={numbering} sel={sel} onPick={setSel} arch="lower" label="Mandible" />
      </div>

      {!readOnly && sel && (
        <div className="card pad" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{selInfo.code} · Tooth {universalLabel(sel, numbering)} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12 }}>({selInfo.name})</span></div>
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setSel(null)}>Close</button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>Tooth status</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {TOOTH_STATUSES.map((s) => (
              <button key={s.id} onClick={() => setToothStatus(sel, s.id)} className={'chip'} style={{ padding: '5px 10px', background: (selTooth?.status || 'sound') === s.id ? s.stroke : 'var(--line-2)', color: (selTooth?.status || 'sound') === s.id ? '#fff' : 'var(--slate-2)', border: `1px solid ${s.stroke}` }}>{s.label}</button>
            ))}
          </div>
          {selTooth?.status !== 'missing' && selTooth?.status !== 'sound' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>Surface conditions</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {SURFACES.map((sf) => {
                  const cur = selTooth?.surfaces?.[sf.id];
                  return (
                    <div key={sf.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 110, fontSize: 12, fontWeight: 600 }}>{sf.label}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {SURFACE_CONDITIONS.map((c) => (
                          <button key={c.id} onClick={() => setSurface(sel, sf.id, cur === c.id ? null : c.id)} className={'chip'} style={{ padding: '4px 9px', fontSize: 11, background: cur === c.id ? 'var(--blue)' : 'var(--line-2)', color: cur === c.id ? '#fff' : 'var(--slate-2)' }}>{c.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuadLabel({ side, corner }) {
  return (
    <span style={{
      position: 'absolute', [corner === 'left' ? 'left' : 'right']: 2, [side === 'top' ? 'top' : 'bottom']: 0,
      fontSize: 9, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', opacity: .55,
    }}>{corner === 'left' ? 'R' : 'L'}</span>
  );
}

function Arch({ list, teeth, numbering, sel, onPick, arch, label }) {
  const total = list.length;
  // Incisors sit at the center of the row (t=0, yNorm=1); molars sit at the outer ends (yNorm=0).
  // Upper arch: incisors point up/outward (away from the bite line), molars sit low, near the bite line.
  // Lower arch: incisors point down/outward, molars sit high, near the bite line.
  const flipY = arch === 'upper';
  const labelOutward = arch === 'upper' ? 'column' : 'column-reverse';
  const tipDir = arch === 'upper' ? 'below' : 'above';
  const labelY = arch === 'upper' ? ARCH_H - MARGIN - 8 : MARGIN + 8;
  return (
    <div style={{ position: 'relative', height: ARCH_H }}>
      <QuadLabel side={arch === 'upper' ? 'top' : 'bottom'} corner="left" />
      <QuadLabel side={arch === 'upper' ? 'top' : 'bottom'} corner="right" />
      <div style={{
        position: 'absolute', left: '50%', top: labelY, transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--muted)',
        letterSpacing: '.04em', opacity: .4, pointerEvents: 'none',
      }}>{label}</div>
      {list.map((t, i) => {
        const e = teeth?.[t.num] || { status: 'sound', surfaces: {} };
        const meta = statusMeta(e.status);
        const activeSurfaces = Object.entries(e.surfaces || {}).filter(([, v]) => v && v !== 'sound');
        const isSel = sel === t.num;
        const { xPct, yNorm, rot } = arcPos(i, total);
        const span = ARCH_H - MARGIN * 2;
        const yPx = flipY ? (ARCH_H - MARGIN) - yNorm * span : MARGIN + yNorm * span;
        const info = toothInfo(t.num);
        return (
          <button
            key={t.num}
            className="tooth-btn"
            onClick={() => onPick(t.num)}
            style={{
              position: 'absolute', left: xPct + '%', top: yPx,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              display: 'flex', flexDirection: labelOutward, alignItems: 'center', gap: 1, padding: 3,
              borderRadius: 8, transition: 'background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease)',
              background: isSel ? 'var(--blue-bg)' : 'transparent',
            }}
            onMouseEnter={(ev) => { if (!isSel) ev.currentTarget.style.background = 'var(--line-2)'; }}
            onMouseLeave={(ev) => { if (!isSel) ev.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ fontSize: 9, color: isSel ? 'var(--blue)' : 'var(--muted)', fontWeight: 700 }}>{universalLabel(t.num, numbering)}</div>
            <ToothIcon type={t.type} meta={meta} isSel={isSel} hasSurfaces={activeSurfaces.length > 0} />
            <div className={'tooth-tip ' + tipDir} style={{ transform: `translateX(-50%) rotate(${-rot}deg)` }}>
              <div><b>{info.code}</b> · {universalLabel(t.num, numbering)}</div>
              <div className="tt-name">{info.name}</div>
              <div className="tt-status"><span className="tt-dot" style={{ background: meta.stroke }} />{meta.label}</div>
              {activeSurfaces.length > 0 && (
                <div className="tt-name">{activeSurfaces.map(([sf, cond]) => `${SURFACES.find((s) => s.id === sf)?.label || sf}: ${SURFACE_CONDITIONS.find((c) => c.id === cond)?.label || cond}`).join(', ')}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ToothIcon({ type, meta, isSel, hasSurfaces }) {
  const size = TOOTH_SIZE[type] || TOOTH_SIZE.premolar;
  const stroke = isSel ? 'var(--blue)' : meta.stroke;
  const accent = isSel ? 'var(--blue)' : meta.stroke;
  return (
    <svg width={size.w} height={size.h} viewBox="0 0 22 26" style={{ display: 'block' }}>
      <path d="M11 2C8 2 6.5 3 5 3.5 3 4 1.5 5 1.5 8c0 3 1 5 1.8 7 .7 1.7 1 3.4 1.2 5.6.2 1.9 1.1 3.4 2.5 3.4 1 0 1.3-1.4 1.5-3 .1-1 .3-2 .5-2.8.2.8.4 1.8.5 2.8.2 1.6.5 3 1.5 3 1.4 0 2.3-1.5 2.5-3.4.2-2.2.5-3.9 1.2-5.6.8-2 1.8-4 1.8-7 0-3-1.5-4-3.5-4.5C15.5 3 14 2 11 2Z"
        fill={meta.color} stroke={stroke} strokeWidth={isSel ? 2 : (meta.dashed ? 1.4 : 1.5)} strokeDasharray={meta.dashed ? '2 2' : undefined} />
      {type === 'canine' && meta.id !== 'missing' && <polygon points="9.3,3.4 11,1 12.7,3.4" fill={accent} opacity=".55" />}
      {type === 'premolar' && meta.id !== 'missing' && <line x1="11" y1="4" x2="11" y2="10" stroke={accent} strokeWidth="1" opacity=".5" />}
      {type === 'molar' && meta.id !== 'missing' && (
        <g stroke={accent} strokeWidth="1" opacity=".5">
          <line x1="7.5" y1="7" x2="11" y2="10.5" />
          <line x1="14.5" y1="7" x2="11" y2="10.5" />
          <line x1="11" y1="10.5" x2="11" y2="4.5" />
        </g>
      )}
      {hasSurfaces && meta.id !== 'missing' && <circle cx="11" cy="13" r="2.2" fill="#c02f1d" />}
    </svg>
  );
}
