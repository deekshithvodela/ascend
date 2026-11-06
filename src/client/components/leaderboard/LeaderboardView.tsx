import React, { useState } from 'react';
import { AthleteStanding, CompetitionResults } from '../../../core/types/ranking';
import { CompetitionEvent } from '../../../core/types/competition';
import { Trophy, Download, Printer, Filter, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface LeaderboardViewProps {
  event: CompetitionEvent;
  results: CompetitionResults | null;
  onRefreshResults: () => Promise<void>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  event,
  results,
  onRefreshResults,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'category' | 'overall'>('category');

  if (!results) {
    return (
      <div className="py-16 text-center text-slate-400">Loading competition standings...</div>
    );
  }

  const isIpf = event.rulesSnapshot.profileId === 'ipf_inspired';
  const categories = Object.keys(results.categoryStandings);

  const displayedStandings: AthleteStanding[] =
    viewMode === 'overall' || selectedCategory === 'ALL'
      ? results.overallStandings
      : results.categoryStandings[selectedCategory] || [];

  const handleDownloadCsv = (type: 'results' | 'weighin') => {
    window.open(`/api/events/${event.id}/sheets/csv-${type}`, '_blank');
  };

  const handleOpenSheet = (sheetType: string) => {
    window.open(`/api/events/${event.id}/sheets/${sheetType}`, '_blank');
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
            Primary Metric: <strong className="text-red-400">{event.rulesSnapshot.primaryRankingMetric.replace(/_/g, ' ').toUpperCase()}</strong> • Tie-breakers: {event.rulesSnapshot.tieBreakers.map(t => t.replace(/_/g, ' ')).join(' → ')}
          </p>
        </div>

        {/* Export & Sheets Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('results')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenSheet('score-sheet')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-md shadow-red-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Official Score Sheet</span>
          </button>

          <button
            onClick={() => handleOpenSheet('weigh-in')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Weigh-In Sheet</span>
          </button>

          <button
            onClick={() => handleOpenSheet('referee-records')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Referee Decisions</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: Category vs Overall */}
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

      {/* Standings Table with Full Attempt Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-3 text-center">Rank</th>
                <th className="p-3 text-center">Lot</th>
                <th className="p-3">Athlete</th>
                <th className="p-3">Cat</th>
                <th className="p-3 text-right">BW (kg)</th>
                <th className="p-3 text-center bg-slate-950/40">SQ Best</th>
                <th className="p-3 text-center bg-slate-950/40">BP Best</th>
                <th className="p-3 text-center bg-slate-950/40">DL Best</th>
                <th className="p-3 text-center font-extrabold text-red-400 bg-red-950/20">TOTAL</th>
                {event.rulesSnapshot.bodyweightRatioEnabled && (
                  <th className="p-3 text-center font-bold text-emerald-400">Ratio</th>
                )}
                <th className="p-3 text-center">DOTS</th>
                <th className="p-3">Tie-Break Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedStandings.map((athlete) => {
                const rank = viewMode === 'category' ? athlete.categoryRank : athlete.overallRank;
                const isWinner = rank === 1;

                return (
                  <tr
                    key={athlete.athleteId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isWinner ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      {rank ? (
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                            rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {rank}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold text-[10px] uppercase">
                          {athlete.lifterStatus}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center font-bold text-slate-400">
                      {athlete.lotNumber}
                    </td>

                    <td className="p-3 font-bold text-white">
                      <div>{athlete.name}</div>
                      <div className="text-[10px] text-slate-500">{athlete.team || 'Independent'}</div>
                    </td>

                    <td className="p-3 text-slate-300 font-medium">{athlete.category}</td>

                    <td className="p-3 text-right font-mono text-slate-200">
                      {athlete.officialBodyweightKg !== undefined ? athlete.officialBodyweightKg.toFixed(2) : '-'}
                    </td>

                    <td className="p-3 text-center font-bold text-slate-200 bg-slate-950/20">
                      {athlete.bestSquatKg ? `${athlete.bestSquatKg} kg` : '-'}
                    </td>

                    <td className="p-3 text-center font-bold text-slate-200 bg-slate-950/20">
                      {athlete.bestBenchKg ? `${athlete.bestBenchKg} kg` : '-'}
                    </td>

                    <td className="p-3 text-center font-bold text-slate-200 bg-slate-950/20">
                      {athlete.bestDeadliftKg ? `${athlete.bestDeadliftKg} kg` : '-'}
                    </td>

                    <td className="p-3 text-center font-black text-sm text-red-400 bg-red-950/30">
                      {athlete.totalKg ? `${athlete.totalKg} kg` : '0 kg'}
                    </td>

                    {event.rulesSnapshot.bodyweightRatioEnabled && (
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {athlete.bodyweightRatio !== undefined ? athlete.bodyweightRatio.toFixed(2) : '-'}
                      </td>
                    )}

                    <td className="p-3 text-center font-mono text-slate-300">
                      {athlete.dots !== undefined ? athlete.dots.toFixed(2) : '-'}
                    </td>

                    <td className="p-3 text-slate-400 text-[11px] leading-tight max-w-xs">
                      {athlete.tieBreakReason || '-'}
                    </td>
                  </tr>
                );
              })}
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
