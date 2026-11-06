import { RefereeVote, RefereeDecision, RefereeRole } from '../types/attempt';
import { RefereeConsensusResult } from '../types/judging';

export class JudgingEngine {
  /**
   * Calculates the majority decision from submitted referee votes.
   * In 3-referee mode, 2 or more votes decide the outcome.
   */
  public static evaluateConsensus(
    votes: RefereeVote[],
    threshold: number = 2
  ): RefereeConsensusResult {
    let whiteCount = 0;
    let redCount = 0;

    const individualVotes = votes.map((v) => {
      if (v.decision === 'good_lift') {
        whiteCount++;
      } else {
        redCount++;
      }
      return {
        role: v.refereeRole,
        decision: v.decision,
        infractions: v.infractionReasonCodes,
      };
    });

    // Majority decision
    const majorityDecision: RefereeDecision =
      whiteCount >= threshold ? 'good_lift' : 'no_lift';

    return {
      majorityDecision,
      whiteCount,
      redCount,
      individualVotes,
      isOverridden: false,
    };
  }

  /**
   * Applies an authorized Jury or Chief Referee override to an attempt outcome.
   * Strictly records the previous majority and requires a justified rationale.
   */
  public static applyJuryOverride(
    originalResult: RefereeConsensusResult,
    overriddenDecision: RefereeDecision,
    authorizedBy: string,
    reason: string
  ): RefereeConsensusResult {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Jury override requires an explicit justified reason per technical rules.');
    }

    return {
      ...originalResult,
      majorityDecision: overriddenDecision,
      isOverridden: true,
      overrideReason: `Jury Override by ${authorizedBy}: ${reason}`,
    };
  }

  /**
   * Validates that all required referee votes are present before finalizing an attempt.
   */
  public static isComplete(votes: RefereeVote[], judgingMode: 'single_operator' | 'multi_judge' | 'three_referee'): boolean {
    if (judgingMode === 'single_operator') {
      return votes.length >= 1;
    }
    if (judgingMode === 'three_referee') {
      const roles = new Set(votes.map((v) => v.refereeRole));
      return roles.has('chief') && roles.has('left') && roles.has('right');
    }
    return votes.length >= 2;
  }
}

