import { Athlete } from '../types/athlete';
import { Attempt, LiftType } from '../types/attempt';

export interface ScheduledAttemptItem {
  attempt: Attempt;
  athlete: Athlete;
  roundNumber: number;
  queuePosition: number;
}

export interface PlatformQueueState {
  currentLifter?: ScheduledAttemptItem;
  onDeck?: ScheduledAttemptItem;
  inTheHole?: ScheduledAttemptItem;
  remainingQueue: ScheduledAttemptItem[];
  completedCount: number;
  totalInRound: number;
  activeRound: number;
  activeLift: LiftType;
}

export class RoundScheduler {
  /**
   * Sorts attempts within a round according to official technical rules:
   * 1. Ascending weight order (lighter bar loaded first).
   * 2. If weights are equal, lower lot number lifts first.
   */
  public static sortAttemptsForRound(
    athletes: Athlete[],
    attempts: Attempt[],
    liftType: LiftType,
    roundNumber: number
  ): ScheduledAttemptItem[] {
    const athleteMap = new Map(athletes.map((a) => [a.id, a]));

    const roundAttempts = attempts.filter(
      (a) =>
        a.liftType === liftType &&
        a.attemptNumber === roundNumber &&
        athleteMap.has(a.athleteId) &&
        athleteMap.get(a.athleteId)?.lifterStatus !== 'eliminated' &&
        athleteMap.get(a.athleteId)?.lifterStatus !== 'disqualified'
    );

    // Sort by weight ascending, then lotNumber ascending
    const sorted = [...roundAttempts].sort((a, b) => {
      if (a.weightKg !== b.weightKg) {
        return a.weightKg - b.weightKg;
      }
      const athleteA = athleteMap.get(a.athleteId);
      const athleteB = athleteMap.get(b.athleteId);
      const lotA = athleteA?.lotNumber ?? 9999;
      const lotB = athleteB?.lotNumber ?? 9999;
      return lotA - lotB;
    });

    return sorted.map((attempt, index) => ({
      attempt,
      athlete: athleteMap.get(attempt.athleteId)!,
      roundNumber,
      queuePosition: index + 1,
    }));
  }

  /**
   * Evaluates the current platform queue state (Current, On Deck, In the Hole).
   */
  public static getPlatformQueue(
    scheduledItems: ScheduledAttemptItem[]
  ): PlatformQueueState {
    const pendingItems = scheduledItems.filter(
      (item) => item.attempt.status === 'pending'
    );
    const completedCount = scheduledItems.length - pendingItems.length;

    const currentLifter = pendingItems[0];
    const onDeck = pendingItems[1];
    const inTheHole = pendingItems[2];
    const remainingQueue = pendingItems.slice(3);

    const activeRound = scheduledItems[0]?.roundNumber ?? 1;
    const activeLift = scheduledItems[0]?.attempt.liftType ?? 'squat';

    return {
      currentLifter,
      onDeck,
      inTheHole,
      remainingQueue,
      completedCount,
      totalInRound: scheduledItems.length,
      activeRound,
      activeLift,
    };
  }
}

