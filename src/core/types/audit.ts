export interface AuditLogEntry {
  id: string;
  eventId: string;
  entityType: 'athlete' | 'attempt' | 'weigh_in' | 'rules' | 'judging' | 'event' | 'equipment';
  entityId: string;
  action: string;
  previousValue: any;
  updatedValue: any;
  actorId: string;
  actorRole: string;
  reason?: string;
  timestamp: string;
}

