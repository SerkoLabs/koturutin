/** In-memory Store for tests and previews (no persistence across process restarts). */
import type { AppData } from '@/domain/model';
import type { Store } from './store';

export class MemoryStore implements Store {
  private data: AppData | null;

  constructor(initial: AppData | null = null) {
    this.data = initial ? structuredClone(initial) : null;
  }

  async load(): Promise<AppData | null> {
    return this.data ? structuredClone(this.data) : null;
  }

  async save(data: AppData): Promise<void> {
    this.data = structuredClone(data);
  }

  async clear(): Promise<void> {
    this.data = null;
  }
}
