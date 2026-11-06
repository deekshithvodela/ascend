import React, { useState } from 'react';
import { Attempt, RefereeRole, RefereeDecision, RefereeVote } from '../../../core/types/attempt';
import { Athlete } from '../../../core/types/athlete';
import { CompetitionEvent } from '../../../core/types/competition';
import { getInfractionsForLift, TechnicalInfractionCode } from '../../../core/technical-validation';
import { ShieldCheck, AlertOctagon, Check, X, ShieldAlert, Award, UserCheck } from 'lucide-react';

interface RefereeConsoleProps {
  event: CompetitionEvent;
  attempt?: Attempt;
  athlete?: Athlete;
  onVote: (role: RefereeRole, decision: RefereeDecision, infractions?: string[]) => Promise<void>;
  onJuryOverride: (overriddenDecision: RefereeDecision, authorizedBy: string, reason: string) => Promise<void>;
  onClose: () => void;
}

export const RefereeConsole: React.FC<RefereeConsoleProps> = ({
  event,
  attempt,
  athlete,
  onVote,
  onJuryOverride,
  onClose,
}) => {
  const [selectedInfractions, setSelectedInfractions] = useState<Record<RefereeRole, string[]>>({
    chief: [],
    left: [],
    right: [],
    operator: [],
  });

  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideDecision, setOverrideDecision] = useState<RefereeDecision>('good_lift');
  const [authorizedOfficial, setAuthorizedOfficial] = useState<string>('Jury President Dr. Vance');
  const [overrideReason, setOverrideReason] = useState<string>('');

  if (!attempt || !athlete) {
    return (
      <div className="py-16 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-8 my-6">
        <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
        <div className="text-base font-bold text-slate-300">No Attempt Selected for Judging</div>
        <p className="text-xs text-slate-400">
          Select an active attempt from the Platform & Queue screen to open the referee lights console.
        </p>
      </div>
    );
  }

  const isSingleReferee = event.rulesSnapshot.judgingMode === 'single_operator';
  const liftInfractions = getInfractionsForLift(attempt.liftType);

  const getVote = (role: RefereeRole): RefereeVote | undefined => {
    return attempt.refereeVotes.find((v) => v.refereeRole === role);
  };

  const chiefVote = getVote('chief');
  const leftVote = getVote('left');
  const rightVote = getVote('right');
  const operatorVote = getVote('operator') || chiefVote;

  const handleCastVote = async (role: RefereeRole, decision: RefereeDecision) => {
    const infractions = decision === 'no_lift' ? selectedInfractions[role] : [];
    await onVote(role, decision, infractions);
  };

  const toggleInfraction = (role: RefereeRole, code: string) => {
    setSelectedInfractions((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, [role]: updated };
    });
  };

  const handleConfirmOverride = async () => {
    if (!overrideReason.trim()) {
      alert('A technical justification is strictly required for Jury Overrides.');
      return;
    }
    await onJuryOverride(overrideDecision, authorizedOfficial, overrideReason);
    setShowOverrideModal(false);
  };

  return (
    <div className="py-6 space-y-6">
      {/* Top Banner: Athlete & Lift Info with Red Accent */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <span className="font-bold text-red-400">Lot #{athlete.lotNumber}</span>
            <span>•</span>
            <span>{athlete.verifiedWeightCategory || athlete.declaredWeightCategory}</span>
            <span>•</span>
            <span className="uppercase font-semibold text-slate-300">
              {attempt.liftType.replace('_', ' ')} — Attempt #{attempt.attemptNumber}
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-red-300 border border-slate-700">
              {isSingleReferee ? '1 Official Referee Station' : '3 Official Referees Panel'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {athlete.firstName} {athlete.lastName}
          </h2>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-semibold">ATTEMPT WEIGHT</span>
            <span className="text-4xl font-black text-red-400 tracking-tight">
              {attempt.weightKg.toFixed(1)} <span className="text-xl text-slate-400 font-bold">KG</span>
            </span>
          </div>

          <button
            onClick={() => setShowOverrideModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Jury / Chief Override</span>
          </button>
        </div>
      </div>

      {/* VIRTUAL LIGHTS DISPLAY (Adapts to 1 Referee vs 3 Referees) */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          {isSingleReferee
            ? 'Official Referee Decision Station (1 Referee / Operator)'
            : 'Official Referee Decision Panel (3 Referees • 2-1 Majority Rules)'}
        </div>

        {/* 1-Referee Mode: Single Glowing Light */}
        {isSingleReferee ? (
          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <div
              className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl ${
                !operatorVote
                  ? 'bg-slate-900 border-slate-800 shadow-none'
                  : operatorVote.decision === 'good_lift'
                  ? 'bg-white border-slate-200 shadow-white/50 ring-8 ring-white/10'
                  : 'bg-red-600 border-red-500 shadow-red-600/60 ring-8 ring-red-600/20'
              }`}
            >
              {operatorVote && (
                <span
                  className={`text-lg font-black uppercase ${
                    operatorVote.decision === 'good_lift' ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  {operatorVote.decision === 'good_lift' ? 'WHITE LIGHT' : 'RED LIGHT'}
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-white uppercase tracking-wider block">
                Official Referee
              </span>
              <span className="text-xs text-slate-500">Threshold: 1 decisive vote</span>
            </div>
          </div>
        ) : (
          /* 3-Referee Mode: 3 Glowing Circles */
          <div className="flex items-center justify-center space-x-12 sm:space-x-20 mb-8">
            {/* Left Referee */}
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-xl ${
                  !leftVote
                    ? 'bg-slate-900 border-slate-800 shadow-none'
                    : leftVote.decision === 'good_lift'
                    ? 'bg-white border-slate-200 shadow-white/40 ring-8 ring-white/10'
                    : 'bg-red-600 border-red-500 shadow-red-600/50 ring-8 ring-red-600/20'
                }`}
              >
                {leftVote && (
                  <span
                    className={`text-sm font-black uppercase ${
                      leftVote.decision === 'good_lift' ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    {leftVote.decision === 'good_lift' ? 'WHITE' : 'RED'}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Left Referee
              </span>
            </div>

            {/* Chief Referee (Center) */}
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-xl ${
                  !chiefVote
                    ? 'bg-slate-900 border-slate-800 shadow-none'
                    : chiefVote.decision === 'good_lift'
                    ? 'bg-white border-slate-200 shadow-white/40 ring-8 ring-white/10'
                    : 'bg-red-600 border-red-500 shadow-red-600/50 ring-8 ring-red-600/20'
                }`}
              >
                {chiefVote && (
                  <span
                    className={`text-sm font-black uppercase ${
                      chiefVote.decision === 'good_lift' ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    {chiefVote.decision === 'good_lift' ? 'WHITE' : 'RED'}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Chief Referee (Center)
              </span>
            </div>

            {/* Right Referee */}
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-xl ${
                  !rightVote
                    ? 'bg-slate-900 border-slate-800 shadow-none'
                    : rightVote.decision === 'good_lift'
                    ? 'bg-white border-slate-200 shadow-white/40 ring-8 ring-white/10'
                    : 'bg-red-600 border-red-500 shadow-red-600/50 ring-8 ring-red-600/20'
                }`}
              >
                {rightVote && (
                  <span
                    className={`text-sm font-black uppercase ${
                      rightVote.decision === 'good_lift' ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    {rightVote.decision === 'good_lift' ? 'WHITE' : 'RED'}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Right Referee
              </span>
            </div>
          </div>
        )}

        {/* Majority / Official Decision Result Banner */}
        <div className="text-center pt-4 border-t border-slate-800/80">
          {attempt.majorityDecision ? (
            <div className="inline-flex flex-col items-center">
              <span
                className={`text-xl sm:text-2xl font-black px-8 py-2 rounded-xl shadow-lg tracking-wider uppercase ${
                  attempt.majorityDecision === 'good_lift'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-rose-600 text-white shadow-rose-600/30'
                }`}
              >
                {attempt.majorityDecision === 'good_lift' ? 'GOOD LIFT (WHITE)' : 'NO LIFT (RED)'}
              </span>
              {attempt.isJuryOverride && (
                <span className="text-xs text-amber-300 font-semibold mt-2">
                  Overridden by Jury: {attempt.juryOverrideReason}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              Waiting for referee decision...
            </span>
          )}
        </div>
      </div>

      {/* REFEREE INPUT CONSOLES */}
      {isSingleReferee ? (
        /* Single Referee Control Console */
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-red-400" />
                <span>Single Referee / Operator Station</span>
              </h4>
              <p className="text-xs text-slate-400">Cast the official decision for this attempt.</p>
            </div>
            {operatorVote && (
              <span
                className={`text-xs font-extrabold uppercase px-3 py-1 rounded ${
                  operatorVote.decision === 'good_lift'
                    ? 'bg-white text-slate-950 font-bold'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                DECISION: {operatorVote.decision === 'good_lift' ? 'WHITE' : 'RED'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleCastVote('operator', 'good_lift')}
              className="py-4 px-6 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-black text-base flex items-center justify-center space-x-2 shadow-lg shadow-white/20 transition-all"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>GOOD LIFT (WHITE)</span>
            </button>

            <button
              onClick={() => handleCastVote('operator', 'no_lift')}
              className="py-4 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-base flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <X className="w-5 h-5 stroke-[3]" />
              <span>NO LIFT (RED)</span>
            </button>
          </div>

          {/* Technical Infractions Selector */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase block">
              Reason Codes for No Lift ({attempt.liftType.toUpperCase()}):
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {liftInfractions.map((inf) => {
                const isSelected = selectedInfractions['operator']?.includes(inf.code);
                return (
                  <div
                    key={inf.code}
                    onClick={() => toggleInfraction('operator', inf.code)}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{inf.code}: {inf.title}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          inf.cardColor === 'red'
                            ? 'bg-red-500'
                            : inf.cardColor === 'blue'
                            ? 'bg-blue-500'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {inf.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 3-Referee Panel Consoles */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['left', 'chief', 'right'] as RefereeRole[]).map((role) => {
            const vote = getVote(role);
            const isChief = role === 'chief';

            return (
              <div
                key={role}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 ${
                  isChief ? 'border-red-800/80 ring-1 ring-red-800/40' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      {role} Referee
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {isChief ? 'Chief Platform Official' : 'Side Official'}
                    </span>
                  </div>
                  {vote && (
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        vote.decision === 'good_lift'
                          ? 'bg-white text-slate-950 font-bold'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      VOTED: {vote.decision === 'good_lift' ? 'WHITE' : 'RED'}
                    </span>
                  )}
                </div>

                {/* White & Red Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCastVote(role, 'good_lift')}
                    className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-black text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-white/20 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>WHITE</span>
                  </button>

                  <button
                    onClick={() => handleCastVote(role, 'no_lift')}
                    className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/30 transition-all"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    <span>RED</span>
                  </button>
                </div>

                {/* Technical Infractions Selector for Red Card */}
                {event.rulesSnapshot.requireTechnicalInfractionCodes && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">
                      Disqualification Reason Codes:
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {liftInfractions.map((inf) => {
                        const isSelected = selectedInfractions[role]?.includes(inf.code);
                        return (
                          <div
                            key={inf.code}
                            onClick={() => toggleInfraction(role, inf.code)}
                            className={`p-2 rounded-lg text-[11px] cursor-pointer transition-colors border ${
                              isSelected
                                ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{inf.code}: {inf.title}</span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  inf.cardColor === 'red'
                                    ? 'bg-red-500'
                                    : inf.cardColor === 'blue'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-400'
                                }`}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {inf.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Jury Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Authorized Jury / Chief Correction</h3>
            </div>
            <p className="text-xs text-slate-400">
              Per IPF Technical Rulebook, ordinary scorekeepers may not override referee decisions. Only an authorized Jury President or Chief Referee may overturn a decision upon video or official review.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Overridden Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideDecision('good_lift')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold border ${
                      overrideDecision === 'good_lift'
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    OVERRIDE TO GOOD LIFT
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideDecision('no_lift')}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold border ${
                      overrideDecision === 'no_lift'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    OVERRIDE TO NO LIFT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Authorized Official</label>
                <input
                  type="text"
                  value={authorizedOfficial}
                  onChange={(e) => setAuthorizedOfficial(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mandatory Technical Justification</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Video angle confirmed hip crease broke knee parallel prior to ascent..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
              >
                Apply Authorized Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
