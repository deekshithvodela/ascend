import { describe, it, expect } from 'vitest';
import { CategoryRanker } from '../../src/core/ranking-engine/category-ranker';
import { IPF_COMPETITION_PROFILE } from '../../src/core/competition-profiles/ipf-technical.profile';
import { Athlete } from '../../src/core/types/athlete';
import { Attempt } from '../../src/core/types/attempt';

describe('IPF Official Ranking and Tie-Breaking', () => {
  const athletes: Athlete[] = [
    {
      id: 'ath-1',
      eventId: 'evt-1',
      lotNumber: 15,
      registrationNumber: 'IPF-001',
      firstName: 'Marcus',
      lastName: 'Heavy',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: '83 kg',
      verifiedWeightCategory: '83 kg',
      officialBodyweightKg: 82.8,
      weighInRecords: [],
      weighInStatus: 'passed',
      rackHeights: {},
      lifterStatus: 'active',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'ath-2',
      eventId: 'evt-1',
      lotNumber: 22,
      registrationNumber: 'IPF-002',
      firstName: 'David',
      lastName: 'Light',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: '83 kg',
      verifiedWeightCategory: '83 kg',
      officialBodyweightKg: 81.9, // Lighter bodyweight
      weighInRecords: [],
      weighInStatus: 'passed',
      rackHeights: {},
      lifterStatus: 'active',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'ath-3',
      eventId: 'evt-1',
      lotNumber: 7, // Lower lot number than ath-4
      registrationNumber: 'IPF-003',
      firstName: 'Alex',
      lastName: 'Early',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: '83 kg',
      verifiedWeightCategory: '83 kg',
      officialBodyweightKg: 81.9, // Same bodyweight as ath-2
      weighInRecords: [],
      weighInStatus: 'passed',
      rackHeights: {},
      lifterStatus: 'active',
      createdAt: '',
      updatedAt: '',
    },
  ];

  // All 3 athletes total exactly 700 kg
  const createAttemptsForTotal = (athleteId: string): Attempt[] => [
    { id: `${athleteId}-1`, athleteId, liftType: 'squat', attemptNumber: 1, weightKg: 250, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    { id: `${athleteId}-2`, athleteId, liftType: 'bench_press', attemptNumber: 1, weightKg: 170, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
    { id: `${athleteId}-3`, athleteId, liftType: 'deadlift', attemptNumber: 1, weightKg: 280, status: 'good_lift', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
  ];

  const attempts: Attempt[] = [
    ...createAttemptsForTotal('ath-1'),
    ...createAttemptsForTotal('ath-2'),
    ...createAttemptsForTotal('ath-3'),
  ];

  it('ranks lighter bodyweight higher when totals are identical', () => {
    const results = CategoryRanker.rankByCategories(
      [athletes[0], athletes[1]],
      [...createAttemptsForTotal('ath-1'), ...createAttemptsForTotal('ath-2')],
      IPF_COMPETITION_PROFILE,
      true
    );

    const standings = results['83 kg'];
    expect(standings).toBeDefined();
    expect(standings.length).toBe(2);

    // David Light (81.9kg) must beat Marcus Heavy (82.8kg)
    expect(standings[0].athleteId).toBe('ath-2');
    expect(standings[0].categoryRank).toBe(1);
    expect(standings[1].athleteId).toBe('ath-1');
    expect(standings[1].categoryRank).toBe(2);
    expect(standings[1].tieBreakReason).toContain('Lighter bodyweight');
  });

  it('uses order-of-achievement / lot number when totals and bodyweights are identical', () => {
    const results = CategoryRanker.rankByCategories(
      [athletes[1], athletes[2]], // ath-2 (lot 22) and ath-3 (lot 7), both 81.9kg
      [...createAttemptsForTotal('ath-2'), ...createAttemptsForTotal('ath-3')],
      IPF_COMPETITION_PROFILE,
      true
    );

    const standings = results['83 kg'];
    // Alex Early (lot 7) must beat David Light (lot 22)
    expect(standings[0].athleteId).toBe('ath-3');
    expect(standings[0].categoryRank).toBe(1);
    expect(standings[1].athleteId).toBe('ath-2');
    expect(standings[1].categoryRank).toBe(2);
    expect(standings[1].tieBreakReason).toContain('Lower lot number');
  });

  it('does NOT substitute bodyweight ratio for official IPF ranking', () => {
    expect(IPF_COMPETITION_PROFILE.primaryRankingMetric).toBe('weight_category_total');
    expect(IPF_COMPETITION_PROFILE.bodyweightRatioEnabled).toBe(false);
  });
});

