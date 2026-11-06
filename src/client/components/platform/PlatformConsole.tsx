import React, { useState } from 'react';
import { Athlete } from '../../../core/types/athlete';
import { Attempt, LiftType } from '../../../core/types/attempt';
import { CompetitionEvent } from '../../../core/types/competition';
import { RoundScheduler, PlatformQueueState } from '../../../core/attempt-scheduler/round-scheduler';
import { BarLoaderCalculator } from '../../../core/attempt-scheduler/bar-loader';
import { Dumbbell, Clock, UserCheck, AlertCircle, Play, ChevronRight, Edit3 } from 'lucide-react';

interface PlatformConsoleProps {
  event: CompetitionEvent;
  athletes: Athlete[];
  attempts: Attempt[];
  onSelectAttemptForJudging: (attempt: Attempt) => void;
  onDeclareAttempt: (athleteId: string, liftType: LiftType, attemptNumber: number, weightKg: number) => Promise<void>;
}

export const PlatformConsole: React.FC<PlatformConsoleProps> = ({
  event,
  athletes,
  attempts,
  onSelectAttemptForJudging,
  onDeclareAttempt,
}) => {
  const [activeLift, setActiveLift] = useState<LiftType>('squat');
  const [activeRound, setActiveRound] = useState<number>(1);
  const [changeModalAthlete, setChangeModalAthlete] = useState<Athlete | null>(null);
  const [changeWeightInput, setChangeWeightInput] = useState<number>(0);

  const totalAttemptsAllowed = event.rulesSnapshot.attemptsPerLift || 3;
  const availableRounds = Array.from({ length: totalAttemptsAllowed }, (_, i) => i + 1);

  // If current activeRound > totalAttemptsAllowed, reset to 1
  const currentRound = activeRound > totalAttemptsAllowed ? 1 : activeRound;

  // Calculate scheduled attempts for active lift and round
  const scheduledItems = RoundScheduler.sortAttemptsForRound(athletes, attempts, activeLift, currentRound);
  const queueState: PlatformQueueState = RoundScheduler.getPlatformQueue(scheduledItems);

  const currentAttempt = queueState.currentLifter?.attempt;
  const currentAthlete = queueState.currentLifter?.athlete;

  const plateLoading = currentAttempt
    ? BarLoaderCalculator.calculate(currentAttempt.weightKg)
    : undefined;

  const handleOpenChangeModal = (athlete: Athlete, currentWeight: number) => {
    setChangeModalAthlete(athlete);
    setChangeWeightInput(currentWeight);
  };

  const handleSaveChange = async () => {
    if (!changeModalAthlete) return;
    await onDeclareAttempt(changeModalAthlete.id, activeLift, currentRound, changeWeightInput);
    setChangeModalAthlete(null);
  };

  const getPlateBadgeColor = (color: string) => {
    switch (color) {
      case 'Red':
        return 'bg-red-600 text-white border-red-700';
      case 'Blue':
        return 'bg-blue-600 text-white border-blue-700';
      case 'Yellow':
        return 'bg-amber-400 text-slate-950 border-amber-500 font-bold';
      case 'Green':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'White':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'Black':
        return 'bg-slate-900 text-slate-100 border-slate-700';
      default:
        return 'bg-slate-400 text-slate-900 border-slate-500';
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Lift & Dynamic Round Selector with Red Accent */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        {/* Lift Selector */}
        <div className="flex space-x-2">
          {(['squat', 'bench_press', 'deadlift'] as LiftType[]).map((lift) => (
            <button
              key={lift}
              onClick={() => setActiveLift(lift)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                activeLift === lift
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {lift.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Dynamic Round Selector (Renders [1, 2] if attempts = 2) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Rounds ({totalAttemptsAllowed} Attempts Meet):
          </span>
          {availableRounds.map((round) => (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                currentRound === round
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              #{round}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stage Grid: Current Platform + Plate Loader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Lifter On Platform */}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-red-600 text-white text-xs font-extrabold uppercase tracking-widest rounded-bl-xl shadow-md">
            ON PLATFORM
          </div>

          {currentAthlete && currentAttempt ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded font-bold bg-slate-800 text-red-400 border border-slate-700">
                    Lot #{currentAthlete.lotNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentAthlete.verifiedWeightCategory || currentAthlete.declaredWeightCategory} • {currentAthlete.equipmentDivision.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  {currentAthlete.firstName} {currentAthlete.lastName}
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Affiliation: <span className="text-slate-200">{currentAthlete.teamOrAffiliation || 'Independent'}</span>
                  {currentAthlete.rackHeights?.squatRackHeight && ` • SQ Rack: ${currentAthlete.rackHeights.squatRackHeight}`}
                  {currentAthlete.rackHeights?.benchRackHeight && ` • BP Rack: ${currentAthlete.rackHeights.benchRackHeight}`}
                </div>
              </div>

              {/* Huge Weight Banner */}
              <div className="flex items-baseline space-x-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6">
                <span className="text-6xl font-black text-red-500 tracking-tight">
                  {currentAttempt.weightKg.toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-slate-400">KG</span>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400 uppercase ml-auto">
                  Attempt #{currentAttempt.attemptNumber} of {totalAttemptsAllowed}
                </span>
              </div>

              {/* Visual Plate Loader */}
              {plateLoading && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Platform Loader Plate Breakdown (Each Side)</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Bar: {plateLoading.barbellWeightKg}kg + Collars: {plateLoading.collarsWeightKg}kg
                    </span>
                  </div>

                  {/* Colored Plate Discs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {plateLoading.platesPerSide.map((plate, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 shadow-sm ${getPlateBadgeColor(
                          plate.color
                        )}`}
                      >
                        <span>{plate.count}x</span>
                        <span>{plate.weightKg} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Send to Referee Judging */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleOpenChangeModal(currentAthlete, currentAttempt.weightKg)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Change Weight</span>
                </button>

                <button
                  onClick={() => onSelectAttemptForJudging(currentAttempt)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Open Referee Lights Station</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <Dumbbell className="w-12 h-12 text-slate-600 mx-auto opacity-40" />
              <div className="text-sm font-bold text-slate-400">Round #{currentRound} Complete</div>
              <p className="text-xs text-slate-500">All lifters in this round have completed their attempts.</p>
            </div>
          )}
        </div>

        {/* On Deck & In The Hole Queue */}
        <div className="space-y-4">
          {/* On Deck */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>ON DECK (NEXT)</span>
            </div>
            {queueState.onDeck ? (
              <div>
                <div className="text-base font-bold text-white">
                  {queueState.onDeck.athlete.firstName} {queueState.onDeck.athlete.lastName}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Lot #{queueState.onDeck.athlete.lotNumber}</span>
                  <span className="font-extrabold text-white text-sm">
                    {queueState.onDeck.attempt.weightKg} kg
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3">No next lifter in round</div>
            )}
          </div>

          {/* In The Hole */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <span>IN THE HOLE</span>
            </div>
            {queueState.inTheHole ? (
              <div>
                <div className="text-sm font-bold text-slate-300">
                  {queueState.inTheHole.athlete.firstName} {queueState.inTheHole.athlete.lastName}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Lot #{queueState.inTheHole.athlete.lotNumber}</span>
                  <span className="font-bold text-slate-200">
                    {queueState.inTheHole.attempt.weightKg} kg
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">Queue clear</div>
            )}
          </div>

          {/* Round Progress Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Round #{currentRound} Progress</span>
              <span>
                {queueState.completedCount} / {queueState.totalInRound} lifts
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    queueState.totalInRound > 0
                      ? (queueState.completedCount / queueState.totalInRound) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Round Lifting Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="font-bold text-sm text-white flex items-center space-x-2">
            <span>Ascending Order Queue — Round #{currentRound}</span>
            <span className="text-xs text-slate-400 font-normal">
              (Lighter weights lift first; equal weights ordered by lower lot number)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center">Order</th>
                <th className="p-3 text-center">Lot</th>
                <th className="p-3">Athlete</th>
                <th className="p-3">Category</th>
                <th className="p-3 font-bold text-right">Requested Weight</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {scheduledItems.map((item, idx) => (
                <tr
                  key={item.attempt.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    item.attempt.id === currentAttempt?.id ? 'bg-red-950/30 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 text-center font-bold text-slate-400">#{item.queuePosition}</td>
                  <td className="p-3 text-center font-bold text-red-400">{item.athlete.lotNumber}</td>
                  <td className="p-3 font-medium text-white">
                    {item.athlete.firstName} {item.athlete.lastName}
                  </td>
                  <td className="p-3 text-slate-400">
                    {item.athlete.verifiedWeightCategory || item.athlete.declaredWeightCategory}
                  </td>
                  <td className="p-3 text-right font-extrabold text-sm text-white">
                    {item.attempt.weightKg} kg
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        item.attempt.status === 'good_lift'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : item.attempt.status === 'no_lift'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.attempt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectAttemptForJudging(item.attempt)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-red-600 hover:text-white rounded text-xs font-semibold text-slate-300 transition-colors"
                    >
                      Judge Lift
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attempt Weight Change Modal */}
      {changeModalAthlete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Declare / Change Attempt Weight</h3>
            <p className="text-xs text-slate-400">
              Lifter: <strong className="text-white">{changeModalAthlete.firstName} {changeModalAthlete.lastName}</strong> • {activeLift.toUpperCase()} #{currentRound}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Requested Weight (KG)</label>
              <input
                type="number"
                step="0.5"
                value={changeWeightInput}
                onChange={(e) => setChangeWeightInput(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-extrabold text-white outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Deadlift final round permits weight changes prior to bar loading.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setChangeModalAthlete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChange}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/30"
              >
                Confirm Weight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
