import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { dayClose, periodTotals, gstPrep, topProcedures, stockReport, labCostSummary, exportCSV, exportJSON, todayStr, monthRange } from '../lib/reports.js';
import { money } from '../lib/invoice.js';
import { Icons } from '../components/Icons.jsx';

export default function Reports() {
  const { toast } = useApp();
  const [tab, setTab] = useState('day');
  const [date, setDate] = useState(todayStr());
  const mr = monthRange();
  const [from, setFrom] = useState(mr.from);
  const [to, setTo] = useState(mr.to);
  const [day, setDay] = useState(null);
  const [period, setPeriod] = useState(null);
  const [gst, setGst] = useState(null);
  const [procs, setProcs] = useState([]);
  const [stock, setStock] = useState(null);
  const [lab, setLab] = useState([]);

  const load = async () => {
    setDay(await dayClose(date));
    setPeriod(await periodTotals(from, to));
    setGst(await gstPrep(from, to));
    setProcs(await topProcedures(from, to));
    setStock(await stockReport());
    setLab(await labCostSummary(from, to));
  };
  useEffect(() => { load(); }, [date, from, to]);

  const tabs = [
    { id: 'day', label: 'Day close' },
    { id: 'gst', label: 'GST prep' },
    { id: 'procedures', label: 'Top procedures' },
    { id: 'stock', label: 'Stock & expiry' },
    { id: 'lab', label: 'Lab costs' },
  ];

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Reports</h1>
          <div className="sub">Day close, GST prep, and business summaries.</div>
        </div>
        {tab === 'gst' && gst && <button className="btn btn-ghost" onClick={() => { exportJSON(`gst-prep-${from}-to-${to}.json`, gst); toast('GST report exported'); }}><Icons.download size={16} /> Export JSON</button>}
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--line)', marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, color: tab === t.id ? 'var(--blue)' : 'var(--muted)', borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, transition: 'color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)' }}>{t.label}</button>
        ))}
      </div>

      {(tab === 'day' || tab === 'gst' || tab === 'procedures') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {tab === 'day' ? (
            <>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)' }}>Day</label>
              <input type="date" className="field" style={{ width: 160 }} value={date} onChange={(e) => setDate(e.target.value)} />
            </>
          ) : (
            <>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)' }}>From</label>
              <input type="date" className="field" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} />
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)' }}>To</label>
              <input type="date" className="field" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
        </div>
      )}

      {tab === 'day' && day && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 18 }}>
            <div className="kpi kpi-blue"><div className="label">Patients seen</div><div className="value">{day.patientsSeen}</div></div>
            <div className="kpi kpi-green"><div className="label">Appointments</div><div className="value">{day.appointments}</div><div className="delta tone-green">{day.completed} completed</div></div>
            <div className="kpi kpi-green"><div className="label">Revenue collected</div><div className="value">{money(day.revenueCollected)}</div><div className="delta tone-green">{day.invoiceCount} invoices</div></div>
            <div className="kpi kpi-amber"><div className="label">Outstanding</div><div className="value">{money(day.outstandingAmount)}</div><div className="delta tone-amber">{day.outstandingCount} unpaid</div></div>
          </div>
          <div className="card pad">
            <div className="section-title" style={{ marginBottom: 10 }}>Collection by payment mode</div>
            {Object.keys(day.byMode).length === 0 ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>No collections today.</div> : (
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(day.byMode).map(([mode, amt]) => (
                  <div key={mode} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}><span>{mode}</span><span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{money(amt)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'gst' && gst && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 18 }}>
            <div className="kpi kpi-blue"><div className="label">Total taxable value</div><div className="value">{money(gst.totalTaxable)}</div></div>
            <div className="kpi kpi-green"><div className="label">Exempt services</div><div className="value">{money(gst.exemptTotal)}</div><div className="delta tone-green">Nil-rated</div></div>
            <div className="kpi kpi-blue"><div className="label">Total tax</div><div className="value">{money(gst.totalTax)}</div><div className="delta tone-blue">CGST+SGST+IGST</div></div>
            <div className="kpi"><div className="label">Invoices</div><div className="value">{gst.invoiceCount}</div></div>
          </div>
          <div className="card pad" style={{ marginBottom: 14, overflow: 'auto' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Rate-slab summary {gst.totalCgst > 0 ? '(intra-state: CGST + SGST)' : '(inter-state: IGST)'}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: 'var(--line-2)' }}>{['Slab', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Lines'].map((h) => <th key={h} style={{ padding: 9, textAlign: 'left', fontSize: 11, color: 'var(--muted)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.entries(gst.slabs).map(([k, v]) => (
                  <tr key={k} style={{ borderTop: '1px solid var(--line-2)' }}>
                    <td style={{ padding: 9, fontWeight: 600 }}>{k}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(v.taxableValue)}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(v.cgst)}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(v.sgst)}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(v.igst)}</td>
                    <td style={{ padding: 9 }}>{v.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { exportCSV(`gst-slabs-${from}-to-${to}.csv`, Object.entries(gst.slabs).map(([k, v]) => ({ slab: k, ...v }))); toast('Slabs CSV exported'); }}><Icons.download size={14} /> Slabs CSV</button>
            </div>
          </div>
          <div className="card pad" style={{ overflow: 'auto' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>HSN/SAC summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: 'var(--line-2)' }}>{['HSN/SAC', 'Taxable value', 'GST', 'Lines'].map((h) => <th key={h} style={{ padding: 9, textAlign: 'left', fontSize: 11, color: 'var(--muted)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.entries(gst.hsn).map(([k, v]) => (
                  <tr key={k} style={{ borderTop: '1px solid var(--line-2)' }}>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{k}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(v.taxableValue)}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(v.gst)}</td>
                    <td style={{ padding: 9 }}>{v.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Hand these figures to your CA for filing. Healthcare services are exempt; taxable items carry the applicable GST rate.</div>
        </>
      )}

      {tab === 'procedures' && (
        <div className="card pad" style={{ overflow: 'auto' }}>
          {procs.length === 0 ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>No procedures billed in this period.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: 'var(--line-2)' }}>{['Procedure', 'Count', 'Revenue'].map((h) => <th key={h} style={{ padding: 9, textAlign: 'left', fontSize: 11, color: 'var(--muted)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {procs.map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--line-2)' }}>
                    <td style={{ padding: 9, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 9 }}>{p.count}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button className="btn btn-ghost" style={{ fontSize: 12, marginTop: 12 }} onClick={() => { exportCSV(`procedures-${from}-to-${to}.csv`, procs); toast('Procedures CSV exported'); }}><Icons.download size={14} /> Export CSV</button>
        </div>
      )}

      {tab === 'stock' && stock && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 18 }}>
            <div className="kpi kpi-blue"><div className="label">Items tracked</div><div className="value">{stock.itemCount}</div></div>
            <div className="kpi kpi-blue"><div className="label">Stock value</div><div className="value">{money(stock.totalValue)}</div></div>
            <div className={'kpi' + (stock.lowStock.length > 0 ? ' kpi-amber' : '')}><div className="label">Low stock</div><div className="value">{stock.lowStock.length}</div></div>
            <div className={'kpi' + (stock.expiring.length + stock.expired.length > 0 ? ' kpi-red' : '')}><div className="label">Expiring / expired</div><div className="value">{stock.expiring.length + stock.expired.length}</div></div>
          </div>
          {stock.expired.length > 0 && (
            <div className="card pad" style={{ marginBottom: 14, borderLeft: '3px solid var(--red)' }}>
              <div className="section-title" style={{ color: 'var(--red)', marginBottom: 8 }}>Expired batches — do not use</div>
              {stock.expired.map((e, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>{e.item} · Lot {e.lot} · expired {e.expiry} · {e.qty} units</div>)}
            </div>
          )}
          {stock.expiring.length > 0 && (
            <div className="card pad" style={{ marginBottom: 14, borderLeft: '3px solid var(--amber)' }}>
              <div className="section-title" style={{ color: 'var(--amber)', marginBottom: 8 }}>Expiring within 60 days</div>
              {stock.expiring.map((e, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>{e.item} · Lot {e.lot} · expires {e.expiry} ({e.days}d) · {e.qty} units</div>)}
            </div>
          )}
          {stock.lowStock.length > 0 && (
            <div className="card pad" style={{ borderLeft: '3px solid var(--blue)' }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Below reorder level</div>
              {stock.lowStock.map((e, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>{e.name} · {e.qty} left (reorder at {e.reorder})</div>)}
            </div>
          )}
        </>
      )}

      {tab === 'lab' && (
        <div className="card pad" style={{ overflow: 'auto' }}>
          {lab.length === 0 ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>No lab cases in this period.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: 'var(--line-2)' }}>{['Lab', 'Cases', 'Lab cost', 'Patient charge', 'Margin'].map((h) => <th key={h} style={{ padding: 9, textAlign: 'left', fontSize: 11, color: 'var(--muted)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {lab.map((l, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--line-2)' }}>
                    <td style={{ padding: 9, fontWeight: 600 }}>{l.lab}</td>
                    <td style={{ padding: 9 }}>{l.cases}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(l.cost)}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)' }}>{money(l.charge)}</td>
                    <td style={{ padding: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: l.margin >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(l.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
