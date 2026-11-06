import { LiftType, RefereeDecision, RefereeRole } from './attempt';

export interface TechnicalInfractionCode {
  code: string;
  liftType: LiftType;
  cardColor: 'red' | 'blue' | 'yellow';
  title: string;
  description: string;
  rulebookSection?: string;
}

export interface RefereeConsensusResult {
  majorityDecision: RefereeDecision;
  whiteCount: number;
  redCount: number;
  individualVotes: {
    role: RefereeRole;
    decision: RefereeDecision;
    infractions?: string[];
  }[];
  isOverridden: boolean;
  overrideReason?: string;
}

