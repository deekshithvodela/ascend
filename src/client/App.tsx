import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicEventPage } from './pages/PublicEventPage';

import { PlatformConsole } from './components/platform/PlatformConsole';
import { AthleteRoster } from './components/athletes/AthleteRoster';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { RulesDashboard } from './components/rules-config/RulesDashboard';
import { AuditViewer } from './components/audit/AuditViewer';

import { CompetitionEvent, CompetitionRules } from '../core/types/competition';
import { Athlete } from '../core/types/athlete';
import { Attempt, RefereeRole, RefereeDecision, LiftType } from '../core/types/attempt';
import { CompetitionResults } from '../core/types/ranking';
import { AuditLogEntry } from '../core/types/audit';
import { DataClient } from './services/data-client';
import { TransactionalStore } from '../server/store';
import {
  Dumbbell,
  Users,
  Trophy,
  Sliders,
  History,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Play,
  LogOut,
  ExternalLink,
  UserPlus,
} from 'lucide-react';

/**
 * Event Management View for Authorized Meet Directors
 * Accessible at #/dashboard/events/:eventId
 */
const EventManagementView: React.FC<{
  isOrganizer: boolean;
  onLogout: () => void;
}> = ({ isOrganizer, onLogout }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<CompetitionEvent | null>(() => {
    return eventId ? TransactionalStore.getEvent(eventId) || null : null;
  });
  const [activeTab, setActiveTab] = useState<string>('platform');
  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    return eventId ? TransactionalStore.getAthletes(eventId) : [];
  });
  const [attempts, setAttempts] = useState<Attempt[]>(() => {
    return eventId ? TransactionalStore.getAttempts(eventId) : [];
  });
  const [results, setResults] = useState<CompetitionResults | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (targetId: string) => {
    try {
      setLoading(true);
      const allEvents = await DataClient.getEvents();
      const matched = allEvents.find((e) => e.id === targetId);
      if (matched) {
        setEvent(matched);
      }

      const [athData, attData, resData, logData] = await Promise.all([
        DataClient.getAthletes(targetId),
        DataClient.getAttempts(targetId),
        DataClient.getResults(targetId),
        DataClient.getAuditLogs(targetId),
      ]);

      setAthletes(athData);
      setAttempts(attData);
      setResults(resData);
      setAuditLogs(logData);
    } catch (err) {
      console.error('Failed to load event data in console:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    loadData(eventId);
  }, [eventId]);

  if (!isOrganizer) {
    return <Navigate to="/login" replace />;
  }

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Meet Console...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Event Not Found</h2>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Realtime Handlers
  const handleDeclareAttempt = async (
    athleteId: string,
    liftType: LiftType,
    attemptNumber: number,
    weightKg: number
  ) => {
    await DataClient.declareAttempt(event.id, {
      athleteId,
      liftType,
      attemptNumber,
      weightKg,
    });
    await loadData(event.id);
  };

  const handleVote = async (role: RefereeRole, decision: RefereeDecision, infractions?: string[]) => {
    // If voting individually on attempt
    await loadData(event.id);
  };

  // Immediate consensus quick judge
  const handleQuickJudge = async (attemptId: string, decision: RefereeDecision) => {
    await DataClient.recordVote(event.id, attemptId, { role: 'chief', decision });
    await DataClient.recordVote(event.id, attemptId, { role: 'left', decision });
    await DataClient.recordVote(event.id, attemptId, { role: 'right', decision });
    await loadData(event.id);
  };

  // Atomic quick judge: Declares attempt if undeclared AND records votes in one step
  const handleQuickJudgeAttempt = async (
    athleteId: string,
    liftType: LiftType,
    attemptNumber: number,
    weightKg: number,
    decision: RefereeDecision
  ) => {
    const declared = await DataClient.declareAttempt(event.id, {
      athleteId,
      liftType,
      attemptNumber,
      weightKg,
    });
    await DataClient.recordVote(event.id, declared.id, { role: 'chief', decision });
    await DataClient.recordVote(event.id, declared.id, { role: 'left', decision });
    await DataClient.recordVote(event.id, declared.id, { role: 'right', decision });
    await loadData(event.id);
  };

  const handleUnifiedRegisterAthlete = async (
    data: Partial<Athlete> & {
      openingSquatKg?: number;
      openingBenchKg?: number;
      openingDeadliftKg?: number;
    }
  ) => {
    const newAthlete = await DataClient.registerAthlete(event.id, data);

    if (data.openingSquatKg) {
      await DataClient.declareAttempt(event.id, {
        athleteId: newAthlete.id,
        liftType: 'squat',
        attemptNumber: 1,
        weightKg: data.openingSquatKg,
      });
    }
    if (data.openingBenchKg) {
      await DataClient.declareAttempt(event.id, {
        athleteId: newAthlete.id,
        liftType: 'bench_press',
        attemptNumber: 1,
        weightKg: data.openingBenchKg,
      });
    }
    if (data.openingDeadliftKg) {
      await DataClient.declareAttempt(event.id, {
        athleteId: newAthlete.id,
        liftType: 'deadlift',
        attemptNumber: 1,
        weightKg: data.openingDeadliftKg,
      });
    }

    await loadData(event.id);
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    await DataClient.deleteAthlete(event.id, athleteId);
    await loadData(event.id);
  };

  const handleUpdateRules = async (updatedRules: CompetitionRules) => {
    const updated = await DataClient.updateRules(event.id, updatedRules);
    setEvent(updated);
    await loadData(updated.id);
  };

  const handleFinalizeEvent = async () => {
    const finalized = await DataClient.finalizeEvent(event.id, 'Technical Jury Controller');
    setEvent(finalized);
    await loadData(finalized.id);
  };

  const handleTogglePublish = async () => {
    if (event.isPublished || event.status === 'published' || event.status === 'live') {
      const updated = await DataClient.unpublishEvent(event.id);
      setEvent(updated);
    } else {
      const updated = await DataClient.publishEvent(event.id);
      setEvent(updated);
    }
  };

  const isLive = event.status === 'live';
  const isPublished = event.isPublished || event.status === 'published' || isLive;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Brand & Return to Dashboard */}
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-bold"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="h-5 w-px bg-slate-800" />

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white max-w-[200px] sm:max-w-xs truncate">
                    {event.name}
                  </span>
                  {isLive ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 animate-pulse">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {event.status}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">{event.venue} • {event.date}</p>
              </div>
            </div>

            {/* Right Quick Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Publishing Status Toggle */}
              <button
                onClick={handleTogglePublish}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  isPublished
                    ? 'bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
                title={isPublished ? 'Event is published publicly' : 'Event is hidden/draft'}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isPublished ? 'Published' : 'Draft Mode'}</span>
              </button>

              {/* View Public Page */}
              <Link
                to={`/event/${event.id}`}
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5"
                title="Open Public Event View"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Public View</span>
              </Link>

              {/* Add Participant quick action */}
              <button
                onClick={() => setActiveTab('athletes')}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-red-600/30 active:scale-95"
                title="Register and weigh-in participant"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Participant</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
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
                  onClick={() => setActiveTab(tab.id)}
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Real-Time Platform Console */}
        {activeTab === 'platform' && (
          <PlatformConsole
            event={event}
            athletes={athletes}
            attempts={attempts}
            isOrganizer={isOrganizer}
            onDeclareAttempt={handleDeclareAttempt}
            onVote={handleVote}
            onQuickJudge={handleQuickJudge}
            onQuickJudgeAttempt={handleQuickJudgeAttempt}
            onRegisterAthlete={handleUnifiedRegisterAthlete}
          />
        )}

        {/* 2. Unified Participants & Weigh-in */}
        {activeTab === 'athletes' && (
          <AthleteRoster
            event={event}
            athletes={athletes}
            isOrganizer={isOrganizer}
            onRegisterAthlete={handleUnifiedRegisterAthlete}
            onDeleteAthlete={handleDeleteAthlete}
          />
        )}

        {/* 3. Official Results & Leaderboard */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            event={event}
            results={results}
            athletes={athletes}
            attempts={attempts}
            onRefreshResults={() => loadData(event.id)}
          />
        )}

        {/* 4. Technical Rules & Settings */}
        {activeTab === 'rules' && (
          <RulesDashboard
            event={event}
            onUpdateRules={handleUpdateRules}
            onFinalizeEvent={handleFinalizeEvent}
          />
        )}

        {/* 5. Immutable Audit Trail */}
        {activeTab === 'audit' && <AuditViewer logs={auditLogs} />}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        Ascend Competition Engine • Section 21 Compliance • Organizer Control Mode Active
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  // Organizer state defaults to false for unauthenticated / incognito visitors
  const [isOrganizer, setIsOrganizer] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ascend_is_organizer');
      return stored === 'true';
    }
    return false;
  });

  const [organizerEmail, setOrganizerEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ascend_organizer_email') || '';
    }
    return '';
  });

  const handleLoginSuccess = (email: string) => {
    setIsOrganizer(true);
    setOrganizerEmail(email);
    localStorage.setItem('ascend_is_organizer', 'true');
    localStorage.setItem('ascend_organizer_email', email);
  };

  const handleLogout = () => {
    setIsOrganizer(false);
    setOrganizerEmail('');
    localStorage.removeItem('ascend_is_organizer');
    localStorage.removeItem('ascend_organizer_email');
  };

  return (
    <HashRouter>
      <Routes>
        {/* 1. Public Homepage: Displays ongoing published events & login link */}
        <Route path="/" element={<HomePage isOrganizer={isOrganizer} />} />

        {/* 2. Login Page: Supabase Auth with master fallback */}
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

        {/* 3. Authenticated Management Dashboard */}
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              isOrganizer={isOrganizer}
              organizerEmail={organizerEmail}
              onLogout={handleLogout}
            />
          }
        />

        {/* 4. Authenticated Meet Console for an Event */}
        <Route
          path="/dashboard/events/:eventId"
          element={
            <EventManagementView
              isOrganizer={isOrganizer}
              onLogout={handleLogout}
            />
          }
        />

        {/* 5. Public Read-Only Event Page */}
        <Route path="/event/:eventId" element={<PublicEventPage />} />

        {/* Fallback to Public Homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
