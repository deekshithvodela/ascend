import React from 'react';
import { CompetitionEvent } from '../../../core/types/competition';
import { ShieldCheck, Dumbbell, Trophy, Users, Sliders, History, Lock, Unlock, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentEvent: CompetitionEvent;
  events: CompetitionEvent[];
  activeTab: string;
  isOrganizer: boolean;
  onOpenLogin: () => void;
  onSelectTab: (tab: string) => void;
  onSelectEvent: (eventId: string) => void;
  onNewEvent: (profileId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEvent,
  events,
  activeTab,
  isOrganizer,
  onOpenLogin,
  onSelectTab,
  onSelectEvent,
}) => {
  const isIpf = currentEvent.rulesSnapshot.profileId === 'ipf_inspired';

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand with Red Accent */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/25 ring-1 ring-red-500/30">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-wider text-white">ASCEND</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-950 text-red-400 border border-red-800/80">
                  Powerlifting
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Competition Engine & Platform Manager</p>
            </div>
          </div>

          {/* Event Switcher, Mode Badge & Login */}
          <div className="flex items-center space-x-3">
            {/* Event Dropdown */}
            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <select
                aria-label="Active Competition Event"
                value={currentEvent.id}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium px-2 py-1 outline-none cursor-pointer max-w-[220px] truncate"
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
              className={`hidden md:flex px-2.5 py-1 rounded-md text-xs font-semibold items-center space-x-1.5 border ${
                isIpf
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                  : 'bg-red-950/60 text-red-300 border-red-700/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isIpf ? 'IPF Technical Rules' : 'Ascend Open Mode'}</span>
            </div>

            {/* Organizer Login / Mode Button */}
            <button
              onClick={onOpenLogin}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 border transition ${
                isOrganizer
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60'
                  : 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-md shadow-red-600/30'
              }`}
            >
              {isOrganizer ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Organizer Mode</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Organizer Login</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Streamlined Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto py-2 border-t border-slate-800/60 text-sm">
          {[
            { id: 'platform', label: 'Platform (Live Meet)', icon: Dumbbell },
            { id: 'athletes', label: 'Participants & Registration', icon: Users },
            { id: 'leaderboard', label: 'Results & Standings', icon: Trophy },
            { id: 'rules', label: 'Rules & Settings', icon: Sliders },
            { id: 'audit', label: 'Audit Log', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
