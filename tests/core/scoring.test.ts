import { describe, it, expect } from 'vitest';
import { TotalCalculator } from '../../src/core/scoring-engine/total';
import { BodyweightRatioCalculator } from '../../src/core/scoring-engine/bodyweight-ratio';
import { DotsCalculator } from '../../src/core/scoring-engine/dots';
import { WilksCalculator } from '../../src/core/scoring-engine/wilks';
import { Attempt } from '../../src/core/types/attempt';

describe('Scoring Engine', () => {
  describe('TotalCalculator', () => {
    it('calculates best lifts and total when all lifts have successful attempts', () => {
      const attempts: Attempt[] = [
        { id: '1', athleteId: 'ath1', liftType: 'squat', attemptNumber: 1, weightKg: 200, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '2', athleteId: 'ath1', liftType: 'squat', attemptNumber: 2, weightKg: 210, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '3', athleteId: 'ath1', liftType: 'squat', attemptNumber: 3, weightKg: 220, status: 'no_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '4', athleteId: 'ath1', liftType: 'bench_press', attemptNumber: 1, weightKg: 140, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '5', athleteId: 'ath1', liftType: 'bench_press', attemptNumber: 2, weightKg: 145, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '6', athleteId: 'ath1', liftType: 'bench_press', attemptNumber: 3, weightKg: 150, status: 'no_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '7', athleteId: 'ath1', liftType: 'deadlift', attemptNumber: 1, weightKg: 250, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '8', athleteId: 'ath1', liftType: 'deadlift', attemptNumber: 2, weightKg: 260, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '9', athleteId: 'ath1', liftType: 'deadlift', attemptNumber: 3, weightKg: 270, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      ];

      const result = TotalCalculator.calculate(attempts, 3, true);
      expect(result.bestSquatKg).toBe(210);
      expect(result.bestBenchKg).toBe(145);
      expect(result.bestDeadliftKg).toBe(270);
      expect(result.totalKg).toBe(625);
      expect(result.hasBombedOut).toBe(false);
    });

    it('calculates total accurately for a 2-attempt per lift competition format', () => {
      const attempts2: Attempt[] = [
        { id: '1', athleteId: 'ath1', liftType: 'squat', attemptNumber: 1, weightKg: 190, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '2', athleteId: 'ath1', liftType: 'squat', attemptNumber: 2, weightKg: 205, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '3', athleteId: 'ath1', liftType: 'bench_press', attemptNumber: 1, weightKg: 130, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '4', athleteId: 'ath1', liftType: 'bench_press', attemptNumber: 2, weightKg: 140, status: 'no_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '5', athleteId: 'ath1', liftType: 'deadlift', attemptNumber: 1, weightKg: 240, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
        { id: '6', athleteId: 'ath1', liftType: 'deadlift', attemptNumber: 2, weightKg: 255, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      ];

      // Total = 205 + 130 + 255 = 590 kg
      const result = TotalCalculator.calculate(attempts2, 3, false);
      expect(result.bestSquatKg).toBe(205);
      expect(result.bestBenchKg).toBe(130);
      expect(result.bestDeadliftKg).toBe(255);
      expect(result.totalKg).toBe(590);
    });
  });

  describe('BodyweightRatioCalculator', () => {
    it('computes total / bodyweight accurately with precision', () => {
      const ratio = BodyweightRatioCalculator.calculate({
        totalKg: 625,
        bodyweightKg: 82.5,
        lifterStatus: 'completed',
        allRequiredLiftsCompleted: true,
        decimalPrecision: 2,
      });

      // 625 / 82.5 = 7.5757... -> 7.58
      expect(ratio).toBe(7.58);
    });

    it('returns undefined if athlete is eliminated or disqualified', () => {
      const ratio = BodyweightRatioCalculator.calculate({
        totalKg: 625,
        bodyweightKg: 82.5,
        lifterStatus: 'eliminated',
        allRequiredLiftsCompleted: false,
      });
      expect(ratio).toBeUndefined();
    });

    it('returns undefined if lifts incomplete and provisional is false', () => {
      const ratio = BodyweightRatioCalculator.calculate({
        totalKg: 400,
        bodyweightKg: 80,
        lifterStatus: 'active',
        allRequiredLiftsCompleted: false,
        allowProvisional: false,
      });
      expect(ratio).toBeUndefined();
    });
  });

  describe('DOTS and Wilks', () => {
    it('computes positive DOTS points for valid lifts', () => {
      const dotsM = DotsCalculator.calculate(600, 83.0, 'M', 2);
      expect(dotsM).toBeGreaterThan(390);
      expect(dotsM).toBeLessThan(420);

      const dotsF = DotsCalculator.calculate(400, 63.0, 'F', 2);
      expect(dotsF).toBeGreaterThan(390);
      expect(dotsF).toBeLessThan(440);
    });

    it('computes Wilks points accurately', () => {
      const wilksM = WilksCalculator.calculate(600, 83.0, 'M', false, 2);
      expect(wilksM).toBeGreaterThan(380);
      expect(wilksM).toBeLessThan(420);
    });
  });
});
