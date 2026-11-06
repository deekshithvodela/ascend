import { CompetitionRules } from '../types/competition';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  autoFixSuggestions: {
    field: keyof CompetitionRules;
    recommendedValue: any;
    reason: string;
  }[];
}

export class RulesDependencyValidator {
  public static validate(rules: CompetitionRules): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const autoFixSuggestions: ValidationResult['autoFixSuggestions'] = [];

    // 1. Weight Categories Dependency
    if (rules.primaryRankingMetric === 'weight_category_total') {
      if (!rules.weightCategoriesEnabled) {
        errors.push('Official weight-category ranking is enabled, but Weight Categories are currently disabled.');
        autoFixSuggestions.push({
          field: 'weightCategoriesEnabled',
          recommendedValue: true,
          reason: 'Enable weight categories to support category-based ranking.',
        });
      } else if (!rules.categories || rules.categories.length === 0) {
        errors.push('Official weight-category ranking is enabled, but no weight categories have been configured.');
      }
    }

    // 2. Bodyweight Ratio Consistency
    if (rules.bodyweightRatioIsPrimary && rules.primaryRankingMetric !== 'bodyweight_ratio') {
      warnings.push('Bodyweight ratio is marked as primary, but the primary ranking metric is set to another value.');
      autoFixSuggestions.push({
        field: 'primaryRankingMetric',
        recommendedValue: 'bodyweight_ratio',
        reason: 'Sync primaryRankingMetric with bodyweightRatioIsPrimary flag.',
      });
    }

    if (rules.profileId === 'ipf_inspired' && rules.primaryRankingMetric === 'bodyweight_ratio') {
      errors.push('Official IPF technical rules do not permit bodyweight ratio as the primary ranking metric. IPF requires total-based ranking within weight categories.');
      autoFixSuggestions.push({
        field: 'primaryRankingMetric',
        recommendedValue: 'weight_category_total',
        reason: 'Restore official IPF category total ranking.',
      });
    }

    // 3. Official Weigh-In Dependencies
    if (rules.weightCategoriesEnabled && !rules.officialWeighInEnabled && !rules.openWeightDefault) {
      warnings.push('Weight categories are enabled without official weigh-in. Athletes will rely on self-reported bodyweights.');
    }

    if (rules.officialWeighInEnabled && rules.weighInWindowHours <= 0) {
      errors.push('Weigh-in window must be greater than 0 hours.');
    }

    // 4. Referee System Dependencies
    if (rules.judgingMode === 'three_referee' && rules.majorityThreshold < 2) {
      errors.push('Three-referee judging requires a majority threshold of at least 2 out of 3 lights.');
      autoFixSuggestions.push({
        field: 'majorityThreshold',
        recommendedValue: 2,
        reason: 'Set majority threshold to 2 for 3-referee panel.',
      });
    }

    // 5. Scheduling & Flight Size
    if (rules.schedulingMode === 'round_based') {
      if (rules.flightSizeMax < 1 || rules.flightSizeMax > 20) {
        warnings.push(`Flight size of ${rules.flightSizeMax} is outside standard federation recommendations (typically 8–14 lifters).`);
      }
      if (rules.declarationDeadlineSeconds < 30) {
        warnings.push('Attempt declaration deadline is set to under 30 seconds, which may be difficult for lifters and platform managers.');
      }
    }

    // 6. Elimination & Integrity
    if (rules.profileId === 'ipf_inspired' && !rules.threeFailuresElimination) {
      warnings.push('IPF Technical Rules require automatic elimination from the total after three unsuccessful attempts in any single lift.');
      autoFixSuggestions.push({
        field: 'threeFailuresElimination',
        recommendedValue: true,
        reason: 'Enable three-failures elimination for IPF compliance.',
      });
    }

    // 7. Equipment Inspection
    if (rules.equipmentInspectionEnabled && (!rules.inspectionChecklists || rules.inspectionChecklists.length === 0)) {
      warnings.push('Equipment inspection is enabled, but the inspection checklist is empty.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      autoFixSuggestions,
    };
  }
}

