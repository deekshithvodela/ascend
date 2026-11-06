import { CompetitionEvent, CompetitionRules } from '../core/types/competition';
import { Athlete } from '../core/types/athlete';
import { Attempt } from '../core/types/attempt';
import { AuditLogEntry } from '../core/types/audit';
import { ASCEND_OPEN_PROFILE } from '../core/competition-profiles/ascend-open.profile';
import { IPF_COMPETITION_PROFILE, IPF_STANDARD_CATEGORIES } from '../core/competition-profiles/ipf-technical.profile';
import { AuditService } from '../core/audit-trail/audit-service';

export interface MeetData {
  event: CompetitionEvent;
  athletes: Athlete[];
  attempts: Attempt[];
}

export class TransactionalStore {
  private static events: Map<string, CompetitionEvent> = new Map();
  private static athletes: Map<string, Athlete[]> = new Map();
  private static attempts: Map<string, Attempt[]> = new Map();

  static {
    this.seedInitialData();
  }

  public static seedInitialData(): void {
    // 1. Seed Event: Ascend Open Summer Classic
    const openEventId = 'evt-ascend-open';
    const openEvent: CompetitionEvent = {
      id: openEventId,
      name: 'Ascend Open Summer Classic 2024',
      date: '2024-07-20',
      venue: 'Metropolis Athletics Club, Platform 1',
      organizer: 'Ascend Lifting League',
      status: 'in_progress',
      rulesSnapshot: JSON.parse(JSON.stringify(ASCEND_OPEN_PROFILE)),
      createdAt: '2024-07-01T08:00:00Z',
      updatedAt: '2024-07-20T10:00:00Z',
    };

    const openAthletes: Athlete[] = [
      {
        id: 'ath-open-1',
        eventId: openEventId,
        lotNumber: 1,
        registrationNumber: 'ASC-001',
        firstName: 'Elena',
        lastName: 'Rostova',
        sex: 'F',
        ageCategory: 'open',
        equipmentDivision: 'raw',
        declaredWeightCategory: 'Open',
        officialBodyweightKg: 58.4,
        weighInRecords: [],
        weighInStatus: 'passed',
        rackHeights: { squatRackHeight: 11, benchRackHeight: 9 },
        lifterStatus: 'completed',
        createdAt: '2024-07-01T08:00:00Z',
        updatedAt: '2024-07-20T09:00:00Z',
      },
      {
        id: 'ath-open-2',
        eventId: openEventId,
        lotNumber: 2,
        registrationNumber: 'ASC-002',
        firstName: 'Liam',
        lastName: 'Vance',
        sex: 'M',
        ageCategory: 'open',
        equipmentDivision: 'raw',
        declaredWeightCategory: 'Open',
        officialBodyweightKg: 78.5,
        weighInRecords: [],
        weighInStatus: 'passed',
        rackHeights: { squatRackHeight: 14, benchRackHeight: 12 },
        lifterStatus: 'completed',
        createdAt: '2024-07-01T08:00:00Z',
        updatedAt: '2024-07-20T09:00:00Z',
      },
      {
        id: 'ath-open-3',
        eventId: openEventId,
        lotNumber: 3,
        registrationNumber: 'ASC-003',
        firstName: 'Mateo',
        lastName: 'Gomez',
        sex: 'M',
        ageCategory: 'open',
        equipmentDivision: 'raw',
        declaredWeightCategory: 'Open',
        officialBodyweightKg: 95.2,
        weighInRecords: [],
        weighInStatus: 'passed',
        rackHeights: { squatRackHeight: 16, benchRackHeight: 13 },
        lifterStatus: 'completed',
        createdAt: '2024-07-01T08:00:00Z',
        updatedAt: '2024-07-20T09:00:00Z',
      },
    ];

    const openAttempts: Attempt[] = [
      // Elena: Squat 140kg, Bench 85kg, Deadlift 175kg -> Total 400kg / 58.4kg = 6.85 ratio
      { id: 'att-o1', athleteId: 'ath-open-1', liftType: 'squat', attemptNumber: 1, weightKg: 130, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o2', athleteId: 'ath-open-1', liftType: 'squat', attemptNumber: 2, weightKg: 140, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o3', athleteId: 'ath-open-1', liftType: 'bench_press', attemptNumber: 1, weightKg: 80, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o4', athleteId: 'ath-open-1', liftType: 'bench_press', attemptNumber: 2, weightKg: 85, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o5', athleteId: 'ath-open-1', liftType: 'deadlift', attemptNumber: 1, weightKg: 165, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o6', athleteId: 'ath-open-1', liftType: 'deadlift', attemptNumber: 2, weightKg: 175, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },

      // Liam: Squat 200kg, Bench 140kg, Deadlift 240kg -> Total 580kg / 78.5kg = 7.39 ratio (Winner on Ratio!)
      { id: 'att-o7', athleteId: 'ath-open-2', liftType: 'squat', attemptNumber: 1, weightKg: 190, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o8', athleteId: 'ath-open-2', liftType: 'squat', attemptNumber: 2, weightKg: 200, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o9', athleteId: 'ath-open-2', liftType: 'bench_press', attemptNumber: 1, weightKg: 135, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o10', athleteId: 'ath-open-2', liftType: 'bench_press', attemptNumber: 2, weightKg: 140, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o11', athleteId: 'ath-open-2', liftType: 'deadlift', attemptNumber: 1, weightKg: 230, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o12', athleteId: 'ath-open-2', liftType: 'deadlift', attemptNumber: 2, weightKg: 240, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },

      // Mateo: Squat 240kg, Bench 160kg, Deadlift 280kg -> Total 680kg / 95.2kg = 7.14 ratio (Highest total, but 2nd on Ratio!)
      { id: 'att-o13', athleteId: 'ath-open-3', liftType: 'squat', attemptNumber: 1, weightKg: 225, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o14', athleteId: 'ath-open-3', liftType: 'squat', attemptNumber: 2, weightKg: 240, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o15', athleteId: 'ath-open-3', liftType: 'bench_press', attemptNumber: 1, weightKg: 150, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o16', athleteId: 'ath-open-3', liftType: 'bench_press', attemptNumber: 2, weightKg: 160, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o17', athleteId: 'ath-open-3', liftType: 'deadlift', attemptNumber: 1, weightKg: 265, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-o18', athleteId: 'ath-open-3', liftType: 'deadlift', attemptNumber: 2, weightKg: 280, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    ];

    this.events.set(openEventId, openEvent);
    this.athletes.set(openEventId, openAthletes);
    this.attempts.set(openEventId, openAttempts);

    // 2. Seed Event: IPF National Championship (Federation Mode)
    const ipfEventId = 'evt-ipf-nationals';
    const ipfEvent: CompetitionEvent = {
      id: ipfEventId,
      name: 'National Powerlifting Championship (IPF Technical Standard)',
      date: '2024-09-15',
      venue: 'National Sports Center, Main Arena',
      organizer: 'National Powerlifting Federation',
      chiefRefereeName: 'Chief Ref. Arthur Sterling',
      status: 'in_progress',
      rulesSnapshot: JSON.parse(JSON.stringify(IPF_COMPETITION_PROFILE)),
      createdAt: '2024-08-01T08:00:00Z',
      updatedAt: '2024-09-15T10:00:00Z',
    };

    const ipfAthletes: Athlete[] = [
      {
        id: 'ath-ipf-1',
        eventId: ipfEventId,
        lotNumber: 14,
        registrationNumber: 'IPF-NAT-041',
        firstName: 'Alexander',
        lastName: 'Cole',
        sex: 'M',
        ageCategory: 'open',
        equipmentDivision: 'raw',
        teamOrAffiliation: 'Northern Barbell Club',
        declaredWeightCategory: '83 kg',
        verifiedWeightCategory: '83 kg',
        officialBodyweightKg: 82.6,
        weighInRecords: [
          {
            id: 'w-1',
            attemptNumber: 1,
            timestamp: '2024-09-15T07:15:00Z',
            measuredWeightKg: 82.6,
            officialId: 'off-1',
            officialName: 'Referee Sterling',
            status: 'passed',
            notes: 'Verified on calibrated electronic scale',
          },
        ],
        weighInStatus: 'passed',
        rackHeights: { squatRackHeight: 13, benchRackHeight: 11, squatSafetyPin: 7, benchSafetyPin: 5 },
        lifterStatus: 'active',
        flight: 'Flight A',
        createdAt: '2024-08-01T08:00:00Z',
        updatedAt: '2024-09-15T07:15:00Z',
      },
      {
        id: 'ath-ipf-2',
        eventId: ipfEventId,
        lotNumber: 8, // Lower lot than Alexander
        registrationNumber: 'IPF-NAT-042',
        firstName: 'Benjamin',
        lastName: 'Kim',
        sex: 'M',
        ageCategory: 'open',
        equipmentDivision: 'raw',
        teamOrAffiliation: 'Capital Iron',
        declaredWeightCategory: '83 kg',
        verifiedWeightCategory: '83 kg',
        officialBodyweightKg: 82.1, // Lighter bodyweight
        weighInRecords: [
          {
            id: 'w-2',
            attemptNumber: 1,
            timestamp: '2024-09-15T07:22:00Z',
            measuredWeightKg: 82.1,
            officialId: 'off-1',
            officialName: 'Referee Sterling',
            status: 'passed',
            notes: 'Verified bodyweight',
          },
        ],
        weighInStatus: 'passed',
        rackHeights: { squatRackHeight: 12, benchRackHeight: 10, squatSafetyPin: 6, benchSafetyPin: 4 },
        lifterStatus: 'active',
        flight: 'Flight A',
        createdAt: '2024-08-01T08:00:00Z',
        updatedAt: '2024-09-15T07:22:00Z',
      },
      {
        id: 'ath-ipf-3',
        eventId: ipfEventId,
        lotNumber: 21,
        registrationNumber: 'IPF-NAT-043',
        firstName: 'Marcus',
        lastName: 'O\'Connor',
        sex: 'M',
        ageCategory: 'open',
        equipmentDivision: 'raw',
        teamOrAffiliation: 'Northern Barbell Club',
        declaredWeightCategory: '83 kg',
        verifiedWeightCategory: '83 kg',
        officialBodyweightKg: 82.9,
        weighInRecords: [
          {
            id: 'w-3',
            attemptNumber: 1,
            timestamp: '2024-09-15T07:30:00Z',
            measuredWeightKg: 82.9,
            officialId: 'off-1',
            officialName: 'Referee Sterling',
            status: 'passed',
            notes: 'Verified',
          },
        ],
        weighInStatus: 'passed',
        rackHeights: { squatRackHeight: 15, benchRackHeight: 12, squatSafetyPin: 8, benchSafetyPin: 6 },
        lifterStatus: 'active',
        flight: 'Flight A',
        createdAt: '2024-08-01T08:00:00Z',
        updatedAt: '2024-09-15T07:30:00Z',
      },
    ];

    const ipfAttempts: Attempt[] = [
      // Alexander (SQ: 240, BP: 165, DL: 275 -> 680 kg total)
      {
        id: 'att-ipf-1',
        athleteId: 'ath-ipf-1',
        liftType: 'squat',
        attemptNumber: 1,
        weightKg: 225,
        status: 'good_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'good_lift', timestamp: '2024-09-15T10:05:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'good_lift', timestamp: '2024-09-15T10:05:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'good_lift', timestamp: '2024-09-15T10:05:00Z' },
        ],
        majorityDecision: 'good_lift',
        declaredAt: '2024-09-15T08:00:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-2',
        athleteId: 'ath-ipf-1',
        liftType: 'squat',
        attemptNumber: 2,
        weightKg: 240,
        status: 'good_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'good_lift', timestamp: '2024-09-15T10:20:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'good_lift', timestamp: '2024-09-15T10:20:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'no_lift', infractionReasonCodes: ['SQ-01'], timestamp: '2024-09-15T10:20:00Z' },
        ],
        majorityDecision: 'good_lift', // 2-1 White Majority!
        declaredAt: '2024-09-15T10:07:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-3',
        athleteId: 'ath-ipf-1',
        liftType: 'squat',
        attemptNumber: 3,
        weightKg: 247.5,
        status: 'no_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'no_lift', infractionReasonCodes: ['SQ-01'], timestamp: '2024-09-15T10:35:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'no_lift', infractionReasonCodes: ['SQ-01'], timestamp: '2024-09-15T10:35:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'good_lift', timestamp: '2024-09-15T10:35:00Z' },
        ],
        majorityDecision: 'no_lift',
        declaredAt: '2024-09-15T10:22:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-4',
        athleteId: 'ath-ipf-1',
        liftType: 'bench_press',
        attemptNumber: 1,
        weightKg: 155,
        status: 'good_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'good_lift', timestamp: '2024-09-15T11:10:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'good_lift', timestamp: '2024-09-15T11:10:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'good_lift', timestamp: '2024-09-15T11:10:00Z' },
        ],
        majorityDecision: 'good_lift',
        declaredAt: '2024-09-15T10:40:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-5',
        athleteId: 'ath-ipf-1',
        liftType: 'bench_press',
        attemptNumber: 2,
        weightKg: 165,
        status: 'good_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'good_lift', timestamp: '2024-09-15T11:25:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'good_lift', timestamp: '2024-09-15T11:25:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'good_lift', timestamp: '2024-09-15T11:25:00Z' },
        ],
        majorityDecision: 'good_lift',
        declaredAt: '2024-09-15T11:12:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-6',
        athleteId: 'ath-ipf-1',
        liftType: 'bench_press',
        attemptNumber: 3,
        weightKg: 170,
        status: 'no_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'no_lift', infractionReasonCodes: ['BP-03'], timestamp: '2024-09-15T11:40:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'no_lift', infractionReasonCodes: ['BP-03'], timestamp: '2024-09-15T11:40:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'no_lift', infractionReasonCodes: ['BP-04'], timestamp: '2024-09-15T11:40:00Z' },
        ],
        majorityDecision: 'no_lift',
        declaredAt: '2024-09-15T11:27:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-7',
        athleteId: 'ath-ipf-1',
        liftType: 'deadlift',
        attemptNumber: 1,
        weightKg: 260,
        status: 'good_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'good_lift', timestamp: '2024-09-15T12:15:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'good_lift', timestamp: '2024-09-15T12:15:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'good_lift', timestamp: '2024-09-15T12:15:00Z' },
        ],
        majorityDecision: 'good_lift',
        declaredAt: '2024-09-15T11:45:00Z',
        declarationChangeCount: 0,
      },
      {
        id: 'att-ipf-8',
        athleteId: 'ath-ipf-1',
        liftType: 'deadlift',
        attemptNumber: 2,
        weightKg: 275,
        status: 'good_lift',
        refereeVotes: [
          { refereeId: 'ref-c', refereeName: 'Arthur Sterling', refereeRole: 'chief', decision: 'good_lift', timestamp: '2024-09-15T12:35:00Z' },
          { refereeId: 'ref-l', refereeName: 'Maria Santos', refereeRole: 'left', decision: 'good_lift', timestamp: '2024-09-15T12:35:00Z' },
          { refereeId: 'ref-r', refereeName: 'James Chen', refereeRole: 'right', decision: 'good_lift', timestamp: '2024-09-15T12:35:00Z' },
        ],
        majorityDecision: 'good_lift',
        declaredAt: '2024-09-15T12:17:00Z',
        declarationChangeCount: 0,
      },

      // Benjamin Kim: (SQ: 235, BP: 165, DL: 280 -> 680 kg total! Exactly tied with Alexander Cole on total, but 82.1kg < 82.6kg BW!)
      { id: 'att-ipf-b1', athleteId: 'ath-ipf-2', liftType: 'squat', attemptNumber: 1, weightKg: 220, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-b2', athleteId: 'ath-ipf-2', liftType: 'squat', attemptNumber: 2, weightKg: 235, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-b3', athleteId: 'ath-ipf-2', liftType: 'bench_press', attemptNumber: 1, weightKg: 155, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-b4', athleteId: 'ath-ipf-2', liftType: 'bench_press', attemptNumber: 2, weightKg: 165, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-b5', athleteId: 'ath-ipf-2', liftType: 'deadlift', attemptNumber: 1, weightKg: 265, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-b6', athleteId: 'ath-ipf-2', liftType: 'deadlift', attemptNumber: 2, weightKg: 280, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },

      // Marcus O'Connor: (SQ: 230, BP: 155, DL: 265 -> 650 kg total)
      { id: 'att-ipf-m1', athleteId: 'ath-ipf-3', liftType: 'squat', attemptNumber: 1, weightKg: 215, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-m2', athleteId: 'ath-ipf-3', liftType: 'squat', attemptNumber: 2, weightKg: 230, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-m3', athleteId: 'ath-ipf-3', liftType: 'bench_press', attemptNumber: 1, weightKg: 145, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-m4', athleteId: 'ath-ipf-3', liftType: 'bench_press', attemptNumber: 2, weightKg: 155, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-m5', athleteId: 'ath-ipf-3', liftType: 'deadlift', attemptNumber: 1, weightKg: 250, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-ipf-m6', athleteId: 'ath-ipf-3', liftType: 'deadlift', attemptNumber: 2, weightKg: 265, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    ];

    this.events.set(ipfEventId, ipfEvent);
    this.athletes.set(ipfEventId, ipfAthletes);
    this.attempts.set(ipfEventId, ipfAttempts);
  }

  public static getEvents(): CompetitionEvent[] {
    return Array.from(this.events.values());
  }

  public static getEvent(id: string): CompetitionEvent | undefined {
    return this.events.get(id);
  }

  public static saveEvent(event: CompetitionEvent): void {
    this.events.set(event.id, event);
  }

  public static getAthletes(eventId: string): Athlete[] {
    return this.athletes.get(eventId) || [];
  }

  public static saveAthletes(eventId: string, athletes: Athlete[]): void {
    this.athletes.set(eventId, athletes);
  }

  public static getAttempts(eventId: string): Attempt[] {
    return this.attempts.get(eventId) || [];
  }

  public static saveAttempts(eventId: string, attempts: Attempt[]): void {
    this.attempts.set(eventId, attempts);
  }
}

