import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listSupplierOrders, createSupplierOrder, updateSupplierOrder, deleteSupplierOrder, receiveLine, PO_STATUS_META, autoSuggestedPOs } from '../lib/suppliers.js';
import { listStock, createStock, addBatch, needsReorder, totalQuantity } from '../lib/stock.js';
import { money } from '../lib/invoice.js';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

export default function Suppliers() {
  const { toast } = useApp();
  const [orders, setOrders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [receiving, setReceiving] = useState(null);

  const refresh = async () => setOrders(await listSupplierOrders());
  useEffect(() => { refresh(); }, []);

  const open = orders.filter((o) => o.status !== 'received' && o.status !== 'cancelled');
  const received = orders.filter((o) => o.status === 'received');

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Supplier Orders</h1>
          <div className="sub">Purchase orders — sent to suppliers, received into stock.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icons.plus size={16} /> New PO</button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi kpi-blue"><div className="label">Open orders</div><div className="value">{open.length}</div></div>
        <div className="kpi kpi-green"><div className="label">Received</div><div className="value">{received.length}</div></div>
        <div className="kpi kpi-amber"><div className="label">Open value</div><div className="value">{money(open.reduce((s, o) => s + o.total, 0))}</div></div>
      </div>

      {orders.length === 0 ? (
        <div className="card pad empty"><div className="ic"><Icons.suppliers size={40} /></div>No purchase orders yet. Create a PO when stock runs low.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {orders.map((o) => {
            const m = PO_STATUS_META[o.status] || PO_STATUS_META.draft;
            const rcvCount = o.lines.filter((l) => l.received).length;
            return (
              <div key={o.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--blue-bg)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.suppliers size={18} /></div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditing(o.id)}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: 'var(--font-mono)' }}>{o.poNumber} <span style={{ fontFamily: 'inherit', marginLeft: 8 }}>{o.supplierName || '—'}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{o.date} · {o.lines.length} lines · {rcvCount} received</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{money(o.total)}</div>
                <span className={'chip ' + m.cls}>{m.label}</span>
                {(o.status === 'sent' || o.status === 'partial') && <button className="btn btn-primary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setReceiving(o)}>Receive</button>}
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setEditing(o.id)}>Open</button>
              </div>
            );
          })}
        </div>
      )}

      <POEditor open={!!editing} poId={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onChanged={refresh} toast={toast} />
      <ReceiveModal open={!!receiving} po={receiving} onClose={() => setReceiving(null)} onChanged={refresh} toast={toast} />
    </div>
  );
}

