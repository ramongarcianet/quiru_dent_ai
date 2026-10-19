export const QUIRU_LIVE_MODEL = import.meta.env.VITE_QUIRU_LIVE_MODEL
  || 'gemini-2.5-flash-native-audio-preview-12-2025'

export const QUIRU_TEXT_MODEL = import.meta.env.VITE_QUIRU_TEXT_MODEL || 'gemini-3.5-flash-lite'

export const QUIRU_LIVE_VOICE = import.meta.env.VITE_QUIRU_LIVE_VOICE || 'Sulafat'

const functionDeclarations = [
  {
    name: 'buscar_paciente',
    description: 'Busca pacientes activos del odontólogo autenticado por nombre, apellido o documento.',
    parameters: {
      type: 'object',
      properties: {
        consulta: {
          type: 'string',
          description: 'Nombre, apellido, nombre completo o documento indicado por el usuario.'
        }
      },
      required: ['consulta']
    }
  },
  {
    name: 'preparar_cita',
    description: 'Valida y prepara el resumen de una cita. No guarda nada. Debe llamarse antes de solicitar confirmación.',
    parameters: {
      type: 'object',
      properties: {
        pacienteId: { type: 'string', description: 'ID exacto obtenido mediante buscar_paciente.' },
        fecha: { type: 'string', description: 'Fecha absoluta en formato YYYY-MM-DD.' },
        horaInicio: { type: 'string', description: 'Hora de inicio de 24 horas en formato HH:mm.' },
        duracionMinutos: { type: 'integer', description: 'Duración confirmada por el usuario, entre 15 y 480 minutos.' },
        motivo: { type: 'string', description: 'Motivo breve de la cita.' },
        mensaje: { type: 'string', description: 'Mensaje opcional para el especialista.' }
      },
      required: ['pacienteId', 'fecha', 'horaInicio', 'duracionMinutos', 'motivo']
    }
  },
  {
    name: 'confirmar_cita',
    description: 'Guarda la cita preparada. Úsala solo después de que QUIRU haya resumido los datos y el usuario confirme explícitamente en un turno posterior.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'cancelar_cita',
    description: 'Cancela el borrador actual sin guardar información.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
]

export const QUIRU_APPOINTMENT_TOOLS = [{ functionDeclarations }]

function localIsoDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const value = type => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function buildQuiruAppointmentInstruction(timeZone) {
  const today = localIsoDate(new Date(), timeZone)
  return `Tu nombre es QUIRU. Eres el asistente virtual de QUIRU Dent AI para profesionales odontológicos.

Tu única tarea es registrar una cita. Habla en español claro, natural y muy breve. Usa una sola oración corta por respuesta, salvo el resumen final. Nunca uses Markdown, asteriscos, listas, títulos ni emojis. La fecha local actual es ${today} y la zona horaria es ${timeZone}.

Reglas obligatorias:
- Nunca inventes pacientes, fechas, horarios, duraciones ni resultados.
- Usa buscar_paciente antes de seleccionar un paciente. Si hay una coincidencia, continúa sin repetir datos innecesarios. Si hay varias, pregunta solo el dato necesario para distinguirlas; si no hay resultados, pide otro nombre o documento.
- No crees pacientes nuevos ni solicites información clínica.
- Convierte fechas relativas a una fecha absoluta YYYY-MM-DD. Si una expresión temporal es ambigua, pregunta y confirma la fecha concreta.
- Si falta la duración o la hora final, pregunta cuánto durará la cita. No asumas una duración.
- Cuando tengas paciente, fecha, hora, duración y motivo, llama una sola vez a preparar_cita.
- Después de preparar_cita, di únicamente: paciente, fecha, rango de hora y motivo; termina con “¿Confirmas?”. No menciones nombres de campos ni uses adornos.
- Solo si el usuario confirma explícitamente en un turno posterior, llama a confirmar_cita.
- Si cambia cualquier dato, vuelve a llamar a preparar_cita y solicita una nueva confirmación.
- Si el usuario rechaza el resumen, pregunta qué dato desea cambiar. Si cancela, llama a cancelar_cita.
- Nunca afirmes que una cita fue registrada antes de recibir success=true de confirmar_cita.
- Ejecuta como máximo una herramienta por turno.
- No expliques lo que estás haciendo ni anuncies que buscarás, validarás o prepararás datos.
- Si el usuario proporciona varios datos juntos, aprovéchalos y pregunta solo lo que falte.
- No proporciones diagnósticos ni recomendaciones clínicas.`
}
