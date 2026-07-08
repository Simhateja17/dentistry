import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listInvoices, markPaid, cancelInvoice, money, updateInvoice, computeInvoice } from '../lib/invoice.js';
import { getPatient } from '../lib/patient.js';
import { generateReceiptPDF } from '../lib/receipt.js';
import { printReceipt } from '../components/ReceiptHTML.jsx';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

const STATUS = {
  draft: { label: 'Draft', cls: 'chip-soft' },
  issued: { label: 'Issued', cls: 'chip-blue' },
  paid: { label: 'Paid', cls: 'chip-green' },
  cancelled: { label: 'Cancelled', cls: 'chip-red' },
};

export default function Billing({ focusInvoice }) {
  const { settings, toast } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('open');
  const [edit, setEdit] = useState(null);

  const refresh = async () => setInvoices(await listInvoices());
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (focusInvoice) setEdit(focusInvoice);
  }, [focusInvoice]);

  const today = new Date().toISOString().slice(0, 10);
  const paidToday = invoices.filter((i) => i.date === today && i.status === 'paid');
  const openInv = invoices.filter((i) => i.status === 'issued' || i.status === 'draft');
  const paidTodayAmt = paidToday.reduce((s, i) => s + i.payable, 0);
  const openAmt = openInv.reduce((s, i) => s + i.payable, 0);

  const shown = filter === 'all' ? invoices : filter === 'open' ? openInv : filter === 'paid' ? invoices.filter((i) => i.status === 'paid') : invoices.filter((i) => i.status === 'cancelled');

  return (
    <div>
      <div className="page-head">
        <h1>Billing</h1>
        <div className="sub">Doctor charges arrive here for collection at reception.</div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi kpi-amber"><div className="label">Awaiting collection</div><div className="value">{openInv.length}</div><div className="delta tone-amber">{money(openAmt)}</div></div>
        <div className="kpi kpi-green"><div className="label">Paid today</div><div className="value">{paidToday.length}</div><div className="delta tone-green">{money(paidTodayAmt)}</div></div>
        <div className="kpi kpi-blue"><div className="label">Total invoices</div><div className="value">{invoices.length}</div><div className="delta tone-blue">All time</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['open', 'Open'], ['paid', 'Paid'], ['cancelled', 'Cancelled'], ['all', 'All']].map(([k, l]) => (
          <button key={k} className={'btn ' + (filter === k ? 'btn-primary' : 'btn-ghost')} style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card pad empty"><div className="ic"><Icons.billing size={40} /></div>No invoices here yet. Visits with treatment auto-create draft invoices.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {shown.map((inv) => {
            const st = STATUS[inv.status] || STATUS.issued;
            return (
              <button key={inv.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }} onClick={() => setEdit(inv)}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--blue-bg)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.billing size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: 'var(--font-mono)' }}>{inv.number}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{inv.patientName} · {inv.date} · {inv.lines.length} items</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{money(inv.payable)}</div>
                  <span className={'chip ' + st.cls}>{st.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <InvoiceEditor open={!!edit} invoiceId={edit?.id} onClose={() => setEdit(null)} onChanged={refresh} onPrint={(inv) => { generateReceiptPDF(inv, settings); toast('Receipt PDF generated'); }} />
    </div>
  );
}

