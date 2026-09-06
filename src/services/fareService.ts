/**
 * Servicio de Tarifas de Transporte Urbano Colectivo en Tunja
 * - Tarifa Diurna: $2.600 COP (Lunes a Sábado de 5:00 AM a 6:00 PM)
 * - Tarifa Nocturna, Domingos y Festivos: $2.700 COP (Después de las 6:00 PM, Domingos y Festivos oficiales de Colombia)
 */

// Lista de días festivos oficiales en Colombia (formato MM-DD o YYYY-MM-DD)
// Incluye festivos fijos y con traslado por Ley Emiliani para 2025, 2026 y 2027
const COLOMBIAN_HOLIDAYS_SET = new Set([
  // 2025
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-05-01',
  '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20', '2025-08-07', '2025-08-18',
  '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
  '2026-05-18', '2026-06-08', '2026-06-15', '2026-07-20', '2026-08-07', '2026-08-17',
  '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01',
  '2027-05-10', '2027-05-31', '2027-06-07', '2027-07-20', '2027-08-07', '2027-08-16',
  '2027-10-18', '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25',
]);

export interface BusFareInfo {
  fare: number;
  fareText: string;
  isFestiveOrNight: boolean;
  label: string;
  detail: string;
}

export function isColombianHoliday(date: Date = new Date()): boolean {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;
  return COLOMBIAN_HOLIDAYS_SET.has(dateKey);
}

export function getCurrentBusFare(date: Date = new Date()): BusFareInfo {
  const hours = date.getHours();
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
  const isSunday = dayOfWeek === 0;
  const isNight = hours >= 18 || hours < 5;
  const isHoliday = isColombianHoliday(date);

  const isFestiveOrNight = isSunday || isNight || isHoliday;
  const fare = isFestiveOrNight ? 2700 : 2600;
  const fareText = `$${fare.toLocaleString('es-CO')}`;

  let label = 'Tarifa Diurna';
  let detail = 'Lunes a Sábado (5:00 AM - 6:00 PM)';

  if (isHoliday) {
    label = 'Día Festivo';
    detail = 'Tarifa especial dominical / festivo';
  } else if (isSunday) {
    label = 'Domingo';
    detail = 'Tarifa dominical y festiva';
  } else if (isNight) {
    label = 'Tarifa Nocturna';
    detail = 'Aplica después de las 6:00 PM';
  }

  return {
    fare,
    fareText,
    isFestiveOrNight,
    label,
    detail,
  };
}
