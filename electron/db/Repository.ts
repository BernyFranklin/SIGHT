import type { DatabaseManager } from './DatabaseManager';

export abstract class Repository {
  constructor(protected readonly db: DatabaseManager) {}
}
