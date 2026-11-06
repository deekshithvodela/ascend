import React, { useState } from 'react';
import { Athlete } from '../../../core/types/athlete';
import { Attempt, LiftType, RefereeDecision, RefereeRole } from '../../../core/types/attempt';
import { CompetitionEvent } from '../../../core/types/competition';
import { BarLoaderCalculator } from '../../../core/attempt-scheduler/bar-loader';
import {
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  User,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PlatformConsoleProps {
  event: CompetitionEvent;
  athletes: Athlete[];
  attempts: Attempt[];
  isOrganizer: boolean;
  onDeclareAttempt: (athleteId: string, liftType: LiftType, attemptNumber: number, weightKg: number) => Promise<void>;
  onVote: (role: RefereeRole, decision: RefereeDecision, infractions?: string[]) => Promise<void>;
  onQuickJudge: (attemptId: string, decision: RefereeDecision) => Promise<void>;
}

export const PlatformConsole: React.FC<PlatformConsoleProps> = ({
  event,
  athletes,
  attempts,
  isOrganizer,
  onDeclareAttempt,
  onVote,
  onQuickJudge,
}) => {
  const [activeAthleteIndex, setActiveAthleteIndex] = useState<number>(0);
  const [activeLift, setActiveLift] = useState<LiftType>('squat');
  const [activeAttemptNum, setActiveAttemptNum] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAttemptsAllowed = event.rulesSnapshot.attemptsPerLift || 3;
  const lifts: LiftType[] = ['squat', 'bench_press', 'deadlift'];

  if (athletes.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <Dumbbell className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Participants Registered Yet</h3>
        <p className="text-xs text-slate-400">
          Go to the <strong>Participants & Registration</strong> tab to add your first lifter with opening attempts.
        </p>
      </div>
    );
  }

  // Ensure valid athlete index
  const safeAthleteIndex = activeAthleteIndex >= athletes.length ? 0 : activeAthleteIndex;
  const currentAthlete = athletes[safeAthleteIndex];

  // Find or create virtual attempt for the selected athlete, lift & attempt number
  const existingAttempt = attempts.find(
    (a) =>
      a.athleteId === currentAthlete.id &&
      a.liftType === activeLift &&
      a.attemptNumber === activeAttemptNum
  );

  const defaultWeight =
    existingAttempt?.weightKg ||
    (activeLift === 'squat' ? 140 : activeLift === 'bench_press' ? 100 : 180);

  const attemptStatus = existingAttempt?.majorityDecision || existingAttempt?.status || 'pending';

  // Barbell plate calculation
  const plateLoading = BarLoaderCalculator.calculate(defaultWeight);

  // Stepper handlers
  const handlePrevLifter = () => {
    setActiveAthleteIndex((prev) => (prev > 0 ? prev - 1 : athletes.length - 1));
  };

  const handleNextLifter = () => {
    setActiveAthleteIndex((prev) => (prev < athletes.length - 1 ? prev + 1 : 0));
  };

  const handlePrevLift = () => {
    const idx = lifts.indexOf(activeLift);
    const prevIdx = idx > 0 ? idx - 1 : lifts.length - 1;
    setActiveLift(lifts[prevIdx]);
  };

  const handleNextLift = () => {
    const idx = lifts.indexOf(activeLift);
    const nextIdx = idx < lifts.length - 1 ? idx + 1 : 0;
    setActiveLift(lifts[nextIdx]);
  };

  const handlePrevAttempt = () => {
    setActiveAttemptNum((prev) => (prev > 1 ? prev - 1 : totalAttemptsAllowed));
  };

  const handleNextAttempt = () => {
    setActiveAttemptNum((prev) => (prev < totalAttemptsAllowed ? prev + 1 : 1));
  };

  // Weight adjusters
  const handleAdjustWeight = async (delta: number) => {
    const newWeight = Math.max(20, defaultWeight + delta);
    await onDeclareAttempt(currentAthlete.id, activeLift, activeAttemptNum, newWeight);
  };

  // Working Decision Actions
  const handleRecordDecision = async (decision: RefereeDecision) => {
    setIsSubmitting(true);
    try {
      if (existingAttempt) {
        await onQuickJudge(existingAttempt.id, decision);
      } else {
        // Declare first if not already declared, then judge
        await onDeclareAttempt(currentAthlete.id, activeLift, activeAttemptNum, defaultWeight);
        // Reload will associate attempt
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndNextLifter = async (decision: RefereeDecision) => {
    await handleRecordDecision(decision);
    handleNextLifter();
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
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* 1. Global Stepper Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* A. Lifter Stepper */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
            <button
              onClick={handlePrevLifter}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Previous Lifter"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center px-2 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Lifter ({safeAthleteIndex + 1}/{athletes.length})
              </span>
              <select
                value={currentAthlete.id}
                onChange={(e) => {
                  const idx = athletes.findIndex((a) => a.id === e.target.value);
                  if (idx !== -1) setActiveAthleteIndex(idx);
                }}
                className="bg-transparent text-sm font-bold text-white text-center cursor-pointer outline-none max-w-[200px] truncate"
              >
                {athletes.map((a, i) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                    #{a.lotNumber} {a.firstName} {a.lastName}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextLifter}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Next Lifter"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* B. Lift Stepper */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
            <button
              onClick={handlePrevLift}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Previous Lift"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex space-x-1">
              {lifts.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLift(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                    activeLift === l
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {l === 'squat' ? 'Squat' : l === 'bench_press' ? 'Bench' : 'Deadlift'}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextLift}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Next Lift"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* C. Attempt Stepper */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
            <button
              onClick={handlePrevAttempt}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Previous Attempt"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex space-x-1.5 items-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Attempt:</span>
              {Array.from({ length: totalAttemptsAllowed }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setActiveAttemptNum(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    activeAttemptNum === num
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  #{num}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextAttempt}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Next Attempt"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Stage: Active Lifter Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-md shadow-red-600/30">
              ON PLATFORM
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Lot #{currentAthlete.lotNumber}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {currentAthlete.verifiedWeightCategory || currentAthlete.declaredWeightCategory}
            </span>
          </div>

          {/* Attempt Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              attemptStatus === 'good_lift'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : attemptStatus === 'no_lift'
                ? 'bg-red-950 text-red-300 border border-red-700'
                : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}
          >
            {attemptStatus.replace('_', ' ')}
          </span>
        </div>

        {/* Lifter Details */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {currentAthlete.firstName} {currentAthlete.lastName}
          </h1>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>Bodyweight: <strong className="text-slate-200">{currentAthlete.officialBodyweightKg?.toFixed(1) || '—'} kg</strong></span>
            <span>•</span>
            <span>Squat Rack: <strong className="text-slate-200">{currentAthlete.rackHeights?.squatRackHeight || '—'}</strong></span>
            <span>•</span>
            <span>Bench Rack: <strong className="text-slate-200">{currentAthlete.rackHeights?.benchRackHeight || '—'}</strong></span>
          </div>
        </div>

        {/* Big Weight Display with Quick Adjusters */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {activeLift.replace('_', ' ')} — Attempt #{activeAttemptNum}
              </span>
              <div className="flex items-baseline space-x-3">
                <span className="text-6xl sm:text-7xl font-black text-red-500 tracking-tight font-mono">
                  {defaultWeight.toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-slate-400">KG</span>
              </div>
            </div>

            {/* Quick Weight Adjust Steppers */}
            {isOrganizer && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleAdjustWeight(-5)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
                >
                  -5 kg
                </button>
                <button
                  onClick={() => handleAdjustWeight(-2.5)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition"
                >
                  -2.5 kg
                </button>
                <button
                  onClick={() => handleAdjustWeight(2.5)}
                  className="px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900/80 text-red-300 text-xs font-bold border border-red-800 transition"
                >
                  +2.5 kg
                </button>
                <button
                  onClick={() => handleAdjustWeight(5)}
                  className="px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900/80 text-red-300 text-xs font-bold border border-red-800 transition"
                >
                  +5 kg
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Barbell Plate Loading Visualizer */}
        {plateLoading && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 mb-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Barbell Loading Per Side</span>
              <span className="text-[11px] text-slate-500 font-mono">
                Bar: {plateLoading.barbellWeightKg}kg + Collars: {plateLoading.collarsWeightKg}kg
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {plateLoading.platesPerSide.map((p, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1.5 shadow-sm ${getPlateBadgeColor(
                    p.color
                  )}`}
                >
                  <span>{p.count}x</span>
                  <span>{p.weightKg} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. WORKING DECISION BUTTONS & QUICK ADVANCE */}
        {isOrganizer ? (
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Good Lift Action */}
              <button
                disabled={isSubmitting}
                onClick={() => handleRecordDecision('good_lift')}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-black text-lg shadow-xl shadow-emerald-900/30 flex items-center justify-center space-x-3 transition active:scale-[0.98]"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>⚪ GOOD LIFT</span>
              </button>

              {/* No Lift Action */}
              <button
                disabled={isSubmitting}
                onClick={() => handleRecordDecision('no_lift')}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-lg shadow-xl shadow-red-900/30 flex items-center justify-center space-x-3 transition active:scale-[0.98]"
              >
                <XCircle className="w-6 h-6" />
                <span>🔴 NO LIFT</span>
              </button>
            </div>

            {/* Quick Advance Workflow */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleNextLifter}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 transition"
              >
                <span>Next Lifter in Flight</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextAttempt}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 transition"
              >
                <span>Next Attempt (Round #{activeAttemptNum < totalAttemptsAllowed ? activeAttemptNum + 1 : 1})</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextLift}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 transition"
              >
                <span>Next Discipline</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-400">
            Spectator View • Sign in as Meet Organizer to record attempts and referee decisions.
          </div>
        )}
      </div>

      {/* 4. Complete Flight Participant Roster Table for this Lift */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <span>Flight Roster — {activeLift.toUpperCase().replace('_', ' ')} (Attempt #{activeAttemptNum})</span>
          </h3>
          <span className="text-xs text-slate-400">Click any lifter to select</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center">Lot</th>
                <th className="p-3">Lifter</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Attempt Weight</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {athletes.map((ath, idx) => {
                const att = attempts.find(
                  (a) => a.athleteId === ath.id && a.liftType === activeLift && a.attemptNumber === activeAttemptNum
                );
                const isSelected = idx === safeAthleteIndex;
                const status = att?.majorityDecision || att?.status || 'pending';

                return (
                  <tr
                    key={ath.id}
                    onClick={() => setActiveAthleteIndex(idx)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-red-950/30 text-white' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 text-center font-bold text-red-400">#{ath.lotNumber}</td>
                    <td className="p-3 font-bold text-white">
                      {ath.firstName} {ath.lastName}
                    </td>
                    <td className="p-3 text-slate-300">{ath.verifiedWeightCategory || ath.declaredWeightCategory}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      {att ? `${att.weightKg} kg` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          status === 'good_lift'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : status === 'no_lift'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAthleteIndex(idx);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Load'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
