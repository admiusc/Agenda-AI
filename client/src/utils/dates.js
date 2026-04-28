export const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS_FULL[date.getDay()]} ${d} de ${MONTHS[m - 1].toLowerCase()}`;
}

export function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS_SHORT[m - 1]}`;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}
