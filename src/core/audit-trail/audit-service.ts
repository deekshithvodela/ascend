import { AuditLogEntry } from '../types/audit';

export class AuditService {
  private static logs: AuditLogEntry[] = [];

  /**
   * Appends an audit record.
   * Append-only by design. Records cannot be deleted or mutated.
   */
  public static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(Object.freeze({ ...fullEntry }));
    return fullEntry;
  }

  /**
   * Retrieves audit logs for an event, optionally filtered by entity.
   */
  public static getLogs(
    eventId: string,
    filters?: { entityType?: string; entityId?: string }
  ): AuditLogEntry[] {
    return this.logs.filter((log) => {
      if (log.eventId !== eventId) return false;
      if (filters?.entityType && log.entityType !== filters.entityType) return false;
      if (filters?.entityId && log.entityId !== filters.entityId) return false;
      return true;
    });
  }

  /**
   * Clears in-memory logs (for testing purposes only).
   */
  public static clearForTesting(): void {
    this.logs = [];
  }
}

