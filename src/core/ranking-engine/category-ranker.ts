import { Athlete } from '../types/athlete';
import { Attempt } from '../types/attempt';
import { CompetitionRules } from '../types/competition';
import { AthleteStanding } from '../types/ranking';
import { TotalCalculator } from '../scoring-engine/total';
import { BodyweightRatioCalculator } from '../scoring-engine/bodyweight-ratio';
import { DotsCalculator } from '../scoring-engine/dots';
import { WilksCalculator } from '../scoring-engine/wilks';
import { TieBreakerEngine } from '../tie-breaker-engine/tie-breaker';

export class CategoryRanker {
  /**
   * Generates official rankings grouped by weight category.
   * Strictly respects federation tie-breakers and elimination rules.
   */
  public static rankByCategories(
    athletes: Athlete[],
    attempts: Attempt[],
    rules: CompetitionRules,
    isFinalized: boolean = false
  ): Record<string, AthleteStanding[]> {
    // 1. Compile standings for each athlete
    const allStandings: AthleteStanding[] = athletes.map((athlete) => {
      const athleteAttempts = attempts.filter((a) => a.athleteId === athlete.id);
      const summary = TotalCalculator.calculate(
        athleteAttempts,
        rules.numberOfLifts,
        rules.threeFailuresElimination
      );

      // Status resolution
      let status = athlete.lifterStatus;
      let statusReason = athlete.statusReason;

      if (rules.threeFailuresElimination && summary.hasBombedOut) {
        status = 'eliminated';
        statusReason = `Disqualified from total: 3 failed attempts in ${summary.bombOutLift?.replace('_', ' ')}`;
      } else if (
        summary.isSquatSuccessful &&
        summary.isBenchSuccessful &&
        summary.isDeadliftSuccessful
      ) {
        status = 'completed';
      }

      // Check if all lifts are completed
      const allCompleted = summary.totalKg !== undefined && summary.totalKg > 0;

      const bodyweightRatio = rules.bodyweightRatioEnabled
        ? BodyweightRatioCalculator.calculate({
            totalKg: summary.totalKg,
            bodyweightKg: athlete.officialBodyweightKg,
            lifterStatus: status,
            allRequiredLiftsCompleted: allCompleted,
            decimalPrecision: rules.decimalPrecision,
            roundingMode: rules.roundingMode,
            allowProvisional: !isFinalized,
          })
        : undefined;

      const dots = DotsCalculator.calculate(
        summary.totalKg,
        athlete.officialBodyweightKg,
        athlete.sex,
        rules.decimalPrecision
      );

      const wilks = WilksCalculator.calculate(
        summary.totalKg,
        athlete.officialBodyweightKg,
        athlete.sex,
        false,
        rules.decimalPrecision
      );

      const categoryName =
        athlete.verifiedWeightCategory || athlete.declaredWeightCategory || 'Open';

      return {
        athleteId: athlete.id,
        lotNumber: athlete.lotNumber,
        name: `${athlete.firstName} ${athlete.lastName}`,
        team: athlete.teamOrAffiliation,
        category: categoryName,
        officialBodyweightKg: athlete.officialBodyweightKg,
        lifterStatus: status,
        statusReason,
        bestSquatKg: summary.bestSquatKg,
        bestBenchKg: summary.bestBenchKg,
        bestDeadliftKg: summary.bestDeadliftKg,
        totalKg: summary.totalKg,
        bodyweightRatio,
        dots,
        wilks,
        attempts: athleteAttempts,
      };
    });

    // 2. Group by category
    const grouped: Record<string, AthleteStanding[]> = {};
    for (const standing of allStandings) {
      const cat = standing.category;
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(standing);
    }

    // 3. Sort each category group using configured tie-breakers and assign categoryRank
    for (const cat in grouped) {
      const sorted = TieBreakerEngine.sortAndAnnotate(grouped[cat], rules.tieBreakers);
      sorted.forEach((item, index) => {
        // If athlete is eliminated or disqualified, they do not receive an official placing
        if (item.lifterStatus === 'eliminated' || item.lifterStatus === 'disqualified') {
          item.categoryRank = undefined;
        } else {
          item.categoryRank = index + 1;
        }
      });
      grouped[cat] = sorted;
    }

    return grouped;
  }
}
