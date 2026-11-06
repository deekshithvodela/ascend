import { LifterStatus } from '../types/athlete';
import { RoundingMode } from '../types/competition';

export interface BodyweightRatioOptions {
  totalKg?: number;
  bodyweightKg?: number;
  lifterStatus: LifterStatus;
  allRequiredLiftsCompleted: boolean;
  decimalPrecision?: number;
  roundingMode?: RoundingMode;
  allowProvisional?: boolean;
}

export class BodyweightRatioCalculator {
  /**
   * Calculates bodyweight ratio = total / bodyweight.
   * Strictly adheres to Section 21.3.D constraints:
   * - Does not calculate a final ratio until all required lifts are completed.
   * - Does not calculate a valid ratio if lifter is eliminated, disqualified, or incomplete.
   */
  public static calculate(options: BodyweightRatioOptions): number | undefined {
    const {
      totalKg,
      bodyweightKg,
      lifterStatus,
      allRequiredLiftsCompleted,
      decimalPrecision = 2,
      roundingMode = 'half_up',
      allowProvisional = false,
    } = options;

    // Guard: Eliminated or disqualified lifters have no valid ratio
    if (
      lifterStatus === 'eliminated' ||
      lifterStatus === 'disqualified' ||
      lifterStatus === 'withdrawn'
    ) {
      return undefined;
    }

    if (!totalKg || totalKg <= 0 || !bodyweightKg || bodyweightKg <= 0) {
      return undefined;
    }

    // Guard: In finalized ranking, all lifts must be completed unless provisional is allowed
    if (!allRequiredLiftsCompleted && !allowProvisional) {
      return undefined;
    }

    const rawRatio = totalKg / bodyweightKg;
    const factor = Math.pow(10, decimalPrecision);

    let rounded: number;
    if (roundingMode === 'floor') {
      rounded = Math.floor(rawRatio * factor) / factor;
    } else if (roundingMode === 'ceil') {
      rounded = Math.ceil(rawRatio * factor) / factor;
    } else {
      rounded = Math.round(rawRatio * factor) / factor;
    }

    return rounded;
  }
}

