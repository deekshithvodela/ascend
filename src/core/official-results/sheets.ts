import { CompetitionEvent } from '../types/competition';
import { Athlete } from '../types/athlete';
import { Attempt } from '../types/attempt';
import { AthleteStanding } from '../types/ranking';
import { AuditLogEntry } from '../types/audit';

export class OfficialSheetsGenerator {
  /**
   * Generates header metadata common to all official sheets.
   */
  private static renderHeader(event: CompetitionEvent, sheetTitle: string): string {
    return `
      <div class="sheet-header" style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase;">${sheetTitle}</h1>
            <h2 style="font-size: 16px; font-weight: 600; margin: 4px 0 0 0; color: #333;">${event.name}</h2>
            <div style="font-size: 12px; color: #555; margin-top: 2px;">
              Venue: ${event.venue} | Date: ${event.date} | Organizer: ${event.organizer}
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>Rulebook:</strong> ${event.rulesSnapshot.federationRulebookVersion || event.rulesSnapshot.profileName}</div>
            <div><strong>Profile Version:</strong> ${event.rulesSnapshot.profileVersion}</div>
            <div><strong>Status:</strong> ${event.status.toUpperCase()}</div>
          </div>
        </div>
        ${
          event.rulesSnapshot.complianceDisclaimer
            ? `<div style="font-size: 10px; color: #777; margin-top: 6px; font-style: italic;">${event.rulesSnapshot.complianceDisclaimer}</div>`
            : ''
        }
      </div>
    `;
  }

  /**
   * Renders the Official Weigh-In Sheet.
   */
  public static renderWeighInSheet(event: CompetitionEvent, athletes: Athlete[]): string {
    const sorted = [...athletes].sort((a, b) => a.lotNumber - b.lotNumber);

    const rows = sorted
      .map(
        (a) => `
        <tr style="border-bottom: 1px solid #ddd; font-size: 12px; height: 32px;">
          <td style="padding: 6px; text-align: center; font-weight: bold;">${a.lotNumber}</td>
          <td style="padding: 6px;">${a.registrationNumber}</td>
          <td style="padding: 6px; font-weight: 600;">${a.firstName} ${a.lastName}</td>
          <td style="padding: 6px; text-align: center;">${a.sex}</td>
          <td style="padding: 6px;">${a.teamOrAffiliation || '-'}</td>
          <td style="padding: 6px;">${a.declaredWeightCategory}</td>
          <td style="padding: 6px; font-weight: bold; text-align: right;">${a.officialBodyweightKg !== undefined ? a.officialBodyweightKg.toFixed(2) + ' kg' : 'Pending'}</td>
          <td style="padding: 6px; text-align: center; text-transform: uppercase; font-size: 11px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; ${a.weighInStatus === 'passed' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">
              ${a.weighInStatus}
            </span>
          </td>
          <td style="padding: 6px; text-align: center;">SQ: ${a.rackHeights?.squatRackHeight || '-'}; BP: ${a.rackHeights?.benchRackHeight || '-'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #999; width: 140px;"></td>
        </tr>
      `
      )
      .join('');

    return `
      <div class="printable-sheet" style="font-family: sans-serif; padding: 24px; max-width: 900px; margin: 0 auto;">
        ${this.renderHeader(event, 'Official Weigh-In Sheet')}
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 6px; text-align: center;">Lot</th>
              <th style="padding: 6px;">Reg #</th>
              <th style="padding: 6px;">Athlete Name</th>
              <th style="padding: 6px; text-align: center;">Sex</th>
              <th style="padding: 6px;">Team</th>
              <th style="padding: 6px;">Category</th>
              <th style="padding: 6px; text-align: right;">Official BW</th>
              <th style="padding: 6px; text-align: center;">Status</th>
              <th style="padding: 6px; text-align: center;">Rack Heights</th>
              <th style="padding: 6px;">Official Signature</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 32px; display: flex; justify-content: space-between; font-size: 12px;">
          <div>Weigh-In Official: __________________________</div>
          <div>Chief Referee Sign-off: __________________________</div>
        </div>
      </div>
    `;
  }

