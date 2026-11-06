import { describe, it, expect } from 'vitest';
import { WeighInManager } from '../../src/core/weigh-in/weigh-in-manager';
import { IPF_STANDARD_CATEGORIES } from '../../src/core/competition-profiles/ipf-technical.profile';
import { Athlete } from '../../src/core/types/athlete';

describe('Official Weigh-In Engine', () => {
  const athlete: Athlete = {
    id: 'ath-1',
    eventId: 'evt-1',
    lotNumber: 1,
    registrationNumber: 'IPF-101',
    firstName: 'Sarah',
    lastName: 'Connor',
    sex: 'F',
    ageCategory: 'open',
    equipmentDivision: 'raw',
    declaredWeightCategory: '63 kg',
    weighInRecords: [],
    weighInStatus: 'pending',
    rackHeights: {},
    lifterStatus: 'active',
    createdAt: '',
    updatedAt: '',
  };

  it('approves weigh-in within category boundaries (e.g. 62.4kg for 63kg category)', () => {
    const result = WeighInManager.recordWeighIn(
      athlete,
      62.4,
      'off-1',
      'Referee Jenkins',
      IPF_STANDARD_CATEGORIES
    );

    expect(result.evaluation.status).toBe('passed');
    expect(result.updatedAthlete.weighInStatus).toBe('passed');
    expect(result.updatedAthlete.officialBodyweightKg).toBe(62.4);
    expect(result.record.officialName).toBe('Referee Jenkins');
  });

  it('rejects overweight lifter (e.g. 63.8kg for 63kg category) and logs re-weigh option', () => {
    const result = WeighInManager.recordWeighIn(
      athlete,
      63.8,
      'off-1',
      'Referee Jenkins',
      IPF_STANDARD_CATEGORIES
    );

    expect(result.evaluation.status).toBe('failed');
    expect(result.evaluation.isEligible).toBe(false);
    expect(result.evaluation.message).toContain('Overweight for 63 kg');
    expect(result.evaluation.message).toContain('Re-weigh permitted');
  });

  it('tracks sequential weigh-in attempts for re-weighing', () => {
    // Attempt 1: overweight
    const step1 = WeighInManager.recordWeighIn(
      athlete,
      63.4,
      'off-1',
      'Referee Jenkins',
      IPF_STANDARD_CATEGORIES
    );
    expect(step1.updatedAthlete.weighInRecords.length).toBe(1);

    // Attempt 2: re-weigh passes
    const step2 = WeighInManager.recordWeighIn(
      step1.updatedAthlete,
      62.9,
      'off-1',
      'Referee Jenkins',
      IPF_STANDARD_CATEGORIES
    );
    expect(step2.updatedAthlete.weighInRecords.length).toBe(2);
    expect(step2.updatedAthlete.weighInStatus).toBe('passed');
    expect(step2.updatedAthlete.officialBodyweightKg).toBe(62.9);
  });
});

