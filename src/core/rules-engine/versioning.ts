import { CompetitionRules, CompetitionEvent } from '../types/competition';

export class RuleSnapshotManager {
  /**
   * Freezes a rule configuration snapshot for an event.
   * Ensures that updating Ascend or introducing new rule profiles will never
   * retroactively alter past competition results.
   */
  public static createSnapshot(rules: CompetitionRules): CompetitionRules {
    const frozen = JSON.parse(JSON.stringify(rules));
    Object.freeze(frozen);
    return frozen;
  }

  /**
   * Asserts that an event's rules can be modified.
   * Throws an error if the competition is finalized or locked.
   */
  public static assertCanModifyRules(event: CompetitionEvent): void {
    if (event.status === 'finalized' || event.status === 'locked') {
      throw new Error(`Cannot modify competition rules: Event "${event.name}" is already ${event.status}. Authorized audit correction required.`);
    }
  }

  /**
   * Attaches rulebook metadata to an event.
   */
  public static stampRulebookVersion(rules: CompetitionRules, version: string, effectiveDate: string): CompetitionRules {
    return {
      ...rules,
      federationRulebookVersion: version,
      effectiveDate,
    };
  }
}

