import { describe, it, expect } from 'vitest';
import { JudgingEngine } from '../../src/core/judging-engine/referee-consensus';
import { RefereeVote } from '../../src/core/types/attempt';

describe('Judging Engine and Referee Consensus', () => {
  it('calculates Good Lift when 2 or 3 referees show White', () => {
    const votes: RefereeVote[] = [
      { refereeId: 'ref-1', refereeRole: 'chief', decision: 'good_lift', timestamp: '' },
      { refereeId: 'ref-2', refereeRole: 'left', decision: 'good_lift', timestamp: '' },
      { refereeId: 'ref-3', refereeRole: 'right', decision: 'no_lift', infractionReasonCodes: ['SQ-01'], timestamp: '' },
    ];

    const result = JudgingEngine.evaluateConsensus(votes, 2);
    expect(result.majorityDecision).toBe('good_lift');
    expect(result.whiteCount).toBe(2);
    expect(result.redCount).toBe(1);
    expect(result.individualVotes[2].infractions).toContain('SQ-01');
  });

  it('calculates No Lift when 2 or 3 referees show Red', () => {
    const votes: RefereeVote[] = [
      { refereeId: 'ref-1', refereeRole: 'chief', decision: 'no_lift', infractionReasonCodes: ['BP-01'], timestamp: '' },
      { refereeId: 'ref-2', refereeRole: 'left', decision: 'no_lift', infractionReasonCodes: ['BP-03'], timestamp: '' },
      { refereeId: 'ref-3', refereeRole: 'right', decision: 'good_lift', timestamp: '' },
    ];

    const result = JudgingEngine.evaluateConsensus(votes, 2);
    expect(result.majorityDecision).toBe('no_lift');
    expect(result.redCount).toBe(2);
    expect(result.whiteCount).toBe(1);
  });

  it('supports authorized Jury override with required justification', () => {
    const initialVotes: RefereeVote[] = [
      { refereeId: 'ref-1', refereeRole: 'chief', decision: 'no_lift', timestamp: '' },
      { refereeId: 'ref-2', refereeRole: 'left', decision: 'no_lift', timestamp: '' },
      { refereeId: 'ref-3', refereeRole: 'right', decision: 'good_lift', timestamp: '' },
    ];

    const consensus = JudgingEngine.evaluateConsensus(initialVotes, 2);
    expect(consensus.majorityDecision).toBe('no_lift');

    const overridden = JudgingEngine.applyJuryOverride(
      consensus,
      'good_lift',
      'Jury President Dr. Smith',
      'Video review confirmed barbell locked without downward motion before rack signal.'
    );

    expect(overridden.majorityDecision).toBe('good_lift');
    expect(overridden.isOverridden).toBe(true);
    expect(overridden.overrideReason).toContain('Video review confirmed');
    // Original votes remain preserved
    expect(overridden.redCount).toBe(2);
  });

  it('supports 1-referee (single operator) mode with threshold of 1', () => {
    const singleVoteWhite: RefereeVote[] = [
      { refereeId: 'ref-op', refereeRole: 'operator', decision: 'good_lift', timestamp: '' },
    ];
    const whiteResult = JudgingEngine.evaluateConsensus(singleVoteWhite, 1);
    expect(whiteResult.majorityDecision).toBe('good_lift');
    expect(whiteResult.whiteCount).toBe(1);

    const singleVoteRed: RefereeVote[] = [
      { refereeId: 'ref-op', refereeRole: 'operator', decision: 'no_lift', infractionReasonCodes: ['DL-03'], timestamp: '' },
    ];
    const redResult = JudgingEngine.evaluateConsensus(singleVoteRed, 1);
    expect(redResult.majorityDecision).toBe('no_lift');
    expect(redResult.redCount).toBe(1);
    expect(redResult.individualVotes[0].infractions).toContain('DL-03');
  });
});

