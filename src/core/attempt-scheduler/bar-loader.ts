import { BarPlateBreakdown } from '../types/attempt';

export interface PlateSpec {
  weightKg: number;
  color: string;
}

export const STANDARD_PLATES: PlateSpec[] = [
  { weightKg: 25.0, color: 'Red' },
  { weightKg: 20.0, color: 'Blue' },
  { weightKg: 15.0, color: 'Yellow' },
  { weightKg: 10.0, color: 'Green' },
  { weightKg: 5.0, color: 'White' },
  { weightKg: 2.5, color: 'Black' },
  { weightKg: 1.25, color: 'Silver' },
  { weightKg: 0.5, color: 'Chrome' },
  { weightKg: 0.25, color: 'Chrome' },
];

export class BarLoaderCalculator {
  /**
   * Calculates the plate loading breakdown for loaders.
   * Standard IPF competition setup:
   * - 20 kg bar
   * - 5 kg collars (2.5 kg each collar)
   * Minimum loaded weight = 25 kg.
   */
  public static calculate(
    targetWeightKg: number,
    barWeightKg: number = 20,
    collarsWeightKg: number = 5
  ): BarPlateBreakdown {
    const minWeight = barWeightKg + collarsWeightKg;

    if (targetWeightKg < minWeight) {
      return {
        barbellWeightKg: barWeightKg,
        collarsWeightKg,
        totalWeightKg: minWeight,
        platesPerSide: [],
      };
    }

    let remainingWeightPerSide = (targetWeightKg - minWeight) / 2;
    const platesPerSide: { weightKg: number; count: number; color: string }[] = [];

    for (const plate of STANDARD_PLATES) {
      if (remainingWeightPerSide >= plate.weightKg) {
        const count = Math.floor(remainingWeightPerSide / plate.weightKg);
        remainingWeightPerSide = +(remainingWeightPerSide - count * plate.weightKg).toFixed(4);
        platesPerSide.push({
          weightKg: plate.weightKg,
          count,
          color: plate.color,
        });
      }
    }

    return {
      barbellWeightKg: barWeightKg,
      collarsWeightKg,
      totalWeightKg: targetWeightKg,
      platesPerSide,
    };
  }
}

