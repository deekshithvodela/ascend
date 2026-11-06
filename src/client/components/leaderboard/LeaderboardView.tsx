import React, { useState } from 'react';
import { AthleteStanding, CompetitionResults } from '../../../core/types/ranking';
import { CompetitionEvent } from '../../../core/types/competition';
import { Athlete } from '../../../core/types/athlete';
import { Attempt } from '../../../core/types/attempt';
import { CsvExporter } from '../../../core/official-results/csv-exporter';
import { OfficialSheetsGenerator } from '../../../core/official-results/sheets';
import {
  Trophy,
  Download,
  Printer,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Dumbbell,
} from 'lucide-react';

interface LeaderboardViewProps {
  event: CompetitionEvent;
  results: CompetitionResults | null;
  athletes?: Athlete[];
  attempts?: Attempt[];
  onRefreshResults: () => Promise<void>;
}

type DisciplineSort = 'total' | 'squat' | 'bench_press' | 'deadlift' | 'ratio' | 'dots' | 'wilks' | 'lot';

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  event,
  results,
  athletes = [],
  attempts = [],
  onRefreshResults,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'category' | 'overall'>('category');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [sortBy, setSortBy] = useState<DisciplineSort>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (!results) {
    return (
      <div className="py-16 text-center text-slate-400">Loading competition standings...</div>
    );
  }

  const isIpf = event.rulesSnapshot.profileId === 'ipf_inspired';
  const categories = Object.keys(results.categoryStandings);

  // Map athlete ID to sex
  const athleteSexMap = new Map<string, 'M' | 'F' | 'MX'>();
  athletes.forEach((a) => {
    athleteSexMap.set(a.id, a.sex);
  });

  // 1. Initial Category / Overall slice
  const baseStandings: AthleteStanding[] =
    viewMode === 'overall' || selectedCategory === 'ALL'
      ? results.overallStandings
      : results.categoryStandings[selectedCategory] || [];

  // 2. Gender Filtering
  const genderFilteredStandings = baseStandings.filter((athlete) => {
    if (selectedGender === 'ALL') return true;
    const sex = athleteSexMap.get(athlete.athleteId);
    if (sex) return sex === selectedGender;

    const catLower = athlete.category.toLowerCase();
    if (catLower.startsWith('m-') || catLower.includes('men')) {
      return selectedGender === 'M';
    }
    if (catLower.startsWith('f-') || catLower.includes('women')) {
      return selectedGender === 'F';
    }
    return true;
  });

  // 3. Discipline Sorting
  const displayedStandings = [...genderFilteredStandings].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    switch (sortBy) {
      case 'squat':
        valA = a.bestSquatKg || 0;
        valB = b.bestSquatKg || 0;
        break;
      case 'bench_press':
        valA = a.bestBenchKg || 0;
        valB = b.bestBenchKg || 0;
        break;
      case 'deadlift':
        valA = a.bestDeadliftKg || 0;
        valB = b.bestDeadliftKg || 0;
        break;
      case 'total':
        valA = a.totalKg || 0;
        valB = b.totalKg || 0;
        break;
      case 'ratio':
        valA = a.bodyweightRatio || 0;
        valB = b.bodyweightRatio || 0;
        break;
      case 'dots':
        valA = a.dots || 0;
        valB = b.dots || 0;
        break;
      case 'wilks':
        valA = a.wilks || 0;
        valB = b.wilks || 0;
        break;
      case 'lot':
        valA = a.lotNumber || 0;
        valB = b.lotNumber || 0;
        break;
      default:
        valA = a.totalKg || 0;
        valB = b.totalKg || 0;
    }

    if (valA !== valB) {
      return sortDirection === 'desc' ? valB - valA : valA - valB;
    }

    // Secondary tie-breaker by bodyweight (lower bodyweight wins)
    const bwA = a.officialBodyweightKg || 999;
    const bwB = b.officialBodyweightKg || 999;
    return bwA - bwB;
  });

  const handleToggleSort = (discipline: DisciplineSort) => {
    if (sortBy === discipline) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(discipline);
      setSortDirection(discipline === 'lot' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (discipline: DisciplineSort) => {
    if (sortBy !== discipline) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 inline ml-1" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="w-3 h-3 text-red-400 inline ml-1" />
    ) : (
      <ArrowUp className="w-3 h-3 text-red-400 inline ml-1" />
    );
  };

  const handleDownloadCsv = (type: 'results' | 'weighin') => {
    let csvContent = '';
    let filename = '';
    if (type === 'results') {
      csvContent = CsvExporter.exportStandingsToCsv(displayedStandings);
      filename = `${event.name.replace(/\s+/g, '_')}_Results_${sortBy}_${selectedGender}.csv`;
    } else {
      csvContent = CsvExporter.exportWeighInToCsv(athletes);
      filename = `${event.name.replace(/\s+/g, '_')}_WeighIn.csv`;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSheet = (sheetType: string) => {
    let sheetHtml = '';
    if (sheetType === 'weigh-in') {
      sheetHtml = OfficialSheetsGenerator.renderWeighInSheet(event, athletes);
    } else if (sheetType === 'score-sheet') {
      sheetHtml = OfficialSheetsGenerator.renderScoreSheet(event, displayedStandings);
    } else if (sheetType === 'referee-records') {
      sheetHtml = OfficialSheetsGenerator.renderRefereeDecisions(event, attempts, athletes);
    }

    if (sheetHtml) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${event.name} - ${sheetType}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
                td { padding: 6px 8px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${sheetHtml}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Top Banner: Metrics & Export Actions with Red Accent */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Official Standings & Leaderboard</h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                results.status === 'finalized'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {results.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by: <strong className="text-red-400">{sortBy.replace(/_/g, ' ').toUpperCase()}</strong> ({sortDirection === 'desc' ? 'Highest first' : 'Lowest first'}) • Tie-breakers: {event.rulesSnapshot.tieBreakers.map((t) => t.replace(/_/g, ' ')).join(' → ')}
          </p>
        </div>

        {/* Export & Sheets Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('results')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenSheet('score-sheet')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-md shadow-red-600/30 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Official Score Sheet</span>
          </button>

          <button
            onClick={() => handleOpenSheet('weigh-in')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Weigh-In Sheet</span>
          </button>

          <button
            onClick={() => handleOpenSheet('referee-records')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Referee Decisions</span>
          </button>
        </div>
      </div>

      {/* Primary Standings Mode & Weight Category Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('category')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'category'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Category Standings {isIpf && '(IPF Official)'}
          </button>
          <button
            onClick={() => setViewMode('overall')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'overall'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overall Open Standings {event.rulesSnapshot.bodyweightRatioEnabled && '(Ratio Ranking)'}
          </button>
        </div>

        {/* Category Picker if in category mode */}
        {viewMode === 'category' && categories.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Weight Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
            >
              <option value="ALL">All Categories Combined</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({results.categoryStandings[cat]?.length || 0} lifters)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Secondary Controls: Gender Filter & Discipline Sorting Buttons */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* A. Gender Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5 mr-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Gender:</span>
          </span>
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedGender('ALL')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                selectedGender === 'ALL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedGender('M')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                selectedGender === 'M'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Men (M)
            </button>
            <button
              onClick={() => setSelectedGender('F')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                selectedGender === 'F'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Women (F)
            </button>
          </div>
        </div>

        {/* B. Discipline Sort Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5 mr-1">
            <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort By Discipline:</span>
          </span>
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1 flex-wrap">
            <button
              onClick={() => handleToggleSort('total')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center ${
                sortBy === 'total'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Total</span>
              {sortBy === 'total' && (sortDirection === 'desc' ? ' ▼' : ' ▲')}
            </button>
            <button
              onClick={() => handleToggleSort('squat')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center ${
                sortBy === 'squat'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Squat</span>
              {sortBy === 'squat' && (sortDirection === 'desc' ? ' ▼' : ' ▲')}
            </button>
            <button
              onClick={() => handleToggleSort('bench_press')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center ${
                sortBy === 'bench_press'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Bench</span>
              {sortBy === 'bench_press' && (sortDirection === 'desc' ? ' ▼' : ' ▲')}
            </button>
            <button
              onClick={() => handleToggleSort('deadlift')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center ${
                sortBy === 'deadlift'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Deadlift</span>
              {sortBy === 'deadlift' && (sortDirection === 'desc' ? ' ▼' : ' ▲')}
            </button>
            {event.rulesSnapshot.bodyweightRatioEnabled && (
              <button
                onClick={() => handleToggleSort('ratio')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center ${
                  sortBy === 'ratio'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Ratio</span>
                {sortBy === 'ratio' && (sortDirection === 'desc' ? ' ▼' : ' ▲')}
              </button>
            )}
            <button
              onClick={() => handleToggleSort('dots')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center ${
                sortBy === 'dots'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>DOTS</span>
              {sortBy === 'dots' && (sortDirection === 'desc' ? ' ▼' : ' ▲')}
            </button>
          </div>
        </div>
      </div>

      {/* Standings Table with Full Attempt Breakdown & Clickable Sorting Headers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800 tracking-wider select-none">
              <tr>
                <th className="p-3 text-center">Rank</th>
                <th
                  onClick={() => handleToggleSort('lot')}
                  className="p-3 text-center cursor-pointer hover:text-white transition"
                  title="Click to sort by Lot number"
                >
                  Lot {getSortIcon('lot')}
                </th>
                <th className="p-3">Athlete</th>
                <th className="p-3">Cat</th>
                <th className="p-3 text-right">BW (kg)</th>
                
                {/* Clickable Discipline Headers */}
                <th
                  onClick={() => handleToggleSort('squat')}
                  className={`p-3 text-center cursor-pointer transition ${
                    sortBy === 'squat' ? 'bg-red-950/40 text-red-300 font-extrabold' : 'bg-slate-950/40 hover:text-white'
                  }`}
                  title="Click to sort by Squat"
                >
                  SQ Best {getSortIcon('squat')}
                </th>

                <th
                  onClick={() => handleToggleSort('bench_press')}
                  className={`p-3 text-center cursor-pointer transition ${
                    sortBy === 'bench_press' ? 'bg-red-950/40 text-red-300 font-extrabold' : 'bg-slate-950/40 hover:text-white'
                  }`}
                  title="Click to sort by Bench Press"
                >
                  BP Best {getSortIcon('bench_press')}
                </th>

                <th
                  onClick={() => handleToggleSort('deadlift')}
                  className={`p-3 text-center cursor-pointer transition ${
                    sortBy === 'deadlift' ? 'bg-red-950/40 text-red-300 font-extrabold' : 'bg-slate-950/40 hover:text-white'
                  }`}
                  title="Click to sort by Deadlift"
                >
                  DL Best {getSortIcon('deadlift')}
                </th>

                <th
                  onClick={() => handleToggleSort('total')}
                  className={`p-3 text-center cursor-pointer transition ${
                    sortBy === 'total' ? 'bg-red-900/40 text-white font-black ring-1 ring-red-500/50' : 'bg-red-950/20 text-red-400 hover:text-white'
                  }`}
                  title="Click to sort by Total"
                >
                  TOTAL {getSortIcon('total')}
                </th>

                {event.rulesSnapshot.bodyweightRatioEnabled && (
                  <th
                    onClick={() => handleToggleSort('ratio')}
                    className={`p-3 text-center cursor-pointer transition ${
                      sortBy === 'ratio' ? 'bg-emerald-950/40 text-emerald-300 font-extrabold' : 'hover:text-white'
                    }`}
                    title="Click to sort by Bodyweight Ratio"
                  >
                    Ratio {getSortIcon('ratio')}
                  </th>
                )}

                <th
                  onClick={() => handleToggleSort('dots')}
                  className={`p-3 text-center cursor-pointer transition ${
                    sortBy === 'dots' ? 'bg-blue-950/40 text-blue-300 font-extrabold' : 'hover:text-white'
                  }`}
                  title="Click to sort by DOTS score"
                >
                  DOTS {getSortIcon('dots')}
                </th>

                <th className="p-3">Tie-Break Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedStandings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500 text-xs">
                    No lifters match the current gender or category filter.
                  </td>
                </tr>
              ) : (
                displayedStandings.map((athlete, index) => {
                  const currentRank = index + 1;
                  const isWinner = currentRank === 1;
                  const athleteSex = athleteSexMap.get(athlete.athleteId);

                  return (
                    <tr
                      key={athlete.athleteId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isWinner ? 'bg-red-950/10' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                            currentRank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                              : currentRank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : currentRank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {currentRank}
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-400">
                        {athlete.lotNumber}
                      </td>

                      <td className="p-3 font-bold text-white">
                        <div className="flex items-center space-x-1.5">
                          <span>{athlete.name}</span>
                          {athleteSex && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              {athleteSex}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{athlete.team || 'Independent'}</div>
                      </td>

                      <td className="p-3 text-slate-300 font-medium">{athlete.category}</td>

                      <td className="p-3 text-right font-mono text-slate-200">
                        {athlete.officialBodyweightKg !== undefined ? athlete.officialBodyweightKg.toFixed(2) : '-'}
                      </td>

                      <td
                        className={`p-3 text-center font-bold text-slate-200 ${
                          sortBy === 'squat' ? 'bg-red-950/30 text-red-300 font-extrabold' : 'bg-slate-950/20'
                        }`}
                      >
                        {athlete.bestSquatKg ? `${athlete.bestSquatKg} kg` : '-'}
                      </td>

                      <td
                        className={`p-3 text-center font-bold text-slate-200 ${
                          sortBy === 'bench_press' ? 'bg-red-950/30 text-red-300 font-extrabold' : 'bg-slate-950/20'
                        }`}
                      >
                        {athlete.bestBenchKg ? `${athlete.bestBenchKg} kg` : '-'}
                      </td>

                      <td
                        className={`p-3 text-center font-bold text-slate-200 ${
                          sortBy === 'deadlift' ? 'bg-red-950/30 text-red-300 font-extrabold' : 'bg-slate-950/20'
                        }`}
                      >
                        {athlete.bestDeadliftKg ? `${athlete.bestDeadliftKg} kg` : '-'}
                      </td>

                      <td
                        className={`p-3 text-center font-black text-sm ${
                          sortBy === 'total' ? 'text-white bg-red-950/50 ring-1 ring-red-500/40' : 'text-red-400 bg-red-950/30'
                        }`}
                      >
                        {athlete.totalKg ? `${athlete.totalKg} kg` : '0 kg'}
                      </td>

                      {event.rulesSnapshot.bodyweightRatioEnabled && (
                        <td
                          className={`p-3 text-center font-mono font-bold ${
                            sortBy === 'ratio' ? 'bg-emerald-950/30 text-emerald-300' : 'text-emerald-400'
                          }`}
                        >
                          {athlete.bodyweightRatio !== undefined ? athlete.bodyweightRatio.toFixed(2) : '-'}
                        </td>
                      )}

                      <td
                        className={`p-3 text-center font-mono ${
                          sortBy === 'dots' ? 'bg-blue-950/30 text-blue-300 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {athlete.dots !== undefined ? athlete.dots.toFixed(2) : '-'}
                      </td>

                      <td className="p-3 text-slate-400 text-[11px] leading-tight max-w-xs">
                        {athlete.tieBreakReason || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Standings if enabled */}
      {event.rulesSnapshot.enableTeamScoring && results.teamStandings && results.teamStandings.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Award className="w-5 h-5 text-red-400" />
            <span>Official Federation Team Standings (IPF 12-9-8-7-6-5-4-3-2-1 Points)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {results.teamStandings.map((team, idx) => (
              <div key={team.teamName} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 uppercase">Rank #{idx + 1}</span>
                  <span className="text-lg font-black text-amber-400">{team.totalPoints} PTS</span>
                </div>
                <div className="font-bold text-white text-base">{team.teamName}</div>
                <div className="text-xs text-slate-400">
                  {team.topLiftersCount} scoring lifters contributing to team total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
