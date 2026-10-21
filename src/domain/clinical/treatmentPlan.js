function findingPlanRow(finding) {
  const teeth = Array.isArray(finding.teeth) ? finding.teeth : [finding.tooth]
  return {
    Pieza: teeth.filter(Boolean).join(', '),
    Diagnostico: [finding.ntsCode, finding.description || finding.findingLabel].filter(Boolean).join(' · '),
    Atendido: false,
    sourceFindingId: finding.id || null,
    isManual: false,
    Tratamiento: []
  }
}

function matchesLegacyRow(finding, row) {
  if (row.isManual || row.sourceFindingId) return false
  const expected = findingPlanRow(finding)
  return row.Pieza === expected.Pieza && row.Diagnostico === expected.Diagnostico
}

export function mergeFindingsIntoTreatmentPlan(plan, findings) {
  const rows = [...plan]
  const representedIds = new Set(rows.map(row => row.sourceFindingId).filter(Boolean))
  const legacyRows = rows.filter(row => !row.sourceFindingId && !row.isManual)

  for (const finding of findings) {
    if (finding.id && representedIds.has(finding.id)) continue

    const legacyIndex = legacyRows.findIndex(row => matchesLegacyRow(finding, row))
    if (legacyIndex !== -1) {
      legacyRows.splice(legacyIndex, 1)
      if (finding.id) representedIds.add(finding.id)
      continue
    }

    const row = findingPlanRow(finding)
    rows.push(row)
    if (row.sourceFindingId) representedIds.add(row.sourceFindingId)
  }

  return rows
}

function parseScheduledDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value || ''))
  if (!match) throw new Error('Una fecha del plan no tiene un formato válido.')

  const [, yearText, monthText, dayText, hourText, minuteText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute))
  if (
    date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute
  ) {
    throw new Error('Una fecha del plan no es válida.')
  }
  return { year, month, day, hour, minute, timestamp: date.getTime() }
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function buildTreatmentAppointments(plan, patientId, sessionId, durationMinutes = 30) {
  if (!patientId || !sessionId) throw new Error('Falta identificar al paciente o al diagnóstico.')

  const groups = new Map()
  for (const row of plan) {
    for (const treatment of row.Tratamiento || []) {
      if (!treatment.Fecha) continue
      const scheduled = parseScheduledDate(treatment.Fecha)
      const key = `${treatment.Fecha.slice(0, 16)}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date: new Date(Date.UTC(scheduled.year, scheduled.month - 1, scheduled.day)),
          startTimestamp: scheduled.timestamp,
          treatments: []
        })
      }
      groups.get(key).treatments.push({
        Pieza: row.Pieza || '',
        Diagnostico: row.Diagnostico || '',
        Tratamiento: treatment.Tratamiento || '',
        Precio: Number(treatment.Precio || 0),
        Acuenta: Number(treatment.Acuenta || 0),
        Resto: Number(treatment.Precio || 0) - Number(treatment.Acuenta || 0)
      })
    }
  }

  return [...groups.values()].map(group => {
    const start = new Date(group.startTimestamp)
    const end = new Date(group.startTimestamp + durationMinutes * 60000)
    const startTime = formatTime(start.getUTCHours(), start.getUTCMinutes())
    const endTime = formatTime(end.getUTCHours(), end.getUTCMinutes())
    const dateLabel = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(group.date)
    const treatmentNames = [...new Set(group.treatments
      .map(item => item.Tratamiento || item.Diagnostico || 'Tratamiento planificado'))]

    return {
      id: `ai-${sessionId}-${group.key.replace(/[-:T]/g, '')}`,
      idPaciente: patientId,
      start: start.toISOString(),
      end: end.toISOString(),
      timeStart: startTime,
      timeEnd: endTime,
      title: treatmentNames.join(', '),
      borderColor: 'rgba(0, 102, 255, 0.18)',
      backgroundColor: '#eef3ff',
      textColor: '#071b40',
      timedisplay: `${dateLabel}     ${startTime} - ${endTime}`,
      fechaDeCreacion: new Date().toISOString().slice(0, 10),
      aiSessionId: sessionId,
      treatments: group.treatments
    }
  })
}
