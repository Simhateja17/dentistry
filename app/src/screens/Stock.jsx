import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listStock, createStock, updateStock, deleteStock, addBatch, dispense, totalQuantity, expiryStatus, needsReorder, isExpired, daysToExpiry } from '../lib/stock.js';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

const CATEGORIES = ['Anesthetic', 'Cement', 'Composite', 'Impression material', 'Disposable', 'Instrument', 'Medication', 'Other'];

export default function Stock() {
  const { toast } = useApp();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [dispensing, setDispensing] = useState(null);
  const [addingBatch, setAddingBatch] = useState(null);
  const [filter, setFilter] = useState('all');

  const refresh = async () => setItems(await listStock());
  useEffect(() => { refresh(); }, []);

  const low = items.filter(needsReorder);
  const expSoon = items.filter((i) => { const s = expiryStatus(i); return s.level === 'expired' || s.level === 'soon'; });
  const shown = filter === 'low' ? low : filter === 'expiry' ? expSoon : items;

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Clinical Stock</h1>
          <div className="sub">Batch-tracked inventory with expiry and FIFO dispensing.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icons.plus size={16} /> New item</button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi kpi-blue"><div className="label">Items tracked</div><div className="value">{items.length}</div></div>
        <div className={'kpi' + (low.length > 0 ? ' kpi-amber' : '')}><div className="label">Low stock</div><div className="value">{low.length}</div>{low.length > 0 && <div className="delta tone-amber">Reorder needed</div>}</div>
        <div className={'kpi' + (expSoon.length > 0 ? ' kpi-red' : '')}><div className="label">Expiring / expired</div><div className="value">{expSoon.length}</div>{expSoon.length > 0 && <div className="delta tone-red">Check batches</div>}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['all', 'All'], ['low', 'Low stock'], ['expiry', 'Expiring']].map(([k, l]) => (
          <button key={k} className={'btn ' + (filter === k ? 'btn-primary' : 'btn-ghost')} style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card pad empty"><div className="ic"><Icons.stock size={40} /></div>No stock items. Add items and their batches to start tracking inventory.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {shown.map((item) => {
            const qty = totalQuantity(item);
            const exp = expiryStatus(item);
            const reorder = needsReorder(item);
            return (
              <div key={item.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: reorder ? 'var(--amber-bg)' : 'var(--blue-bg)', color: reorder ? 'var(--amber)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.stock size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name} {item.category && <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12 }}>· {item.category}</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{qty} {item.unit} available · {item.batches?.length || 0} batches · reorder at {item.reorderLevel}</div>
                </div>
                <span className={'chip ' + exp.cls}>{exp.label}</span>
                {reorder && <span className="chip chip-amber">Low</span>}
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setDispensing(item)}>Dispense</button>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setAddingBatch(item)}>Add batch</button>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setEditing(item.id)}>Edit</button>
              </div>
            );
          })}
        </div>
      )}

      <StockEditor open={!!editing} itemId={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onChanged={refresh} toast={toast} />
      <DispenseModal open={!!dispensing} item={dispensing} onClose={() => setDispensing(null)} onChanged={refresh} toast={toast} />
      <AddBatchModal open={!!addingBatch} item={addingBatch} onClose={() => setAddingBatch(null)} onChanged={refresh} toast={toast} />
    </div>
  );
}

