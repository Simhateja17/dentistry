export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-panel" style={{ width: '100%', maxWidth: wide ? 760 : 520, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} className="modal-close" style={{ fontSize: 22, color: 'var(--muted)', lineHeight: 1, padding: 4, borderRadius: 8 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}
