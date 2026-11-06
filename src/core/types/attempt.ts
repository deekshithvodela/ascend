export type LiftType = 'squat' | 'bench_press' | 'deadlift';

export type AttemptStatus = 'pending' | 'good_lift' | 'no_lift' | 'skipped' | 'disqualified';

export type RefereeDecision = 'good_lift' | 'no_lift';

export type RefereeRole = 'chief' | 'left' | 'right' | 'operator';

export interface RefereeVote {
  refereeId: string;
  refereeName?: string;
  refereeRole: RefereeRole;
  decision: RefereeDecision;
  timestamp: string;
  infractionReasonCodes?: string[];
}

export interface Attempt {
  id: string;
  athleteId: string;
  liftType: LiftType;
  attemptNumber: number; // 1, 2, 3 (or 4 for record attempt if allowed)
  weightKg: number;
  status: AttemptStatus;
  refereeVotes: RefereeVote[];
  majorityDecision?: RefereeDecision;
  isJuryOverride?: boolean;
  juryOverrideReason?: string;
  juryOverrideBy?: string;
  declaredAt: string;
  declarationChangeCount: number;
  timestamp?: string; // when executed
}

export interface FlightGroup {
  id: string;
  name: string; // "Flight A", "Flight B"
  athleteIds: string[];
  liftType: LiftType;
  currentRound: number;
}

export interface BarPlateBreakdown {
  barbellWeightKg: number;
  collarsWeightKg: number;
  totalWeightKg: number;
  platesPerSide: {
    weightKg: number;
    count: number;
    color: string;
  }[];
}

