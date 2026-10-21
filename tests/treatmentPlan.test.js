import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTreatmentAppointments, mergeFindingsIntoTreatmentPlan } from '../src/domain/clinical/treatmentPlan.js'

const findings = [
  { id: 'finding-1', tooth: 16, ntsCode: 'CD', description: 'Caries en dentina' },
  { id: 'finding-2', tooth: 26, ntsCode: 'CM', description: 'Corona metálica' },
  { id: 'finding-3', teeth: [36, 37], ntsCode: 'PF', description: 'Prótesis fija' }
]

test('adds every diagnosis missing from a previously saved treatment plan', () => {
  const plan = [{ sourceFindingId: 'finding-1', Pieza: '16', Diagnostico: 'CD · Caries en dentina', Tratamiento: [] }]

  const result = mergeFindingsIntoTreatmentPlan(plan, findings)

  assert.deepEqual(result.map(row => row.sourceFindingId), ['finding-1', 'finding-2', 'finding-3'])
  assert.equal(result[2].Pieza, '36, 37')
  assert.equal(result[2].Diagnostico, 'PF · Prótesis fija')
})

test('does not duplicate findings when synchronizing repeatedly', () => {
  const once = mergeFindingsIntoTreatmentPlan([], findings)
  const twice = mergeFindingsIntoTreatmentPlan(once, findings)

  assert.equal(twice.length, findings.length)
  assert.deepEqual(twice.map(row => row.sourceFindingId), findings.map(finding => finding.id))
})

test('preserves saved treatment details and matches legacy rows without source ids', () => {
  const savedTreatment = { Tratamiento: 'Obturación', Precio: 100, Acuenta: 25, Observacion: 'Control' }
  const plan = [
    { sourceFindingId: 'finding-1', Pieza: '16', Diagnostico: 'CD · Caries en dentina', Tratamiento: [savedTreatment] },
    { Pieza: '26', Diagnostico: 'CM · Corona metálica', Tratamiento: [{ Tratamiento: 'Corona', Precio: 300 }] },
    { isManual: true, Pieza: '48', Diagnostico: 'Extracción', Tratamiento: [] }
  ]

  const result = mergeFindingsIntoTreatmentPlan(plan, findings)

  assert.equal(result.length, 4)
  assert.equal(result[0].Tratamiento[0], savedTreatment)
  assert.equal(result[1].Pieza, '26')
  assert.equal(result[2].isManual, true)
  assert.equal(result[3].sourceFindingId, 'finding-3')
})

test('groups planned treatments by date and time into one 30-minute appointment', () => {
  const plan = [
    {
      Pieza: '16',
      Diagnostico: 'Caries',
      Tratamiento: [{ Tratamiento: 'Obturación', Fecha: '2026-10-22T10:30', Precio: 120, Acuenta: 20 }]
    },
    {
      Pieza: '26',
      Diagnostico: 'Corona',
      Tratamiento: [
        { Tratamiento: 'Corona provisional', Fecha: '2026-10-22T10:30', Precio: 80 },
        { Tratamiento: 'Control', Fecha: '2026-10-23T11:00', Precio: 0 }
      ]
    }
  ]

  const appointments = buildTreatmentAppointments(plan, 'patient-1', 'session-1')

  assert.equal(appointments.length, 2)
  assert.equal(appointments[0].id, 'ai-session-1-202610221030')
  assert.equal(appointments[0].idPaciente, 'patient-1')
  assert.equal(appointments[0].start, '2026-10-22T10:30:00.000Z')
  assert.equal(appointments[0].end, '2026-10-22T11:00:00.000Z')
  assert.equal(appointments[0].treatments.length, 2)
  assert.equal(appointments[0].treatments[0].Resto, 100)
  assert.equal(appointments[1].start, '2026-10-23T11:00:00.000Z')
})

test('does not create appointments for unscheduled treatments and rejects invalid dates', () => {
  assert.deepEqual(
    buildTreatmentAppointments([{ Tratamiento: [{ Tratamiento: 'Obturación', Fecha: '' }] }], 'patient-1', 'session-1'),
    []
  )
  assert.throws(
    () => buildTreatmentAppointments([{ Tratamiento: [{ Fecha: '2026-02-30T10:30' }] }], 'patient-1', 'session-1'),
    /fecha del plan no es válida/
  )
})
