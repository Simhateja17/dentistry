import { getAll, get, put, STORES, uid } from '../db/database.js';
import { emptyChart } from './odontogram.js';
import { updateAppointment } from './appointment.js';
import { createInvoice } from './invoice.js';

export async function listVisits() {
  return (await getAll(STORES.visits)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getVisit(id) {
  return get(STORES.visits, id);
}

export async function latestChartSnapshot(patientId) {
  const all = await getAll(STORES.chartSnapshots);
  const pats = all.filter((c) => c.patientId === patientId).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return pats[0]?.teeth || emptyChart();
}

export async function listChartSnapshots(patientId) {
  const all = await getAll(STORES.chartSnapshots);
  return all.filter((c) => c.patientId === patientId).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function saveVisit(data) {
  const id = data.id || uid('vis');
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  const chartSnapshotId = uid('chs');
  const snapshot = {
    id: chartSnapshotId,
    patientId: data.patientId,
    visitId: id,
    date: data.date || today,
    teeth: data.chart || emptyChart(),
    createdAt: now,
  };
  await put(STORES.chartSnapshots, snapshot);

  const visit = {
    id,
    appointmentId: data.appointmentId || null,
    patientId: data.patientId,
    patientName: data.patientName || '',
    date: data.date || today,
    chartSnapshotId,
    findings: data.findings || '',
    diagnosis: data.diagnosis || '',
    treatment: data.treatment || [],
    prescriptions: data.prescriptions || [],
    nextVisitNote: data.nextVisitNote || '',
    notes: data.notes || '',
    doctorMemberId: data.doctorMemberId || null,
    doctorName: data.doctorName || '',
    status: data.status || 'completed',
    createdAt: now,
  };
  await put(STORES.visits, visit);

  if (data.appointmentId) {
    await updateAppointment(data.appointmentId, { status: 'completed' });
  }

  // Auto-create draft invoice from treatment lines
  let invoice = null;
  if (data.treatment && data.treatment.length) {
    const lines = data.treatment
      .filter((t) => t.procedure && (t.cost || 0) > 0)
      .map((t) => ({
        description: t.procedure + (t.toothNum ? ` (Tooth ${t.toothNum})` : ''),
        hsn: t.hsn || (t.kind === 'exempt' ? '9973' : ''),
        gstRate: t.gstRate ?? 0,
        kind: t.kind || 'exempt',
        quantity: 1,
        unitPrice: t.cost,
      }));
    if (lines.length) {
      invoice = await createInvoice({
        patientId: data.patientId,
        visitId: id,
        lines,
        status: 'draft',
        createdBy: data.doctorName || '',
      });
    }
  }

  return { visit, invoice };
}
