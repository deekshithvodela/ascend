import { Attempt, LiftType } from '../types/attempt';

export interface AttemptChangeValidation {
  isPermitted: boolean;
  reason?: string;
  remainingChangesAllowed?: number;
}

export class DeadlineTracker {
  /**
   * Validates whether an attempt weight change request is permitted.
   * Special IPF rules:
   * - 2nd attempt: No change permitted once declared, unless under authorized re-declaration rule.
   * - 3rd attempt Deadlift: Up to 2 changes allowed before the bar is loaded.
   */
  public static validateAttemptChange(
    attempt: Attempt,
    newWeightKg: number,
    deadliftChangesMax: number = 2,
    isBarLoaded: boolean = false
  ): AttemptChangeValidation {
    if (attempt.status !== 'pending') {
      return {
        isPermitted: false,
        reason: 'Cannot change weight for an attempt that has already been executed.',
      };
    }

    if (newWeightKg <= 0) {
      return {
        isPermitted: false,
        reason: 'Attempt weight must be greater than zero.',
      };
    }

    // Weight cannot be reduced below the bar loaded or previously completed weight
    if (isBarLoaded) {
      return {
        isPermitted: false,
        reason: 'Bar has already been announced loaded. No further changes permitted for this lifter.',
      };
    }

    // Check deadlift 3rd attempt change rule
    if (attempt.liftType === 'deadlift' && attempt.attemptNumber === 3) {
      const currentChanges = attempt.declarationChangeCount || 0;
      if (currentChanges >= deadliftChangesMax) {
        return {
          isPermitted: false,
          reason: `Maximum of ${deadliftChangesMax} weight changes reached on 3rd attempt deadlift.`,
          remainingChangesAllowed: 0,
        };
      }

      return {
        isPermitted: true,
        remainingChangesAllowed: deadliftChangesMax - (currentChanges + 1),
      };
    }

    // For other lifts or attempts (1st or 2nd)
    const currentChanges = attempt.declarationChangeCount || 0;
    if (currentChanges >= 1) {
      return {
        isPermitted: false,
        reason: 'Attempt weight has already been declared. Further change not permitted for this round.',
        remainingChangesAllowed: 0,
      };
    }

    return {
      isPermitted: true,
      remainingChangesAllowed: 0,
    };
  }
}

