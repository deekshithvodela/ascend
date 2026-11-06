import { CompetitionEvent, CompetitionRules } from '../../core/types/competition';
import { Athlete } from '../../core/types/athlete';
import { Attempt, RefereeRole, RefereeDecision, LiftType, RefereeVote } from '../../core/types/attempt';
import { CompetitionResults } from '../../core/types/ranking';
import { AuditLogEntry } from '../../core/types/audit';
import { TransactionalStore } from '../../server/store';
import { CategoryRanker } from '../../core/ranking-engine/category-ranker';
import { OpenRanker } from '../../core/ranking-engine/open-ranker';
import { IndividualLiftsRanker } from '../../core/ranking-engine/individual-lifts';
import { TeamScoringEngine } from '../../core/ranking-engine/team-scoring';
import { JudgingEngine } from '../../core/judging-engine/referee-consensus';
import { WeighInManager } from '../../core/weigh-in/weigh-in-manager';
import { DeadlineTracker } from '../../core/attempt-scheduler/deadline-tracker';
import { RulesDependencyValidator } from '../../core/rules-engine/validator';
import { RuleSnapshotManager } from '../../core/rules-engine/versioning';
import { AuditService } from '../../core/audit-trail/audit-service';
import { supabase } from '../../core/services/supabase';

const STORAGE_KEY = 'ascend_powerlifting_data_v1';

// ----------------------------------------------------
// Supabase <-> Domain Data Mappers
// ----------------------------------------------------
function eventFromSupabase(row: any): CompetitionEvent {
  return {
    id: row.id,
    name: row.name,
    date: typeof row.date === 'string' ? row.date.split('T')[0] : row.date,
    venue: row.venue,
    organizer: row.organizer,
    chiefRefereeName: row.chief_referee_name || undefined,
    status: row.status,
    isPublished: Boolean(row.is_published),
    publishedAt: row.published_at || undefined,
    rulesSnapshot: row.rules_snapshot,
    customModifications: row.custom_modifications || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    finalizedAt: row.finalized_at || undefined,
    finalizedBy: row.finalized_by || undefined,
  };
}

function eventToSupabase(event: CompetitionEvent): any {
  return {
    id: event.id,
    name: event.name,
    date: event.date,
    venue: event.venue,
    organizer: event.organizer,
    chief_referee_name: event.chiefRefereeName || null,
    status: event.status,
    is_published: event.isPublished ?? (event.status === 'published' || event.status === 'live'),
    published_at: event.publishedAt || (event.isPublished ? new Date().toISOString() : null),
    rules_snapshot: event.rulesSnapshot,
    custom_modifications: event.customModifications || {},
    updated_at: new Date().toISOString(),
  };
}

