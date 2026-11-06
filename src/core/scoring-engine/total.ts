import { Attempt, LiftType } from '../types/attempt';

export interface BestLiftsSummary {
  bestSquatKg?: number;
  bestBenchKg?: number;
  bestDeadliftKg?: number;
  totalKg?: number;
  hasSquatAttempts: boolean;
  hasBenchAttempts: boolean;
  hasDeadliftAttempts: boolean;
  isSquatSuccessful: boolean;
  isBenchSuccessful: boolean;
  isDeadliftSuccessful: boolean;
  hasBombedOut: boolean; // 3 failed attempts in any single lift
  bombOutLift?: LiftType;
}

export class TotalCalculator {
  /**
   * Calculates the best successful attempt for each lift and the cumulative total.
   */
  public static calculate(
    attempts: Attempt[],
    numberOfLifts: number = 3,
    threeFailuresElimination: boolean = true
  ): BestLiftsSummary {
    const squatAttempts = attempts.filter((a) => a.liftType === 'squat');
    const benchAttempts = attempts.filter((a) => a.liftType === 'bench_press');
    const deadliftAttempts = attempts.filter((a) => a.liftType === 'deadlift');

    const getBest = (liftAttempts: Attempt[]) => {
      const successful = liftAttempts
        .filter((a) => a.status === 'good_lift')
        .map((a) => a.weightKg);
      return successful.length > 0 ? Math.max(...successful) : undefined;
    };

    const bestSquat = getBest(squatAttempts);
    const bestBench = getBest(benchAttempts);
    const bestDeadlift = getBest(deadliftAttempts);

    // Check if 3 attempts were completed and all failed (bomb out)
    const isBombOut = (liftAttempts: Attempt[]) => {
      const finished = liftAttempts.filter((a) => a.status === 'good_lift' || a.status === 'no_lift');
      return finished.length >= 3 && !finished.some((a) => a.status === 'good_lift');
    };

    let hasBombedOut = false;
    let bombOutLift: LiftType | undefined;

    if (threeFailuresElimination) {
      if (isBombOut(squatAttempts)) {
        hasBombedOut = true;
        bombOutLift = 'squat';
      } else if (isBombOut(benchAttempts)) {
        hasBombedOut = true;
        bombOutLift = 'bench_press';
      } else if (isBombOut(deadliftAttempts)) {
        hasBombedOut = true;
        bombOutLift = 'deadlift';
      }
    }

    // A valid total in 3-lift powerlifting requires a successful lift in all contested disciplines
    let totalKg: number | undefined;
    if (hasBombedOut) {
      totalKg = 0; // In IPF rules, athlete has no total / subtotal is invalid
    } else if (numberOfLifts === 3) {
      if (bestSquat !== undefined && bestBench !== undefined && bestDeadlift !== undefined) {
        totalKg = +(bestSquat + bestBench + bestDeadlift).toFixed(2);
      }
    } else if (numberOfLifts === 1) {
      // Single lift (e.g. Bench Only)
      totalKg = bestBench ?? bestDeadlift ?? bestSquat;
    }

    return {
      bestSquatKg: bestSquat,
      bestBenchKg: bestBench,
      bestDeadliftKg: bestDeadlift,
      totalKg,
      hasSquatAttempts: squatAttempts.length > 0,
      hasBenchAttempts: benchAttempts.length > 0,
      hasDeadliftAttempts: deadliftAttempts.length > 0,
      isSquatSuccessful: bestSquat !== undefined,
      isBenchSuccessful: bestBench !== undefined,
      isDeadliftSuccessful: bestDeadlift !== undefined,
      hasBombedOut,
      bombOutLift,
    };
  }
}

