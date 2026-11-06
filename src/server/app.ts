import express, { Request, Response } from 'express';
import cors from 'cors';
import { TransactionalStore } from './store';
import { RulesDependencyValidator } from '../core/rules-engine/validator';
import { RuleSnapshotManager } from '../core/rules-engine/versioning';
import { getProfileTemplate } from '../core/competition-profiles';
import { CategoryRanker } from '../core/ranking-engine/category-ranker';
import { OpenRanker } from '../core/ranking-engine/open-ranker';
import { IndividualLiftsRanker } from '../core/ranking-engine/individual-lifts';
import { TeamScoringEngine } from '../core/ranking-engine/team-scoring';
import { JudgingEngine } from '../core/judging-engine/referee-consensus';
import { WeighInManager } from '../core/weigh-in/weigh-in-manager';
import { DeadlineTracker } from '../core/attempt-scheduler/deadline-tracker';
import { BarLoaderCalculator } from '../core/attempt-scheduler/bar-loader';
import { RoundScheduler } from '../core/attempt-scheduler/round-scheduler';
import { OfficialSheetsGenerator } from '../core/official-results/sheets';
import { CsvExporter } from '../core/official-results/csv-exporter';
import { AuditService } from '../core/audit-trail/audit-service';
import { CompetitionEvent, CompetitionRules } from '../core/types/competition';
import { Athlete } from '../core/types/athlete';
import { Attempt, RefereeVote } from '../core/types/attempt';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend assets if built
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

// ----------------------------------------------------
// 1. EVENT & RULES CONFIGURATION ENDPOINTS
// ----------------------------------------------------

app.get('/api/events', (_req: Request, res: Response) => {
  const events = TransactionalStore.getEvents();
  res.json(events);
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

app.post('/api/events', (req: Request, res: Response) => {
  const { name, venue, organizer, profileId = 'ascend_open', date = new Date().toISOString().split('T')[0] } = req.body;
  const rulesTemplate = getProfileTemplate(profileId);

  const newEvent: CompetitionEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: name || 'New Powerlifting Competition',
    venue: venue || 'Main Gymnasium',
    organizer: organizer || 'Meet Director',
    date,
    status: 'draft',
    rulesSnapshot: rulesTemplate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  TransactionalStore.saveEvent(newEvent);
  TransactionalStore.saveAthletes(newEvent.id, []);
  TransactionalStore.saveAttempts(newEvent.id, []);

  AuditService.log({
    eventId: newEvent.id,
    entityType: 'event',
    entityId: newEvent.id,
    action: 'EVENT_CREATED',
    previousValue: null,
    updatedValue: { name: newEvent.name, profileId },
    actorId: 'meet_director',
    actorRole: 'organizer',
    reason: `Created event with profile ${profileId}`,
  });

  res.status(201).json(newEvent);
});

app.put('/api/events/:id/rules', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  try {
    RuleSnapshotManager.assertCanModifyRules(event);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }

  const updatedRules: CompetitionRules = req.body;
  const validation = RulesDependencyValidator.validate(updatedRules);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Rules validation failed',
      errors: validation.errors,
      warnings: validation.warnings,
      autoFixSuggestions: validation.autoFixSuggestions,
    });
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
    reason: req.body.reason || 'Competition rules adjusted in dashboard',
  });

  res.json({
    event,
    warnings: validation.warnings,
    autoFixSuggestions: validation.autoFixSuggestions,
  });
});

app.post('/api/events/:id/finalize', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  event.status = 'finalized';
  event.finalizedAt = new Date().toISOString();
  event.finalizedBy = req.body.finalizedBy || 'Authorized Technical Controller';
  TransactionalStore.saveEvent(event);

  AuditService.log({
    eventId: event.id,
    entityType: 'event',
    entityId: event.id,
    action: 'EVENT_FINALIZED',
    previousValue: 'in_progress',
    updatedValue: 'finalized',
    actorId: event.finalizedBy || 'technical_controller',
    actorRole: 'technical_controller',
    reason: 'Official results locked against further edits.',
  });

  res.json(event);
});

