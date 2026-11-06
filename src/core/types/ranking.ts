import { LifterStatus } from './athlete';
import { Attempt } from './attempt';

export interface AthleteStanding {
  athleteId: string;
  lotNumber: number;
  name: string;
  team?: string;
  category: string;
  officialBodyweightKg?: number;
  lifterStatus: LifterStatus;
  statusReason?: string;

  // Best Lifts
  bestSquatKg?: number;
  bestBenchKg?: number;
  bestDeadliftKg?: number;
  totalKg?: number;

  // Calculated Metrics
  bodyweightRatio?: number;
  dots?: number;
  wilks?: number;
  wilks2020?: number;

  // Attempts Detail
  attempts: Attempt[];

  // Placings
  categoryRank?: number;
  overallRank?: number;
  squatRank?: number;
  benchRank?: number;
  deadliftRank?: number;

  // Explanatory Tie-Break String
  tieBreakReason?: string;
}

export interface TeamStanding {
  teamName: string;
  totalPoints: number;
  topLiftersCount: number;
  lifters: {
    athleteId: string;
    athleteName: string;
    category: string;
    rank: number;
    points: number;
  }[];
}

export interface CompetitionResults {
  eventId: string;
  eventName: string;
  status: 'provisional' | 'finalized';
  generatedAt: string;
  categoryStandings: Record<string, AthleteStanding[]>;
  overallStandings: AthleteStanding[];
  teamStandings?: TeamStanding[];
  individualLiftChampions?: {
    squat: AthleteStanding[];
    bench: AthleteStanding[];
    deadlift: AthleteStanding[];
  };
}

