import { CompetitionRules } from '../types/competition';

export const CUSTOM_COMPETITION_PROFILE: CompetitionRules = {
  // Profile Metadata
  profileId: 'custom',
  profileName: 'Custom Organizer Configuration',
  profileVersion: '1.0.0',
  isFederationCompliant: false,
  complianceDisclaimer: 'Custom profile allowing meet directors to toggle individual competition modules, scoring rules, and judging systems.',

  // Format
  competitionType: 'powerlifting',
  numberOfLifts: 3,
  attemptsPerLift: 3,
  allowAdditionalAttempts: false,
  allowReattempts: false,
  enableTeamScoring: false,
  enableIndividualLiftAwards: false,

  // Weight Categories
  weightCategoriesEnabled: true,
  categories: [],
  allowManualCategoryReassignment: true,
  openWeightDefault: false,

  // Scoring & Ranking
  primaryRankingMetric: 'total_weight',
  secondaryRankingMetrics: ['bodyweight_ratio', 'dots', 'wilks'],
  decimalPrecision: 2,
  roundingMode: 'half_up',
  tieBreakers: ['total_weight', 'lower_bodyweight', 'order_of_achievement'],
  leaderboardGrouping: 'category',
  distinguishOfficialAndCustom: false,

  // Bodyweight Ratio
  bodyweightRatioEnabled: true,
  bodyweightRatioIsPrimary: false,
  requireAllLiftsCompletedForRatio: true,
  hideRatioIfEliminated: true,

  // Athlete Registration & Weigh-In
  officialWeighInEnabled: true,
  weighInWindowHours: 2,
  allowReWeigh: true,
  maxWeighInAttempts: 3,
  requireOfficialSignoff: false,

  // Attempt Management & Scheduling
  schedulingMode: 'round_based',
  flightSizeMax: 15,
  declarationDeadlineSeconds: 60,
  deadliftAttemptChangesAllowed: 2,

  // Referee & Judging
  judgingMode: 'three_referee',
  majorityThreshold: 2,
  requireTechnicalInfractionCodes: true,
  allowJuryOverride: true,

  // Technical Validation
  technicalValidationEnabled: true,
  enforceLiftCommands: true,
  enforceSquatDepth: true,
  enforceBenchPause: true,
  enforceDeadliftLockout: true,

  // Elimination & Disqualification
  threeFailuresElimination: true,
  preserveLiftAwardsOnTotalElimination: true,
  disqualifyOnWeighInFail: false,

  // Equipment Inspection
  equipmentInspectionEnabled: false,
  inspectionChecklists: [],

  // Official Documentation & Audit
  requireOfficialSignatures: false,
  auditLoggingEnabled: true,
  lockOnFinalization: true,
};

