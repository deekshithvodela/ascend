import { describe, it, expect } from 'vitest';
import { RoundScheduler } from '../../src/core/attempt-scheduler/round-scheduler';
import { DeadlineTracker } from '../../src/core/attempt-scheduler/deadline-tracker';
import { BarLoaderCalculator } from '../../src/core/attempt-scheduler/bar-loader';
import { Athlete } from '../../src/core/types/athlete';
import { Attempt } from '../../src/core/types/attempt';

describe('Attempt Scheduler and Platform Management', () => {
  const athletes: Athlete[] = [
    {
      id: 'ath-1',
      eventId: 'evt-1',
      lotNumber: 18,
      registrationNumber: 'R1',
      firstName: 'John',
      lastName: 'Doe',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: '83 kg',
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
      lotNumber: 5, // Lower lot number than John
      registrationNumber: 'R2',
      firstName: 'Alan',
      lastName: 'Smith',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: '83 kg',
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
      lotNumber: 12,
      registrationNumber: 'R3',
      firstName: 'Chris',
      lastName: 'Taylor',
      sex: 'M',
      ageCategory: 'open',
      equipmentDivision: 'raw',
      declaredWeightCategory: '83 kg',
      weighInRecords: [],
      weighInStatus: 'passed',
      rackHeights: {},
      lifterStatus: 'active',
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('orders attempts by ascending weight, and tie-breaks equal weights by lower lot number', () => {
    const attempts: Attempt[] = [
      { id: 'att-1', athleteId: 'ath-1', liftType: 'squat', attemptNumber: 1, weightKg: 200, status: 'pending', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 },
      { id: 'att-2', athleteId: 'ath-2', liftType: 'squat', attemptNumber: 1, weightKg: 200, status: 'pending', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 }, // Same weight as John, but Lot 5 < 18
      { id: 'att-3', athleteId: 'ath-3', liftType: 'squat', attemptNumber: 1, weightKg: 190, status: 'pending', refereeVotes: [], declaredAt: '', declarationChangeCount: 0 }, // Lighter weight lifts first
    ];

    const scheduled = RoundScheduler.sortAttemptsForRound(athletes, attempts, 'squat', 1);

    expect(scheduled.length).toBe(3);
    // 1st: Chris (190 kg)
    expect(scheduled[0].athlete.id).toBe('ath-3');
    expect(scheduled[0].attempt.weightKg).toBe(190);

    // 2nd: Alan (200 kg, lot 5)
    expect(scheduled[1].athlete.id).toBe('ath-2');
    expect(scheduled[1].attempt.weightKg).toBe(200);

    // 3rd: John (200 kg, lot 18)
    expect(scheduled[2].athlete.id).toBe('ath-1');
    expect(scheduled[2].attempt.weightKg).toBe(200);
  });

  it('correctly manages Deadlift 3rd attempt change rule (up to 2 changes permitted)', () => {
    const dlAttempt: Attempt = {
      id: 'dl-3',
      athleteId: 'ath-1',
      liftType: 'deadlift',
      attemptNumber: 3,
      weightKg: 280,
      status: 'pending',
      refereeVotes: [],
      declaredAt: '',
      declarationChangeCount: 0,
    };

    // First change: allowed
    const check1 = DeadlineTracker.validateAttemptChange(dlAttempt, 285, 2, false);
    expect(check1.isPermitted).toBe(true);
    expect(check1.remainingChangesAllowed).toBe(1);

    // After 1 change used:
    dlAttempt.declarationChangeCount = 1;
    const check2 = DeadlineTracker.validateAttemptChange(dlAttempt, 290, 2, false);
    expect(check2.isPermitted).toBe(true);
    expect(check2.remainingChangesAllowed).toBe(0);

    // After 2 changes used:
    dlAttempt.declarationChangeCount = 2;
    const check3 = DeadlineTracker.validateAttemptChange(dlAttempt, 292.5, 2, false);
    expect(check3.isPermitted).toBe(false);
    expect(check3.reason).toContain('Maximum of 2 weight changes reached');
  });

  it('calculates plate loading breakdown accurately', () => {
    // 227.5 kg load on 20kg bar + 5kg collars = 202.5 kg plates / 2 = 101.25 kg per side
    // Per side: 4x25kg (100kg) + 1x1.25kg (1.25kg)
    const breakdown = BarLoaderCalculator.calculate(227.5);
    expect(breakdown.totalWeightKg).toBe(227.5);
    expect(breakdown.barbellWeightKg).toBe(20);
    expect(breakdown.collarsWeightKg).toBe(5);

    const red25 = breakdown.platesPerSide.find((p) => p.weightKg === 25);
    expect(red25?.count).toBe(4);

    const silver125 = breakdown.platesPerSide.find((p) => p.weightKg === 1.25);
    expect(silver125?.count).toBe(1);
  });
});

