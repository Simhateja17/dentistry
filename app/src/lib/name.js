const HONORIFIC = /^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i;

export function stripHonorific(name) {
  return (name || '').replace(HONORIFIC, '');
}

export function firstName(name) {
  return stripHonorific(name).split(' ')[0] || '';
}

export function initials(name) {
  const clean = stripHonorific(name);
  return clean.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}
