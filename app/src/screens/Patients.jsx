import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listPatients, createPatient, findByPhone, mergePatients, age, initials } from '../lib/patient.js';
import { listAppointmentsForDate, listVisitsForDate } from '../lib/appointment.js';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

export default function Patients({ onNavigate, onOpenRecord }) {
  const { toast } = useApp();
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);
  const [todayIds, setTodayIds] = useState(new Set());
  const [showNew, setShowNew] = useState(false);

  const refresh = async () => {
    const all = await listPatients();
    setPatients(all);
    const today = new Date().toISOString().slice(0, 10);
    const [appts, visits] = await Promise.all([listAppointmentsForDate(today), listVisitsForDate(today)]);
    setTodayIds(new Set([...appts.map((a) => a.patientId), ...visits.map((v) => v.patientId)]));
  };

  useEffect(() => { refresh(); }, []);

  const filtered = patients.filter((p) => {
    if (todayOnly && !todayIds.has(p.id)) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (p.name || '').toLowerCase().includes(s) || (p.phone || '').includes(q) || (p.mrn || '').toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Patients</h1>
          <div className="sub">{patients.length} registered · {todayIds.size} seen today</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icons.plus size={16} /> New patient</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--muted)' }}><Icons.search size={16} /></span>
          <input className="field" style={{ paddingLeft: 38 }} placeholder="Search by name, phone, or MRN" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className={'btn ' + (todayOnly ? 'btn-primary' : 'btn-ghost')} onClick={() => setTodayOnly((v) => !v)}>Today only</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card pad empty">
          <div className="ic"><Icons.patients size={40} /></div>
          <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 4 }}>{patients.length === 0 ? 'No patients yet' : 'No matches'}</div>
          <div style={{ fontSize: 13 }}>{patients.length === 0 ? 'Register your first patient to start a clinical record.' : 'Try a different search or clear the filters.'}</div>
          {patients.length === 0 && <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowNew(true)}><Icons.plus size={16} /> Add patient</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((p) => (
            <button key={p.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer' }} onClick={() => onOpenRecord(p.id)}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials(p.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.gender && <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12 }}>· {p.gender}</span>}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.mrn} · {age(p.dob) || 'DOB n/a'} · {p.phone || 'no phone'}</div>
              </div>
              {p.allergies?.length > 0 && <span className="chip chip-red">Allergies</span>}
              {todayIds.has(p.id) && <span className="chip chip-blue">Today</span>}
            </button>
          ))}
        </div>
      )}

      <NewPatientModal open={showNew} onClose={() => setShowNew(false)} onSaved={(p) => { setShowNew(false); refresh(); toast('Patient registered'); onNavigate ? null : null; }} onOpenRecord={onOpenRecord} />
    </div>
  );
}

function NewPatientModal({ open, onClose, onSaved, onOpenRecord }) {
  const { toast } = useApp();
  const [form, setForm] = useState({ name: '', dob: '', gender: 'Male', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });
  const [dups, setDups] = useState([]);
  const [saving, setSaving] = useState(false);

  const checkPhone = async (phone) => {
    if ((phone || '').replace(/\D/g, '').length < 7) { setDups([]); return; }
    const found = await findByPhone(phone);
    setDups(found);
  };

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === 'phone') checkPhone(v);
  };

  const save = async () => {
    if (!form.name.trim()) { toast('Enter the patient name'); return; }
    setSaving(true);
    const p = await createPatient(form);
    setSaving(false);
    onSaved(p);
    setForm({ name: '', dob: '', gender: 'Male', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });
    setDups([]);
  };

  const doMerge = async (keepId) => {
    const dropId = dups.find((d) => d.id !== keepId)?.id;
    if (!dropId) return;
    await mergePatients(keepId, dropId);
    toast('Patients merged');
    setDups([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New patient" wide>
      {dups.length > 0 && (
        <div className="card pad" style={{ background: 'var(--amber-bg)', borderColor: '#f0d9a0', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--amber)', marginBottom: 6 }}>Possible duplicate — same phone number</div>
          {dups.map((d) => (
            <div key={d.id} style={{ fontSize: 12.5, marginBottom: 4 }}>{d.name} · {d.mrn} · {d.phone}</div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => doMerge(dups[0].id)}>Merge into {dups[0].name}</button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setDups([])}>Keep separate</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 14 }}>
        <div><label className="field-label">Full name *</label><input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Aarav Sharma" /></div>
        <div className="field-row cols-2">
          <div><label className="field-label">Date of birth</label><input type="date" className="field" value={form.dob} onChange={(e) => set('dob', e.target.value)} /></div>
          <div><label className="field-label">Gender</label><select className="field" value={form.gender} onChange={(e) => set('gender', e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
        </div>
        <div className="field-row cols-2">
          <div><label className="field-label">Phone</label><input className="field" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
          <div><label className="field-label">Email</label><input className="field" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
        </div>
        <div><label className="field-label">Address</label><input className="field" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
        <div><label className="field-label">Allergies (comma-separated)</label><input className="field" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Penicillin, Latex" /></div>
        <div><label className="field-label">Medical history</label><textarea className="field" rows={2} value={form.medicalHistory} onChange={(e) => set('medicalHistory', e.target.value)} placeholder="Diabetes, hypertension, medications…" /></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}><Icons.check size={16} /> Save patient</button>
      </div>
    </Modal>
  );
}
