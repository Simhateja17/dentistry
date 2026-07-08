import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getPatient, age, initials } from '../lib/patient.js';
import { listVisitsForPatient } from '../lib/appointment.js';
import { latestChartSnapshot, listChartSnapshots } from '../lib/visit.js';
import { listInvoicesForPatient, money } from '../lib/invoice.js';
import { emptyChart, summarizeChart, statusMeta } from '../lib/odontogram.js';
import Odontogram from '../components/Odontogram.jsx';
import { Icons } from '../components/Icons.jsx';

export default function PatientRecord({ patientId, onBack, onStartVisit, onOpenInvoice }) {
  const { settings, toast } = useApp();
  const [patient, setPatient] = useState(null);
  const [chart, setChart] = useState(emptyChart());
  const [visits, setVisits] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [editChart, setEditChart] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [chartView, setChartView] = useState('current');

  const refresh = async () => {
    const p = await getPatient(patientId);
    setPatient(p);
    setChart(await latestChartSnapshot(patientId));
    setVisits(await listVisitsForPatient(patientId));
    setInvoices(await listInvoicesForPatient(patientId));
    setSnapshots(await listChartSnapshots(patientId));
  };
  useEffect(() => { refresh(); }, [patientId]);

  if (!patient) return <div className="content"><div className="page-head"><h1>Loading…</h1></div></div>;

  const summary = summarizeChart(chart);
  const shownChart = chartView === 'current' ? chart : (snapshots.find((s) => s.id === chartView)?.teeth || chart);
  const shownSnapshot = chartView !== 'current' ? snapshots.find((s) => s.id === chartView) : null;
  const timeline = [
    ...visits.map((v) => ({ type: 'visit', date: v.date, data: v })),
    ...invoices.map((i) => ({ type: 'invoice', date: i.date, data: i })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={onBack} className="back-link" style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Icons.back size={14} /> All patients</button>
          <h1>{patient.name}</h1>
          <div className="sub">{patient.mrn} · {age(patient.dob) || 'DOB n/a'} · {patient.gender || '—'} · {patient.phone || 'no phone'}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onStartVisit(patient)}><Icons.plus size={16} /> Start visit</button>
      </div>

      {patient.allergies?.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16, background: 'var(--red-bg)', borderColor: '#f5c2bd' }}>
          <strong style={{ color: 'var(--red)' }}>⚠ Allergies:</strong> <span style={{ fontSize: 13 }}>{patient.allergies.join(', ')}</span>
          {patient.medicalHistory && <><br /><strong style={{ color: 'var(--red)' }}>History:</strong> <span style={{ fontSize: 13 }}>{patient.medicalHistory}</span></>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="card pad" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Patient summary</div>
            <Row label="Date of birth" val={patient.dob || '—'} />
            <Row label="Phone" val={patient.phone || '—'} />
            <Row label="Email" val={patient.email || '—'} />
            <Row label="Address" val={patient.address || '—'} />
            <Row label="Registered" val={new Date(patient.createdAt).toLocaleDateString('en-IN')} />
            <Row label="Visits" val={visits.length} />
            <Row label="Total billed" val={money(invoices.reduce((s, i) => s + (i.status !== 'cancelled' ? i.payable : 0), 0))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="section-title">Dental chart {shownSnapshot && <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12 }}>· as of {new Date(shownSnapshot.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}</div>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setEditChart((v) => !v)} disabled={chartView !== 'current'}>{editChart ? 'Done' : 'Edit chart'}</button>
          </div>
          <Odontogram teeth={shownChart} onChange={setChart} numbering={settings?.choices?.numberingSystem} readOnly={!editChart || chartView !== 'current'} />
          {snapshots.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Chart history</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className={'chip ' + (chartView === 'current' ? 'chip-blue' : 'chip-soft')} style={{ padding: '5px 11px', cursor: 'pointer' }} onClick={() => setChartView('current')}>Current</button>
                {snapshots.map((s) => (
                  <button key={s.id} className={'chip ' + (chartView === s.id ? 'chip-blue' : 'chip-soft')} style={{ padding: '5px 11px', cursor: 'pointer' }} onClick={() => setChartView(s.id)}>{new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            {Object.keys(summary.byStatus).length === 0 ? 'All teeth sound.' : Object.entries(summary.byStatus).map(([k, v]) => `${v} ${statusMeta(k).label}`).join(' · ')}
          </div>
          {editChart && chartView === 'current' && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Chart edits are saved when you complete a visit. Use Start visit to persist changes.</div>}
          {shownSnapshot && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Viewing historical chart — read only. Select "Current" to edit.</div>}
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 10 }}>Timeline</div>
          {timeline.length === 0 ? (
            <div className="card pad empty" style={{ padding: 30 }}><div className="ic"><Icons.records size={32} /></div>No visits or invoices yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {timeline.map((item, i) => <TimelineItem key={i} item={item} onOpenInvoice={onOpenInvoice} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, val }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}><span style={{ color: 'var(--muted)' }}>{label}</span><span style={{ fontWeight: 600 }}>{val}</span></div>;
}

function TimelineItem({ item, onOpenInvoice }) {
  if (item.type === 'visit') {
    const v = item.data;
    return (
      <div className="card pad" style={{ padding: 12, borderLeft: '3px solid var(--blue)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Visit · {new Date(v.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="chip chip-blue">{v.doctorName || '—'}</span>
        </div>
        {v.diagnosis && <div style={{ fontSize: 12, color: 'var(--slate)' }}><strong>Dx:</strong> {v.diagnosis}</div>}
        {v.treatment?.length > 0 && <div style={{ fontSize: 12, color: 'var(--slate)' }}><strong>Tx:</strong> {v.treatment.map((t) => t.procedure).join(', ')}</div>}
        {v.prescriptions?.length > 0 && <div style={{ fontSize: 12, color: 'var(--slate)' }}><strong>Rx:</strong> {v.prescriptions.map((r) => r.drug).join(', ')}</div>}
        {v.nextVisitNote && <div style={{ fontSize: 12, color: 'var(--amber)' }}><strong>Next:</strong> {v.nextVisitNote}</div>}
      </div>
    );
  }
  const inv = item.data;
  const st = { draft: 'chip-soft', issued: 'chip-blue', paid: 'chip-green', cancelled: 'chip-red' }[inv.status];
  return (
    <button className="card pad" style={{ padding: 12, borderLeft: '3px solid var(--green)', textAlign: 'left' }} onClick={() => onOpenInvoice(inv.id)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{inv.number}</span>
        <span className={'chip ' + st}>{inv.status}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{inv.date} · {inv.lines.length} items · <strong style={{ color: 'var(--ink)' }}>{money(inv.payable)}</strong></div>
    </button>
  );
}