  /**
   * Renders Competition Score Sheet with all 9 attempts and best lifts.
   */
  public static renderScoreSheet(
    event: CompetitionEvent,
    standings: AthleteStanding[]
  ): string {
    const numAttempts = event.rulesSnapshot.attemptsPerLift || 3;
    const attemptNumbers = Array.from({ length: numAttempts }, (_, i) => i + 1);

    const renderAttempt = (attempts: Attempt[], liftType: string, num: number) => {
      const att = attempts.find((a) => a.liftType === liftType && a.attemptNumber === num);
      if (!att) return '<td style="padding: 4px; text-align: center; color: #aaa;">-</td>';
      const isGood = att.status === 'good_lift';
      const isFailed = att.status === 'no_lift';
      const bg = isGood ? '#dcfce7' : isFailed ? '#fee2e2' : '#f8fafc';
      const color = isGood ? '#166534' : isFailed ? '#991b1b' : '#334155';
      const decoration = isFailed ? 'line-through' : 'none';

      return `<td style="padding: 4px; text-align: center; background: ${bg}; color: ${color}; text-decoration: ${decoration}; font-weight: 600;">${att.weightKg}</td>`;
    };

    const renderAttemptsForLift = (attempts: Attempt[], liftType: string) => {
      return attemptNumbers.map((n) => renderAttempt(attempts, liftType, n)).join('');
    };

    const rows = standings
      .map(
        (s) => `
        <tr style="border-bottom: 1px solid #ddd; font-size: 11px;">
          <td style="padding: 4px; text-align: center; font-weight: bold;">${s.categoryRank ?? s.overallRank ?? '-'}</td>
          <td style="padding: 4px; text-align: center;">${s.lotNumber}</td>
          <td style="padding: 4px; font-weight: 600; white-space: nowrap;">${s.name}</td>
          <td style="padding: 4px;">${s.category}</td>
          <td style="padding: 4px; text-align: right;">${s.officialBodyweightKg?.toFixed(1) || '-'}</td>
          ${renderAttemptsForLift(s.attempts, 'squat')}
          <td style="padding: 4px; text-align: center; font-weight: bold; background: #f1f5f9;">${s.bestSquatKg || '-'}</td>
          ${renderAttemptsForLift(s.attempts, 'bench_press')}
          <td style="padding: 4px; text-align: center; font-weight: bold; background: #f1f5f9;">${s.bestBenchKg || '-'}</td>
          ${renderAttemptsForLift(s.attempts, 'deadlift')}
          <td style="padding: 4px; text-align: center; font-weight: bold; background: #f1f5f9;">${s.bestDeadliftKg || '-'}</td>
          <td style="padding: 4px; text-align: center; font-weight: 800; font-size: 12px; background: #fee2e2; color: #991b1b;">${s.totalKg || '0'}</td>
          <td style="padding: 4px; text-align: center;">${s.bodyweightRatio !== undefined ? s.bodyweightRatio.toFixed(2) : '-'}</td>
          <td style="padding: 4px; text-align: center;">${s.dots !== undefined ? s.dots.toFixed(2) : '-'}</td>
        </tr>
      `
      )
      .join('');

    const subHeadersForLift = () =>
      attemptNumbers
        .map((n) => `<th style="padding: 2px; text-align: center;">${n}</th>`)
        .join('') +
      `<th style="padding: 2px; text-align: center; font-weight: bold;">Best</th>`;

    return `
      <div class="printable-sheet" style="font-family: sans-serif; padding: 24px; max-width: 1100px; margin: 0 auto;">
        ${this.renderHeader(event, 'Official Competition Score Sheet')}
        <table style="width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase;">
              <th rowspan="2" style="padding: 4px; text-align: center;">Placing</th>
              <th rowspan="2" style="padding: 4px; text-align: center;">Lot</th>
              <th rowspan="2" style="padding: 4px;">Athlete</th>
              <th rowspan="2" style="padding: 4px;">Cat</th>
              <th rowspan="2" style="padding: 4px; text-align: right;">BW</th>
              <th colspan="${numAttempts + 1}" style="padding: 4px; text-align: center; background: #1e293b;">Squat</th>
              <th colspan="${numAttempts + 1}" style="padding: 4px; text-align: center; background: #334155;">Bench Press</th>
              <th colspan="${numAttempts + 1}" style="padding: 4px; text-align: center; background: #1e293b;">Deadlift</th>
              <th rowspan="2" style="padding: 4px; text-align: center; background: #b91c1c;">Total</th>
              <th rowspan="2" style="padding: 4px; text-align: center;">Ratio</th>
              <th rowspan="2" style="padding: 4px; text-align: center;">DOTS</th>
            </tr>
            <tr style="background: #e2e8f0; font-size: 9px; text-transform: uppercase; color: #333;">
              ${subHeadersForLift()}
              ${subHeadersForLift()}
              ${subHeadersForLift()}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px;">
          <div>Technical Controller: __________________________</div>
          <div>Chief Referee: __________________________</div>
          <div>Jury President: __________________________</div>
        </div>
      </div>
    `;
  }

