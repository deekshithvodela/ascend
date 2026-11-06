import { describe, it, expect } from 'vitest';
import { OpenRanker } from '../../src/core/ranking-engine/open-ranker';
import { ASCEND_OPEN_PROFILE } from '../../src/core/competition-profiles/ascend-open.profile';
import { Athlete } from '../../src/core/types/athlete';
import { Attempt } from '../../src/core/types/attempt';

describe('Ascend Open Mode Ranking', () => {
  const athletes: Athlete[] = [
    {
      id: 'open-1',
      eventId: 'evt-open',
      lotNumber: 1,
      registrationNumber: 'ASC-01',
      firstName: 'Heavier',
      lastName: 'Lifter',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: 'Open',
      officialBodyweightKg: 100.0,
      weighInRecords: [],
      weighInStatus: 'passed',
      rackHeights: {},
      lifterStatus: 'completed',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'open-2',
      eventId: 'evt-open',
      lotNumber: 2,
      registrationNumber: 'ASC-02',
      firstName: 'Lighter',
      lastName: 'Lifter',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: 'Open',
      officialBodyweightKg: 70.0,
      weighInRecords: [],
      weighInStatus: 'passed',
      rackHeights: {},
      lifterStatus: 'completed',
      createdAt: '',
      updatedAt: '',
    },
  ];

  // Heavier lifter totals 650kg -> Ratio = 650 / 100 = 6.50
  // Lighter lifter totals 500kg -> Ratio = 500 / 70 = 7.14
  const attempts: Attempt[] = [
    { id: '1', athleteId: 'open-1', liftType: 'squat', attemptNumber: 1, weightKg: 220, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    { id: '2', athleteId: 'open-1', liftType: 'bench_press', attemptNumber: 1, weightKg: 160, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    { id: '3', athleteId: 'open-1', liftType: 'deadlift', attemptNumber: 1, weightKg: 270, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },

    { id: '4', athleteId: 'open-2', liftType: 'squat', attemptNumber: 1, weightKg: 170, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    { id: '5', athleteId: 'open-2', liftType: 'bench_press', attemptNumber: 1, weightKg: 120, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    { id: '6', athleteId: 'open-2', liftType: 'deadlift', attemptNumber: 1, weightKg: 210, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
  ];

  it('ranks higher bodyweight ratio first in Ascend Open mode', () => {
    const standings = OpenRanker.rankOverall(athletes, attempts, ASCEND_OPEN_PROFILE, true);

    expect(standings.length).toBe(2);
    // Lighter lifter has ratio 7.14 vs 6.50
    expect(standings[0].athleteId).toBe('open-2');
    expect(standings[0].overallRank).toBe(1);
    expect(standings[0].bodyweightRatio).toBe(7.14);

    expect(standings[1].athleteId).toBe('open-1');
    expect(standings[1].overallRank).toBe(2);
    expect(standings[1].bodyweightRatio).toBe(6.5);
  });
});

