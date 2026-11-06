import React, { useState, useEffect } from 'react';
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
  Pencil,
  UserPlus,
  Scale,
} from 'lucide-react';

interface PlatformConsoleProps {
  event: CompetitionEvent;
  athletes: Athlete[];
  attempts: Attempt[];
  isOrganizer: boolean;
  onDeclareAttempt: (athleteId: string, liftType: LiftType, attemptNumber: number, weightKg: number) => Promise<void>;
  onVote: (role: RefereeRole, decision: RefereeDecision, infractions?: string[]) => Promise<void>;
  onQuickJudge: (attemptId: string, decision: RefereeDecision) => Promise<void>;
  onQuickJudgeAttempt?: (
    athleteId: string,
    liftType: LiftType,
    attemptNumber: number,
    weightKg: number,
    decision: RefereeDecision
  ) => Promise<void>;
  onRegisterAthlete?: (data: Partial<Athlete> & {
    openingSquatKg?: number;
    openingBenchKg?: number;
    openingDeadliftKg?: number;
  }) => Promise<void>;
}

export const PlatformConsole: React.FC<PlatformConsoleProps> = ({
  event,
  athletes,
  attempts,
  isOrganizer,
  onDeclareAttempt,
  onVote,
  onQuickJudge,
  onQuickJudgeAttempt,
  onRegisterAthlete,
}) => {
  const [activeAthleteIndex, setActiveAthleteIndex] = useState<number>(0);
  const [activeLift, setActiveLift] = useState<LiftType>('squat');
  const [activeAttemptNum, setActiveAttemptNum] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Participant modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newSex, setNewSex] = useState<'M' | 'F'>('M');
  const [newCategory, setNewCategory] = useState('Open');
  const [newBodyweight, setNewBodyweight] = useState('');
  const [newSquatRack, setNewSquatRack] = useState('');
  const [newBenchRack, setNewBenchRack] = useState('');
  const [newOpenSquat, setNewOpenSquat] = useState('');
  const [newOpenBench, setNewOpenBench] = useState('');
  const [newOpenDeadlift, setNewOpenDeadlift] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  const categories = event.rulesSnapshot.categories || [
    { id: 'c1', name: 'Open', minBodyweightKg: 0, maxBodyweightKg: 300, sex: 'both', division: 'raw' },
  ];

  const handleQuickAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRegisterAthlete) return;
    setIsAddingParticipant(true);
    try {
      const nextLot = athletes.length + 1;
      const effectiveFirstName = newFirstName.trim() || `Lifter #${nextLot}`;
      const effectiveLastName = newLastName.trim() || '';
      const bw = parseFloat(newBodyweight);
      const sqRack = parseInt(newSquatRack, 10);
      const bpRack = parseInt(newBenchRack, 10);
      const sq = parseFloat(newOpenSquat);
      const bp = parseFloat(newOpenBench);
      const dl = parseFloat(newOpenDeadlift);

      await onRegisterAthlete({
        firstName: effectiveFirstName,
        lastName: effectiveLastName,
        sex: newSex,
        declaredWeightCategory: newCategory,
        verifiedWeightCategory: newCategory,
        officialBodyweightKg: !isNaN(bw) && bw > 0 ? bw : undefined,
        weighInStatus: !isNaN(bw) && bw > 0 ? 'passed' : 'pending',
        rackHeights: {
          squatRackHeight: !isNaN(sqRack) ? sqRack : undefined,
          benchRackHeight: !isNaN(bpRack) ? bpRack : undefined,
        },
        openingSquatKg: !isNaN(sq) && sq > 0 ? sq : undefined,
        openingBenchKg: !isNaN(bp) && bp > 0 ? bp : undefined,
        openingDeadliftKg: !isNaN(dl) && dl > 0 ? dl : undefined,
      });

      // Jump to newly created participant on the platform
      setActiveAthleteIndex(athletes.length);
      setIsAddModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewBodyweight('');
      setNewSquatRack('');
      setNewBenchRack('');
      setNewOpenSquat('');
      setNewOpenBench('');
      setNewOpenDeadlift('');
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const totalAttemptsAllowed = event.rulesSnapshot.attemptsPerLift || 3;
  const lifts: LiftType[] = ['squat', 'bench_press', 'deadlift'];

  const renderAddModal = () => {
    if (!isAddModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn text-left">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-red-500" />
              <span>Add Participant to Platform</span>
            </h3>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="text-slate-400 hover:text-white text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-slate-400 my-3">
            Add a participant immediately without leaving the dashboard. All options are optional.
          </p>

          <form onSubmit={handleQuickAddParticipant} className="space-y-4">
            {/* Names (Optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  First Name <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Last Name <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vance"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Sex & Weight Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                <select
                  value={newSex}
                  onChange={(e) => setNewSex(e.target.value as 'M' | 'F')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Weight Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Open">Open Weight</option>
                </select>
              </div>
            </div>

            {/* Verified Bodyweight */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Weigh-In Verification <span className="text-[10px] text-slate-500 font-normal normal-case">(optional)</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 75"
                  value={newBodyweight}
                  onChange={(e) => setNewBodyweight(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-red-500"
                />
                <span className="text-xs font-bold text-slate-400">KG</span>
              </div>
            </div>

            {/* Rack Heights */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Squat Rack <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={newSquatRack}
                  onChange={(e) => setNewSquatRack(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bench Rack <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={newBenchRack}
                  onChange={(e) => setNewBenchRack(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Opening Attempts */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Dumbbell className="w-4 h-4 text-red-500" />
                <span>Opening Attempt Declarations <span className="text-[10px] text-slate-500 font-normal normal-case">(optional)</span></span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Squat 1 (kg)</label>
                  <input
                    type="number"
                    step="2.5"
                    placeholder="e.g. 140"
                    value={newOpenSquat}
                    onChange={(e) => setNewOpenSquat(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bench 1 (kg)</label>
                  <input
                    type="number"
                    step="2.5"
                    placeholder="e.g. 100"
                    value={newOpenBench}
                    onChange={(e) => setNewOpenBench(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Deadlift 1 (kg)</label>
                  <input
                    type="number"
                    step="2.5"
                    placeholder="e.g. 180"
                    value={newOpenDeadlift}
                    onChange={(e) => setNewOpenDeadlift(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="pt-2 flex space-x-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingParticipant}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-red-600/30 transition disabled:opacity-50"
              >
                {isAddingParticipant ? 'Saving...' : 'Save Lifter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (athletes.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <Dumbbell className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Participants Registered Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Add your first lifter directly from the dashboard to start officiating attempts.
        </p>
        {isOrganizer && onRegisterAthlete && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 inline-flex items-center space-x-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Participant</span>
          </button>
        )}
        {renderAddModal()}
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

  const currentTargetWeight =
    existingAttempt?.weightKg ||
    (activeLift === 'squat' ? 140 : activeLift === 'bench_press' ? 100 : 180);

  const [editingWeight, setEditingWeight] = useState<number>(currentTargetWeight);

  useEffect(() => {
    setEditingWeight(currentTargetWeight);
  }, [currentAthlete?.id, activeLift, activeAttemptNum, existingAttempt?.weightKg]);

  const attemptStatus = existingAttempt?.majorityDecision || existingAttempt?.status || 'pending';

  // Barbell plate calculation based on current/editing weight
  const plateLoading = BarLoaderCalculator.calculate(editingWeight);

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

  // Real-time Weight Updaters
  const handleUpdateWeight = async (newWeight: number) => {
    const valid = Math.max(20, Math.min(600, Math.round(newWeight * 10) / 10));
    setEditingWeight(valid);
    await onDeclareAttempt(currentAthlete.id, activeLift, activeAttemptNum, valid);
  };

  const handleAdjustWeight = async (delta: number) => {
    await handleUpdateWeight(editingWeight + delta);
  };

  // Working Decision Actions
  const handleRecordDecision = async (decision: RefereeDecision) => {
    setIsSubmitting(true);
    try {
      if (existingAttempt) {
        await onQuickJudge(existingAttempt.id, decision);
      } else if (onQuickJudgeAttempt) {
        await onQuickJudgeAttempt(
          currentAthlete.id,
          activeLift,
          activeAttemptNum,
          editingWeight,
          decision
        );
      } else {
        await onDeclareAttempt(currentAthlete.id, activeLift, activeAttemptNum, editingWeight);
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
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-red-500" />
            <span>Platform Competition Controls</span>
          </span>
          {isOrganizer && onRegisterAthlete && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-red-600/30 active:scale-95"
              title="Add participant directly to competition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Participant</span>
            </button>
          )}
        </div>

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

        {/* Big Weight Display with Direct Inline Editable Number & Quick Adjusters */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {activeLift.replace('_', ' ')} — Attempt #{activeAttemptNum}
              </span>

              <div className="flex items-baseline space-x-3">
                {isOrganizer ? (
                  <div className="relative group inline-flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      min="20"
                      max="600"
                      value={editingWeight === 0 ? '' : editingWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const nextVal = isNaN(val) ? 0 : val;
                        setEditingWeight(nextVal);
                        if (nextVal >= 20 && nextVal <= 600) {
                          onDeclareAttempt(currentAthlete.id, activeLift, activeAttemptNum, nextVal);
                        }
                      }}
                      onBlur={() => {
                        if (editingWeight > 0) {
                          handleUpdateWeight(editingWeight);
                        } else {
                          setEditingWeight(currentTargetWeight);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingWeight > 0) {
                          handleUpdateWeight(editingWeight);
                          (e.target as HTMLInputElement).blur();
                        } else if (e.key === 'Escape') {
                          setEditingWeight(currentTargetWeight);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-52 sm:w-64 bg-slate-950/70 hover:bg-slate-900 focus:bg-slate-900 border-2 border-transparent hover:border-slate-700 focus:border-red-500 rounded-2xl px-2 py-0.5 text-6xl sm:text-7xl font-black text-red-500 tracking-tight font-mono outline-none transition-all cursor-text shadow-inner"
                      title="Click directly to edit weight"
                    />
                    <span className="text-2xl font-bold text-slate-400 ml-3">KG</span>
                    <span className="hidden group-hover:inline-flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md ml-3 transition animate-in fade-in">
                      <Pencil className="w-3 h-3 text-red-400" />
                      <span>Click to edit</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline space-x-3">
                    <span className="text-6xl sm:text-7xl font-black text-red-500 tracking-tight font-mono">
                      {editingWeight.toFixed(1)}
                    </span>
                    <span className="text-2xl font-bold text-slate-400">KG</span>
                  </div>
                )}
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

      {/* Quick Add Participant Modal */}
      {renderAddModal()}
    </div>
  );
};
