import { AthleteStanding } from '../types/ranking';
import { TieBreakCriterion } from '../types/competition';
import { TieBreakerEngine } from '../tie-breaker-engine/tie-breaker';

export class IndividualLiftsRanker {
  /**
   * Ranks competitors for individual discipline awards (Squat, Bench Press, Deadlift).
   * Per IPF rules, if an event awards single lift medals, lifters who fail to register
   * a total can still win a medal in a discipline they successfully completed.
   */
  public static rankIndividualLifts(
    standings: AthleteStanding[],
    preserveOnTotalElimination: boolean = true
  ): {
    squat: AthleteStanding[];
    bench: AthleteStanding[];
    deadlift: AthleteStanding[];
  } {
    const filterEligible = (list: AthleteStanding[], bestWeight?: number) => {
      return list.filter((athlete) => {
        if (!bestWeight || bestWeight <= 0) return false;
        if (athlete.lifterStatus === 'disqualified') return false;
        if (athlete.lifterStatus === 'eliminated' && !preserveOnTotalElimination) return false;
        return true;
      });
    };

    // Squat Ranking
    const squatEligible = filterEligible(
      standings.filter((s) => (s.bestSquatKg ?? 0) > 0),
      1
    );
    const squatCriteria: TieBreakCriterion[] = ['higher_squat', 'lower_bodyweight', 'order_of_achievement'];
    const squatSorted = TieBreakerEngine.sortAndAnnotate(squatEligible, squatCriteria);
    squatSorted.forEach((s, idx) => (s.squatRank = idx + 1));

    // Bench Ranking
    const benchEligible = filterEligible(
      standings.filter((s) => (s.bestBenchKg ?? 0) > 0),
      1
    );
    const benchCriteria: TieBreakCriterion[] = ['higher_bench', 'lower_bodyweight', 'order_of_achievement'];
    const benchSorted = TieBreakerEngine.sortAndAnnotate(benchEligible, benchCriteria);
    benchSorted.forEach((s, idx) => (s.benchRank = idx + 1));

    // Deadlift Ranking
    const deadliftEligible = filterEligible(
      standings.filter((s) => (s.bestDeadliftKg ?? 0) > 0),
      1
    );
    const deadliftCriteria: TieBreakCriterion[] = ['higher_deadlift', 'lower_bodyweight', 'order_of_achievement'];
    const deadliftSorted = TieBreakerEngine.sortAndAnnotate(deadliftEligible, deadliftCriteria);
    deadliftSorted.forEach((s, idx) => (s.deadliftRank = idx + 1));

    return {
      squat: squatSorted,
      bench: benchSorted,
      deadlift: deadliftSorted,
    };
  }
}

