/**
 * Calcula a diferença em horas entre dois horários no formato HH:MM
 */
export function calculateHoursBetween(horaInicio: string, horaFim: string): number {
  const [startH, startM] = horaInicio.split(':').map(Number)
  const [endH, endM] = horaFim.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

/**
 * Extrai o identificador mês/ano de uma data (YYYY-MM)
 */
export function extractMonthKey(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Converte um identificador mês/ano para label legível
 */
export function monthKeyToLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
