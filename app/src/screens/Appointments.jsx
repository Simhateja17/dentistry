import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { generateSlots, listAppointmentsForDate, createAppointment, updateAppointment, conflicts, to12h, todayStr, prettyDate, STATUS_META, STATUS_FLOW as FLOW } from '../lib/appointment.js';
import { listPatients, initials, createPatient } from '../lib/patient.js';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

export default function Appointments({ onOpenVisit, focusPatient }) {
  const { settings, toast } = useApp();
  const [date, setDate] = useState(todayStr());
  const [view, setView] = useState(settings?.choices?.schedulingMode || 'grid');
  const [appts, setAppts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [booking, setBooking] = useState(null);
  const [detail, setDetail] = useState(null);

  const slots = useMemo(() => generateSlots(settings?.hours?.opening, settings?.hours?.closing, settings?.capacity?.slotDuration, settings?.capacity?.buffer), [settings]);
  const chairs = settings?.capacity?.chairs || 2;
  const doctors = settings?.team?.filter((m) => m.role === 'doctor' || m.role === 'owner') || [];

  const refresh = async () => {
    setAppts(await listAppointmentsForDate(date));
    setPatients(await listPatients());
  };
  useEffect(() => { refresh(); }, [date]);

  const shift = (days) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const onCellClick = (chair, slot) => setBooking({ chair, start: slot.start, end: slot.end });
  const onWalkIn = () => setBooking({ walkin: true });

  const advance = async (appt, status) => {
    if (status === 'completed') {
      setDetail(null);
      onOpenVisit?.(appt);
      return;
    }
    await updateAppointment(appt.id, { status });
    refresh();
    toast(`Marked ${STATUS_META[status].label}`);
  };

  const isToday = date === todayStr();

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Appointments</h1>
          <div className="sub">{prettyDate(date)}{isToday ? ' · Today' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost" onClick={() => shift(-1)}>‹</button>
            <button className="btn btn-ghost" onClick={() => setDate(todayStr())}>Today</button>
            <button className="btn btn-ghost" onClick={() => shift(1)}>›</button>
          </div>
          <input type="date" className="field" style={{ width: 150 }} value={date} onChange={(e) => setDate(e.target.value)} />
          <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 9, overflow: 'hidden' }}>
            {['grid', 'list', 'week'].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 600, background: view === v ? 'var(--blue)' : '#fff', color: view === v ? '#fff' : 'var(--slate)' }}>{v[0].toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={onWalkIn}><Icons.plus size={16} /> Walk-in</button>
        </div>
      </div>

      {view === 'grid' && <Grid slots={slots} chairs={chairs} appts={appts} onCell={onCellClick} onAppt={setDetail} />}
      {view === 'list' && <ListView appts={appts} onAppt={setDetail} />}
      {view === 'week' && <WeekView anchor={date} onAppt={setDetail} />}

      <BookingModal open={!!booking} seed={booking} patients={patients} date={date} slots={slots} chairs={chairs} doctors={doctors} focusPatient={focusPatient} onClose={() => setBooking(null)} onSaved={() => { setBooking(null); refresh(); toast('Appointment booked'); }} />
      <DetailModal open={!!detail} appt={detail} onClose={() => setDetail(null)} onAdvance={advance} />
    </div>
  );
}

