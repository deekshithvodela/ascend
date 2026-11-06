import { CompetitionRules } from '../types/competition';

export const ASCEND_OPEN_PROFILE: CompetitionRules = {
  // Profile Metadata
  profileId: 'ascend_open',
  profileName: 'Ascend Open Mode',
  profileVersion: '1.0.0',
  isFederationCompliant: false,
  complianceDisclaimer: 'Ascend Open is an unrestricted, flexible format intended for gym meets, recreational events, and local non-sanctioned competitions.',

  // Format
  competitionType: 'powerlifting',
  numberOfLifts: 3,
  attemptsPerLift: 3,
  allowAdditionalAttempts: true,
  allowReattempts: true,
  enableTeamScoring: false,
  enableIndividualLiftAwards: false,

  // Weight Categories (Disabled by default)
  weightCategoriesEnabled: false,
  categories: [],
  allowManualCategoryReassignment: true,
  openWeightDefault: true,

  // Scoring & Ranking
  primaryRankingMetric: 'bodyweight_ratio',
  secondaryRankingMetrics: ['total_weight', 'dots', 'wilks'],
  decimalPrecision: 2,
  roundingMode: 'half_up',
  tieBreakers: ['bodyweight_ratio', 'total_weight', 'lower_bodyweight'],
  leaderboardGrouping: 'overall',
  distinguishOfficialAndCustom: false,

  // Bodyweight Ratio
  bodyweightRatioEnabled: true,
  bodyweightRatioIsPrimary: true,
  requireAllLiftsCompletedForRatio: true,
  hideRatioIfEliminated: true,

  // Athlete Registration & Weigh-In (Optional)
  officialWeighInEnabled: false,
  weighInWindowHours: 2,
  allowReWeigh: true,
  maxWeighInAttempts: 3,
  requireOfficialSignoff: false,

  // Attempt Management & Scheduling
  schedulingMode: 'simple',
  flightSizeMax: 15,
  declarationDeadlineSeconds: 60,
  deadliftAttemptChangesAllowed: 2,

  // Referee & Judging (Single operator by default)
  judgingMode: 'single_operator',
  majorityThreshold: 1,
  requireTechnicalInfractionCodes: false,
  allowJuryOverride: false,

  // Technical Validation (Optional)
  technicalValidationEnabled: false,
  enforceLiftCommands: false,
  enforceSquatDepth: false,
  enforceBenchPause: false,
  enforceDeadliftLockout: false,

  // Elimination & Disqualification
  threeFailuresElimination: false,
  preserveLiftAwardsOnTotalElimination: true,
  disqualifyOnWeighInFail: false,

  // Equipment Inspection (Disabled by default)
  equipmentInspectionEnabled: false,
  inspectionChecklists: [],

  // Official Documentation & Audit
  requireOfficialSignatures: false,
  auditLoggingEnabled: true,
  lockOnFinalization: true,
};

