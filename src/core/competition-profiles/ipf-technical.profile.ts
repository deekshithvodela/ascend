import { CompetitionRules, WeightCategory, EquipmentChecklistItem } from '../types/competition';

export const IPF_STANDARD_CATEGORIES: WeightCategory[] = [
  // Men's Categories
  { id: 'ipf-m-53', name: '53 kg (Sub-Junior/Junior)', gender: 'M', maxWeightKg: 53.0, division: 'Sub-Junior/Junior' },
  { id: 'ipf-m-59', name: '59 kg', gender: 'M', minWeightKg: 53.01, maxWeightKg: 59.0 },
  { id: 'ipf-m-66', name: '66 kg', gender: 'M', minWeightKg: 59.01, maxWeightKg: 66.0 },
  { id: 'ipf-m-74', name: '74 kg', gender: 'M', minWeightKg: 66.01, maxWeightKg: 74.0 },
  { id: 'ipf-m-83', name: '83 kg', gender: 'M', minWeightKg: 74.01, maxWeightKg: 83.0 },
  { id: 'ipf-m-93', name: '93 kg', gender: 'M', minWeightKg: 83.01, maxWeightKg: 93.0 },
  { id: 'ipf-m-105', name: '105 kg', gender: 'M', minWeightKg: 93.01, maxWeightKg: 105.0 },
  { id: 'ipf-m-120', name: '120 kg', gender: 'M', minWeightKg: 105.01, maxWeightKg: 120.0 },
  { id: 'ipf-m-120plus', name: '120+ kg', gender: 'M', minWeightKg: 120.01, isUnlimited: true },

  // Women's Categories
  { id: 'ipf-f-43', name: '43 kg (Sub-Junior/Junior)', gender: 'F', maxWeightKg: 43.0, division: 'Sub-Junior/Junior' },
  { id: 'ipf-f-47', name: '47 kg', gender: 'F', minWeightKg: 43.01, maxWeightKg: 47.0 },
  { id: 'ipf-f-52', name: '52 kg', gender: 'F', minWeightKg: 47.01, maxWeightKg: 52.0 },
  { id: 'ipf-f-57', name: '57 kg', gender: 'F', minWeightKg: 52.01, maxWeightKg: 57.0 },
  { id: 'ipf-f-63', name: '63 kg', gender: 'F', minWeightKg: 57.01, maxWeightKg: 63.0 },
  { id: 'ipf-f-69', name: '69 kg', gender: 'F', minWeightKg: 63.01, maxWeightKg: 69.0 },
  { id: 'ipf-f-76', name: '76 kg', gender: 'F', minWeightKg: 69.01, maxWeightKg: 76.0 },
  { id: 'ipf-f-84', name: '84 kg', gender: 'F', minWeightKg: 76.01, maxWeightKg: 84.0 },
  { id: 'ipf-f-84plus', name: '84+ kg', gender: 'F', minWeightKg: 84.01, isUnlimited: true },
];

export const IPF_STANDARD_EQUIPMENT_CHECKLIST: EquipmentChecklistItem[] = [
  { id: 'eq-singlet', name: 'Lifting Suit (Singlet) - IPF Approved Spec', category: 'clothing', required: true },
  { id: 'eq-shirt', name: 'T-Shirt (Round Neck, Cotton/Poly, Non-Supportive)', category: 'clothing', required: true },
  { id: 'eq-belt', name: 'Lifting Belt (Max width 10cm, thickness 13mm)', category: 'belt', required: true },
  { id: 'eq-sleeves', name: 'Knee Sleeves (Max length 30cm, thickness 7mm, non-supportive)', category: 'wraps_sleeves', required: true },
  { id: 'eq-wristwraps', name: 'Wrist Wraps (Max length 1m, width 8cm)', category: 'wraps_sleeves', required: false },
  { id: 'eq-shoes', name: 'Shoes / Deadlift Slippers / Socks', category: 'footwear', required: true },
  { id: 'eq-platform', name: 'Platform (Min 2.5m x 2.5m, non-slip surface)', category: 'platform_bar', required: true },
  { id: 'eq-bar-plates', name: 'IPF Calibrated Barbell & Discs', category: 'platform_bar', required: true },
];

