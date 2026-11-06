import { AthleteStanding } from '../types/ranking';
import { TieBreakCriterion } from '../types/competition';

export interface TieBreakComparisonResult {
  winner: 1 | -1 | 0; // 1 means athlete A wins (ranks higher), -1 means athlete B wins, 0 means absolute tie
  appliedCriterion?: TieBreakCriterion;
  reason: string;
}

export class TieBreakerEngine {
  /**
   * Compares two athletes given an ordered list of tie-breaking criteria.
   * Returns which athlete ranks higher, which criterion determined the result,
   * and a detailed human-readable explanation string.
   */
  public static compare(
    a: AthleteStanding,
    b: AthleteStanding,
    criteria: TieBreakCriterion[]
  ): TieBreakComparisonResult {
    // 0. Primary check: Status (Active/Completed > Eliminated > Disqualified)
    const statusScore = (status: string) => {
      switch (status) {
        case 'completed':
        case 'active':
          return 3;
        case 'incomplete':
          return 2;
        case 'eliminated':
          return 1;
        case 'disqualified':
        case 'withdrawn':
        default:
          return 0;
      }
    };

    const statusA = statusScore(a.lifterStatus);
    const statusB = statusScore(b.lifterStatus);

    if (statusA !== statusB) {
      if (statusA > statusB) {
        return {
          winner: 1,
          reason: `Higher status: ${a.lifterStatus} vs ${b.lifterStatus}`,
        };
      } else {
        return {
          winner: -1,
          reason: `Higher status: ${b.lifterStatus} vs ${a.lifterStatus}`,
        };
      }
    }

    // Evaluate each criterion in configured priority order
    for (const criterion of criteria) {
      switch (criterion) {
        case 'total_weight': {
          const totA = a.totalKg ?? 0;
          const totB = b.totalKg ?? 0;
          if (totA !== totB) {
            return totA > totB
              ? { winner: 1, appliedCriterion: 'total_weight', reason: `Higher total: ${totA} kg vs ${totB} kg` }
              : { winner: -1, appliedCriterion: 'total_weight', reason: `Higher total: ${totB} kg vs ${totA} kg` };
          }
          break;
        }

        case 'lower_bodyweight': {
          const bwA = a.officialBodyweightKg;
          const bwB = b.officialBodyweightKg;
          if (bwA !== undefined && bwB !== undefined && bwA !== bwB) {
            return bwA < bwB
              ? { winner: 1, appliedCriterion: 'lower_bodyweight', reason: `Lighter bodyweight: ${bwA} kg vs ${bwB} kg` }
              : { winner: -1, appliedCriterion: 'lower_bodyweight', reason: `Lighter bodyweight: ${bwB} kg vs ${bwA} kg` };
          }
          break;
        }

        case 'bodyweight_ratio': {
          const ratioA = a.bodyweightRatio ?? 0;
          const ratioB = b.bodyweightRatio ?? 0;
          if (ratioA !== ratioB) {
            return ratioA > ratioB
              ? { winner: 1, appliedCriterion: 'bodyweight_ratio', reason: `Higher bodyweight ratio: ${ratioA.toFixed(2)} vs ${ratioB.toFixed(2)}` }
              : { winner: -1, appliedCriterion: 'bodyweight_ratio', reason: `Higher bodyweight ratio: ${ratioB.toFixed(2)} vs ${ratioA.toFixed(2)}` };
          }
          break;
        }

        case 'order_of_achievement': {
          // In IPF rules: when totals and bodyweights are equal, the lifter who reached the total first wins.
          // In formal meets, this is also ordered by lot number or earlier attempt sequence.
          if (a.lotNumber !== b.lotNumber) {
            return a.lotNumber < b.lotNumber
              ? { winner: 1, appliedCriterion: 'order_of_achievement', reason: `Order of achievement / Lower lot number: #${a.lotNumber} vs #${b.lotNumber}` }
              : { winner: -1, appliedCriterion: 'order_of_achievement', reason: `Order of achievement / Lower lot number: #${b.lotNumber} vs #${a.lotNumber}` };
          }
          break;
        }

        case 'higher_deadlift': {
          const dlA = a.bestDeadliftKg ?? 0;
          const dlB = b.bestDeadliftKg ?? 0;
          if (dlA !== dlB) {
            return dlA > dlB
              ? { winner: 1, appliedCriterion: 'higher_deadlift', reason: `Higher deadlift: ${dlA} kg vs ${dlB} kg` }
              : { winner: -1, appliedCriterion: 'higher_deadlift', reason: `Higher deadlift: ${dlB} kg vs ${dlA} kg` };
          }
          break;
        }

        case 'higher_squat': {
          const sqA = a.bestSquatKg ?? 0;
          const sqB = b.bestSquatKg ?? 0;
          if (sqA !== sqB) {
            return sqA > sqB
              ? { winner: 1, appliedCriterion: 'higher_squat', reason: `Higher squat: ${sqA} kg vs ${sqB} kg` }
              : { winner: -1, appliedCriterion: 'higher_squat', reason: `Higher squat: ${sqB} kg vs ${sqA} kg` };
          }
          break;
        }

        case 'higher_bench': {
          const bpA = a.bestBenchKg ?? 0;
          const bpB = b.bestBenchKg ?? 0;
          if (bpA !== bpB) {
            return bpA > bpB
              ? { winner: 1, appliedCriterion: 'higher_bench', reason: `Higher bench press: ${bpA} kg vs ${bpB} kg` }
              : { winner: -1, appliedCriterion: 'higher_bench', reason: `Higher bench press: ${bpB} kg vs ${bpA} kg` };
          }
          break;
        }
      }
    }

    return {
      winner: 0,
      reason: 'Equal performance across all configured tie-breakers',
    };
  }

  /**
   * Sorts an array of AthleteStanding in-place according to the criteria
   * and annotates each with the reason for their position.
   */
  public static sortAndAnnotate(
    standings: AthleteStanding[],
    criteria: TieBreakCriterion[]
  ): AthleteStanding[] {
    const sorted = [...standings].sort((a, b) => {
      const result = this.compare(a, b, criteria);
      return result.winner === 1 ? -1 : result.winner === -1 ? 1 : 0;
    });

    // Assign ranks and generate tie-break explanation
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const comp = this.compare(sorted[i - 1], sorted[i], criteria);
        if (comp.winner === 0) {
          // Tied with previous athlete
          sorted[i].tieBreakReason = `Tied with ${sorted[i - 1].name}: ${comp.reason}`;
        } else {
          currentRank = i + 1;
          sorted[i].tieBreakReason = comp.appliedCriterion
            ? `Rank determined by ${comp.appliedCriterion.replace(/_/g, ' ')}: ${comp.reason}`
            : comp.reason;
        }
      } else {
        sorted[0].tieBreakReason = 'Leader';
      }
    }

    return sorted;
  }
}

