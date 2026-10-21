const enabledValue = String(import.meta.env.VITE_CONVERSATIONAL_ODONTOGRAM_ENABLED ?? import.meta.env.DEV)
  .toLowerCase()

const allowedUsers = String(import.meta.env.VITE_CONVERSATIONAL_ODONTOGRAM_USERS || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

export const CONVERSATIONAL_ODONTOGRAM_CONFIG = Object.freeze({
  enabled: ['true', '1', 'yes'].includes(enabledValue),
  allowedUsers,
  safeMode: true,
  fastModeEnabled: false,
  maxSessionMinutes: Number(import.meta.env.VITE_QUIRU_AI_MAX_SESSION_MINUTES || 10),
  inactivitySeconds: Number(import.meta.env.VITE_QUIRU_AI_INACTIVITY_SECONDS || 90),
  maxRetries: Number(import.meta.env.VITE_QUIRU_AI_MAX_RETRIES || 2),
  maxContextTurns: Number(import.meta.env.VITE_QUIRU_AI_MAX_CONTEXT_TURNS || 12)
})

export function isConversationalOdontogramEnabled(userId) {
  if (!CONVERSATIONAL_ODONTOGRAM_CONFIG.enabled) return false
  return allowedUsers.length === 0 || allowedUsers.includes(userId)
}