function InvoiceEditor({ open, invoiceId, onClose, onChanged, onPrint }) {
  const { settings, toast } = useApp();
  const [inv, setInv] = useState(null);

  const load = async () => {
    if (!invoiceId) return;
    const all = await listInvoices();
    setInv(all.find((i) => i.id === invoiceId) || null);
  };
  useEffect(() => { load(); }, [invoiceId]);

  if (!inv) return <Modal open={open} onClose={onClose} title="Invoice"><div>Loading…</div></Modal>;

  const recompute = (lines) => {
    const interState = inv.interState;
    const c = computeInvoice(lines, interState);
    setInv({ ...inv, lines: c.lines, ...c });
  };

  const updLine = (i, patch) => {
    const lines = inv.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l);
    recompute(lines);
  };
  const addLine = () => recompute([...inv.lines, { description: '', hsn: '', gstRate: 0, kind: 'exempt', quantity: 1, unitPrice: 0 }]);
  const delLine = (i) => recompute(inv.lines.filter((_, idx) => idx !== i));

  const save = async () => {
    await updateInvoice(inv.id, { lines: inv.lines, subtotal: inv.subtotal, totalCgst: inv.totalCgst, totalSgst: inv.totalSgst, totalIgst: inv.totalIgst, totalTax: inv.totalTax, roundOff: inv.roundOff, payable: inv.payable, grandTotal: inv.grandTotal, status: inv.status === 'draft' ? 'issued' : inv.status });
    toast('Invoice updated');
    onChanged(); onClose();
  };
  const pay = async (mode) => {
    await markPaid(inv.id, mode);
    toast('Marked paid');
    onChanged(); onClose();
  };
  const cancel = async () => {
    const reason = prompt('Cancel reason (credit note):') || 'Cancelled';
    await cancelInvoice(inv.id, reason);
    toast('Invoice cancelled');
    onChanged(); onClose();
  };

  const gstOptions = settings?.billing?.gstRates || [];
  const isPaid = inv.status === 'paid';
  const isCancelled = inv.status === 'cancelled';

  return (
    <Modal open={open} onClose={onClose} title={`Invoice ${inv.number}`} wide>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Patient</div><div style={{ fontWeight: 700 }}>{inv.patientName}</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Date</div><div style={{ fontWeight: 700 }}>{inv.date}</div></div>
          <span className={'chip ' + (STATUS[inv.status] || {}).cls} style={{ marginLeft: 'auto' }}>{(STATUS[inv.status] || {}).label}</span>
        </div>

        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr style={{ background: 'var(--line-2)' }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
              <th style={{ padding: 8, textAlign: 'left', width: 70 }}>HSN</th>
              <th style={{ padding: 8, textAlign: 'left', width: 110 }}>GST</th>
              <th style={{ padding: 8, width: 70 }}>Qty</th>
              <th style={{ padding: 8, width: 90 }}>Rate</th>
              <th style={{ padding: 8, width: 80 }}>Tax</th>
              <th style={{ padding: 8, width: 80 }}>Total</th>
              <th style={{ padding: 8, width: 30 }}></th>
            </tr></thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--line-2)' }}>
                  <td style={{ padding: 4 }}><input className="field" style={{ fontSize: 12, padding: '5px 7px' }} value={l.description} disabled={isPaid || isCancelled} onChange={(e) => updLine(i, { description: e.target.value })} /></td>
                  <td style={{ padding: 4 }}><input className="field" style={{ fontSize: 12, padding: '5px 7px' }} value={l.hsn} disabled={isPaid || isCancelled} onChange={(e) => updLine(i, { hsn: e.target.value })} /></td>
                  <td style={{ padding: 4 }}>
                    <select className="field" style={{ fontSize: 12, padding: '5px 7px' }} value={l.kind + '|' + l.gstRate} disabled={isPaid || isCancelled} onChange={(e) => { const [kind, rate] = e.target.value.split('|'); updLine(i, { kind, gstRate: parseFloat(rate) }); }}>
                      {gstOptions.map((g) => <option key={g.label} value={`${g.kind}|${g.rate}`}>{g.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 4 }}><input type="number" className="field" style={{ fontSize: 12, padding: '5px 7px' }} value={l.quantity} disabled={isPaid || isCancelled} onChange={(e) => updLine(i, { quantity: parseFloat(e.target.value) || 1 })} /></td>
                  <td style={{ padding: 4 }}><input type="number" className="field" style={{ fontSize: 12, padding: '5px 7px' }} value={l.unitPrice} disabled={isPaid || isCancelled} onChange={(e) => updLine(i, { unitPrice: parseFloat(e.target.value) || 0 })} /></td>
                  <td style={{ padding: 8, fontFamily: 'var(--font-mono)' }}>{money(l.gstAmount)}</td>
                  <td style={{ padding: 8, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{money(l.total)}</td>
                  <td style={{ padding: 4 }}>{!isPaid && !isCancelled && <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => delLine(i)}>×</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isPaid && !isCancelled && <button className="btn btn-ghost" style={{ margin: 8, fontSize: 12 }} onClick={addLine}><Icons.plus size={14} /> Add line</button>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 240, display: 'grid', gap: 4, fontSize: 13 }}>
            <Row label="Subtotal" val={money(inv.subtotal)} />
            {!inv.interState ? <><Row label="CGST" val={money(inv.totalCgst)} /><Row label="SGST" val={money(inv.totalSgst)} /></> : <Row label="IGST" val={money(inv.totalIgst)} />}
            {inv.roundOff !== 0 && <Row label="Round off" val={(inv.roundOff > 0 ? '+' : '') + money(inv.roundOff)} />}
            <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: 'var(--blue)' }}>
              <span>Total</span><span>{money(inv.payable)}</span>
            </div>
          </div>
        </div>

        {!isCancelled && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <button className="btn btn-ghost" onClick={() => printReceipt(inv, settings)}><Icons.download size={16} /> Print receipt (తెలుగు)</button>
            <button className="btn btn-ghost" onClick={() => { generateReceiptPDF(inv, settings); toast('Receipt PDF generated'); }}><Icons.download size={16} /> PDF (English)</button>
            {!isPaid && <button className="btn btn-danger" onClick={cancel}>Cancel invoice</button>}
            {!isPaid && <>
              <button className="btn btn-primary" onClick={() => pay('UPI')}>Mark paid · UPI</button>
              <button className="btn btn-primary" onClick={() => pay('Cash')}>Mark paid · Cash</button>
            </>}
            {!isPaid && <button className="btn btn-ghost" onClick={save}>Save changes</button>}
          </div>
        )}
        {isCancelled && <div style={{ fontSize: 12, color: 'var(--red)' }}>Cancelled: {inv.cancelReason || '—'}</div>}
      </div>
    </Modal>
  );
}

function Row({ label, val }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>{label}</span><span style={{ fontFamily: 'var(--font-mono)' }}>{val}</span></div>;
}
