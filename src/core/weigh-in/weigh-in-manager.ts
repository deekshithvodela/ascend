import { Athlete, WeighInRecord, WeighInStatus, RackHeights } from '../types/athlete';
import { WeightCategory } from '../types/competition';

export interface WeighInEvaluationResult {
  status: WeighInStatus;
  verifiedCategory?: string;
  isEligible: boolean;
  message: string;
}

export class WeighInManager {
  /**
   * Evaluates measured bodyweight against category boundaries.
   */
  public static evaluateCategoryEligibility(
    measuredWeightKg: number,
    declaredCategoryName: string,
    categories: WeightCategory[]
  ): WeighInEvaluationResult {
    const targetCategory = categories.find((c) => c.name === declaredCategoryName);

    if (!targetCategory) {
      return {
        status: 'passed',
        verifiedCategory: declaredCategoryName,
        isEligible: true,
        message: 'No specific category constraints configured. Passed for open category.',
      };
    }

    if (targetCategory.minWeightKg !== undefined && measuredWeightKg < targetCategory.minWeightKg) {
      return {
        status: 'failed',
        isEligible: false,
        message: `Underweight for ${targetCategory.name} (Minimum ${targetCategory.minWeightKg} kg, measured ${measuredWeightKg} kg).`,
      };
    }

    if (
      !targetCategory.isUnlimited &&
      targetCategory.maxWeightKg !== undefined &&
      measuredWeightKg > targetCategory.maxWeightKg
    ) {
      return {
        status: 'failed',
        isEligible: false,
        message: `Overweight for ${targetCategory.name} (Maximum ${targetCategory.maxWeightKg} kg, measured ${measuredWeightKg} kg). Re-weigh permitted within 2-hour window.`,
      };
    }

    return {
      status: 'passed',
      verifiedCategory: targetCategory.name,
      isEligible: true,
      message: `Verified bodyweight ${measuredWeightKg} kg within ${targetCategory.name} limits.`,
    };
  }

  /**
   * Records a weigh-in attempt (initial or re-weigh) with official attribution.
   */
  public static recordWeighIn(
    athlete: Athlete,
    measuredWeightKg: number,
    officialId: string,
    officialName: string,
    categories: WeightCategory[],
    notes?: string
  ): { updatedAthlete: Athlete; record: WeighInRecord; evaluation: WeighInEvaluationResult } {
    const evaluation = this.evaluateCategoryEligibility(
      measuredWeightKg,
      athlete.declaredWeightCategory,
      categories
    );

    const record: WeighInRecord = {
      id: `wrec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      attemptNumber: (athlete.weighInRecords?.length || 0) + 1,
      timestamp: new Date().toISOString(),
      measuredWeightKg,
      officialId,
      officialName,
      status: evaluation.status,
      notes: notes || evaluation.message,
    };

    const updatedAthlete: Athlete = {
      ...athlete,
      officialBodyweightKg: evaluation.status === 'passed' ? measuredWeightKg : athlete.officialBodyweightKg,
      verifiedWeightCategory: evaluation.status === 'passed' ? evaluation.verifiedCategory : athlete.verifiedWeightCategory,
      weighInStatus: evaluation.status,
      weighInRecords: [...(athlete.weighInRecords || []), record],
      updatedAt: new Date().toISOString(),
    };

    return {
      updatedAthlete,
      record,
      evaluation,
    };
  }

  /**
   * Updates rack heights for platform setup.
   */
  public static updateRackHeights(
    athlete: Athlete,
    rackHeights: RackHeights
  ): Athlete {
    return {
      ...athlete,
      rackHeights: {
        ...athlete.rackHeights,
        ...rackHeights,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}

