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

const STORAGE_KEY = 'ascend_powerlifting_data_v1';

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

    return TransactionalStore.getEvents();
  }

  public static async getPublishedEvents(): Promise<CompetitionEvent[]> {
    return TransactionalStore.getPublishedEvents();
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

      this.saveToStorage();
      return existing;
    }

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

    this.saveToStorage();
    return newAttempt;
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
    const event = TransactionalStore.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const athletes = TransactionalStore.getAthletes(eventId);
    const attempts = TransactionalStore.getAttempts(eventId);
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

