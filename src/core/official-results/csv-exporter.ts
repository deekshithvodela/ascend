import { AthleteStanding } from '../types/ranking';
import { Athlete } from '../types/athlete';

export class CsvExporter {
  /**
   * Generates CSV for official competition results.
   */
  public static exportStandingsToCsv(standings: AthleteStanding[]): string {
    const headers = [
      'Rank',
      'Lot',
      'Name',
      'Team',
      'Category',
      'Bodyweight (kg)',
      'Status',
      'Best Squat (kg)',
      'Best Bench (kg)',
      'Best Deadlift (kg)',
      'Total (kg)',
      'Bodyweight Ratio',
      'DOTS',
      'Wilks',
      'Tie-Break Reason',
    ];

    const rows = standings.map((s) => [
      s.categoryRank ?? s.overallRank ?? 'N/A',
      s.lotNumber,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.team || '').replace(/"/g, '""')}"`,
      `"${s.category}"`,
      s.officialBodyweightKg ?? '',
      s.lifterStatus,
      s.bestSquatKg ?? '',
      s.bestBenchKg ?? '',
      s.bestDeadliftKg ?? '',
      s.totalKg ?? '',
      s.bodyweightRatio ?? '',
      s.dots ?? '',
      s.wilks ?? '',
      `"${(s.tieBreakReason || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generates CSV for official weigh-in sheet.
   */
  public static exportWeighInToCsv(athletes: Athlete[]): string {
    const headers = [
      'Lot #',
      'Registration #',
      'Name',
      'Sex',
      'Division',
      'Declared Category',
      'Verified Category',
      'Measured Bodyweight (kg)',
      'Weigh-In Status',
      'Squat Rack',
      'Bench Rack',
    ];

    const rows = athletes.map((a) => [
      a.lotNumber,
      a.registrationNumber,
      `"${a.firstName} ${a.lastName}"`,
      a.sex,
      a.equipmentDivision,
      `"${a.declaredWeightCategory}"`,
      `"${a.verifiedWeightCategory || ''}"`,
      a.officialBodyweightKg ?? '',
      a.weighInStatus,
      a.rackHeights?.squatRackHeight ?? '',
      a.rackHeights?.benchRackHeight ?? '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

