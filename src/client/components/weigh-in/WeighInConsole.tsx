import React, { useState } from 'react';
import { Athlete } from '../../../core/types/athlete';
import { CompetitionEvent } from '../../../core/types/competition';
import { WeighInManager } from '../../../core/weigh-in/weigh-in-manager';
import { Scale, CheckCircle2, AlertTriangle, UserCheck, ShieldCheck, Plus } from 'lucide-react';

interface WeighInConsoleProps {
  event: CompetitionEvent;
  athletes: Athlete[];
  onRecordWeighIn: (athleteId: string, measuredWeightKg: number, officialId: string, officialName: string, notes?: string) => Promise<void>;
  onUpdateRackHeights: (athleteId: string, heights: any) => Promise<void>;
  onRegisterAthlete: (athleteData: Partial<Athlete>) => Promise<void>;
}

export const WeighInConsole: React.FC<WeighInConsoleProps> = ({
  event,
  athletes,
  onRecordWeighIn,
  onUpdateRackHeights,
  onRegisterAthlete,
}) => {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [measuredWeight, setMeasuredWeight] = useState<number>(0);
  const [officialName, setOfficialName] = useState<string>('Official Referee Sterling');
  const [notes, setNotes] = useState<string>('');

  const [squatRack, setSquatRack] = useState<number>(12);
  const [benchRack, setBenchRack] = useState<number>(10);

  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');
  const [newSex, setNewSex] = useState<'M' | 'F' | 'MX'>('M');
  const [newCategory, setNewCategory] = useState<string>(
    event.rulesSnapshot.categories?.[3]?.name || '83 kg'
  );

  const handleOpenWeighIn = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setMeasuredWeight(athlete.officialBodyweightKg || 80.0);
    setSquatRack(athlete.rackHeights?.squatRackHeight || 12);
    setBenchRack(athlete.rackHeights?.benchRackHeight || 10);
    setNotes('');
  };

  const handleSaveWeighIn = async () => {
    if (!selectedAthlete) return;
    await onRecordWeighIn(selectedAthlete.id, measuredWeight, 'official-1', officialName, notes);
    await onUpdateRackHeights(selectedAthlete.id, {
      squatRackHeight: squatRack,
      benchRackHeight: benchRack,
    });
    setSelectedAthlete(null);
  };

  const handleCreateAthlete = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    await onRegisterAthlete({
      firstName: newFirstName,
      lastName: newLastName,
      sex: newSex,
      declaredWeightCategory: newCategory,
    });
    setNewFirstName('');
    setNewLastName('');
    setShowRegisterModal(false);
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header Bar with Red Accent */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Scale className="w-5 h-5 text-red-400" />
            <span>Official Athlete Registration & Weigh-In Desk</span>
          </h3>
          <p className="text-xs text-slate-400">
            Official 2-hour weigh-in window • Bodyweight verified against category boundaries • Re-weigh permitted
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Athlete</span>
        </button>
      </div>

      {/* Athletes Weigh-In Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center">Lot</th>
                <th className="p-3">Athlete</th>
                <th className="p-3 text-center">Sex</th>
                <th className="p-3">Team</th>
                <th className="p-3">Declared Cat</th>
                <th className="p-3 font-bold text-right">Official BW</th>
                <th className="p-3 text-center">Weigh-in Status</th>
                <th className="p-3 text-center">Rack Heights</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {athletes.map((ath) => (
                <tr key={ath.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-center font-bold text-red-400">#{ath.lotNumber}</td>
                  <td className="p-3 font-bold text-white">
                    {ath.firstName} {ath.lastName}
                  </td>
                  <td className="p-3 text-center text-slate-300">{ath.sex}</td>
                  <td className="p-3 text-slate-400">{ath.teamOrAffiliation || '-'}</td>
                  <td className="p-3 text-slate-300 font-medium">{ath.declaredWeightCategory}</td>
                  <td className="p-3 text-right font-extrabold text-sm text-white">
                    {ath.officialBodyweightKg !== undefined ? `${ath.officialBodyweightKg.toFixed(2)} kg` : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        ath.weighInStatus === 'passed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : ath.weighInStatus === 'failed'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ath.weighInStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-400">
                    SQ: {ath.rackHeights?.squatRackHeight ?? '-'} | BP: {ath.rackHeights?.benchRackHeight ?? '-'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenWeighIn(ath)}
                      className="px-3 py-1 bg-slate-800 hover:bg-red-600 hover:text-white rounded text-xs font-semibold text-slate-300 transition-colors"
                    >
                      Conduct Weigh-In
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weigh-In Action Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Scale className="w-5 h-5 text-red-400" />
              <span>Weigh-In Verification</span>
            </h3>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>Athlete: <strong className="text-white">{selectedAthlete.firstName} {selectedAthlete.lastName}</strong></div>
              <div>Declared Category: <strong className="text-red-400">{selectedAthlete.declaredWeightCategory}</strong></div>
              <div>Previous Weigh-in Attempts: {selectedAthlete.weighInRecords?.length || 0}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Measured Bodyweight (KG)</label>
                <input
                  type="number"
                  step="0.05"
                  value={measuredWeight}
                  onChange={(e) => setMeasuredWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-extrabold text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Weigh-In Official</label>
                <input
                  type="text"
                  value={officialName}
                  onChange={(e) => setOfficialName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-xs text-white"
                />
              </div>
            </div>

            {/* Rack Heights */}
            <div className="border-t border-slate-800 pt-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Platform Rack Heights
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Squat Rack Pin Height</label>
                  <input
                    type="number"
                    value={squatRack}
                    onChange={(e) => setSquatRack(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bench Rack Pin Height</label>
                  <input
                    type="number"
                    value={benchRack}
                    onChange={(e) => setBenchRack(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Scale Details</label>
              <input
                type="text"
                placeholder="Scale serial, re-weigh reason..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-red-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedAthlete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWeighIn}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Save & Verify Bodyweight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Athlete Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Register New Athlete</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Sex</label>
                <select
                  value={newSex}
                  onChange={(e) => setNewSex(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="MX">Mixed (MX)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Declared Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  {event.rulesSnapshot.categories?.length > 0 ? (
                    event.rulesSnapshot.categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.gender})
                      </option>
                    ))
                  ) : (
                    <option value="Open">Open Weight</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAthlete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/30"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