// ----------------------------------------------------
// 2. ATHLETE & WEIGH-IN ENDPOINTS
// ----------------------------------------------------

app.get('/api/events/:id/athletes', (req: Request, res: Response) => {
  const athletes = TransactionalStore.getAthletes(req.params.id);
  res.json(athletes);
});

app.post('/api/events/:id/athletes', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const athletes = TransactionalStore.getAthletes(event.id);
  const nextLot = athletes.length + 1;

  const newAthlete: Athlete = {
    id: `ath-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    eventId: event.id,
    lotNumber: req.body.lotNumber || nextLot,
    registrationNumber: req.body.registrationNumber || `REG-${nextLot}`,
    firstName: req.body.firstName || 'First',
    lastName: req.body.lastName || 'Last',
    birthDate: req.body.birthDate,
    sex: req.body.sex || 'M',
    ageCategory: req.body.ageCategory || 'open',
    equipmentDivision: req.body.equipmentDivision || 'raw',
    teamOrAffiliation: req.body.teamOrAffiliation,
    declaredWeightCategory: req.body.declaredWeightCategory || 'Open',
    weighInRecords: [],
    weighInStatus: 'pending',
    rackHeights: req.body.rackHeights || {},
    lifterStatus: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  athletes.push(newAthlete);
  TransactionalStore.saveAthletes(event.id, athletes);

  AuditService.log({
    eventId: event.id,
    entityType: 'athlete',
    entityId: newAthlete.id,
    action: 'ATHLETE_REGISTERED',
    previousValue: null,
    updatedValue: newAthlete,
    actorId: 'registration_official',
    actorRole: 'registrar',
    reason: 'Athlete registered for competition',
  });

  res.status(201).json(newAthlete);
});

app.post('/api/events/:id/athletes/:athleteId/weigh-in', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const athletes = TransactionalStore.getAthletes(event.id);
  const athleteIndex = athletes.findIndex((a) => a.id === req.params.athleteId);
  if (athleteIndex === -1) return res.status(404).json({ error: 'Athlete not found' });

  const athlete = athletes[athleteIndex];
  const { measuredWeightKg, officialId, officialName, notes } = req.body;

  const { updatedAthlete, record, evaluation } = WeighInManager.recordWeighIn(
    athlete,
    measuredWeightKg,
    officialId || 'official-1',
    officialName || 'Weigh-in Official',
    event.rulesSnapshot.categories || [],
    notes
  );

  athletes[athleteIndex] = updatedAthlete;
  TransactionalStore.saveAthletes(event.id, athletes);

  AuditService.log({
    eventId: event.id,
    entityType: 'weigh_in',
    entityId: updatedAthlete.id,
    action: 'WEIGH_IN_RECORDED',
    previousValue: athlete.weighInStatus,
    updatedValue: { weight: measuredWeightKg, status: evaluation.status },
    actorId: officialId || 'official-1',
    actorRole: 'weigh_in_official',
    reason: evaluation.message,
  });

  res.json({
    athlete: updatedAthlete,
    record,
    evaluation,
  });
});

app.put('/api/events/:id/athletes/:athleteId/rack-heights', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const athletes = TransactionalStore.getAthletes(event.id);
  const athleteIndex = athletes.findIndex((a) => a.id === req.params.athleteId);
  if (athleteIndex === -1) return res.status(404).json({ error: 'Athlete not found' });

  athletes[athleteIndex] = WeighInManager.updateRackHeights(athletes[athleteIndex], req.body);
  TransactionalStore.saveAthletes(event.id, athletes);

  res.json(athletes[athleteIndex]);
});

// ----------------------------------------------------
// 3. ATTEMPTS, QUEUE & REFEREE JUDGING ENDPOINTS
// ----------------------------------------------------

app.get('/api/events/:id/attempts', (req: Request, res: Response) => {
  const attempts = TransactionalStore.getAttempts(req.params.id);
  res.json(attempts);
});

app.post('/api/events/:id/attempts', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const attempts = TransactionalStore.getAttempts(event.id);
  const { athleteId, liftType, attemptNumber, weightKg } = req.body;

  // Check if attempt already exists
  const existingIndex = attempts.findIndex(
    (a) => a.athleteId === athleteId && a.liftType === liftType && a.attemptNumber === attemptNumber
  );

  if (existingIndex !== -1) {
    // Validate weight change
    const existing = attempts[existingIndex];
    const validation = DeadlineTracker.validateAttemptChange(
      existing,
      weightKg,
      event.rulesSnapshot.deadliftAttemptChangesAllowed
    );

    if (!validation.isPermitted) {
      return res.status(400).json({ error: validation.reason });
    }

    const prevWeight = existing.weightKg;
    existing.weightKg = weightKg;
    existing.declarationChangeCount = (existing.declarationChangeCount || 0) + 1;
    attempts[existingIndex] = existing;
    TransactionalStore.saveAttempts(event.id, attempts);

    AuditService.log({
      eventId: event.id,
      entityType: 'attempt',
      entityId: existing.id,
      action: 'ATTEMPT_WEIGHT_CHANGED',
      previousValue: prevWeight,
      updatedValue: weightKg,
      actorId: 'platform_manager',
      actorRole: 'coach_or_lifter',
      reason: `Attempt weight changed from ${prevWeight}kg to ${weightKg}kg`,
    });

    return res.json(existing);
  }

  const newAttempt: Attempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    athleteId,
    liftType,
    attemptNumber,
    weightKg,
    status: 'pending',
    refereeVotes: [],
    declaredAt: new Date().toISOString(),
    declarationChangeCount: 0,
  };

  attempts.push(newAttempt);
  TransactionalStore.saveAttempts(event.id, attempts);

  AuditService.log({
    eventId: event.id,
    entityType: 'attempt',
    entityId: newAttempt.id,
    action: 'ATTEMPT_DECLARED',
    previousValue: null,
    updatedValue: newAttempt,
    actorId: 'platform_manager',
    actorRole: 'coach_or_lifter',
    reason: `Attempt declared at ${weightKg}kg`,
  });

  res.status(201).json(newAttempt);
});

app.post('/api/events/:id/attempts/:attemptId/vote', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const attempts = TransactionalStore.getAttempts(event.id);
  const attemptIndex = attempts.findIndex((a) => a.id === req.params.attemptId);
  if (attemptIndex === -1) return res.status(404).json({ error: 'Attempt not found' });

  const attempt = attempts[attemptIndex];
  const { refereeId, refereeName, refereeRole, decision, infractionReasonCodes } = req.body;

  // Add or update vote for this referee role
  const existingVoteIndex = attempt.refereeVotes.findIndex((v) => v.refereeRole === refereeRole);
  const vote: RefereeVote = {
    refereeId: refereeId || `ref-${refereeRole}`,
    refereeName: refereeName || `${refereeRole} Referee`,
    refereeRole,
    decision,
    infractionReasonCodes,
    timestamp: new Date().toISOString(),
  };

  if (existingVoteIndex !== -1) {
    attempt.refereeVotes[existingVoteIndex] = vote;
  } else {
    attempt.refereeVotes.push(vote);
  }

  // If complete consensus reached
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
  TransactionalStore.saveAttempts(event.id, attempts);

  AuditService.log({
    eventId: event.id,
    entityType: 'judging',
    entityId: attempt.id,
    action: 'REFEREE_VOTE_CAST',
    previousValue: null,
    updatedValue: { role: refereeRole, decision, infractions: infractionReasonCodes },
    actorId: vote.refereeId,
    actorRole: `${refereeRole}_referee`,
    reason: `Vote cast: ${decision.toUpperCase()}`,
  });

  res.json(attempt);
});

app.post('/api/events/:id/attempts/:attemptId/override', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const attempts = TransactionalStore.getAttempts(event.id);
  const attemptIndex = attempts.findIndex((a) => a.id === req.params.attemptId);
  if (attemptIndex === -1) return res.status(404).json({ error: 'Attempt not found' });

  const attempt = attempts[attemptIndex];
  const { overriddenDecision, authorizedBy, reason } = req.body;

  if (!reason || !authorizedBy) {
    return res.status(400).json({ error: 'Authorized official and explicit justification required.' });
  }

  const prevDecision = attempt.majorityDecision || attempt.status;
  attempt.majorityDecision = overriddenDecision;
  attempt.status = overriddenDecision;
  attempt.isJuryOverride = true;
  attempt.juryOverrideBy = authorizedBy;
  attempt.juryOverrideReason = reason;

  attempts[attemptIndex] = attempt;
  TransactionalStore.saveAttempts(event.id, attempts);

  AuditService.log({
    eventId: event.id,
    entityType: 'judging',
    entityId: attempt.id,
    action: 'JURY_OVERRIDE_APPLIED',
    previousValue: prevDecision,
    updatedValue: overriddenDecision,
    actorId: authorizedBy,
    actorRole: 'jury_president',
    reason,
  });

  res.json(attempt);
});

// Platform Queue & Plate Loading Helper
app.get('/api/events/:id/platform-queue', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const athletes = TransactionalStore.getAthletes(event.id);
  const attempts = TransactionalStore.getAttempts(event.id);

  const liftType = (req.query.liftType as any) || 'squat';
  const round = parseInt(req.query.round as string, 10) || 1;

  const scheduled = RoundScheduler.sortAttemptsForRound(athletes, attempts, liftType, round);
  const queue = RoundScheduler.getPlatformQueue(scheduled);

  const plateLoading = queue.currentLifter
    ? BarLoaderCalculator.calculate(queue.currentLifter.attempt.weightKg)
    : undefined;

  res.json({
    queue,
    plateLoading,
  });
});

// ----------------------------------------------------
// 4. RANKINGS, STANDINGS & OFFICIAL RESULTS
// ----------------------------------------------------

app.get('/api/events/:id/results', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const athletes = TransactionalStore.getAthletes(event.id);
  const attempts = TransactionalStore.getAttempts(event.id);
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

  res.json({
    eventId: event.id,
    eventName: event.name,
    status: isFinalized ? 'finalized' : 'provisional',
    generatedAt: new Date().toISOString(),
    categoryStandings,
    overallStandings,
    individualLiftChampions: individualLifts,
    teamStandings,
  });
});

// Official Sheets & CSV Exports
app.get('/api/events/:id/sheets/:sheetType', (req: Request, res: Response) => {
  const event = TransactionalStore.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const athletes = TransactionalStore.getAthletes(event.id);
  const attempts = TransactionalStore.getAttempts(event.id);
  const standings = OpenRanker.rankOverall(athletes, attempts, event.rulesSnapshot, true);

  const sheetType = req.params.sheetType;

  if (sheetType === 'csv-results') {
    const csv = CsvExporter.exportStandingsToCsv(standings);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.name}-Results.csv"`);
    return res.send(csv);
  }

  if (sheetType === 'csv-weighin') {
    const csv = CsvExporter.exportWeighInToCsv(athletes);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.name}-WeighIn.csv"`);
    return res.send(csv);
  }

  if (sheetType === 'weigh-in') {
    const html = OfficialSheetsGenerator.renderWeighInSheet(event, athletes);
    return res.send(html);
  }

  if (sheetType === 'score-sheet') {
    const html = OfficialSheetsGenerator.renderScoreSheet(event, standings);
    return res.send(html);
  }

  if (sheetType === 'referee-records') {
    const html = OfficialSheetsGenerator.renderRefereeDecisions(event, attempts, athletes);
    return res.send(html);
  }

  res.status(400).json({ error: 'Unknown sheet type' });
});

// ----------------------------------------------------
// 5. AUDIT LOG ENDPOINTS
// ----------------------------------------------------

app.get('/api/events/:id/audit', (req: Request, res: Response) => {
  const logs = AuditService.getLogs(req.params.id);
  res.json(logs);
});

// SPA fallback
app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.resolve(distPath, 'index.html');
  res.sendFile(indexHtml);
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Ascend Competition Management API running on http://localhost:${PORT}`);
  });
}
