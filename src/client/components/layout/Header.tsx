import React from 'react';
import { CompetitionEvent } from '../../../core/types/competition';
import { ShieldCheck, Dumbbell, Trophy, Sliders, Users, Scale, FileText, History } from 'lucide-react';

interface HeaderProps {
  currentEvent: CompetitionEvent;
  events: CompetitionEvent[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
  onNewEvent: (profileId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEvent,
  events,
  activeTab,
  onSelectTab,
  onSelectEvent,
  onNewEvent,
}) => {
  const isIpf = currentEvent.rulesSnapshot.profileId === 'ipf_inspired';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand with Red Accent */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/25 ring-1 ring-red-500/30">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-white">ASCEND</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-950 text-red-400 border border-red-800/80">
                  v21 Standards
                </span>
              </div>
              <p className="text-xs text-slate-400">Modular Competition Rules & Compliance Engine</p>
            </div>
          </div>

          {/* Event Switcher & Profile Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <select
                aria-label="Active Competition Event"
                value={currentEvent.id}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="bg-transparent text-sm text-slate-200 font-medium px-2 py-1 outline-none cursor-pointer"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                    {evt.name} ({evt.rulesSnapshot.profileName})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Indicator Badge */}
            <div
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 border ${
                isIpf
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                  : 'bg-red-950/60 text-red-300 border-red-700/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isIpf ? 'IPF Technical Rulebook Mode' : 'Ascend Open Mode (Default)'}</span>
            </div>

            {/* Event status badge */}
            <span
              className={`text-xs px-2.5 py-1 rounded-full uppercase font-bold tracking-wider ${
                currentEvent.status === 'finalized'
                  ? 'bg-purple-950 text-purple-300 border border-purple-700'
                  : 'bg-red-950/80 text-red-300 border border-red-800'
              }`}
            >
              {currentEvent.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Navigation Tabs with Red Accent Active State */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 text-sm">
          {[
            { id: 'rules', label: '15-Section Rules Engine', icon: Sliders },
            { id: 'platform', label: 'Platform & Attempt Queue', icon: Dumbbell },
            { id: 'referee', label: 'Referee Lights & Console', icon: ShieldCheck },
            { id: 'weighin', label: 'Weigh-In & Rack Heights', icon: Scale },
            { id: 'leaderboard', label: 'Official Results & Sheets', icon: Trophy },
            { id: 'audit', label: 'Immutable Audit Log', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