function POEditor({ open, poId, onClose, onChanged, toast }) {
  const [po, setPo] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [suggested, setSuggested] = useState([]);

  useEffect(() => {
    if (!open) return;
    listStock().then(setStockItems);
    autoSuggestedPOs().then(setSuggested);
    if (poId) listSupplierOrders().then((all) => setPo(all.find((o) => o.id === poId)));
    else setPo({ id: null, supplierName: '', date: new Date().toISOString().slice(0, 10), expectedDate: '', lines: [{ stockId: '', name: '', unit: 'unit', quantity: 1, unitPrice: 0, received: false }], status: 'draft', notes: '' });
  }, [open, poId]);

  if (!po) return <Modal open={open} onClose={onClose} title="Purchase order"><div>Loading…</div></Modal>;
  const set = (k, v) => setPo((c) => ({ ...c, [k]: v }));
  const setLine = (i, patch) => setPo((c) => ({ ...c, lines: c.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));
  const addLine = () => setPo((c) => ({ ...c, lines: [...c.lines, { stockId: '', name: '', unit: 'unit', quantity: 1, unitPrice: 0, received: false }] }));
  const delLine = (i) => setPo((c) => ({ ...c, lines: c.lines.filter((_, idx) => idx !== i) }));
  const onStockPick = (i, stockId) => {
    const s = stockItems.find((x) => x.id === stockId);
    setLine(i, { stockId, name: s?.name || '', unit: s?.unit || 'unit' });
  };
  const addSuggested = () => {
    const lines = suggested.map((s) => ({ stockId: s.stockId, name: s.name, unit: s.unit, quantity: s.quantity, unitPrice: 0, received: false }));
    setPo((c) => ({ ...c, lines: [...c.lines.filter((l) => l.stockId || l.name), ...lines] }));
    setSuggested([]);
  };

  const readOnly = po.status === 'received' || po.status === 'cancelled';
  const total = po.lines.reduce((s, l) => s + (l.quantity * l.unitPrice || 0), 0);

  const save = async (status) => {
    if (!po.supplierName.trim()) { toast('Enter supplier name'); return; }
    if (po.lines.length === 0) { toast('Add at least one line'); return; }
    if (po.id) await updateSupplierOrder(po.id, { ...po, status: status || po.status });
    else await createSupplierOrder({ ...po, status: status || 'draft' });
    toast('PO saved');
    onChanged(); onClose();
  };
  const del = async () => {
    if (!po.id || !confirm('Delete this PO?')) return;
    await deleteSupplierOrder(po.id);
    toast('PO deleted');
    onChanged(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={po.id ? `PO ${po.poNumber}` : 'New purchase order'} wide>
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="field-row cols-2">
          <div><label className="field-label">Supplier name</label><input className="field" value={po.supplierName} disabled={readOnly} onChange={(e) => set('supplierName', e.target.value)} placeholder="Apex Dental Supply Co." /></div>
          <div><label className="field-label">Order date</label><input type="date" className="field" value={po.date} disabled={readOnly} onChange={(e) => set('date', e.target.value)} /></div>
        </div>
        <div><label className="field-label">Expected delivery</label><input type="date" className="field" value={po.expectedDate} disabled={readOnly} onChange={(e) => set('expectedDate', e.target.value)} /></div>

        {!readOnly && suggested.length > 0 && (
          <div className="card pad" style={{ background: 'var(--amber-bg)', borderColor: '#f0d9a0', padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--amber)', marginBottom: 6 }}>Auto-suggested from low-stock items</div>
            <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 8 }}>{suggested.map((s) => s.name).join(', ')}</div>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addSuggested}>Add all to PO</button>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="section-title" style={{ fontSize: 13.5 }}>Lines</div>
            {!readOnly && <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addLine}><Icons.plus size={14} /> Add line</button>}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {po.lines.map((l, i) => (
              <div key={i} className="field-row cols-4" style={{ gap: 8 }}>
                <select className="field" style={{ fontSize: 12 }} value={l.stockId} disabled={readOnly} onChange={(e) => onStockPick(i, e.target.value)}>
                  <option value="">— item —</option>
                  {stockItems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input className="field" style={{ fontSize: 12 }} value={l.name} disabled={readOnly} onChange={(e) => setLine(i, { name: e.target.value })} placeholder="Item name" />
                <input type="number" className="field" style={{ fontSize: 12 }} value={l.quantity} disabled={readOnly} onChange={(e) => setLine(i, { quantity: parseFloat(e.target.value) || 0 })} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" className="field" style={{ fontSize: 12 }} value={l.unitPrice} disabled={readOnly} onChange={(e) => setLine(i, { unitPrice: parseFloat(e.target.value) || 0 })} placeholder="₹/unit" />
                  {!readOnly && <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => delLine(i)}>×</button>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 800, fontSize: 14 }}>Total: {money(total)}</div>
        </div>

        <div><label className="field-label">Notes</label><textarea className="field" rows={2} value={po.notes} disabled={readOnly} onChange={(e) => set('notes', e.target.value)} /></div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          {po.id && <button className="btn btn-danger" onClick={del}>Delete</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {!readOnly && po.status === 'draft' && <button className="btn btn-ghost" onClick={() => save('sent')}>Save & mark sent</button>}
            {!readOnly && <button className="btn btn-primary" onClick={() => save()}><Icons.check size={16} /> Save</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ReceiveModal({ open, po, onClose, onChanged, toast }) {
  const [batches, setBatches] = useState({});
  useEffect(() => {
    if (po) setBatches(Object.fromEntries(po.lines.map((l, i) => [i, { lotNumber: '', quantity: String(l.quantity), expiryDate: '' }])));
  }, [po]);
  if (!po) return null;
  const setB = (i, k, v) => setBatches((c) => ({ ...c, [i]: { ...c[i], [k]: v } }));
  const receive = async (i) => {
    const b = batches[i];
    if (!b) return;
    try {
      await receiveLine(po.id, i, b);
      toast('Line received — stock incremented');
      onChanged();
      const all = await listSupplierOrders();
      const updated = all.find((o) => o.id === po.id);
      Object.assign(po, updated);
    } catch (e) { toast(e.message); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Receive — ${po.poNumber}`} wide>
      <div style={{ display: 'grid', gap: 12 }}>
        {po.lines.map((l, i) => (
          <div key={i} className="card pad" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{l.name} <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12 }}>· {l.quantity} {l.unit}</span></div>
              {l.received && <span className="chip chip-green">Received</span>}
            </div>
            {!l.received && (
              <div className="field-row cols-3" style={{ gap: 8 }}>
                <input className="field" style={{ fontSize: 12 }} placeholder="Lot number" value={batches[i]?.lotNumber || ''} onChange={(e) => setB(i, 'lotNumber', e.target.value)} />
                <input type="number" className="field" style={{ fontSize: 12 }} placeholder="Qty received" value={batches[i]?.quantity || ''} onChange={(e) => setB(i, 'quantity', e.target.value)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="date" className="field" style={{ fontSize: 12 }} value={batches[i]?.expiryDate || ''} onChange={(e) => setB(i, 'expiryDate', e.target.value)} />
                  <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }} onClick={() => receive(i)}>Receive</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
