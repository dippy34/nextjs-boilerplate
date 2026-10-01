import { DAY, J2000_JD } from './units';

/**
 * Time scales. The simulation clock runs in TDB (the ephemeris time scale of
 * JPL DE kernels) expressed as a Julian Date. UTC is derived using the leap
 * second table from NAIF naif0012.tls (shipped in system.json).
 *
 * TDB - TT is a periodic term of at most ~1.7 ms and is neglected.
 */
const TT_MINUS_TAI = 32.184;

/** [year, month, day, TAI-UTC seconds] — filled from data on startup. */
let LEAPS: [number, number, number, number][] = [[1972, 1, 1, 10]];
let LEAP_JDS: number[] = [];

export function setLeapSeconds(table: [number, number, number, number][]): void {
  LEAPS = table.slice().sort((a, b) => calendarToJd(a[0], a[1], a[2]) - calendarToJd(b[0], b[1], b[2]));
  LEAP_JDS = LEAPS.map(([y, m, d]) => calendarToJd(y, m, d));
}

/** TAI - UTC at a UTC Julian date (before 1972 the 1972 offset is used; UTC was not leap-second based then). */
export function deltaAT(jdUtc: number): number {
  let v = LEAPS[0][3];
  for (let i = 0; i < LEAP_JDS.length; i++) if (jdUtc >= LEAP_JDS[i]) v = LEAPS[i][3];
  return v;
}

export function utcToTdb(jdUtc: number): number {
  return jdUtc + (deltaAT(jdUtc) + TT_MINUS_TAI) / DAY;
}

export function tdbToUtc(jdTdb: number): number {
  let utc = jdTdb - (37 + TT_MINUS_TAI) / DAY;
  for (let i = 0; i < 2; i++) utc = jdTdb - (deltaAT(utc) + TT_MINUS_TAI) / DAY;
  return utc;
}

/** Proleptic Gregorian calendar date (day may be fractional) -> Julian Date. Valid for all years. */
export function calendarToJd(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = Math.floor(day) + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  return jdn - 0.5 + (day - Math.floor(day));
}

export interface CalendarDate {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
}

export function jdToCalendar(jd: number): CalendarDate {
  const z = Math.floor(jd + 0.5);
  const frac = jd + 0.5 - z;
  const a = z + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  let secs = frac * DAY;
  const hour = Math.floor(secs / 3600); secs -= hour * 3600;
  const minute = Math.floor(secs / 60); secs -= minute * 60;
  return { year, month, day, hour, minute, second: secs };
}

export function dateToJdUtc(d: Date): number {
  return d.getTime() / 86_400_000 + 2_440_587.5;
}

export function formatUtc(jdTdb: number): string {
  const c = jdToCalendar(tdbToUtc(jdTdb));
  const p = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');
  const yr = c.year < 0 ? `-${p(-c.year, 4)}` : p(c.year, 4);
  return `${yr}-${p(c.month)}-${p(c.day)} ${p(c.hour)}:${p(c.minute)}:${p(c.second)} UTC`;
}

/** Julian centuries and days since J2000 (TDB). */
export const centuriesSinceJ2000 = (jd: number) => (jd - J2000_JD) / 36525;
export const daysSinceJ2000 = (jd: number) => jd - J2000_JD;

/**
 * Simulation clock. `rate` is simulated seconds per real second; negative runs
 * time backwards. Stored as TDB Julian Date in a double (~20 µs resolution today).
 */
export class SimClock {
  jdTdb: number;
  rate = 1;
  paused = false;

  constructor(jdTdb: number) {
    this.jdTdb = jdTdb;
  }

  static now(): SimClock {
    return new SimClock(utcToTdb(dateToJdUtc(new Date())));
  }

  advance(realDtSeconds: number): void {
    if (!this.paused) this.jdTdb += (realDtSeconds * this.rate) / DAY;
  }

  setUtcNow(): void {
    this.jdTdb = utcToTdb(dateToJdUtc(new Date()));
  }
}
