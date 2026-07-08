import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getPatient } from '../lib/patient.js';
import { latestChartSnapshot, saveVisit } from '../lib/visit.js';
import { emptyChart, FDI_TEETH, summarizeChart } from '../lib/odontogram.js';
import Odontogram from '../components/Odontogram.jsx';
import { Icons } from '../components/Icons.jsx';

const COMMON_PROCEDURES = ['Consultation', 'Scaling', 'Restoration', 'Extraction', 'Root Canal', 'Crown', 'Bridge', 'Implant', 'Braces Adj.', 'Whitening'];

export default function VisitEditor({ appt, patientId, patientName, onDone, onOpenInvoice }) {
  const { settings, session, toast } = useApp();
  const [patient, setPatient] = useState(null);
  const [chart, setChart] = useState(emptyChart());
  const [chartLoaded, setChartLoaded] = useState(false);
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [nextVisit, setNextVisit] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const pid = appt?.patientId || patientId;
  const pname = appt?.patientName || patientName || '';

  useEffect(() => {
    (async () => {
      if (!pid) return;
      const p = await getPatient(pid);
      setPatient(p);
      const snap = await latestChartSnapshot(pid);
      setChart(snap);
      setChartLoaded(true);
    })();
  }, [pid]);

  const gstOptions = settings?.billing?.gstRates || [];

  const addTreatment = () => setTreatment((t) => [...t, { toothNum: '', procedure: '', materials: '', cost: 0, gstRate: 0, kind: 'exempt' }]);
  const updTreat = (i, patch) => setTreatment((t) => t.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const delTreat = (i) => setTreatment((t) => t.filter((_, idx) => idx !== i));

  const addRx = () => setPrescriptions((r) => [...r, { drug: '', dose: '', frequency: '', duration: '' }]);
  const updRx = (i, patch) => setPrescriptions((r) => r.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const delRx = (i) => setPrescriptions((r) => r.filter((_, idx) => idx !== i));

  const summary = summarizeChart(chart);
  const totalCost = treatment.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0);

  const save = async () => {
    setSaving(true);
    try {
      const { visit, invoice } = await saveVisit({
        appointmentId: appt?.id || null,
        patientId: pid,
        patientName: pname,
        chart,
        findings,
        diagnosis,
        treatment,
        prescriptions,
        nextVisitNote: nextVisit,
        notes,
        doctorMemberId: session?.memberId,
        doctorName: session?.name,
      });
      toast(invoice ? `Visit saved · draft invoice ${invoice.number} created` : 'Visit saved');
      onDone?.();
      if (invoice) onOpenInvoice?.(invoice.id);
    } catch (e) {
      toast('Error saving visit: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Visit · {pname}</h1>
          <div className="sub">{patient?.mrn} · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {session?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onDone}><Icons.back size={16} /> Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Icons.check size={16} /> Complete visit</button>
        </div>
      </div>

      {patient?.allergies?.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16, background: 'var(--red-bg)', borderColor: '#f5c2bd' }}>
          <strong style={{ color: 'var(--red)' }}>⚠ Allergies:</strong> <span style={{ fontSize: 13 }}>{patient.allergies.join(', ')}</span>
          {patient.medicalHistory && <><br /><strong style={{ color: 'var(--red)' }}>History:</strong> <span style={{ fontSize: 13 }}>{patient.medicalHistory}</span></>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>Dental chart</div>
          {chartLoaded && <Odontogram teeth={chart} onChange={setChart} numbering={settings?.choices?.numberingSystem} />}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            {Object.keys(summary.byStatus).length === 0 ? 'All teeth sound.' : Object.entries(summary.byStatus).map(([k, v]) => `${v} ${k}`).join(' · ')}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <Section title="Findings">
            <textarea className="field" rows={2} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Observed conditions (e.g. caries on 16 occlusal, gingivitis lower anteriors)…" />
          </Section>
          <Section title="Diagnosis">
            <textarea className="field" rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Working diagnosis…" />
          </Section>

          <Section title={`Treatment performed${treatment.length ? ` · ₹${totalCost.toLocaleString('en-IN')}` : ''}`} action={<button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addTreatment}><Icons.plus size={14} /> Add</button>}>
            {treatment.length === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>No treatment recorded.</div> : (
              <div style={{ display: 'grid', gap: 8 }}>
                {treatment.map((t, i) => (
                  <div key={i} className="card pad" style={{ padding: 12, display: 'grid', gap: 8 }}>
                    <div className="field-row cols-2">
                      <div>
                        <label className="field-label">Tooth</label>
                        <select className="field" value={t.toothNum} onChange={(e) => updTreat(i, { toothNum: e.target.value })}>
                          <option value="">—</option>
                          {FDI_TEETH.map((tt) => <option key={tt.num} value={tt.num}>{tt.num} ({tt.name})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Procedure</label>
                        <input className="field" list="procs" value={t.procedure} onChange={(e) => updTreat(i, { procedure: e.target.value })} />
                        <datalist id="procs">{COMMON_PROCEDURES.map((p) => <option key={p} value={p} />)}</datalist>
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Materials used</label>
                      <input className="field" value={t.materials} onChange={(e) => updTreat(i, { materials: e.target.value })} placeholder="Composite, anesthetic…" />
                    </div>
                    <div className="field-row cols-3">
                      <div>
                        <label className="field-label">Cost (₹)</label>
                        <input type="number" className="field" value={t.cost} onChange={(e) => updTreat(i, { cost: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="field-label">GST treatment</label>
                        <select className="field" value={t.kind + '|' + t.gstRate} onChange={(e) => { const [kind, rate] = e.target.value.split('|'); updTreat(i, { kind, gstRate: parseFloat(rate) }); }}>
                          {gstOptions.map((g) => <option key={g.label} value={`${g.kind}|${g.rate}`}>{g.label}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button className="btn btn-danger" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => delTreat(i)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Prescriptions" action={<button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addRx}><Icons.plus size={14} /> Add</button>}>
            {prescriptions.length === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>No prescriptions.</div> : (
              <div style={{ display: 'grid', gap: 8 }}>
                {prescriptions.map((r, i) => (
                  <div key={i} className="field-row cols-2" style={{ gap: 8 }}>
                    <input className="field" value={r.drug} onChange={(e) => updRx(i, { drug: e.target.value })} placeholder="Drug" />
                    <input className="field" value={r.dose} onChange={(e) => updRx(i, { dose: e.target.value })} placeholder="Dose (500mg)" />
                    <input className="field" value={r.frequency} onChange={(e) => updRx(i, { frequency: e.target.value })} placeholder="Frequency (BD)" />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="field" value={r.duration} onChange={(e) => updRx(i, { duration: e.target.value })} placeholder="Duration (5 days)" />
                      <button className="btn btn-danger" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => delRx(i)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Visit notes & next visit">
            <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the record…" />
            <input className="field" style={{ marginTop: 8 }} value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} placeholder="Next visit recommendation (e.g. review in 2 weeks)" />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div className="card pad" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="section-title" style={{ fontSize: 13.5 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