function athleteFromSupabase(row: any): Athlete {
  return {
    id: row.id,
    eventId: row.event_id,
    lotNumber: row.lot_number,
    registrationNumber: row.registration_number,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date || undefined,
    sex: row.sex,
    ageCategory: row.age_category,
    equipmentDivision: row.equipment_division,
    teamOrAffiliation: row.team_or_affiliation || undefined,
    declaredWeightCategory: row.declared_weight_category,
    verifiedWeightCategory: row.verified_weight_category || undefined,
    officialBodyweightKg: row.official_bodyweight_kg != null ? parseFloat(row.official_bodyweight_kg) : undefined,
    weighInRecords: [],
    weighInStatus: row.weigh_in_status || 'pending',
    rackHeights: {
      squatRackHeight: row.squat_rack_height != null ? row.squat_rack_height : undefined,
      benchRackHeight: row.bench_rack_height != null ? row.bench_rack_height : undefined,
      squatSafetyPin: row.squat_safety_pin != null ? row.squat_safety_pin : undefined,
      benchSafetyPin: row.bench_safety_pin != null ? row.bench_safety_pin : undefined,
    },
    lifterStatus: row.lifter_status || 'active',
    statusReason: row.status_reason || undefined,
    flight: row.flight || 'Flight A',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function athleteToSupabase(athlete: Athlete): any {
  return {
    id: athlete.id,
    event_id: athlete.eventId,
    lot_number: athlete.lotNumber,
    registration_number: athlete.registrationNumber,
    first_name: athlete.firstName,
    last_name: athlete.lastName,
    birth_date: athlete.birthDate || null,
    sex: athlete.sex,
    age_category: athlete.ageCategory,
    equipment_division: athlete.equipmentDivision,
    team_or_affiliation: athlete.teamOrAffiliation || null,
    declared_weight_category: athlete.declaredWeightCategory,
    verified_weight_category: athlete.verifiedWeightCategory || null,
    official_bodyweight_kg: athlete.officialBodyweightKg ?? null,
    weigh_in_status: athlete.weighInStatus || 'pending',
    squat_rack_height: athlete.rackHeights?.squatRackHeight ?? null,
    bench_rack_height: athlete.rackHeights?.benchRackHeight ?? null,
    squat_safety_pin: athlete.rackHeights?.squatSafetyPin ?? null,
    bench_safety_pin: athlete.rackHeights?.benchSafetyPin ?? null,
    lifter_status: athlete.lifterStatus || 'active',
    status_reason: athlete.statusReason || null,
    flight: athlete.flight || 'Flight A',
    updated_at: new Date().toISOString(),
  };
}

function attemptFromSupabase(row: any, votes: any[] = []): Attempt {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    liftType: row.lift_type,
    attemptNumber: row.attempt_number,
    weightKg: parseFloat(row.weight_kg),
    status: row.status || 'pending',
    refereeVotes: (votes || []).map((v) => ({
      refereeId: v.referee_id,
      refereeName: v.referee_name || `${v.referee_role?.toUpperCase()} Referee`,
      refereeRole: v.referee_role,
      decision: v.decision,
      infractionReasonCodes: v.infraction_reason_codes || [],
      timestamp: v.created_at,
    })),
    majorityDecision: row.majority_decision || undefined,
    isJuryOverride: Boolean(row.is_jury_override),
    juryOverrideBy: row.jury_override_by || undefined,
    juryOverrideReason: row.jury_override_reason || undefined,
    declaredAt: row.declared_at,
    declarationChangeCount: row.declaration_change_count || 0,
    timestamp: row.updated_at,
  };
}

function attemptToSupabase(attempt: Attempt, eventId: string): any {
  return {
    id: attempt.id,
    athlete_id: attempt.athleteId,
    event_id: eventId,
    lift_type: attempt.liftType,
    attempt_number: attempt.attemptNumber,
    weight_kg: attempt.weightKg,
    status: attempt.status,
    majority_decision: attempt.majorityDecision || null,
    is_jury_override: Boolean(attempt.isJuryOverride),
    jury_override_by: attempt.juryOverrideBy || null,
    jury_override_reason: attempt.juryOverrideReason || null,
    declared_at: attempt.declaredAt || new Date().toISOString(),
    declaration_change_count: attempt.declarationChangeCount || 0,
    updated_at: new Date().toISOString(),
  };
}

export class DataClient {
  private static isStaticMode: boolean | null = null;

  /**
   * Probes whether the backend /api is reachable and returns JSON.
   */
  private static async checkBackend(): Promise<boolean> {
    if (this.isStaticMode !== null) return !this.isStaticMode;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('/api/events', { signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        this.isStaticMode = false;
        return true;
      }
    } catch {
      // Backend not available (static host such as GitHub Pages)
    }

    this.isStaticMode = true;
    this.restoreFromStorage();
    return false;
  }

  public static getStaticMode(): boolean {
    return this.isStaticMode ?? true;
  }

  // ----------------------------------------------------
  // LocalStorage Persistence Helpers for Static Mode
  // ----------------------------------------------------
  private static saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        events: TransactionalStore.getEvents(),
        athletes: TransactionalStore.getEvents().reduce((acc, e) => {
          acc[e.id] = TransactionalStore.getAthletes(e.id);
          return acc;
        }, {} as Record<string, Athlete[]>),
        attempts: TransactionalStore.getEvents().reduce((acc, e) => {
          acc[e.id] = TransactionalStore.getAttempts(e.id);
          return acc;
        }, {} as Record<string, Attempt[]>),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }
  }

  private static restoreFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.events && Array.isArray(parsed.events)) {
        parsed.events.forEach((ev: CompetitionEvent) => {
          TransactionalStore.saveEvent(ev);
          if (parsed.athletes?.[ev.id]) {
            TransactionalStore.saveAthletes(ev.id, parsed.athletes[ev.id]);
          }
          if (parsed.attempts?.[ev.id]) {
            TransactionalStore.saveAttempts(ev.id, parsed.attempts[ev.id]);
          }
        });
      }
    } catch (e) {
      console.warn('Could not restore from localStorage:', e);
    }
  }

  // ----------------------------------------------------
  // 1. Events API
  // ----------------------------------------------------
  public static async getEvents(): Promise<CompetitionEvent[]> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch('/api/events');
        if (res.ok) return await res.json();
      } catch {
        this.isStaticMode = true;
      }
    }

    // Try fetching live/all events from Supabase
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach((row) => {
          const ev = eventFromSupabase(row);
          TransactionalStore.saveEvent(ev);
        });
        this.saveToStorage();
      } else if (!error && Array.isArray(data) && data.length === 0) {
        // If Supabase is totally empty, seed initial events asynchronously
        const initialEvents = TransactionalStore.getEvents();
        for (const ev of initialEvents) {
          await supabase.from('events').upsert(eventToSupabase(ev));
        }
      }
    } catch (err) {
      console.warn('Supabase getEvents fallback to local store:', err);
    }

    return TransactionalStore.getEvents();
  }

  public static async getPublishedEvents(): Promise<CompetitionEvent[]> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const all: CompetitionEvent[] = await res.json();
          return all.filter(
            (e) => e.isPublished || e.status === 'published' || e.status === 'live' || e.status === 'completed'
          );
        }
      } catch {
        this.isStaticMode = true;
      }
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or('is_published.eq.true,status.in.(published,live,completed)')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const events = data.map(eventFromSupabase);
        events.forEach((ev) => TransactionalStore.saveEvent(ev));
        this.saveToStorage();
        return events;
      }
    } catch (err) {
      console.warn('Supabase getPublishedEvents fallback:', err);
    }

    return TransactionalStore.getPublishedEvents();
  }

  public static async getEvent(eventId: string): Promise<CompetitionEvent | undefined> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          return data.event || data;
        }
      } catch {
        this.isStaticMode = true;
      }
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (!error && data) {
        const ev = eventFromSupabase(data);
        TransactionalStore.saveEvent(ev);
        this.saveToStorage();
        return ev;
      }
    } catch (err) {
      console.warn('Supabase getEvent fallback:', err);
    }

    return TransactionalStore.getEvent(eventId);
  }

  public static async publishEvent(eventId: string): Promise<CompetitionEvent> {
    const event = TransactionalStore.publishEvent(eventId);
    if (!event) throw new Error('Event not found');

    AuditService.log({
      eventId,
      entityType: 'event',
      entityId: eventId,
      action: 'EVENT_PUBLISHED',
      previousValue: 'draft',
      updatedValue: event.status,
      actorId: 'meet_director',
      actorRole: 'organizer',
      reason: 'Competition published to public homepage',
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('events')
        .update({
          is_published: true,
          published_at: event.publishedAt || new Date().toISOString(),
          status: event.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch (err) {
      console.warn('Supabase publishEvent sync error:', err);
    }

    return event;
  }

  public static async unpublishEvent(eventId: string): Promise<CompetitionEvent> {
    const event = TransactionalStore.unpublishEvent(eventId);
    if (!event) throw new Error('Event not found');

    AuditService.log({
      eventId,
      entityType: 'event',
      entityId: eventId,
      action: 'EVENT_UNPUBLISHED',
      previousValue: 'published',
      updatedValue: 'unpublished',
      actorId: 'meet_director',
      actorRole: 'organizer',
      reason: 'Competition hidden from public homepage',
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('events')
        .update({
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch (err) {
      console.warn('Supabase unpublishEvent sync error:', err);
    }

    return event;
  }

  public static async updateEventStatus(
    eventId: string,
    status: import('../../core/types/competition').EventStatus
  ): Promise<CompetitionEvent> {
    const event = TransactionalStore.updateEventStatus(eventId, status);
    if (!event) throw new Error('Event not found');

    AuditService.log({
      eventId,
      entityType: 'event',
      entityId: eventId,
      action: 'EVENT_STATUS_UPDATED',
      previousValue: null,
      updatedValue: status,
      actorId: 'meet_director',
      actorRole: 'organizer',
      reason: `Competition status updated to ${status}`,
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('events')
        .update({
          status,
          is_published: event.isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch (err) {
      console.warn('Supabase updateEventStatus sync error:', err);
    }

    return event;
  }

  public static async createEvent(data: Partial<CompetitionEvent>): Promise<CompetitionEvent> {
    const newId = `evt-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newEvent: CompetitionEvent = {
      id: newId,
      name: data.name || 'New Powerlifting Competition',
      date: data.date || new Date().toISOString().split('T')[0],
      venue: data.venue || 'Platform 1',
      organizer: data.organizer || 'Ascend Organizer',
      status: 'draft',
      isPublished: false,
      rulesSnapshot: data.rulesSnapshot || TransactionalStore.getEvents()[0].rulesSnapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    TransactionalStore.saveEvent(newEvent);
    AuditService.log({
      eventId: newEvent.id,
      entityType: 'event',
      entityId: newEvent.id,
      action: 'EVENT_CREATED',
      previousValue: null,
      updatedValue: newEvent,
      actorId: 'meet_director',
      actorRole: 'organizer',
      reason: 'Created new competition event in draft mode',
    });

    this.saveToStorage();

    // Persist to Supabase
    try {
      const payload = eventToSupabase(newEvent);
      const { error } = await supabase.from('events').insert(payload);
      if (error) {
        console.warn('Supabase createEvent error:', error);
      }
    } catch (err) {
      console.warn('Supabase createEvent sync error:', err);
    }

    return newEvent;
  }

  public static async updateRules(
    eventId: string,
    updatedRules: CompetitionRules
  ): Promise<CompetitionEvent> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      const res = await fetch(`/api/events/${eventId}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRules),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errors?.join(', ') || err.error);
      }
      const data = await res.json();
      return data.event;
    }

    // Static In-Browser
    const event = TransactionalStore.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    RuleSnapshotManager.assertCanModifyRules(event);
    const validation = RulesDependencyValidator.validate(updatedRules);
    if (!validation.isValid) {
      throw new Error(`Rules validation failed: ${validation.errors.join(', ')}`);
    }

    const prevRules = event.rulesSnapshot;
    event.rulesSnapshot = updatedRules;
    event.updatedAt = new Date().toISOString();
    TransactionalStore.saveEvent(event);

    AuditService.log({
      eventId: event.id,
      entityType: 'rules',
      entityId: event.id,
      action: 'RULES_UPDATED',
      previousValue: prevRules,
      updatedValue: updatedRules,
      actorId: 'meet_director',
      actorRole: 'organizer',
      reason: 'Competition rules adjusted in client dashboard',
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('events')
        .update({
          rules_snapshot: updatedRules,
          updated_at: event.updatedAt,
        })
        .eq('id', event.id);
    } catch (err) {
      console.warn('Supabase updateRules sync error:', err);
    }

    return event;
  }

  public static async finalizeEvent(
    eventId: string,
    finalizedBy: string = 'Authorized Technical Controller'
  ): Promise<CompetitionEvent> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      const res = await fetch(`/api/events/${eventId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalizedBy }),
      });
      return await res.json();
    }

    // Static In-Browser
    const event = TransactionalStore.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    event.status = 'finalized';
    event.finalizedAt = new Date().toISOString();
    event.finalizedBy = finalizedBy;
    TransactionalStore.saveEvent(event);

    AuditService.log({
      eventId: event.id,
      entityType: 'event',
      entityId: event.id,
      action: 'EVENT_FINALIZED',
      previousValue: 'in_progress',
      updatedValue: 'finalized',
      actorId: finalizedBy,
      actorRole: 'technical_controller',
      reason: 'Official results locked against further edits.',
    });

    this.saveToStorage();
    return event;
  }

  // ----------------------------------------------------
  // 2. Athletes & Weigh-In API
  // ----------------------------------------------------
  public static async getAthletes(eventId: string): Promise<Athlete[]> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch(`/api/events/${eventId}/athletes`);
        if (res.ok) return await res.json();
      } catch {
        this.isStaticMode = true;
      }
    }

    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('event_id', eventId)
        .order('lot_number', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const athletes = data.map(athleteFromSupabase);
        TransactionalStore.saveAthletes(eventId, athletes);
        this.saveToStorage();
        return athletes;
      }
    } catch (err) {
      console.warn('Supabase getAthletes fallback:', err);
    }

    return TransactionalStore.getAthletes(eventId);
  }

  public static async registerAthlete(
    eventId: string,
    data: Partial<Athlete>
  ): Promise<Athlete> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      const res = await fetch(`/api/events/${eventId}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    }

    // Static In-Browser
    const event = TransactionalStore.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const athletes = TransactionalStore.getAthletes(eventId);
    const nextLot = athletes.length + 1;

    const newAthlete: Athlete = {
      id: `ath-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      eventId,
      lotNumber: data.lotNumber || nextLot,
      registrationNumber: data.registrationNumber || `REG-${nextLot}`,
      firstName: data.firstName?.trim() || `Lifter #${nextLot}`,
      lastName: data.lastName?.trim() || '',
      birthDate: data.birthDate,
      sex: data.sex || 'M',
      ageCategory: data.ageCategory || 'open',
      equipmentDivision: data.equipmentDivision || 'raw',
      teamOrAffiliation: data.teamOrAffiliation,
      declaredWeightCategory: data.declaredWeightCategory || 'Open',
      officialBodyweightKg: data.officialBodyweightKg,
      weighInRecords: [],
      weighInStatus: data.officialBodyweightKg ? 'passed' : 'pending',
      rackHeights: data.rackHeights || {},
      lifterStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    athletes.push(newAthlete);
    TransactionalStore.saveAthletes(eventId, athletes);

    AuditService.log({
      eventId,
      entityType: 'athlete',
      entityId: newAthlete.id,
      action: 'ATHLETE_REGISTERED',
      previousValue: null,
      updatedValue: newAthlete,
      actorId: 'registration_official',
      actorRole: 'registrar',
      reason: 'Athlete registered for competition',
    });

    this.saveToStorage();

    // Persist to Supabase
    try {
      const payload = athleteToSupabase(newAthlete);
      const { error } = await supabase.from('athletes').upsert(payload);
      if (error) {
        console.warn('Supabase registerAthlete error:', error);
      }
    } catch (err) {
      console.warn('Supabase registerAthlete sync error:', err);
    }

    return newAthlete;
  }

  public static async deleteAthlete(eventId: string, athleteId: string): Promise<void> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        await fetch(`/api/events/${eventId}/athletes/${athleteId}`, { method: 'DELETE' });
      } catch {
        // Fallback to client
      }
    }

    TransactionalStore.deleteAthlete(eventId, athleteId);
    AuditService.log({
      eventId,
      entityType: 'athlete',
      entityId: athleteId,
      action: 'ATHLETE_DELETED',
      previousValue: athleteId,
      updatedValue: null,
      actorId: 'meet_director',
      actorRole: 'organizer',
      reason: 'Athlete removed from competition roster',
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase.from('athletes').delete().eq('id', athleteId);
    } catch (err) {
      console.warn('Supabase deleteAthlete sync error:', err);
    }
  }

  public static async recordWeighIn(
    eventId: string,
    athleteId: string,
    payload: {
      measuredWeightKg: number;
      officialId: string;
      officialName: string;
      notes?: string;
    }
  ): Promise<void> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      await fetch(`/api/events/${eventId}/athletes/${athleteId}/weigh-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return;
    }

    // Static In-Browser
    const event = TransactionalStore.getEvent(eventId);
    if (!event) return;

    const athletes = TransactionalStore.getAthletes(eventId);
    const athleteIndex = athletes.findIndex((a) => a.id === athleteId);
    if (athleteIndex === -1) return;

    const athlete = athletes[athleteIndex];
    const { updatedAthlete, evaluation } = WeighInManager.recordWeighIn(
      athlete,
      payload.measuredWeightKg,
      payload.officialId || 'official-1',
      payload.officialName || 'Weigh-in Official',
      event.rulesSnapshot.categories || [],
      payload.notes
    );

    athletes[athleteIndex] = updatedAthlete;
    TransactionalStore.saveAthletes(eventId, athletes);

    AuditService.log({
      eventId,
      entityType: 'weigh_in',
      entityId: updatedAthlete.id,
      action: 'WEIGH_IN_RECORDED',
      previousValue: athlete.weighInStatus,
      updatedValue: { weight: payload.measuredWeightKg, status: evaluation.status },
      actorId: payload.officialId || 'official-1',
      actorRole: 'weigh_in_official',
      reason: evaluation.message,
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('athletes')
        .update({
          official_bodyweight_kg: payload.measuredWeightKg,
          weigh_in_status: evaluation.status,
          verified_weight_category: updatedAthlete.verifiedWeightCategory || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', athleteId);
    } catch (err) {
      console.warn('Supabase recordWeighIn sync error:', err);
    }
  }

  public static async updateRackHeights(
    eventId: string,
    athleteId: string,
    heights: any
  ): Promise<void> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      await fetch(`/api/events/${eventId}/athletes/${athleteId}/rack-heights`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heights),
      });
      return;
    }

    const athletes = TransactionalStore.getAthletes(eventId);
    const athleteIndex = athletes.findIndex((a) => a.id === athleteId);
    if (athleteIndex === -1) return;

    athletes[athleteIndex] = WeighInManager.updateRackHeights(athletes[athleteIndex], heights);
    TransactionalStore.saveAthletes(eventId, athletes);
    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('athletes')
        .update({
          squat_rack_height: heights.squatRackHeight ?? null,
          bench_rack_height: heights.benchRackHeight ?? null,
          squat_safety_pin: heights.squatSafetyPin ?? null,
          bench_safety_pin: heights.benchSafetyPin ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', athleteId);
    } catch (err) {
      console.warn('Supabase updateRackHeights sync error:', err);
    }
  }

  // ----------------------------------------------------
  // 3. Attempts & Referee Judging API
  // ----------------------------------------------------
  public static async getAttempts(eventId: string): Promise<Attempt[]> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch(`/api/events/${eventId}/attempts`);
        if (res.ok) return await res.json();
      } catch {
        this.isStaticMode = true;
      }
    }

    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*, referee_votes(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const attempts = data.map((row) => attemptFromSupabase(row, row.referee_votes));
        TransactionalStore.saveAttempts(eventId, attempts);
        this.saveToStorage();
        return attempts;
      }
    } catch (err) {
      console.warn('Supabase getAttempts fallback:', err);
    }

    return TransactionalStore.getAttempts(eventId);
  }

  public static async declareAttempt(
    eventId: string,
    payload: {
      athleteId: string;
      liftType: LiftType;
      attemptNumber: number;
      weightKg: number;
    }
  ): Promise<Attempt> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      const res = await fetch(`/api/events/${eventId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    }

    // Static In-Browser
    const event = TransactionalStore.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const attempts = TransactionalStore.getAttempts(eventId);
    const existingIndex = attempts.findIndex(
      (a) =>
        a.athleteId === payload.athleteId &&
        a.liftType === payload.liftType &&
        a.attemptNumber === payload.attemptNumber
    );

    let targetAttempt: Attempt;

    if (existingIndex !== -1) {
      const existing = attempts[existingIndex];
      const validation = DeadlineTracker.validateAttemptChange(
        existing,
        payload.weightKg,
        event.rulesSnapshot.deadliftAttemptChangesAllowed
      );

      if (!validation.isPermitted) {
        throw new Error(validation.reason);
      }

      const prevWeight = existing.weightKg;
      existing.weightKg = payload.weightKg;
      existing.declarationChangeCount = (existing.declarationChangeCount || 0) + 1;
      attempts[existingIndex] = existing;
      targetAttempt = existing;
      TransactionalStore.saveAttempts(eventId, attempts);

      AuditService.log({
        eventId,
        entityType: 'attempt',
        entityId: existing.id,
        action: 'ATTEMPT_WEIGHT_CHANGED',
        previousValue: prevWeight,
        updatedValue: payload.weightKg,
        actorId: 'platform_manager',
        actorRole: 'coach_or_lifter',
        reason: `Weight changed from ${prevWeight}kg to ${payload.weightKg}kg`,
      });
    } else {
      const newAttempt: Attempt = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        athleteId: payload.athleteId,
        liftType: payload.liftType,
        attemptNumber: payload.attemptNumber,
        weightKg: payload.weightKg,
        status: 'pending',
        refereeVotes: [],
        declaredAt: new Date().toISOString(),
        declarationChangeCount: 0,
      };

      attempts.push(newAttempt);
      targetAttempt = newAttempt;
      TransactionalStore.saveAttempts(eventId, attempts);

      AuditService.log({
        eventId,
        entityType: 'attempt',
        entityId: newAttempt.id,
        action: 'ATTEMPT_DECLARED',
        previousValue: null,
        updatedValue: newAttempt,
        actorId: 'platform_manager',
        actorRole: 'coach_or_lifter',
        reason: `Attempt declared at ${payload.weightKg}kg`,
      });
    }

    this.saveToStorage();

    // Persist attempt to Supabase
    try {
      const supabasePayload = attemptToSupabase(targetAttempt, eventId);
      await supabase.from('attempts').upsert(supabasePayload);
    } catch (err) {
      console.warn('Supabase declareAttempt sync error:', err);
    }

    return targetAttempt;
  }

  public static async recordVote(
    eventId: string,
    attemptId: string,
    payload: {
      role: RefereeRole;
      decision: RefereeDecision;
      infractions?: string[];
    }
  ): Promise<void> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      await fetch(`/api/events/${eventId}/attempts/${attemptId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refereeRole: payload.role,
          decision: payload.decision,
          infractionReasonCodes: payload.infractions,
        }),
      });
      return;
    }

    // Static In-Browser
    const event = TransactionalStore.getEvent(eventId);
    if (!event) return;

    const attempts = TransactionalStore.getAttempts(eventId);
    const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
    if (attemptIndex === -1) return;

    const attempt = attempts[attemptIndex];
    const existingVoteIndex = attempt.refereeVotes.findIndex((v) => v.refereeRole === payload.role);
    const vote: RefereeVote = {
      refereeId: `ref-${payload.role}`,
      refereeName: `${payload.role.toUpperCase()} Referee`,
      refereeRole: payload.role,
      decision: payload.decision,
      infractionReasonCodes: payload.infractions,
      timestamp: new Date().toISOString(),
    };

    if (existingVoteIndex !== -1) {
      attempt.refereeVotes[existingVoteIndex] = vote;
    } else {
      attempt.refereeVotes.push(vote);
    }

    if (JudgingEngine.isComplete(attempt.refereeVotes, event.rulesSnapshot.judgingMode)) {
      const consensus = JudgingEngine.evaluateConsensus(
        attempt.refereeVotes,
        event.rulesSnapshot.majorityThreshold
      );
      attempt.majorityDecision = consensus.majorityDecision;
      attempt.status = consensus.majorityDecision;
      attempt.timestamp = new Date().toISOString();
    }

    attempts[attemptIndex] = attempt;
    TransactionalStore.saveAttempts(eventId, attempts);

    AuditService.log({
      eventId,
      entityType: 'judging',
      entityId: attempt.id,
      action: 'REFEREE_VOTE_CAST',
      previousValue: null,
      updatedValue: { role: payload.role, decision: payload.decision, infractions: payload.infractions },
      actorId: vote.refereeId,
      actorRole: `${payload.role}_referee`,
      reason: `Vote cast: ${payload.decision.toUpperCase()}`,
    });

    this.saveToStorage();

    // Async sync to Supabase (upsert vote & update attempt status)
    try {
      await supabase.from('referee_votes').upsert({
        attempt_id: attempt.id,
        event_id: eventId,
        referee_id: vote.refereeId,
        referee_name: vote.refereeName,
        referee_role: vote.refereeRole,
        decision: vote.decision,
        infraction_reason_codes: vote.infractionReasonCodes || [],
      });

      await supabase
        .from('attempts')
        .update({
          status: attempt.status,
          majority_decision: attempt.majorityDecision || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attempt.id);
    } catch (err) {
      console.warn('Supabase recordVote sync error:', err);
    }
  }

  public static async recordOverride(
    eventId: string,
    attemptId: string,
    payload: {
      overriddenDecision: RefereeDecision;
      authorizedBy: string;
      reason: string;
    }
  ): Promise<void> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      await fetch(`/api/events/${eventId}/attempts/${attemptId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return;
    }

    const attempts = TransactionalStore.getAttempts(eventId);
    const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
    if (attemptIndex === -1) return;

    const attempt = attempts[attemptIndex];
    const prevDecision = attempt.majorityDecision || attempt.status;
    attempt.majorityDecision = payload.overriddenDecision;
    attempt.status = payload.overriddenDecision;
    attempt.isJuryOverride = true;
    attempt.juryOverrideBy = payload.authorizedBy;
    attempt.juryOverrideReason = payload.reason;

    attempts[attemptIndex] = attempt;
    TransactionalStore.saveAttempts(eventId, attempts);

    AuditService.log({
      eventId,
      entityType: 'judging',
      entityId: attempt.id,
      action: 'JURY_OVERRIDE_APPLIED',
      previousValue: prevDecision,
      updatedValue: payload.overriddenDecision,
      actorId: payload.authorizedBy,
      actorRole: 'jury_president',
      reason: payload.reason,
    });

    this.saveToStorage();

    // Async sync to Supabase
    try {
      await supabase
        .from('attempts')
        .update({
          status: attempt.status,
          majority_decision: attempt.majorityDecision,
          is_jury_override: true,
          jury_override_by: payload.authorizedBy,
          jury_override_reason: payload.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attempt.id);
    } catch (err) {
      console.warn('Supabase recordOverride sync error:', err);
    }
  }

  // ----------------------------------------------------
  // 4. Results & Audit Logs API
  // ----------------------------------------------------
  public static async getResults(eventId: string): Promise<CompetitionResults> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch(`/api/events/${eventId}/results`);
        if (res.ok) return await res.json();
      } catch {
        this.isStaticMode = true;
      }
    }

    // Static In-Browser
    let event = TransactionalStore.getEvent(eventId);
    if (!event) {
      event = await this.getEvent(eventId);
    }
    if (!event) throw new Error('Event not found');

    let athletes = TransactionalStore.getAthletes(eventId);
    if (athletes.length === 0) {
      athletes = await this.getAthletes(eventId);
    }

    let attempts = TransactionalStore.getAttempts(eventId);
    if (attempts.length === 0) {
      attempts = await this.getAttempts(eventId);
    }

    const isFinalized = event.status === 'finalized' || event.status === 'locked';

    const categoryStandings = CategoryRanker.rankByCategories(
      athletes,
      attempts,
      event.rulesSnapshot,
      isFinalized
    );

    const overallStandings = OpenRanker.rankOverall(
      athletes,
      attempts,
      event.rulesSnapshot,
      isFinalized
    );

    const individualLifts = event.rulesSnapshot.enableIndividualLiftAwards
      ? IndividualLiftsRanker.rankIndividualLifts(
          overallStandings,
          event.rulesSnapshot.preserveLiftAwardsOnTotalElimination
        )
      : undefined;

    const teamStandings = event.rulesSnapshot.enableTeamScoring
      ? TeamScoringEngine.calculate(categoryStandings)
      : undefined;

    return {
      eventId: event.id,
      eventName: event.name,
      status: isFinalized ? 'finalized' : 'provisional',
      generatedAt: new Date().toISOString(),
      categoryStandings,
      overallStandings,
      individualLiftChampions: individualLifts,
      teamStandings,
    };
  }

  public static async getAuditLogs(eventId: string): Promise<AuditLogEntry[]> {
    const hasBackend = await this.checkBackend();
    if (hasBackend) {
      try {
        const res = await fetch(`/api/events/${eventId}/audit`);
        if (res.ok) return await res.json();
      } catch {
        this.isStaticMode = true;
      }
    }

    return AuditService.getLogs(eventId);
  }
}

