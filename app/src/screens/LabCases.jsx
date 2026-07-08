import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listLabCases, createLabCase, updateLabCase, deleteLabCase, setStage, LAB_STAGES, LAB_STAGE_META, APPLIANCE_TYPES, isOverdue, daysUntil } from '../lib/labcases.js';
import { listPatients } from '../lib/patient.js';
import { createAppointment } from '../lib/appointment.js';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

export default function LabCases({ focusPatient, onOpenRecord }) {
  const { settings, toast } = useApp();
  const [cases, setCases] = useState([]);
  const [patients, setPatients] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('open');

  const refresh = async () => {
    setCases(await listLabCases());
    setPatients(await listPatients());
  };
  useEffect(() => { refresh(); }, []);

  const open = cases.filter((c) => c.stage !== 'fitted');
  const fitted = cases.filter((c) => c.stage === 'fitted');
  const overdue = open.filter(isOverdue);
  const ready = open.filter((c) => c.stage === 'ready');
  const shown = filter === 'open' ? open : filter === 'overdue' ? overdue : filter === 'ready' ? ready : filter === 'fitted' ? fitted : cases;

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Lab Cases</h1>
          <div className="sub">Crowns, bridges, aligners — track from impression to fitting.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icons.plus size={16} /> New lab case</button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi kpi-blue"><div className="label">Open cases</div><div className="value">{open.length}</div></div>
        <div className="kpi kpi-green"><div className="label">Ready for fitting</div><div className="value">{ready.length}</div><div className="delta tone-green">Schedule fitting</div></div>
        <div className={'kpi' + (overdue.length > 0 ? ' kpi-red' : '')}><div className="label">Overdue</div><div className="value">{overdue.length}</div>{overdue.length > 0 && <div className="delta tone-red">Past due date</div>}</div>
        <div className="kpi"><div className="label">Fitted (all time)</div><div className="value">{fitted.length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['open', 'Open'], ['ready', 'Ready'], ['overdue', 'Overdue'], ['fitted', 'Fitted'], ['all', 'All']].map(([k, l]) => (
          <button key={k} className={'btn ' + (filter === k ? 'btn-primary' : 'btn-ghost')} style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card pad empty"><div className="ic"><Icons.lab size={40} /></div>No lab cases in this view.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {shown.map((c) => {
            const m = LAB_STAGE_META[c.stage] || LAB_STAGE_META.impression;
            const od = isOverdue(c);
            const d = daysUntil(c.dueDate);
            return (
              <div key={c.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: m.dot + '18', color: m.dot, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.lab size={18} /></div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onOpenRecord ? null : setEditing(c.id)}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: 'var(--font-mono)' }}>LAB-{c.id.slice(-4).toUpperCase()} <span style={{ fontFamily: 'inherit', marginLeft: 8 }}>{c.patientName}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.applianceType} · {c.teeth || '—'} · {c.labName || '—'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Due</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: od ? 'var(--red)' : d !== null && d <= 3 ? 'var(--amber)' : 'var(--slate)' }}>{c.dueDate || '—'}{d !== null && c.stage !== 'fitted' && (od ? ` (${Math.abs(d)}d overdue)` : d === 0 ? ' (today)' : ` (${d}d)`)}</div>
                </div>
                <span className={'chip ' + m.cls}>{m.label}</span>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setEditing(c.id)}>Open</button>
              </div>
            );
          })}
        </div>
      )}

      <LabEditor open={!!editing} caseId={editing === 'new' ? null : editing} patients={patients} focusPatient={focusPatient} settings={settings} onClose={() => setEditing(null)} onChanged={refresh} toast={toast} />
    </div>
  );
}

