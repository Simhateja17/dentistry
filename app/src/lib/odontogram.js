export const FDI_TEETH = [
  { num: 18, name: 'UR8', quad: 1, type: 'molar', arch: 'upper', side: 'right' },
  { num: 17, name: 'UR7', quad: 1, type: 'molar', arch: 'upper', side: 'right' },
  { num: 16, name: 'UR6', quad: 1, type: 'molar', arch: 'upper', side: 'right' },
  { num: 15, name: 'UR5', quad: 1, type: 'premolar', arch: 'upper', side: 'right' },
  { num: 14, name: 'UR4', quad: 1, type: 'premolar', arch: 'upper', side: 'right' },
  { num: 13, name: 'UR3', quad: 1, type: 'canine', arch: 'upper', side: 'right' },
  { num: 12, name: 'UR2', quad: 1, type: 'incisor', arch: 'upper', side: 'right' },
  { num: 11, name: 'UR1', quad: 1, type: 'incisor', arch: 'upper', side: 'right' },
  { num: 21, name: 'UL1', quad: 2, type: 'incisor', arch: 'upper', side: 'left' },
  { num: 22, name: 'UL2', quad: 2, type: 'incisor', arch: 'upper', side: 'left' },
  { num: 23, name: 'UL3', quad: 2, type: 'canine', arch: 'upper', side: 'left' },
  { num: 24, name: 'UL4', quad: 2, type: 'premolar', arch: 'upper', side: 'left' },
  { num: 25, name: 'UL5', quad: 2, type: 'premolar', arch: 'upper', side: 'left' },
  { num: 26, name: 'UL6', quad: 2, type: 'molar', arch: 'upper', side: 'left' },
  { num: 27, name: 'UL7', quad: 2, type: 'molar', arch: 'upper', side: 'left' },
  { num: 28, name: 'UL8', quad: 2, type: 'molar', arch: 'upper', side: 'left' },
  { num: 48, name: 'LR8', quad: 4, type: 'molar', arch: 'lower', side: 'right' },
  { num: 47, name: 'LR7', quad: 4, type: 'molar', arch: 'lower', side: 'right' },
  { num: 46, name: 'LR6', quad: 4, type: 'molar', arch: 'lower', side: 'right' },
  { num: 45, name: 'LR5', quad: 4, type: 'premolar', arch: 'lower', side: 'right' },
  { num: 44, name: 'LR4', quad: 4, type: 'premolar', arch: 'lower', side: 'right' },
  { num: 43, name: 'LR3', quad: 4, type: 'canine', arch: 'lower', side: 'right' },
  { num: 42, name: 'LR2', quad: 4, type: 'incisor', arch: 'lower', side: 'right' },
  { num: 41, name: 'LR1', quad: 4, type: 'incisor', arch: 'lower', side: 'right' },
  { num: 31, name: 'LL1', quad: 3, type: 'incisor', arch: 'lower', side: 'left' },
  { num: 32, name: 'LL2', quad: 3, type: 'incisor', arch: 'lower', side: 'left' },
  { num: 33, name: 'LL3', quad: 3, type: 'canine', arch: 'lower', side: 'left' },
  { num: 34, name: 'LL4', quad: 3, type: 'premolar', arch: 'lower', side: 'left' },
  { num: 35, name: 'LL5', quad: 3, type: 'premolar', arch: 'lower', side: 'left' },
  { num: 36, name: 'LL6', quad: 3, type: 'molar', arch: 'lower', side: 'left' },
  { num: 37, name: 'LL7', quad: 3, type: 'molar', arch: 'lower', side: 'left' },
  { num: 38, name: 'LL8', quad: 3, type: 'molar', arch: 'lower', side: 'left' },
];

export const UPPER_RIGHT = FDI_TEETH.filter((t) => t.arch === 'upper' && t.side === 'right');
export const UPPER_LEFT = FDI_TEETH.filter((t) => t.arch === 'upper' && t.side === 'left');
export const LOWER_LEFT = FDI_TEETH.filter((t) => t.arch === 'lower' && t.side === 'left');
export const LOWER_RIGHT = FDI_TEETH.filter((t) => t.arch === 'lower' && t.side === 'right');

