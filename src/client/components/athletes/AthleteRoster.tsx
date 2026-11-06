import React, { useState } from 'react';
import { Athlete } from '../../../core/types/athlete';
import { CompetitionEvent } from '../../../core/types/competition';
import { UserPlus, Trash2, Search, Scale, CheckCircle2, AlertCircle, Dumbbell } from 'lucide-react';

interface AthleteRosterProps {
  event: CompetitionEvent;
  athletes: Athlete[];
  isOrganizer: boolean;
  onRegisterAthlete: (data: Partial<Athlete> & {
    openingSquatKg?: number;
    openingBenchKg?: number;
    openingDeadliftKg?: number;
  }) => Promise<void>;
  onDeleteAthlete: (athleteId: string) => Promise<void>;
}

export const AthleteRoster: React.FC<AthleteRosterProps> = ({
  event,
  athletes,
  isOrganizer,
  onRegisterAthlete,
  onDeleteAthlete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for combined Registration + Weigh-in (all fields optional)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [category, setCategory] = useState('Open');
  const [bodyweight, setBodyweight] = useState<string>('');
  const [squatRack, setSquatRack] = useState<string>('');
  const [benchRack, setBenchRack] = useState<string>('');
  const [openSquat, setOpenSquat] = useState<string>('');
  const [openBench, setOpenBench] = useState<string>('');
  const [openDeadlift, setOpenDeadlift] = useState<string>('');

  const categories = event.rulesSnapshot.categories || [
    { id: 'c1', name: 'Open', minBodyweightKg: 0, maxBodyweightKg: 300, sex: 'both', division: 'raw' },
  ];

  const filteredAthletes = athletes.filter((a) => {
    const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || a.lotNumber.toString().includes(query) || (a.registrationNumber && a.registrationNumber.toLowerCase().includes(query));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextLot = athletes.length + 1;
    const effectiveFirstName = firstName.trim() || `Lifter #${nextLot}`;
    const effectiveLastName = lastName.trim() || '';
    const bwNum = parseFloat(bodyweight);
    const sqRackNum = parseInt(squatRack, 10);
    const bpRackNum = parseInt(benchRack, 10);
    const sqNum = parseFloat(openSquat);
    const bpNum = parseFloat(openBench);
    const dlNum = parseFloat(openDeadlift);

    await onRegisterAthlete({
      firstName: effectiveFirstName,
      lastName: effectiveLastName,
      sex,
      declaredWeightCategory: category,
      verifiedWeightCategory: category,
      officialBodyweightKg: !isNaN(bwNum) && bwNum > 0 ? bwNum : undefined,
      weighInStatus: !isNaN(bwNum) && bwNum > 0 ? 'passed' : 'pending',
      rackHeights: {
        squatRackHeight: !isNaN(sqRackNum) ? sqRackNum : undefined,
        benchRackHeight: !isNaN(bpRackNum) ? bpRackNum : undefined,
      },
      openingSquatKg: !isNaN(sqNum) && sqNum > 0 ? sqNum : undefined,
      openingBenchKg: !isNaN(bpNum) && bpNum > 0 ? bpNum : undefined,
      openingDeadliftKg: !isNaN(dlNum) && dlNum > 0 ? dlNum : undefined,
    });

    // Reset and close
    setFirstName('');
    setLastName('');
    setBodyweight('');
    setSquatRack('');
    setBenchRack('');
    setOpenSquat('');
    setOpenBench('');
    setOpenDeadlift('');
    setIsModalOpen(false);
  };

  const handleDelete = async (athlete: Athlete) => {
    if (window.confirm(`Are you sure you want to remove ${athlete.firstName} ${athlete.lastName} from the competition?`)) {
      setDeletingId(athlete.id);
      try {
        await onDeleteAthlete(athlete.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Participants & Registration</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
              {athletes.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage lifters, verified bodyweights, rack heights, and opening declarations in one single place.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search lifter or lot #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-48 sm:w-64"
            />
          </div>

          {/* Add Athlete Button */}
          {isOrganizer && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-600/30 flex items-center space-x-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register & Weigh-In Lifter</span>
            </button>
          )}
        </div>
      </div>

      {/* Athlete Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5 text-center">Lot</th>
                <th className="p-3.5">Lifter Name</th>
                <th className="p-3.5 text-center">Sex</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right font-mono">Bodyweight</th>
                <th className="p-3.5 text-center">Rack Heights</th>
                <th className="p-3.5 text-center">Weigh-In</th>
                {isOrganizer && <th className="p-3.5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan={isOrganizer ? 8 : 7} className="p-8 text-center text-slate-500">
                    No participants found. Click "Register & Weigh-In Lifter" to add one.
                  </td>
                </tr>
              ) : (
                filteredAthletes.map((ath) => (
                  <tr key={ath.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-center font-bold text-red-400">#{ath.lotNumber}</td>
                    <td className="p-3.5 font-bold text-white">
                      {ath.firstName} {ath.lastName}
                      {ath.teamOrAffiliation && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {ath.teamOrAffiliation}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-slate-300">{ath.sex}</td>
                    <td className="p-3.5 font-medium text-slate-300">
                      {ath.verifiedWeightCategory || ath.declaredWeightCategory}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                      {ath.officialBodyweightKg !== undefined ? `${ath.officialBodyweightKg.toFixed(1)} kg` : '—'}
                    </td>
                    <td className="p-3.5 text-center font-mono text-[11px] text-slate-300">
                      SQ: {ath.rackHeights?.squatRackHeight || '—'} | BP: {ath.rackHeights?.benchRackHeight || '—'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          ath.weighInStatus === 'passed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        }`}
                      >
                        {ath.weighInStatus}
                      </span>
                    </td>
                    {isOrganizer && (
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDelete(ath)}
                          disabled={deletingId === ath.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition"
                          title="Delete participant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combined Registration & Weigh-In Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-1">
              <UserPlus className="w-5 h-5 text-red-500" />
              <span>Unified Athlete Registration & Weigh-In</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Enter participant identity, verified bodyweight, and opening platform attempts in a single step. All fields are optional.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Names (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Marcus"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Vance"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Sex & Weight Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Weight Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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

              {/* Verified Bodyweight (Weigh-in) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <Scale className="w-4 h-4" />
                  <span>Official Weigh-In Verification <span className="text-[10px] text-slate-500 font-normal normal-case">(optional)</span></span>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Measured Bodyweight (kg)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 75"
                      value={bodyweight}
                      onChange={(e) => setBodyweight(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-red-500"
                    />
                    <span className="text-xs font-bold text-slate-400">KG</span>
                  </div>
                </div>
              </div>

              {/* Rack Heights */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Squat Rack Height <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="e.g. 12"
                    value={squatRack}
                    onChange={(e) => setSquatRack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bench Rack Height <span className="text-[10px] text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="e.g. 10"
                    value={benchRack}
                    onChange={(e) => setBenchRack(e.target.value)}
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
                      value={openSquat}
                      onChange={(e) => setOpenSquat(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Bench 1 (kg)</label>
                    <input
                      type="number"
                      step="2.5"
                      placeholder="e.g. 100"
                      value={openBench}
                      onChange={(e) => setOpenBench(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Deadlift 1 (kg)</label>
                    <input
                      type="number"
                      step="2.5"
                      placeholder="e.g. 180"
                      value={openDeadlift}
                      onChange={(e) => setOpenDeadlift(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-red-600/30 transition"
                >
                  Save & Weigh-In Lifter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

