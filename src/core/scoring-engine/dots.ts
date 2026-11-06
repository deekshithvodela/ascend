import { Sex } from '../types/athlete';

export class DotsCalculator {
  // Official IPF DOTS polynomial coefficients
  private static readonly MALE_COEFFS = {
    A: -0.000001093,
    B: 0.0007391293,
    C: -0.1918759221,
    D: 24.0900756,
    E: -307.272,
  };

  private static readonly FEMALE_COEFFS = {
    A: -0.0000010706,
    B: 0.0005158568,
    C: -0.1126655495,
    D: 13.6175032,
    E: -57.96288,
  };

  /**
   * Calculates DOTS points based on total lifted and bodyweight.
   */
  public static calculate(
    totalKg: number | undefined,
    bodyweightKg: number | undefined,
    sex: Sex,
    decimalPrecision: number = 2
  ): number | undefined {
    if (!totalKg || totalKg <= 0 || !bodyweightKg || bodyweightKg <= 0) {
      return undefined;
    }

    const bw = bodyweightKg;
    // For non-binary / MX default to average or female table as configured
    const coeffs = sex === 'F' ? this.FEMALE_COEFFS : this.MALE_COEFFS;

    const denominator =
      coeffs.A * Math.pow(bw, 4) +
      coeffs.B * Math.pow(bw, 3) +
      coeffs.C * Math.pow(bw, 2) +
      coeffs.D * bw +
      coeffs.E;

    if (denominator <= 0) {
      return undefined;
    }

    const dots = (totalKg * 500) / denominator;
    const factor = Math.pow(10, decimalPrecision);
    return Math.round(dots * factor) / factor;
  }
}

