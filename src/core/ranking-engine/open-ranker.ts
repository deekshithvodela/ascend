import { Athlete } from '../types/athlete';
import { Attempt } from '../types/attempt';
import { CompetitionRules } from '../types/competition';
import { AthleteStanding } from '../types/ranking';
import { TotalCalculator } from '../scoring-engine/total';
import { BodyweightRatioCalculator } from '../scoring-engine/bodyweight-ratio';
import { DotsCalculator } from '../scoring-engine/dots';
import { WilksCalculator } from '../scoring-engine/wilks';
import { TieBreakerEngine } from '../tie-breaker-engine/tie-breaker';

export class OpenRanker {
  /**
   * Generates overall standings for Ascend Open competitions.
   * Uses bodyweight ratio by default, or the configured primary metric.
   */
  public static rankOverall(
    athletes: Athlete[],
    attempts: Attempt[],
    rules: CompetitionRules,
    isFinalized: boolean = false
  ): AthleteStanding[] {
    const standings: AthleteStanding[] = athletes.map((athlete) => {
      const athleteAttempts = attempts.filter((a) => a.athleteId === athlete.id);
      const summary = TotalCalculator.calculate(
        athleteAttempts,
        rules.numberOfLifts,
        rules.threeFailuresElimination
      );

      let status = athlete.lifterStatus;
      let statusReason = athlete.statusReason;

      if (rules.threeFailuresElimination && summary.hasBombedOut) {
        status = 'eliminated';
        statusReason = `Bombed out in ${summary.bombOutLift?.replace('_', ' ')}`;
      } else if (
        summary.isSquatSuccessful &&
        summary.isBenchSuccessful &&
        summary.isDeadliftSuccessful
      ) {
        status = 'completed';
      }

      const allCompleted = summary.totalKg !== undefined && summary.totalKg > 0;

      const bodyweightRatio = BodyweightRatioCalculator.calculate({
        totalKg: summary.totalKg,
        bodyweightKg: athlete.officialBodyweightKg,
        lifterStatus: status,
        allRequiredLiftsCompleted: allCompleted,
        decimalPrecision: rules.decimalPrecision,
        roundingMode: rules.roundingMode,
        allowProvisional: !isFinalized,
      });

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

      return {
        athleteId: athlete.id,
        lotNumber: athlete.lotNumber,
        name: `${athlete.firstName} ${athlete.lastName}`,
        team: athlete.teamOrAffiliation,
        category: athlete.declaredWeightCategory || 'Open',
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

    // Sort using configured tie-breakers
    const sorted = TieBreakerEngine.sortAndAnnotate(standings, rules.tieBreakers);

    // Assign overall rank
    sorted.forEach((item, index) => {
      if (item.lifterStatus === 'eliminated' || item.lifterStatus === 'disqualified') {
        item.overallRank = undefined;
      } else {
        item.overallRank = index + 1;
      }
    });

    return sorted;
  }
}
