import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { PlatformConsole } from './components/platform/PlatformConsole';
import { AthleteRoster } from './components/athletes/AthleteRoster';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { RulesDashboard } from './components/rules-config/RulesDashboard';
import { AuditViewer } from './components/audit/AuditViewer';
import { LoginModal } from './components/auth/LoginModal';

import { CompetitionEvent, CompetitionRules } from '../core/types/competition';
import { Athlete } from '../core/types/athlete';
import { Attempt, RefereeRole, RefereeDecision, LiftType } from '../core/types/attempt';
import { CompetitionResults } from '../core/types/ranking';
import { AuditLogEntry } from '../core/types/audit';
import { DataClient } from './services/data-client';
import { TransactionalStore } from '../server/store';

export const App: React.FC = () => {
  // Initialize with seed data to ensure zero render delay on static hosts
  const [events, setEvents] = useState<CompetitionEvent[]>(() => TransactionalStore.getEvents());
  const [activeEventId, setActiveEventId] = useState<string>(() => {
    const evts = TransactionalStore.getEvents();
    return evts.length > 0 ? evts[0].id : 'evt-ascend-open';
  });

  // Default to the intuitive meet platform
  const [activeTab, setActiveTab] = useState<string>('platform');

  // Organizer mode enabled by default so meet organizers can immediately test and run
  const [isOrganizer, setIsOrganizer] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ascend_is_organizer');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [athletes, setAthletes] = useState<Athlete[]>(() =>
    TransactionalStore.getAthletes('evt-ascend-open')
  );
  const [attempts, setAttempts] = useState<Attempt[]>(() =>
    TransactionalStore.getAttempts('evt-ascend-open')
  );
  const [results, setResults] = useState<CompetitionResults | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, []);

  // When active event changes, reload its data
  useEffect(() => {
    if (activeEventId) {
      loadEventData(activeEventId);
    }
  }, [activeEventId]);

  const fetchEvents = async () => {
    try {
      const data = await DataClient.getEvents();
      if (data && data.length > 0) {
        setEvents(data);
        if (!activeEventId || !data.some((e) => e.id === activeEventId)) {
          setActiveEventId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const loadEventData = async (eventId: string) => {
    try {
      const [athData, attData, resData, logData] = await Promise.all([
        DataClient.getAthletes(eventId),
        DataClient.getAttempts(eventId),
        DataClient.getResults(eventId),
        DataClient.getAuditLogs(eventId),
      ]);

      setAthletes(athData);
      setAttempts(attData);
      setResults(resData);
      setAuditLogs(logData);
    } catch (err) {
      console.error('Error loading event data:', err);
    }
  };

  const currentEvent = events.find((e) => e.id === activeEventId) || events[0];

  const handleUpdateRules = async (updatedRules: CompetitionRules) => {
    if (!currentEvent) return;
    try {
      const updated = await DataClient.updateRules(currentEvent.id, updatedRules);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      await loadEventData(updated.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update rules');
    }
  };

  const handleFinalizeEvent = async () => {
    if (!currentEvent) return;
    const finalized = await DataClient.finalizeEvent(currentEvent.id, 'Technical Jury Controller');
    setEvents((prev) => prev.map((e) => (e.id === finalized.id ? finalized : e)));
    await loadEventData(finalized.id);
  };

  const handleDeclareAttempt = async (
    athleteId: string,
    liftType: LiftType,
    attemptNumber: number,
    weightKg: number
  ) => {
    if (!currentEvent) return;
    await DataClient.declareAttempt(currentEvent.id, {
      athleteId,
      liftType,
      attemptNumber,
      weightKg,
    });
    await loadEventData(currentEvent.id);
  };

  const handleVote = async (role: RefereeRole, decision: RefereeDecision, infractions?: string[]) => {
    if (!currentEvent || !selectedAttemptId) return;
    await DataClient.recordVote(currentEvent.id, selectedAttemptId, {
      role,
      decision,
      infractions,
    });
    await loadEventData(currentEvent.id);
  };

  // Immediate consensus decision on the card
  const handleQuickJudge = async (attemptId: string, decision: RefereeDecision) => {
    if (!currentEvent) return;
    await DataClient.recordVote(currentEvent.id, attemptId, {
      role: 'chief',
      decision,
    });
    await DataClient.recordVote(currentEvent.id, attemptId, {
      role: 'left',
      decision,
    });
    await DataClient.recordVote(currentEvent.id, attemptId, {
      role: 'right',
      decision,
    });
    await loadEventData(currentEvent.id);
  };

  const handleUnifiedRegisterAthlete = async (
    data: Partial<Athlete> & {
      openingSquatKg?: number;
      openingBenchKg?: number;
      openingDeadliftKg?: number;
    }
  ) => {
    if (!currentEvent) return;
    const newAthlete = await DataClient.registerAthlete(currentEvent.id, data);

    // Auto-declare opening attempts if provided
    if (data.openingSquatKg) {
      await DataClient.declareAttempt(currentEvent.id, {
        athleteId: newAthlete.id,
        liftType: 'squat',
        attemptNumber: 1,
        weightKg: data.openingSquatKg,
      });
    }
    if (data.openingBenchKg) {
      await DataClient.declareAttempt(currentEvent.id, {
        athleteId: newAthlete.id,
        liftType: 'bench_press',
        attemptNumber: 1,
        weightKg: data.openingBenchKg,
      });
    }
    if (data.openingDeadliftKg) {
      await DataClient.declareAttempt(currentEvent.id, {
        athleteId: newAthlete.id,
        liftType: 'deadlift',
        attemptNumber: 1,
        weightKg: data.openingDeadliftKg,
      });
    }

    await loadEventData(currentEvent.id);
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    if (!currentEvent) return;
    await DataClient.deleteAthlete(currentEvent.id, athleteId);
    await loadEventData(currentEvent.id);
  };

  if (!currentEvent) {
    return <div className="p-8 text-center text-slate-400">Loading Ascend Platform...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Header
        currentEvent={currentEvent}
        events={events}
        activeTab={activeTab}
        isOrganizer={isOrganizer}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onSelectTab={setActiveTab}
        onSelectEvent={setActiveEventId}
        onNewEvent={() => {}}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Live Platform Dashboard (Main Organizer View) */}
        {activeTab === 'platform' && (
          <PlatformConsole
            event={currentEvent}
            athletes={athletes}
            attempts={attempts}
            isOrganizer={isOrganizer}
            onDeclareAttempt={handleDeclareAttempt}
            onVote={handleVote}
            onQuickJudge={handleQuickJudge}
          />
        )}

        {/* 2. Unified Participants & Registration & Delete */}
        {activeTab === 'athletes' && (
          <AthleteRoster
            event={currentEvent}
            athletes={athletes}
            isOrganizer={isOrganizer}
            onRegisterAthlete={handleUnifiedRegisterAthlete}
            onDeleteAthlete={handleDeleteAthlete}
          />
        )}

        {/* 3. Official Results & Leaderboard (Participant & Public View) */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            event={currentEvent}
            results={results}
            athletes={athletes}
            attempts={attempts}
            onRefreshResults={() => loadEventData(currentEvent.id)}
          />
        )}

        {/* 4. Technical Rules & Settings (Optional/Organizer) */}
        {activeTab === 'rules' && (
          <RulesDashboard
            event={currentEvent}
            onUpdateRules={handleUpdateRules}
            onFinalizeEvent={handleFinalizeEvent}
          />
        )}

        {/* 5. Immutable Audit Trail */}
        {activeTab === 'audit' && <AuditViewer logs={auditLogs} />}
      </main>

      {/* Organizer Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isOrganizer={isOrganizer}
        onSetOrganizer={(org) => {
          setIsOrganizer(org);
          localStorage.setItem('ascend_is_organizer', org ? 'true' : 'false');
        }}
      />

      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-3">
        <span>Ascend Competition Engine • Section 21 Compliance</span>
        <span className="text-slate-600">|</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {isOrganizer ? 'Organizer Mode Active' : 'Spectator / Participant View'}
        </span>
      </footer>
    </div>
  );
};

export default App;