  /**
   * Renders the Referee Decision Breakdown Sheet.
   */
  public static renderRefereeDecisions(
    event: CompetitionEvent,
    attempts: Attempt[],
    athletes: Athlete[]
  ): string {
    const athleteMap = new Map(athletes.map((a) => [a.id, a]));

    const rows = attempts
      .filter((a) => a.refereeVotes.length > 0)
      .map((att) => {
        const athlete = athleteMap.get(att.athleteId);
        const chief = att.refereeVotes.find((v) => v.refereeRole === 'chief');
        const left = att.refereeVotes.find((v) => v.refereeRole === 'left');
        const right = att.refereeVotes.find((v) => v.refereeRole === 'right');

        const cardPill = (decision?: string, infractions?: string[]) => {
          if (!decision) return '<span style="color: #aaa;">-</span>';
          const isWhite = decision === 'good_lift';
          const bg = isWhite ? '#ffffff' : '#ef4444';
          const border = isWhite ? '2px solid #000' : '2px solid #b91c1c';
          const text = isWhite ? 'WHITE' : 'RED';
          const infractionsStr = infractions && infractions.length > 0 ? ` (${infractions.join(', ')})` : '';

          return `<span style="display: inline-block; padding: 2px 6px; background: ${bg}; color: ${isWhite ? '#000' : '#fff'}; border: ${border}; border-radius: 4px; font-weight: bold; font-size: 10px;">${text}${infractionsStr}</span>`;
        };

        return `
        <tr style="border-bottom: 1px solid #ddd; font-size: 11px;">
          <td style="padding: 6px;">${athlete ? `${athlete.firstName} ${athlete.lastName}` : att.athleteId}</td>
          <td style="padding: 6px; text-transform: capitalize;">${att.liftType.replace('_', ' ')} #${att.attemptNumber}</td>
          <td style="padding: 6px; font-weight: bold;">${att.weightKg} kg</td>
          <td style="padding: 6px; text-align: center;">${cardPill(chief?.decision, chief?.infractionReasonCodes)}</td>
          <td style="padding: 6px; text-align: center;">${cardPill(left?.decision, left?.infractionReasonCodes)}</td>
          <td style="padding: 6px; text-align: center;">${cardPill(right?.decision, right?.infractionReasonCodes)}</td>
          <td style="padding: 6px; text-align: center; font-weight: bold;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 4px; ${att.status === 'good_lift' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">
              ${att.status === 'good_lift' ? 'GOOD LIFT' : 'NO LIFT'}
            </span>
          </td>
          <td style="padding: 6px; font-size: 10px; color: #555;">${att.isJuryOverride ? `Jury Override: ${att.juryOverrideReason}` : 'Standard'}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <div class="printable-sheet" style="font-family: sans-serif; padding: 24px; max-width: 950px; margin: 0 auto;">
        ${this.renderHeader(event, 'Referee Decision & Infraction Audit Records')}
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 6px;">Athlete</th>
              <th style="padding: 6px;">Lift</th>
              <th style="padding: 6px;">Weight</th>
              <th style="padding: 6px; text-align: center;">Chief Referee</th>
              <th style="padding: 6px; text-align: center;">Left Referee</th>
              <th style="padding: 6px; text-align: center;">Right Referee</th>
              <th style="padding: 6px; text-align: center;">Majority Decision</th>
              <th style="padding: 6px;">Notes / Override</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
}

