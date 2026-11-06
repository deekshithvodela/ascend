import React, { useState } from 'react';
import { CompetitionEvent, CompetitionRules } from '../../../core/types/competition';
import { RulesDependencyValidator, ValidationResult } from '../../../core/rules-engine/validator';
import { getProfileTemplate } from '../../../core/competition-profiles';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Scale,
  Award,
  Users,
  Clock,
  Gavel,
  CheckSquare,
  Lock,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface RulesDashboardProps {
  event: CompetitionEvent;
  onUpdateRules: (rules: CompetitionRules) => Promise<void>;
  onFinalizeEvent: () => Promise<void>;
}

export const RulesDashboard: React.FC<RulesDashboardProps> = ({
  event,
  onUpdateRules,
  onFinalizeEvent,
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [rules, setRules] = useState<CompetitionRules>(JSON.parse(JSON.stringify(event.rulesSnapshot)));
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const validation: ValidationResult = RulesDependencyValidator.validate(rules);

  const handleFieldChange = (field: keyof CompetitionRules, value: any) => {
    setRules((prev) => {
      const updated = { ...prev, [field]: value };
      // If changing judging mode to single_operator, set majorityThreshold to 1
      if (field === 'judgingMode') {
        if (value === 'single_operator') {
          updated.majorityThreshold = 1;
        } else if (value === 'three_referee') {
          updated.majorityThreshold = 2;
        }
      }
      return updated;
    });
  };

  const handleProfileSwitch = (profileId: any) => {
    const template = getProfileTemplate(profileId);
    setRules(template);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateRules(rules);
      setSaveStatus('Rules successfully saved and validated!');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (err: any) {
      setSaveStatus(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyAutoFix = (suggestion: ValidationResult['autoFixSuggestions'][0]) => {
    setRules((prev) => ({
      ...prev,
      [suggestion.field]: suggestion.recommendedValue,
    }));
  };

  const sections = [
    { id: 1, title: '1. Competition Profile', icon: Layers },
    { id: 2, title: '2. Competition Format & Attempts', icon: Sliders },
    { id: 3, title: '3. Weight Categories', icon: Scale },
    { id: 4, title: '4. Scoring & Ranking', icon: Award },
    { id: 5, title: '5. Athlete Registration', icon: Users },
    { id: 6, title: '6. Weigh-In Workflow', icon: Scale },
    { id: 7, title: '7. Attempt Management', icon: Clock },
    { id: 8, title: '8. Scheduling & Flights', icon: Layers },
    { id: 9, title: '9. Referee & Judging (1 vs 3)', icon: Gavel },
    { id: 10, title: '10. Technical Validation', icon: CheckSquare },
    { id: 11, title: '11. Elimination & Disqualification', icon: AlertTriangle },
    { id: 12, title: '12. Tie-Breaking Engine', icon: Award },
    { id: 13, title: '13. Equipment Inspection', icon: CheckSquare },
    { id: 14, title: '14. Official Documentation', icon: Layers },
    { id: 15, title: '15. Audit & Finalization', icon: Lock },
  ];

  return (
    <div className="py-6 space-y-6">
      {/* Top Banner: Dependency Validation & Auto-Fix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {validation.isValid ? (
              <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {validation.isValid
                  ? 'Rules Dependency Validation: PASS'
                  : 'Rules Dependency Conflicts Detected'}
              </h3>
              <p className="text-xs text-slate-400">
                Rule Profile: <span className="text-red-400 font-semibold">{rules.profileName}</span> ({rules.profileVersion})
                {rules.federationRulebookVersion && ` • Reference: ${rules.federationRulebookVersion}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {saveStatus && (
              <span className={`text-xs font-medium px-3 py-1 rounded-md ${saveStatus.includes('error') ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || event.status === 'finalized'}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Validating & Saving...' : 'Save Rule Settings'}</span>
            </button>
          </div>
        </div>

        {/* Errors & Auto-fix pills */}
        {validation.errors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            {validation.errors.map((err, idx) => (
              <div key={idx} className="flex items-center justify-between bg-rose-950/40 border border-rose-800/80 rounded-lg p-2.5 text-xs text-rose-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{err}</span>
                </div>
                {validation.autoFixSuggestions[idx] && (
                  <button
                    onClick={() => handleApplyAutoFix(validation.autoFixSuggestions[idx])}
                    className="ml-4 px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded font-semibold text-[11px] whitespace-nowrap"
                  >
                    Auto-Fix Conflict
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {validation.warnings.map((warn, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs text-amber-300/90 bg-amber-950/20 border border-amber-900/50 rounded-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Sidebar + Section Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar with Red Theme */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Configuration Sections
          </div>
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Section Form */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6">
          {/* Section 1: Profile */}
          {activeSection === 1 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">1. Competition Rule Profile</h4>
                <p className="text-xs text-slate-400">
                  Select a predefined starting profile or configure independently. Ascend Open is the default.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'ascend_open',
                    title: 'Ascend Open Mode (Default)',
                    desc: 'No mandatory weight categories. Bodyweight ratio default. Highly flexible, customizable attempt structure.',
                    badge: 'Recreational & Gym Meets',
                  },
                  {
                    id: 'ipf_inspired',
                    title: 'IPF Competition Mode',
                    desc: 'IPF Technical Rulebook compliance. Official weight classes, 2-hr weigh-in, 3-referee lights, round flights.',
                    badge: 'Federation Standard',
                  },
                  {
                    id: 'custom',
                    title: 'Custom Mode',
                    desc: 'Fully configurable blank template. Choose individual scoring formulas, tie-breakers, and judging setups.',
                    badge: 'Customizable Meet',
                  },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProfileSwitch(p.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      rules.profileId === p.id
                        ? 'bg-red-950/60 border-red-500 shadow-md shadow-red-500/20 ring-1 ring-red-500/40'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.badge}
                      </span>
                      {rules.profileId === p.id && (
                        <CheckCircle2 className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-white mb-1">{p.title}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              {rules.complianceDisclaimer && (
                <div className="p-3.5 bg-slate-950/70 border border-amber-800/60 rounded-lg text-xs text-amber-200 leading-relaxed">
                  <strong>Notice:</strong> {rules.complianceDisclaimer}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Format & Customizable Attempts (e.g. 2 attempts) */}
          {activeSection === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">2. Competition Format & Attempts Customization</h4>
                <p className="text-xs text-slate-400">Configure competition disciplines and customize the number of attempts per lift (e.g. 2 attempts).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Competition Type</label>
                  <select
                    value={rules.competitionType}
                    onChange={(e) => handleFieldChange('competitionType', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                  >
                    <option value="powerlifting">Full Powerlifting (Squat, Bench, Deadlift)</option>
                    <option value="bench_press_only">Bench Press Only</option>
                    <option value="deadlift_only">Deadlift Only</option>
                    <option value="squat_only">Squat Only</option>
                    <option value="single_lift">Individual Lifts (Contested Separately)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Attempts Per Lift <span className="text-red-400 font-bold">(Configurable: e.g. 2 Attempts)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={rules.attemptsPerLift}
                    onChange={(e) => handleFieldChange('attemptsPerLift', parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-extrabold outline-none focus:border-red-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Currently set to <strong className="text-red-400">{rules.attemptsPerLift} attempts</strong> per lift. Platform rounds and score sheets adapt dynamically.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.enableIndividualLiftAwards}
                    onChange={(e) => handleFieldChange('enableIndividualLiftAwards', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-300 font-medium">Enable Individual Lift Awards (Squat/Bench/Deadlift Medals)</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.enableTeamScoring}
                    onChange={(e) => handleFieldChange('enableTeamScoring', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-300 font-medium">Enable Federation Team Competition (Points Scoring)</span>
                </label>
              </div>
            </div>
          )}

          {/* Section 3: Weight Categories */}
          {activeSection === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-white">3. Weight Categories</h4>
                  <p className="text-xs text-slate-400">Make weight categories mandatory, optional, or run open-weight.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-300 font-medium">Enable Categories</span>
                  <input
                    type="checkbox"
                    checked={rules.weightCategoriesEnabled}
                    onChange={(e) => handleFieldChange('weightCategoriesEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {!rules.weightCategoriesEnabled ? (
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl text-center">
                  <Scale className="w-8 h-8 text-red-400 mx-auto mb-2 opacity-70" />
                  <div className="text-sm font-semibold text-white">Open-Weight Competition Active</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Athletes will not be forced into weight classes. Standings will use the selected ranking metric (e.g. Bodyweight Ratio or Total).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Configured Categories ({rules.categories.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2">
                    {rules.categories.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs">
                        <span className="font-bold text-white">{c.name}</span>
                        <div className="text-slate-400 space-x-3">
                          <span>Sex: <strong className="text-slate-200">{c.gender}</strong></span>
                          <span>Range: <strong className="text-slate-200">{c.minWeightKg ? `${c.minWeightKg} - ` : '≤ '}{c.maxWeightKg ? `${c.maxWeightKg} kg` : 'Unlimited'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Scoring & Ranking */}
          {activeSection === 4 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">4. Scoring & Ranking Engine</h4>
                <p className="text-xs text-slate-400">Select primary competition ranking method and secondary statistics.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Ranking Metric</label>
                  <select
                    value={rules.primaryRankingMetric}
                    onChange={(e) => handleFieldChange('primaryRankingMetric', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                  >
                    <option value="bodyweight_ratio">Bodyweight Ratio (Total / Bodyweight) [Ascend Open Default]</option>
                    <option value="weight_category_total">Weight Category Total (IPF Federation Official)</option>
                    <option value="total_weight">Overall Absolute Total Lifted</option>
                    <option value="dots">DOTS Formula Points</option>
                    <option value="wilks">Wilks Points</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Decimal Precision</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={rules.decimalPrecision}
                    onChange={(e) => handleFieldChange('decimalPrecision', parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.bodyweightRatioEnabled}
                    onChange={(e) => handleFieldChange('bodyweightRatioEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-300 font-medium">Calculate Bodyweight Ratio</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.requireAllLiftsCompletedForRatio}
                    onChange={(e) => handleFieldChange('requireAllLiftsCompletedForRatio', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-300 font-medium">Do not calculate final ratio until all required lifts completed (Section 21.3.D)</span>
                </label>
              </div>
            </div>
          )}

          {/* Section 6: Weigh-In */}
          {activeSection === 6 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">6. Athlete Weigh-In Workflow</h4>
                <p className="text-xs text-slate-400">Configure weigh-in window, re-weigh limits, and official sign-off.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.officialWeighInEnabled}
                    onChange={(e) => handleFieldChange('officialWeighInEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-200 font-semibold">Enable Official Measured Weigh-In</span>
                </label>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Weigh-in Window (Hours)</label>
                    <input
                      type="number"
                      value={rules.weighInWindowHours}
                      onChange={(e) => handleFieldChange('weighInWindowHours', parseFloat(e.target.value) || 2)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Max Re-weigh Attempts</label>
                    <input
                      type="number"
                      value={rules.maxWeighInAttempts}
                      onChange={(e) => handleFieldChange('maxWeighInAttempts', parseInt(e.target.value) || 3)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 9: Referee System (Configurable: 1 Referee vs 3 Referees) */}
          {activeSection === 9 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">9. Referee & Judging System</h4>
                <p className="text-xs text-slate-400">
                  Select <strong className="text-red-400">1 Referee</strong> (Single Operator) or <strong className="text-red-400">3 Referees</strong> (IPF Standard Panel).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'single_operator', title: '1 Referee (Single Operator)', desc: '1 official renders White/Red decisions. Threshold: 1 vote.', badge: 'Recommended for Local / Gym' },
                  { id: 'three_referee', title: '3 Referees (IPF Standard)', desc: 'Chief, Left, Right independent lights. 2-1 or 3-0 majority.', badge: 'Federation Standard' },
                  { id: 'multi_judge', title: 'Multi-Judge Custom Panel', desc: 'Custom configurable majority threshold.', badge: 'Customizable' },
                ].map((j) => (
                  <div
                    key={j.id}
                    onClick={() => handleFieldChange('judgingMode', j.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      rules.judgingMode === j.id
                        ? 'bg-red-950/60 border-red-500 shadow-md shadow-red-500/20 ring-1 ring-red-500/40'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 block w-fit mb-2">
                      {j.badge}
                    </span>
                    <div className="font-bold text-sm text-white mb-1">{j.title}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{j.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300">
                Active Referee Configuration: <strong className="text-white">{rules.judgingMode === 'single_operator' ? '1 Official Referee (Single Decision)' : '3 Official Referees (Majority Decision)'}</strong> • Majority Threshold: <strong className="text-red-400">{rules.majorityThreshold} vote(s)</strong>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.requireTechnicalInfractionCodes}
                    onChange={(e) => handleFieldChange('requireTechnicalInfractionCodes', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-300 font-medium">Require Technical Infraction Codes on Red Lights (IPF Rulebook)</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.allowJuryOverride}
                    onChange={(e) => handleFieldChange('allowJuryOverride', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm text-slate-300 font-medium">Allow Authorized Jury / Chief Referee Correction with Justification</span>
                </label>
              </div>
            </div>
          )}

          {/* Section 12: Tie-Breaking */}
          {activeSection === 12 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">12. Ordered Tie-Breaking Engine</h4>
                <p className="text-xs text-slate-400">
                  Priority sequence evaluated sequentially when athletes are tied.
                </p>
              </div>

              <div className="space-y-2">
                {rules.tieBreakers.map((crit, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/70 border border-slate-700/60 rounded-lg text-sm text-white">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 border border-red-800 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="capitalize font-medium">{crit.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {idx === 0 ? 'Primary Tie-Breaker' : `Fallback #${idx}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 15: Audit & Finalization */}
          {activeSection === 15 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-white">15. Audit Trail & Competition Finalization</h4>
                <p className="text-xs text-slate-400">
                  Lock competition records. Finalized competitions cannot be modified without authorized audit override.
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 border border-slate-700/80 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Event Finalization Status</div>
                    <div className="text-xs text-slate-400">
                      Current: <span className="font-bold text-red-400 uppercase">{event.status}</span>
                    </div>
                  </div>
                  {event.status !== 'finalized' ? (
                    <button
                      onClick={onFinalizeEvent}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/30"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock & Finalize Results</span>
                    </button>
                  ) : (
                    <span className="text-xs px-3 py-1 bg-purple-950 border border-purple-700 text-purple-300 font-bold rounded-md">
                      LOCKED AND FINALIZED
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Catch-all for other sections */}
          {![1, 2, 3, 4, 6, 9, 12, 15].includes(activeSection) && (
            <div className="space-y-4 text-center py-8">
              <div className="text-base font-bold text-white">{sections.find(s => s.id === activeSection)?.title}</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Settings active and calibrated according to {rules.profileName}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