function StockEditor({ open, itemId, onClose, onChanged, toast }) {
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (itemId) listStock().then((all) => setItem(all.find((x) => x.id === itemId)));
    else setItem({ id: null, name: '', category: 'Anesthetic', unit: 'unit', reorderLevel: 0, batches: [] });
  }, [open, itemId]);

  if (!item) return <Modal open={open} onClose={onClose} title="Stock item"><div>Loading…</div></Modal>;
  const set = (k, v) => setItem((c) => ({ ...c, [k]: v }));

  const save = async () => {
    if (!item.name.trim()) { toast('Enter item name'); return; }
    if (item.id) await updateStock(item.id, item);
    else await createStock(item);
    toast('Stock item saved');
    onChanged(); onClose();
  };
  const del = async () => {
    if (!item.id || !confirm('Delete this stock item and all its batches?')) return;
    await deleteStock(item.id);
    toast('Stock item deleted');
    onChanged(); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={item.id ? 'Edit stock item' : 'New stock item'}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div><label className="field-label">Item name</label><input className="field" value={item.name} onChange={(e) => set('name', e.target.value)} placeholder="Lidocaine 2% carpules" /></div>
        <div className="field-row cols-2">
          <div><label className="field-label">Category</label><select className="field" value={item.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="field-label">Unit</label><input className="field" value={item.unit} onChange={(e) => set('unit', e.target.value)} placeholder="carpules, tubes, units" /></div>
        </div>
        <div><label className="field-label">Reorder level</label><input type="number" className="field" value={item.reorderLevel} onChange={(e) => set('reorderLevel', parseFloat(e.target.value) || 0)} /></div>

        {item.id && item.batches?.length > 0 && (
          <div>
            <div className="section-title" style={{ fontSize: 13, marginBottom: 8 }}>Batches ({item.batches.length})</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {item.batches.map((b) => {
                const exp = isExpired(b);
                const d = daysToExpiry(b);
                return (
                  <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{b.lotNumber || '—'}</span>
                    <span style={{ flex: 1 }}>{b.quantity}/{b.initialQuantity} {item.unit}</span>
                    <span style={{ color: exp ? 'var(--red)' : d !== null && d <= 30 ? 'var(--amber)' : 'var(--muted)' }}>Exp: {b.expiryDate || '—'}</span>
                    {exp && <span className="chip chip-red">Expired</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {item.id && <button className="btn btn-danger" onClick={del}>Delete</button>}
          <button className="btn btn-primary" onClick={save} style={{ marginLeft: 'auto' }}><Icons.check size={16} /> Save</button>
        </div>
      </div>
    </Modal>
  );
}

function AddBatchModal({ open, item, onClose, onChanged, toast }) {
  const [batch, setBatch] = useState({ lotNumber: '', quantity: '', expiryDate: '', receivedDate: new Date().toISOString().slice(0, 10), cost: '' });
  useEffect(() => { if (open) setBatch({ lotNumber: '', quantity: '', expiryDate: '', receivedDate: new Date().toISOString().slice(0, 10), cost: '' }); }, [open]);
  if (!item) return null;
  const set = (k, v) => setBatch((c) => ({ ...c, [k]: v }));
  const save = async () => {
    if (!batch.quantity || parseFloat(batch.quantity) <= 0) { toast('Enter quantity'); return; }
    await addBatch(item.id, batch);
    toast('Batch added');
    onChanged(); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={`Add batch — ${item.name}`}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div><label className="field-label">Lot number</label><input className="field" value={batch.lotNumber} onChange={(e) => set('lotNumber', e.target.value)} placeholder="LOT-2024-001" /></div>
        <div className="field-row cols-2">
          <div><label className="field-label">Quantity ({item.unit})</label><input type="number" className="field" value={batch.quantity} onChange={(e) => set('quantity', e.target.value)} /></div>
          <div><label className="field-label">Expiry date</label><input type="date" className="field" value={batch.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} /></div>
        </div>
        <div className="field-row cols-2">
          <div><label className="field-label">Received date</label><input type="date" className="field" value={batch.receivedDate} onChange={(e) => set('receivedDate', e.target.value)} /></div>
          <div><label className="field-label">Cost (₹)</label><input type="number" className="field" value={batch.cost} onChange={(e) => set('cost', e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={save}><Icons.check size={16} /> Add batch</button>
      </div>
    </Modal>
  );
}

function DispenseModal({ open, item, onClose, onChanged, toast }) {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) { setQty(''); setReason(''); } }, [open]);
  if (!item) return null;
  const available = totalQuantity(item);
  const doDispense = async () => {
    const n = parseFloat(qty);
    if (!n || n <= 0) { toast('Enter quantity'); return; }
    try {
      await dispense(item.id, n, reason);
      toast(`Dispensed ${n} ${item.unit} (FIFO — soonest expiry first)`);
      onChanged(); onClose();
    } catch (e) {
      toast(e.message);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Dispense — ${item.name}`}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ background: 'var(--blue-bg)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}><strong>{available} {item.unit}</strong> available across {item.batches?.filter((b) => !isExpired(b) && b.quantity > 0).length || 0} batches. Dispensing draws from the soonest-expiring batch first (FIFO).</div>
        <div><label className="field-label">Quantity to dispense ({item.unit})</label><input type="number" className="field" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div><label className="field-label">Reason / visit reference</label><input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Used in visit for patient X" /></div>
        <button className="btn btn-primary" onClick={doDispense}><Icons.check size={16} /> Dispense</button>
      </div>
    </Modal>
  );
}