function Grid({ slots, chairs, appts, onCell, onAppt }) {
  return (
    <div className="card" style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ width: 90, padding: '10px 12px', fontSize: 11, color: 'var(--muted)', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Time</th>
            {Array.from({ length: chairs }, (_, i) => i + 1).map((c) => (
              <th key={c} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--slate)', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Chair {c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.start}>
              <td style={{ padding: '0 12px', fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--line-2)' }}>{to12h(slot.start)}</td>
              {Array.from({ length: chairs }, (_, i) => i + 1).map((c) => {
                const a = appts.find((x) => x.chair === c && x.startTime >= slot.start && x.startTime < slot.end);
                if (a) {
                  const m = STATUS_META[a.status] || STATUS_META.booked;
                  return (
                    <td key={c} style={{ padding: 4, borderBottom: '1px solid var(--line-2)' }}>
                      <button onClick={() => onAppt(a)} style={{ width: '100%', textAlign: 'left', padding: '6px 9px', borderRadius: 8, background: m.dot + '18', border: `1px solid ${m.dot}40` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.patientName}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{a.reason || m.label}</div>
                      </button>
                    </td>
                  );
                }
                return (
                  <td key={c} style={{ padding: 4, borderBottom: '1px solid var(--line-2)' }}>
                    <button onClick={() => onCell(c, slot)} style={{ width: '100%', height: 34, borderRadius: 8, border: '1px dashed var(--line)', color: 'transparent' }}>+</button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListView({ appts, onAppt }) {
  if (!appts.length) return <div className="card pad empty"><div className="ic"><Icons.appointments size={40} /></div>No appointments this day.</div>;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {appts.map((a) => {
        const m = STATUS_META[a.status] || STATUS_META.booked;
        return (
          <button key={a.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }} onClick={() => onAppt(a)}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials(a.patientName)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.patientName}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{to12h(a.startTime)} · Chair {a.chair} · {a.reason || '—'}</div>
            </div>
            <span className={'chip ' + m.cls}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function WeekView({ anchor, onAppt }) {
  const [week, setWeek] = useState([]);
  useEffect(() => {
    const d = new Date(anchor + 'T00:00:00');
    const monday = d.getDate() - ((d.getDay() + 6) % 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d); dd.setDate(monday + i);
      days.push(dd.toISOString().slice(0, 10));
    }
    Promise.all(days.map((dt) => listAppointmentsForDate(dt))).then((all) => setWeek(all.map((a, i) => ({ date: days[i], appts: a }))));
  }, [anchor]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {week.map((d) => (
        <div key={d.date} className="card" style={{ padding: 10, minHeight: 160 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{prettyDate(d.date)}</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {d.appts.map((a) => {
              const m = STATUS_META[a.status] || STATUS_META.booked;
              return <button key={a.id} onClick={() => onAppt(a)} style={{ textAlign: 'left', padding: '5px 7px', borderRadius: 6, background: m.dot + '18', border: `1px solid ${m.dot}40` }}><div style={{ fontSize: 11, fontWeight: 700 }}>{to12h(a.startTime)}</div><div style={{ fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.patientName}</div></button>;
            })}
            {!d.appts.length && <div style={{ fontSize: 11, color: 'var(--muted)' }}>—</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingModal({ open, seed, patients, date, slots, chairs, doctors, focusPatient, onClose, onSaved }) {
  const { settings, toast } = useApp();
  const [patientId, setPatientId] = useState('');
  const [q, setQ] = useState('');
  const [chair, setChair] = useState(1);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('09:30');
  const [doctor, setDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [justCreated, setJustCreated] = useState(null);
  const [newPhone, setNewPhone] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (open) {
      setPatientId(focusPatient?.id || '');
      setQ(focusPatient?.name || '');
      setChair(seed?.chair || 1);
      setStart(seed?.start || slots[0]?.start || '09:00');
      setEnd(seed?.end || slots[0]?.end || '09:30');
      setDoctor(doctors[0]?.name || '');
      setReason(''); setRecurring(false);
      setJustCreated(null); setNewPhone('');
    }
  }, [open, seed, slots, doctors, focusPatient]);

  const allPatients = justCreated ? [justCreated, ...patients] : patients;
  const filtered = allPatients.filter((p) => !q || (p.name || '').toLowerCase().includes(q.toLowerCase()) || (p.phone || '').includes(q));
  const chosen = allPatients.find((p) => p.id === patientId);

  const quickRegister = async () => {
    const name = q.trim();
    if (!name) { toast('Enter a patient name'); return; }
    setRegistering(true);
    const p = await createPatient({ name, phone: newPhone });
    setRegistering(false);
    setJustCreated(p);
    setPatientId(p.id);
    setQ(p.name);
    setNewPhone('');
    toast(`${p.name} registered (${p.mrn})`);
  };

  const save = async () => {
    if (!chosen) { toast('Select a patient'); return; }
    const cand = { patientId: chosen.id, patientName: chosen.name, date, startTime: start, endTime: end, chair, doctor, reason };
    const cn = await conflicts(cand, settings);
    if (cn.length) {
      const overlap = cn.find((c) => c.chair === chair);
      if (overlap) { toast(`Chair ${chair} busy: ${overlap.patientName} ${to12h(overlap.startTime)}`); return; }
      if (!confirm(`Overlap with ${cn[0].patientName} at ${to12h(cn[0].startTime)}. Book anyway?`)) return;
    }
    await createAppointment(cand);
    if (recurring) {
      for (let w = 1; w <= 8; w++) {
        const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + w * 7);
        await createAppointment({ ...cand, date: d.toISOString().slice(0, 10), recurring: 'weekly' });
      }
      toast('Booked weekly for 8 weeks');
    }
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title="Book appointment" wide>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label className="field-label">Patient</label>
          <input className="field" value={q} onChange={(e) => { setQ(e.target.value); setPatientId(''); }} placeholder="Search name or phone" />
          {q && !chosen && (
            <div style={{ marginTop: 6, maxHeight: 240, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
              {filtered.slice(0, 6).map((p) => (
                <button key={p.id} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--line-2)', fontSize: 13 }} onClick={() => { setQ(p.name); setPatientId(p.id); }}>
                  {p.name} <span style={{ color: 'var(--muted)' }}>· {p.mrn} · {p.phone}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '12px 14px', display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No existing patient matches "<strong style={{ color: 'var(--ink)' }}>{q.trim()}</strong>". Register them now to book.</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label className="field-label" style={{ fontSize: 11.5, marginBottom: 4 }}>Phone (optional)</label>
                      <input className="field" style={{ fontSize: 13 }} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91 98765 43210" />
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: 12.5, padding: '9px 14px', whiteSpace: 'nowrap' }} onClick={quickRegister} disabled={registering}>
                      <Icons.plus size={15} /> Register &amp; select
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>You can add allergies, DOB and history later in the patient's record.</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="field-row cols-3">
          <div><label className="field-label">Chair</label><select className="field" value={chair} onChange={(e) => setChair(parseInt(e.target.value))}>{Array.from({ length: chairs }, (_, i) => i + 1).map((c) => <option key={c} value={c}>Chair {c}</option>)}</select></div>
          <div><label className="field-label">Start</label><select className="field" value={start} onChange={(e) => setStart(e.target.value)}>{slots.map((s) => <option key={s.start} value={s.start}>{to12h(s.start)}</option>)}</select></div>
          <div><label className="field-label">End</label><select className="field" value={end} onChange={(e) => setEnd(e.target.value)}>{slots.map((s) => <option key={s.end} value={s.end}>{to12h(s.end)}</option>)}</select></div>
        </div>
        <div className="field-row cols-2">
          <div><label className="field-label">Doctor</label><select className="field" value={doctor} onChange={(e) => setDoctor(e.target.value)}>{doctors.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}{doctors.length === 0 && <option>—</option>}</select></div>
          <div><label className="field-label">Reason / complaint</label><input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Cleaning, pain lower left…" /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Repeat weekly for 8 weeks (braces/ortho follow-ups)
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}><Icons.check size={16} /> Book</button>
      </div>
    </Modal>
  );
}

function DetailModal({ open, appt, onClose, onAdvance }) {
  if (!appt) return null;
  const m = STATUS_META[appt.status] || STATUS_META.booked;
  const next = FLOW[appt.status] || [];
  return (
    <Modal open={open} onClose={onClose} title="Appointment">
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(145deg,#1a6be8,#0058BA)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(appt.patientName)}</div>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>{appt.patientName}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{prettyDate(appt.date)} · {to12h(appt.startTime)}–{to12h(appt.endTime)} · Chair {appt.chair}</div></div>
          <span className={'chip ' + m.cls} style={{ marginLeft: 'auto' }}>{m.label}</span>
        </div>
        {appt.reason && <div style={{ fontSize: 13, color: 'var(--slate)' }}><strong>Reason:</strong> {appt.reason}</div>}
        {appt.doctor && <div style={{ fontSize: 13, color: 'var(--slate)' }}><strong>Doctor:</strong> {appt.doctor}</div>}
        {next.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', marginBottom: 8 }}>Advance status</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {next.map((s) => (
                <button key={s} className="btn btn-primary" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => onAdvance(appt, s)}>
                  {s === 'completed' ? 'Complete & open visit' : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
