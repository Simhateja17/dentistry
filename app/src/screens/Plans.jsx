import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { listPlans, createPlan, updatePlan, setPlanStatus, setStageStatus, deletePlan, recordPayment, planPaid, planBalance, STATUS_META, stageMeta, PLAN_STATUSES, STAGE_STATUSES } from '../lib/plan.js';
import { listPatients } from '../lib/patient.js';
import { money } from '../lib/invoice.js';
import { FDI_TEETH } from '../lib/odontogram.js';
import { Icons } from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';

export default function Plans({ focusPatient }) {
  const { session, settings, toast } = useApp();
  const [plans, setPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [editing, setEditing] = useState(null); // plan id or 'new'

  const refresh = async () => {
    setPlans(await listPlans());
    setPatients(await listPatients());
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Treatment Plans</h1>
          <div className="sub">Multi-stage treatment quotes with staged billing.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icons.plus size={16} /> New plan</button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi kpi-blue"><div className="label">Active plans</div><div className="value">{plans.filter((p) => ['approved', 'deposit', 'inprogress'].includes(p.status)).length}</div></div>
        <div className="kpi kpi-amber"><div className="label">Drafts</div><div className="value">{plans.filter((p) => p.status === 'draft').length}</div></div>
        <div className="kpi kpi-green"><div className="label">Total value</div><div className="value">{money(plans.filter((p) => p.status !== 'cancelled').reduce((s, p) => s + p.total, 0))}</div></div>
        <div className="kpi kpi-blue"><div className="label">Deposits</div><div className="value">{money(plans.reduce((s, p) => s + (p.deposit || 0), 0))}</div></div>
      </div>

      {plans.length === 0 ? (
        <div className="card pad empty"><div className="ic"><Icons.plans size={40} /></div>No treatment plans yet. Create a multi-stage plan for procedures like RCT, braces, or implants.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {plans.map((p) => {
            const st = STATUS_META[p.status] || STATUS_META.draft;
            const doneStages = p.stages.filter((s) => s.status === 'done').length;
            return (
              <button key={p.id} className="card" style={{ padding: '16px 18px', textAlign: 'left' }} onClick={() => setEditing(p.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-mono)' }}>TP-{p.id.slice(-4).toUpperCase()}</span>
                    <span style={{ marginLeft: 10, fontWeight: 600, fontSize: 14 }}>{p.patientName}</span>
                    {p.title && <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>· {p.title}</span>}
                  </div>
                  <span className={'chip ' + st.cls}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--muted)', alignItems: 'center' }}>
                  <span>{p.stages.length} stages · {doneStages} done</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{money(p.total)}</span>
                  {p.deposit > 0 && <span className="chip chip-blue">Deposit {money(p.deposit)}</span>}
                  <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--line-2)', maxWidth: 200 }}>
                    <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#1a6be8,#0058BA)', width: p.stages.length ? (doneStages / p.stages.length * 100) + '%' : '0%' }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PlanEditor open={!!editing} planId={editing === 'new' ? null : editing} patients={patients} focusPatient={focusPatient} onClose={() => setEditing(null)} onChanged={refresh} toast={toast} session={session} settings={settings} />
    </div>
  );
}

function PlanEditor({ open, planId, patients, focusPatient, onClose, onChanged, toast, session, settings }) {
  const [plan, setPlan] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPayOpen(false); setPayAmount(''); setPayMode(settings?.billing?.paymentModes?.[0] || 'UPI');
    if (planId) {
      listPlans().then((all) => setPlan(all.find((p) => p.id === planId)));
    } else {
      setPlan({
        id: null,
        patientId: focusPatient?.id || '',
        patientName: focusPatient?.name || '',
        title: '',
        stages: [{ id: 's1', seq: 1, procedure: '', teeth: '', cost: 0, materials: '', status: 'pending' }],
        status: 'draft',
        deposit: 0,
        payments: [],
        notes: '',
      });
    }
  }, [open, planId]);

  if (!plan) return <Modal open={open} onClose={onClose} title="Treatment plan"><div>Loading…</div></Modal>;

  const setField = (k, v) => setPlan((p) => ({ ...p, [k]: v }));
  const setStage = (i, patch) => setPlan((p) => ({ ...p, stages: p.stages.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const addStage = () => setPlan((p) => ({ ...p, stages: [...p.stages, { id: 's' + (p.stages.length + 1), seq: p.stages.length + 1, procedure: '', teeth: '', cost: 0, materials: '', status: 'pending' }] }));
  const delStage = (i) => setPlan((p) => ({ ...p, stages: p.stages.filter((_, idx) => idx !== i) }));

  const total = plan.stages.reduce((s, st) => s + (st.cost || 0), 0);
  const chosen = patients.find((p) => p.id === plan.patientId);

  const save = async () => {
    if (!plan.patientId) { toast('Select a patient'); return; }
    if (plan.stages.length === 0) { toast('Add at least one stage'); return; }
    if (plan.id) await updatePlan(plan.id, plan);
    else await createPlan(plan);
    toast('Plan saved');
    onChanged(); onClose();
  };

  const advance = async (status) => {
    if (!plan.id) return;
    await setPlanStatus(plan.id, status);
    toast(`Marked ${STATUS_META[status].label}`);
    onChanged();
    const all = await listPlans();
    setPlan(all.find((p) => p.id === plan.id));
  };

  const stageAdvance = async (stageId, status) => {
    await setStageStatus(plan.id, stageId, status);
    onChanged();
    const all = await listPlans();
    setPlan(all.find((p) => p.id === plan.id));
  };

  const paid = planPaid(plan);
  const balance = Math.max(0, total - paid);
  const payments = plan.payments || [];

  const openPay = () => { setPayAmount(String(balance || total)); setPayOpen(true); };
  const collectPayment = async () => {
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) { toast('Enter a valid amount'); return; }
    if (!plan.id) { toast('Save the plan first'); return; }
    setBusy(true);
    try {
      const { invoice } = await recordPayment(plan.id, { amount: amt, mode: payMode, createdBy: session?.name });
      toast(`Payment received · receipt ${invoice.number}`);
      setPayOpen(false); setPayAmount('');
      onChanged();
      const all = await listPlans();
      setPlan(all.find((p) => p.id === plan.id));
    } catch (e) { toast(e.message); }
    setBusy(false);
  };

  const del = async () => {
    if (!plan.id) return;
    if (!confirm('Delete this treatment plan?')) return;
    await deletePlan(plan.id);
    toast('Plan deleted');
    onChanged(); onClose();
  };

  const readOnly = plan.status === 'completed' || plan.status === 'cancelled';

  return (
    <Modal open={open} onClose={onClose} title={plan.id ? `Plan TP-${plan.id.slice(-4).toUpperCase()}` : 'New treatment plan'} wide>
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="field-row cols-2">
          <div>
            <label className="field-label">Patient</label>
            <select className="field" value={plan.patientId} disabled={!!plan.id} onChange={(e) => { const p = patients.find((x) => x.id === e.target.value); setField('patientId', e.target.value); setField('patientName', p?.name || ''); }}>
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.mrn}</option>)}
            </select>
          </div>
          <div><label className="field-label">Plan title (optional)</label><input className="field" value={plan.title} disabled={readOnly} onChange={(e) => setField('title', e.target.value)} placeholder="RCT, Ortho treatment…" /></div>
        </div>

        {chosen?.allergies?.length > 0 && <div style={{ background: 'var(--red-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>⚠ Allergies: {chosen.allergies.join(', ')}</div>}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="section-title" style={{ fontSize: 13.5 }}>Stages</div>
            {!readOnly && <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={addStage}><Icons.plus size={14} /> Add stage</button>}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {plan.stages.map((s, i) => (
              <div key={i} className="card pad" style={{ padding: 12, display: 'grid', gap: 8 }}>
                <div className="field-row cols-3">
                  <div><label className="field-label">Procedure</label><input className="field" style={{ fontSize: 12 }} value={s.procedure} disabled={readOnly} onChange={(e) => setStage(i, { procedure: e.target.value })} placeholder="Root canal" /></div>
                  <div><label className="field-label">Tooth/teeth</label><input className="field" style={{ fontSize: 12 }} value={s.teeth} disabled={readOnly} onChange={(e) => setStage(i, { teeth: e.target.value })} placeholder="16, 17" /></div>
                  <div><label className="field-label">Cost (₹)</label><input type="number" className="field" style={{ fontSize: 12 }} value={s.cost} disabled={readOnly} onChange={(e) => setStage(i, { cost: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input className="field" style={{ fontSize: 12, flex: 1, marginRight: 8 }} value={s.materials} disabled={readOnly} onChange={(e) => setStage(i, { materials: e.target.value })} placeholder="Materials" />
                  <span className={'chip ' + stageMeta(s.status).cls}>{stageMeta(s.status).label}</span>
                  {!readOnly && plan.id && s.status === 'pending' && <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px', marginLeft: 6 }} onClick={() => stageAdvance(s.id, 'inprogress')}>Start</button>}
                  {!readOnly && plan.id && s.status === 'inprogress' && <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 8px', marginLeft: 6 }} onClick={() => stageAdvance(s.id, 'done')}>Mark done</button>}
                  {!readOnly && !plan.id && <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px', marginLeft: 6 }} onClick={() => delStage(i)}>×</button>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 800, fontSize: 14 }}>Total: {money(total)}</div>
        </div>

        {plan.id ? (
          <div className="card pad" style={{ padding: 14 }}>
            <div className="section-title" style={{ fontSize: 13, marginBottom: 12 }}>Billing &amp; payments</div>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 12 }}>
              <Stat label="Plan total" val={money(total)} />
              <Stat label="Collected" val={money(paid)} tone="green" />
              <Stat label="Balance due" val={money(balance)} tone={balance > 0 ? 'amber' : 'green'} />
            </div>
            <div style={{ height: 8, borderRadius: 5, background: 'var(--line-2)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: (total ? Math.min(100, paid / total * 100) : 0) + '%', background: 'linear-gradient(90deg,#0c7a52,#16a34a)', transition: 'width .4s var(--ease)' }} />
            </div>

            {payments.length > 0 && (
              <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                {payments.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, padding: '8px 11px', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <span className="chip chip-green" style={{ padding: '2px 8px' }}>{i === 0 ? 'Deposit' : 'Installment ' + i}</span>
                    <span style={{ flex: 1, color: 'var(--muted)' }}>{p.number ? p.number + ' · ' : ''}{p.date} · {p.mode || '—'}</span>
                    <span style={{ fontWeight: 700 }}>{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {balance > 0 && plan.status !== 'cancelled' ? (
              payOpen ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', background: 'var(--blue-bg)', padding: 12, borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label className="field-label" style={{ fontSize: 11.5 }}>Amount (₹)</label>
                    <input type="number" className="field" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} autoFocus />
                  </div>
                  <div style={{ minWidth: 110 }}>
                    <label className="field-label" style={{ fontSize: 11.5 }}>Payment mode</label>
                    <select className="field" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                      {(settings?.billing?.paymentModes || ['UPI', 'Cash', 'Card']).map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={collectPayment} disabled={busy}><Icons.check size={15} /> Record payment</button>
                  <button className="btn btn-ghost" onClick={() => setPayOpen(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={openPay}><Icons.billing size={15} /> Collect payment · {money(balance)} due</button>
              )
            ) : (
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.check size={15} /> Fully collected</div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--line-2)', padding: '10px 12px', borderRadius: 8 }}>Save the plan first — then you can collect the deposit and installment payments here, each generating a receipt.</div>
        )}

        <div><label className="field-label">Notes</label><textarea className="field" rows={2} value={plan.notes} disabled={readOnly} onChange={(e) => setField('notes', e.target.value)} /></div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 14, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {plan.id && <button className="btn btn-danger" onClick={del}>Delete</button>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {plan.id && !readOnly && <button className="btn btn-ghost" onClick={save}>Save changes</button>}
            {plan.id && plan.status === 'draft' && <button className="btn btn-ghost" onClick={() => advance('approved')}>Approve</button>}
            {plan.id && (plan.status === 'approved' || plan.status === 'deposit' || plan.status === 'inprogress') && <button className="btn btn-ghost" onClick={() => advance('completed')}>Mark complete</button>}
            {plan.id && plan.status !== 'cancelled' && plan.status !== 'completed' && <button className="btn btn-ghost" onClick={() => advance('cancelled')}>Cancel plan</button>}
            {!plan.id && <button className="btn btn-primary" onClick={save}><Icons.check size={16} /> Save plan</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, val, tone }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div className={tone ? 'tone-' + tone : ''} style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: 2 }}>{val}</div>
    </div>
  );
}
