import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { RulesDashboard } from './components/rules-config/RulesDashboard';
import { PlatformConsole } from './components/platform/PlatformConsole';
import { RefereeConsole } from './components/referee/RefereeConsole';
import { WeighInConsole } from './components/weigh-in/WeighInConsole';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { AuditViewer } from './components/audit/AuditViewer';

import { CompetitionEvent, CompetitionRules } from '../core/types/competition';
import { Athlete } from '../core/types/athlete';
import { Attempt, RefereeRole, RefereeDecision, LiftType } from '../core/types/attempt';
import { CompetitionResults } from '../core/types/ranking';
import { AuditLogEntry } from '../core/types/audit';

export const App: React.FC = () => {
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('rules');

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0 && !activeEventId) {
        setActiveEventId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const loadEventData = async (eventId: string) => {
    try {
      const [athRes, attRes, resRes, logRes] = await Promise.all([
        fetch(`/api/events/${eventId}/athletes`),
        fetch(`/api/events/${eventId}/attempts`),
        fetch(`/api/events/${eventId}/results`),
        fetch(`/api/events/${eventId}/audit`),
      ]);

      const [athData, attData, resData, logData] = await Promise.all([
        athRes.json(),
        attRes.json(),
        resRes.json(),
        logRes.json(),
      ]);

      setAthletes(athData);
      setAttempts(attData);
      setResults(resData);
      setAuditLogs(logData);
    } catch (err) {
      console.error('Error loading event data:', err);
    }
  };

  const currentEvent = events.find((e) => e.id === activeEventId);

  const handleUpdateRules = async (updatedRules: CompetitionRules) => {
    if (!currentEvent) return;
    const res = await fetch(`/api/events/${currentEvent.id}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRules),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.errors?.join(', ') || errorData.error);
    }

    const { event } = await res.json();
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    await loadEventData(event.id);
  };

  const handleFinalizeEvent = async () => {
    if (!currentEvent) return;
    const res = await fetch(`/api/events/${currentEvent.id}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalizedBy: 'Technical Jury Controller' }),
    });
    const finalized = await res.json();
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
    await fetch(`/api/events/${currentEvent.id}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, liftType, attemptNumber, weightKg }),
    });
    await loadEventData(currentEvent.id);
  };

  const handleVote = async (role: RefereeRole, decision: RefereeDecision, infractions?: string[]) => {
    if (!currentEvent || !selectedAttemptId) return;
    await fetch(`/api/events/${currentEvent.id}/attempts/${selectedAttemptId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refereeRole: role,
        decision,
        infractionReasonCodes: infractions,
      }),
    });
    await loadEventData(currentEvent.id);
  };

  const handleJuryOverride = async (
    overriddenDecision: RefereeDecision,
    authorizedBy: string,
    reason: string
  ) => {
    if (!currentEvent || !selectedAttemptId) return;
    await fetch(`/api/events/${currentEvent.id}/attempts/${selectedAttemptId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overriddenDecision, authorizedBy, reason }),
    });
    await loadEventData(currentEvent.id);
  };

  const handleRecordWeighIn = async (
    athleteId: string,
    measuredWeightKg: number,
    officialId: string,
    officialName: string,
    notes?: string
  ) => {
    if (!currentEvent) return;
    await fetch(`/api/events/${currentEvent.id}/athletes/${athleteId}/weigh-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measuredWeightKg, officialId, officialName, notes }),
    });
    await loadEventData(currentEvent.id);
  };

  const handleUpdateRackHeights = async (athleteId: string, heights: any) => {
    if (!currentEvent) return;
    await fetch(`/api/events/${currentEvent.id}/athletes/${athleteId}/rack-heights`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(heights),
    });
    await loadEventData(currentEvent.id);
  };

  const handleRegisterAthlete = async (data: Partial<Athlete>) => {
    if (!currentEvent) return;
    await fetch(`/api/events/${currentEvent.id}/athletes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await loadEventData(currentEvent.id);
  };

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId);
  const selectedAthlete = selectedAttempt
    ? athletes.find((ath) => ath.id === selectedAttempt.athleteId)
    : undefined;

  if (!currentEvent) {
    return <div className="p-8 text-center text-slate-400">Loading Ascend Platform...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Header
        currentEvent={currentEvent}
        events={events}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectEvent={setActiveEventId}
        onNewEvent={() => {}}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'rules' && (
          <RulesDashboard
            event={currentEvent}
            onUpdateRules={handleUpdateRules}
            onFinalizeEvent={handleFinalizeEvent}
          />
        )}

        {activeTab === 'platform' && (
          <PlatformConsole
            event={currentEvent}
            athletes={athletes}
            attempts={attempts}
            onSelectAttemptForJudging={(attempt) => {
              setSelectedAttemptId(attempt.id);
              setActiveTab('referee');
            }}
            onDeclareAttempt={handleDeclareAttempt}
          />
        )}

        {activeTab === 'referee' && (
          <RefereeConsole
            event={currentEvent}
            attempt={selectedAttempt}
            athlete={selectedAthlete}
            onVote={handleVote}
            onJuryOverride={handleJuryOverride}
            onClose={() => setActiveTab('platform')}
          />
        )}

        {activeTab === 'weighin' && (
          <WeighInConsole
            event={currentEvent}
            athletes={athletes}
            onRecordWeighIn={handleRecordWeighIn}
            onUpdateRackHeights={handleUpdateRackHeights}
            onRegisterAthlete={handleRegisterAthlete}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            event={currentEvent}
            results={results}
            onRefreshResults={() => loadEventData(currentEvent.id)}
          />
        )}

        {activeTab === 'audit' && <AuditViewer logs={auditLogs} />}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        Ascend Competition Management Engine • Section 21 Compliance • IPF Rulebook Technical Reference (Non-Affiliated Standard Implementation)
      </footer>
    </div>
  );
};

export default App;

