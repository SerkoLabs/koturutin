/**
 * Persistence port (spine §10, ADR-004 local-first). The app keeps the single AppData document on
 * the device; a Store implementation loads/saves it. This indirection keeps the domain pure and
 * lets tests run against an in-memory store while the app uses on-device storage.
 *
 * When Supabase auth + sync are wired (needs founder credentials), a SyncingStore will wrap the
 * local store and mirror sync-eligible fields to Postgres under RLS — raw free notes stay local
 * unless consentFreeTextToModel is true (spine §21 R3). See src/data/supabase/.
 */
import type { AppData } from '@/domain/model';

export interface Store {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}