function LabEditor({ open, caseId, patients, focusPatient, settings, onClose, onChanged, toast }) {
  const [c, setC] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (caseId) {
      listLabCases().then((all) => setC(all.find((x) => x.id === caseId)));
    } else {
      setC({
        id: null, patientId: focusPatient?.id || '', patientName: focusPatient?.name || '',
        labName: '', applianceType: 'Crown', teeth: '', dueDate: '', stage: 'impression',
        labCost: 0, patientCharge: 0, notes: '',
      });
    }
  }, [open, caseId]);

  if (!c) return <Modal open={open} onClose={onClose} title="Lab case"><div>Loading…</div></Modal>;

  const set = (k, v) => setC((cur) => ({ ...cur, [k]: v }));
  const readOnly = c.stage === 'fitted';

  const save = async () => {
    if (!c.patientId) { toast('Select a patient'); return; }
    if (c.id) await updateLabCase(c.id, c);
    else await createLabCase(c);
    toast('Lab case saved');
    onChanged(); onClose();
  };

  const advance = async (stage) => {
    await setStage(c.id, stage);
    toast(`Marked ${LAB_STAGE_META[stage].label}`);
    onChanged();
    const all = await listLabCases();
    setC(all.find((x) => x.id === c.id));
  };

  const bookFitting = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const appt = await createAppointment({
      patientId: c.patientId, patientName: c.patientName,
      date: today, startTime: settings?.hours?.opening || '09:00', endTime: '09:30',
      chair: 1, doctor: settings?.team?.find((m) => m.role === 'doctor' || m.role === 'owner')?.name || '',
      reason: `Fitting — ${c.applianceType} (LAB-${c.id.slice(-4).toUpperCase()})`,
      status: 'booked',
    });
    await updateLabCase(c.id, { fittingAppointmentId: appt.id });
    toast('Fitting appointment booked for today');
    onChanged();
    const all = await listLabCases();
    setC(all.find((x) => x.id === c.id));
  };

  const del = async () => {
    if (!confirm('Delete this lab case?')) return;
    await deleteLabCase(c.id);
    toast('Lab case deleted');
    onChanged(); onClose();
  };

  const stageOrder = LAB_STAGES.indexOf(c.stage);

  return (
    <Modal open={open} onClose={onClose} title={c.id ? `Lab case LAB-${c.id.slice(-4).toUpperCase()}` : 'New lab case'} wide>
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="field-row cols-2">
          <div><label className="field-label">Patient</label><select className="field" value={c.patientId} disabled={!!c.id} onChange={(e) => { const p = patients.find((x) => x.id === e.target.value); set('patientId', e.target.value); set('patientName', p?.name || ''); }}><option value="">Select…</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}</select></div>
          <div><label className="field-label">Lab name</label><input className="field" value={c.labName} disabled={readOnly} onChange={(e) => set('labName', e.target.value)} placeholder="Apex Dental Lab" /></div>
        </div>
        <div className="field-row cols-3">
          <div><label className="field-label">Appliance type</label><select className="field" value={c.applianceType} disabled={readOnly} onChange={(e) => set('applianceType', e.target.value)}>{APPLIANCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="field-label">Tooth/teeth</label><input className="field" value={c.teeth} disabled={readOnly} onChange={(e) => set('teeth', e.target.value)} placeholder="16, 17" /></div>
          <div><label className="field-label">Due date</label><input type="date" className="field" value={c.dueDate} disabled={readOnly} onChange={(e) => set('dueDate', e.target.value)} /></div>
        </div>
        <div className="field-row cols-2">
          <div><label className="field-label">Lab cost (₹)</label><input type="number" className="field" value={c.labCost} disabled={readOnly} onChange={(e) => set('labCost', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="field-label">Patient charge (₹)</label><input type="number" className="field" value={c.patientCharge} disabled={readOnly} onChange={(e) => set('patientCharge', parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div><label className="field-label">Notes</label><textarea className="field" rows={2} value={c.notes} disabled={readOnly} onChange={(e) => set('notes', e.target.value)} /></div>

        {c.id && (
          <div className="card pad" style={{ padding: 14 }}>
            <div className="section-title" style={{ fontSize: 13, marginBottom: 10 }}>Pipeline</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {LAB_STAGES.map((s, i) => {
                const m = LAB_STAGE_META[s];
                const done = i < stageOrder;
                const cur = i === stageOrder;
                return (
                  <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 6, borderRadius: 4, background: done || cur ? m.dot : 'var(--line-2)' }} />
                    <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: cur ? m.dot : 'var(--muted)' }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {c.stage !== 'fitted' && LAB_STAGES[stageOrder + 1] && <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => advance(LAB_STAGES[stageOrder + 1])}>Advance to {LAB_STAGE_META[LAB_STAGES[stageOrder + 1]].label}</button>}
              {c.stage === 'ready' && <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={bookFitting}><Icons.appointments size={14} /> Book fitting appointment</button>}
              {c.stage === 'ready' && <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => advance('fitted')}>Mark fitted</button>}
              <button className="btn btn-danger" style={{ fontSize: 12, marginLeft: 'auto' }} onClick={del}>Delete</button>
            </div>
          </div>
        )}

        {!c.id && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={save}><Icons.check size={16} /> Save lab case</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
