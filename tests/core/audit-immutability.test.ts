import { describe, it, expect, beforeEach } from 'vitest';
import { RulesDependencyValidator } from '../../src/core/rules-engine/validator';
import { RuleSnapshotManager } from '../../src/core/rules-engine/versioning';
import { AuditService } from '../../src/core/audit-trail/audit-service';
import { ASCEND_OPEN_PROFILE } from '../../src/core/competition-profiles/ascend-open.profile';
import { IPF_COMPETITION_PROFILE } from '../../src/core/competition-profiles/ipf-technical.profile';
import { CompetitionRules } from '../../src/core/types/competition';

describe('Audit, Immutability & Rules Engine Validation', () => {
  beforeEach(() => {
    AuditService.clearForTesting();
  });

  it('validates default Ascend Open profile with no errors', () => {
    const result = RulesDependencyValidator.validate(ASCEND_OPEN_PROFILE);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('validates default IPF competition profile with no errors', () => {
    const result = RulesDependencyValidator.validate(IPF_COMPETITION_PROFILE);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('flags error if weight category ranking is enabled without weight categories', () => {
    const brokenRules: CompetitionRules = {
      ...IPF_COMPETITION_PROFILE,
      weightCategoriesEnabled: false,
    };

    const result = RulesDependencyValidator.validate(brokenRules);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Weight Categories are currently disabled'))).toBe(true);
    expect(result.autoFixSuggestions.length).toBeGreaterThan(0);
  });

  it('flags error if bodyweight ratio is attempted as primary ranking for IPF profile', () => {
    const brokenRules: CompetitionRules = {
      ...IPF_COMPETITION_PROFILE,
      primaryRankingMetric: 'bodyweight_ratio',
    };

    const result = RulesDependencyValidator.validate(brokenRules);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('do not permit bodyweight ratio'))).toBe(true);
  });

  it('freezes rule snapshot preventing accidental mutations', () => {
    const snapshot = RuleSnapshotManager.createSnapshot(ASCEND_OPEN_PROFILE);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it('maintains append-only audit trail and queries correctly', () => {
    AuditService.log({
      eventId: 'evt-1',
      entityType: 'athlete',
      entityId: 'ath-1',
      action: 'WEIGH_IN_RECORDED',
      previousValue: null,
      updatedValue: { weightKg: 82.5, status: 'passed' },
      actorId: 'user-ref1',
      actorRole: 'weigh_in_official',
      reason: 'Official 2-hour weigh-in verified',
    });

    AuditService.log({
      eventId: 'evt-1',
      entityType: 'attempt',
      entityId: 'att-1',
      action: 'ATTEMPT_DECISION',
      previousValue: 'pending',
      updatedValue: 'good_lift',
      actorId: 'user-chief',
      actorRole: 'chief_referee',
      reason: '2-1 Majority White lights',
    });

    const logs = AuditService.getLogs('evt-1');
    expect(logs.length).toBe(2);
    expect(logs[0].action).toBe('WEIGH_IN_RECORDED');
    expect(logs[1].action).toBe('ATTEMPT_DECISION');
  });
});