export const IPF_COMPETITION_PROFILE: CompetitionRules = {
  // Profile Metadata
  profileId: 'ipf_inspired',
  profileName: 'IPF Technical Competition Mode',
  profileVersion: '2024.1.0',
  federationRulebookVersion: 'IPF Technical Rules Book 2024 (v1.0)',
  effectiveDate: '2024-01-01',
  isFederationCompliant: true,
  complianceDisclaimer:
    'IMPORTANT: Implementing these technical procedures does not itself confer IPF sanctioning, certification or official recognition. Actual compliance must be validated against the applicable federation requirements and by qualified competition officials.',

  // Format
  competitionType: 'powerlifting',
  numberOfLifts: 3,
  attemptsPerLift: 3,
  allowAdditionalAttempts: false, // 4th attempt only for official record breaking outside total
  allowReattempts: false,
  enableTeamScoring: true,
  enableIndividualLiftAwards: true,

  // Weight Categories (Mandatory official IPF categories)
  weightCategoriesEnabled: true,
  categories: IPF_STANDARD_CATEGORIES,
  allowManualCategoryReassignment: false, // strictly assigned by weigh-in bodyweight
  openWeightDefault: false,

  // Scoring & Ranking (Official total by weight category, strictly NO substituting formulas)
  primaryRankingMetric: 'weight_category_total',
  secondaryRankingMetrics: ['dots'],
  decimalPrecision: 1, // IPF weights are typically 0.5kg or 2.5kg increments
  roundingMode: 'half_up',
  tieBreakers: ['total_weight', 'lower_bodyweight', 'order_of_achievement'],
  leaderboardGrouping: 'category',
  distinguishOfficialAndCustom: true,

  // Bodyweight Ratio (IPF does not rank by ratio)
  bodyweightRatioEnabled: false,
  bodyweightRatioIsPrimary: false,
  requireAllLiftsCompletedForRatio: true,
  hideRatioIfEliminated: true,

  // Official Athlete Registration & Weigh-In (Strict 2-hour window)
  officialWeighInEnabled: true,
  weighInWindowHours: 2,
  allowReWeigh: true, // within the official 2-hour window
  maxWeighInAttempts: 3,
  requireOfficialSignoff: true,

  // Attempt Management & Round-Based Scheduling
  schedulingMode: 'round_based',
  flightSizeMax: 14, // IPF maximum 14 lifters per flight
  declarationDeadlineSeconds: 60, // 1 minute declaration deadline
  deadliftAttemptChangesAllowed: 2, // 2 changes allowed on 3rd attempt deadlift

  // 3-Referee Judging System
  judgingMode: 'three_referee',
  majorityThreshold: 2, // 2 out of 3 white lights = good lift
  requireTechnicalInfractionCodes: true,
  allowJuryOverride: true, // Jury has power to overturn 2-1 or 3-0 decisions per rulebook

  // Technical Validation (IPF Rulebook standards)
  technicalValidationEnabled: true,
  enforceLiftCommands: true,
  enforceSquatDepth: true,
  enforceBenchPause: true,
  enforceDeadliftLockout: true,

  // Elimination & Disqualification
  threeFailuresElimination: true, // 3 unsuccessful attempts in any lift eliminates athlete from total
  preserveLiftAwardsOnTotalElimination: true, // can win bench press medal if bench was successful
  disqualifyOnWeighInFail: true,

  // Equipment Inspection (Mandatory in federation meets)
  equipmentInspectionEnabled: true,
  inspectionChecklists: IPF_STANDARD_EQUIPMENT_CHECKLIST,

  // Official Documentation & Audit
  requireOfficialSignatures: true,
  auditLoggingEnabled: true,
  lockOnFinalization: true,
};

