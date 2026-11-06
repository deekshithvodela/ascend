export type CompetitionProfileId = 'ascend_open' | 'ipf_inspired' | 'custom';

export type CompetitionType =
  | 'powerlifting'
  | 'single_lift'
  | 'bench_press_only'
  | 'squat_only'
  | 'deadlift_only'
  | 'custom';

export type RankingMetric =
  | 'bodyweight_ratio'
  | 'total_weight'
  | 'dots'
  | 'wilks'
  | 'wilks_2020'
  | 'custom_formula'
  | 'weight_category_total';

export type TieBreakCriterion =
  | 'total_weight'
  | 'lower_bodyweight'
  | 'order_of_achievement'
  | 'higher_deadlift'
  | 'higher_squat'
  | 'higher_bench'
  | 'bodyweight_ratio'
  | 'custom';

export type RoundingMode = 'half_up' | 'floor' | 'ceil';

export interface WeightCategory {
  id: string;
  name: string;
  gender: 'M' | 'F' | 'MX';
  minWeightKg?: number;
  maxWeightKg?: number;
  division?: string;
  isUnlimited?: boolean;
}

export interface EquipmentChecklistItem {
  id: string;
  name: string;
  category: 'clothing' | 'belt' | 'footwear' | 'wraps_sleeves' | 'platform_bar';
  required: boolean;
  notes?: string;
}

export interface CompetitionRules {
  // Profile Metadata
  profileId: CompetitionProfileId;
  profileName: string;
  profileVersion: string;
  federationRulebookVersion?: string;
  effectiveDate?: string;
  isFederationCompliant: boolean;
  complianceDisclaimer?: string;

  // Format
  competitionType: CompetitionType;
  numberOfLifts: number;
  attemptsPerLift: number;
  allowAdditionalAttempts: boolean;
  allowReattempts: boolean;
  enableTeamScoring: boolean;
  enableIndividualLiftAwards: boolean;

  // Weight Categories
  weightCategoriesEnabled: boolean;
  categories: WeightCategory[];
  allowManualCategoryReassignment: boolean;
  openWeightDefault: boolean;

  // Scoring & Ranking
  primaryRankingMetric: RankingMetric;
  secondaryRankingMetrics: RankingMetric[];
  decimalPrecision: number;
  roundingMode: RoundingMode;
  tieBreakers: TieBreakCriterion[];
  leaderboardGrouping: 'category' | 'division' | 'overall';
  distinguishOfficialAndCustom: boolean;

  // Bodyweight Ratio
  bodyweightRatioEnabled: boolean;
  bodyweightRatioIsPrimary: boolean;
  requireAllLiftsCompletedForRatio: boolean;
  hideRatioIfEliminated: boolean;

  // Athlete Registration & Weigh-In
  officialWeighInEnabled: boolean;
  weighInWindowHours: number;
  allowReWeigh: boolean;
  maxWeighInAttempts: number;
  requireOfficialSignoff: boolean;

  // Attempt Management & Scheduling
  schedulingMode: 'simple' | 'round_based';
  flightSizeMax: number;
  declarationDeadlineSeconds: number;
  deadliftAttemptChangesAllowed: number;

  // Referee & Judging
  judgingMode: 'single_operator' | 'multi_judge' | 'three_referee';
  majorityThreshold: number; // e.g. 2 for 3-referee
  requireTechnicalInfractionCodes: boolean;
  allowJuryOverride: boolean;

  // Technical Validation
  technicalValidationEnabled: boolean;
  enforceLiftCommands: boolean;
  enforceSquatDepth: boolean;
  enforceBenchPause: boolean;
  enforceDeadliftLockout: boolean;

  // Elimination & Disqualification
  threeFailuresElimination: boolean; // 3 misses in 1 lift bombs out of total
  preserveLiftAwardsOnTotalElimination: boolean;
  disqualifyOnWeighInFail: boolean;

  // Equipment Inspection
  equipmentInspectionEnabled: boolean;
  inspectionChecklists: EquipmentChecklistItem[];

  // Official Documentation & Audit
  requireOfficialSignatures: boolean;
  auditLoggingEnabled: boolean;
  lockOnFinalization: boolean;
}

export type EventStatus = 'draft' | 'weigh_in' | 'in_progress' | 'finalized' | 'locked';

export interface CompetitionEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  organizer: string;
  chiefRefereeName?: string;
  status: EventStatus;
  rulesSnapshot: CompetitionRules;
  customModifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
}

