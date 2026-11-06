import { Sex } from '../types/athlete';

export class WilksCalculator {
  // Classic Wilks coefficients
  private static readonly CLASSIC_MALE = {
    a: -216.0475144,
    b: 16.2606339,
    c: -0.002388645,
    d: -0.00113732,
    e: 0.00000701863,
    f: -0.00000001291,
  };

  private static readonly CLASSIC_FEMALE = {
    a: 594.31747775582,
    b: -27.23842536447,
    c: 0.82112226871,
    d: -0.00930733913,
    e: 0.00004731582,
    f: -0.00000009054,
  };

  // Wilks 2020 coefficients
  private static readonly WILKS_2020_MALE = {
    a: 47.4617885411949,
    b: 8.47252971288316,
    c: 0.0736941034626354,
    d: -0.00139583381097585,
    e: 0.00000707665973070743,
    f: -0.0000000120804336482357,
  };

  private static readonly WILKS_2020_FEMALE = {
    a: -125.425539779509,
    b: 13.7121941940668,
    c: -0.0330725146581334,
    d: -0.0010504000506583,
    e: 0.00000938773881462799,
    f: -0.000000023334613884954,
  };

  public static calculate(
    totalKg: number | undefined,
    bodyweightKg: number | undefined,
    sex: Sex,
    is2020: boolean = false,
    decimalPrecision: number = 2
  ): number | undefined {
    if (!totalKg || totalKg <= 0 || !bodyweightKg || bodyweightKg <= 0) {
      return undefined;
    }

    const bw = bodyweightKg;
    const coeffs = is2020
      ? sex === 'F'
        ? this.WILKS_2020_FEMALE
        : this.WILKS_2020_MALE
      : sex === 'F'
      ? this.CLASSIC_FEMALE
      : this.CLASSIC_MALE;

    const denominator =
      coeffs.a +
      coeffs.b * bw +
      coeffs.c * Math.pow(bw, 2) +
      coeffs.d * Math.pow(bw, 3) +
      coeffs.e * Math.pow(bw, 4) +
      coeffs.f * Math.pow(bw, 5);

    if (denominator <= 0) {
      return undefined;
    }

    const wilks = (totalKg * 500) / denominator;
    const factor = Math.pow(10, decimalPrecision);
    return Math.round(wilks * factor) / factor;
  }
}

