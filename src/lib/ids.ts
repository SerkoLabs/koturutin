/** Id + timestamp helpers for the app runtime (kept out of the pure domain, which receives them). */
import { randomUUID } from 'expo-crypto';

export function newId(): string {
  return randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Minutes since local midnight (0–1439) for the on-device decision engine. */
export function localMinuteOfDay(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function localDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

export function todayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