export const TOOTH_STATUSES = [
  { id: 'sound', label: 'Sound', color: '#fff', stroke: '#cbd5e1' },
  { id: 'caries', label: 'Caries', color: '#f6dede', stroke: '#C62828' },
  { id: 'filled', label: 'Filled', color: '#dbe7f5', stroke: '#1565C0' },
  { id: 'missing', label: 'Missing', color: 'transparent', stroke: '#5F6368', dashed: true },
  { id: 'crown', label: 'Crown', color: '#f4ecda', stroke: '#B8860B' },
  { id: 'implant', label: 'Implant', color: '#dfebe0', stroke: '#2E7D32' },
  { id: 'rootcanal', label: 'Root canal', color: '#eae5e3', stroke: '#795548' },
  { id: 'bridge', label: 'Bridge pontic', color: '#e8dcef', stroke: '#6A1B9A' },
  { id: 'extraction', label: 'To extract', color: '#dcdfe4', stroke: '#111827' },
  { id: 'veneer', label: 'Veneer', color: '#d8f2f5', stroke: '#00ACC1' },
];

export const SURFACES = [
  { id: 'buccal', label: 'Buccal/Labial' },
  { id: 'lingual', label: 'Lingual/Palatal' },
  { id: 'mesial', label: 'Mesial' },
  { id: 'distal', label: 'Distal' },
  { id: 'occlusal', label: 'Occlusal/Incisal' },
];

export const SURFACE_CONDITIONS = [
  { id: 'sound', label: 'Sound' },
  { id: 'caries', label: 'Caries' },
  { id: 'filled', label: 'Filled' },
  { id: 'fracture', label: 'Fracture' },
  { id: 'restoration', label: 'Restoration' },
];

export function statusMeta(id) {
  return TOOTH_STATUSES.find((s) => s.id === id) || TOOTH_STATUSES[0];
}

export function emptyChart() {
  const teeth = {};
  for (const t of FDI_TEETH) teeth[t.num] = { status: 'sound', surfaces: {} };
  return teeth;
}

export function universalLabel(num, system) {
  if (system === 'universal') return toUniversal(num);
  return String(num);
}

function toUniversal(fdi) {
  const map = {
    18: 1, 17: 2, 16: 3, 15: 4, 14: 5, 13: 6, 12: 7, 11: 8,
    21: 9, 22: 10, 23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16,
    48: 32, 47: 31, 46: 30, 45: 29, 44: 28, 43: 27, 42: 26, 41: 25,
    31: 24, 32: 23, 33: 22, 34: 21, 35: 20, 36: 19, 37: 18, 38: 17,
  };
  return map[fdi] ?? fdi;
}

const QUAD_INFO = {
  1: { code: 'UR', name: 'Upper Right' },
  2: { code: 'UL', name: 'Upper Left' },
  3: { code: 'LL', name: 'Lower Left' },
  4: { code: 'LR', name: 'Lower Right' },
};
const POS_INFO = {
  1: { code: 'I1', name: 'Central Incisor' },
  2: { code: 'I2', name: 'Lateral Incisor' },
  3: { code: 'C', name: 'Canine' },
  4: { code: 'P3', name: 'First Premolar' },
  5: { code: 'P4', name: 'Second Premolar' },
  6: { code: 'M1', name: 'First Molar' },
  7: { code: 'M2', name: 'Second Molar' },
  8: { code: 'M3', name: 'Third Molar' },
};

export function toothInfo(num) {
  const quad = Math.floor(num / 10);
  const pos = num % 10;
  const q = QUAD_INFO[quad];
  const p = POS_INFO[pos];
  return { code: q.code + p.code, name: `${q.name} ${p.name}`, quadName: q.name, posName: p.name };
}

export function summarizeChart(teeth) {
  const out = { byStatus: {}, withSurfaces: 0 };
  for (const t of FDI_TEETH) {
    const e = teeth?.[t.num];
    if (!e) continue;
    if (e.status && e.status !== 'sound') out.byStatus[e.status] = (out.byStatus[e.status] || 0) + 1;
    if (e.surfaces && Object.keys(e.surfaces).length) out.withSurfaces++;
  }
  return out;
}
