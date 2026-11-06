import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CompetitionEvent } from '../../core/types/competition';
import { Athlete } from '../../core/types/athlete';
import { Attempt } from '../../core/types/attempt';
import { CompetitionResults } from '../../core/types/ranking';
import { DataClient } from '../services/data-client';
import { SupabaseService } from '../../core/services/supabase';
import { BarLoaderCalculator } from '../../core/attempt-scheduler/bar-loader';
import { LeaderboardView } from '../components/leaderboard/LeaderboardView';
import {
  Dumbbell,
  Radio,
  Calendar,
  MapPin,
  ArrowLeft,
  ShieldAlert,
  Wifi,
  Sparkles,
  Trophy,
} from 'lucide-react';

export const PublicEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<CompetitionEvent | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [results, setResults] = useState<CompetitionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'platform' | 'leaderboard'>('platform');

  const loadData = async (targetId: string) => {
    try {
      const allEvents = await DataClient.getEvents();
      const matched = allEvents.find((e) => e.id === targetId);

      if (!matched) {
        setErrorMsg('Competition not found.');
        return;
      }

      // Privacy gate: Draft and unpublished events are strictly private
      if (!matched.isPublished && matched.status !== 'live' && matched.status !== 'published' && matched.status !== 'completed') {
        setErrorMsg('This competition is currently in draft preparation and is not publicly visible.');
        return;
      }

      setEvent(matched);

      const [athData, attData, resData] = await Promise.all([
        DataClient.getAthletes(targetId),
        DataClient.getAttempts(targetId),
        DataClient.getResults(targetId),
      ]);

      setAthletes(athData);
      setAttempts(attData);
      setResults(resData);
    } catch (err: any) {
      console.error('Failed to load public event data:', err);
      setErrorMsg(err.message || 'Error loading competition details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) {
      setErrorMsg('No event ID specified.');
      setLoading(false);
      return;
    }

    loadData(eventId);

    // Supabase Realtime synchronization
    const subscription = SupabaseService.subscribeToEvent(eventId, () => {
      loadData(eventId);
    });

    return () => {
      subscription();
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Connecting to live competition feed...</p>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 border border-red-800 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Event Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  // Determine current active on-platform lifter and attempt
  const isLive = event.status === 'live';
  const currentAthlete = athletes.length > 0 ? athletes[0] : null;

  // Find latest attempt for this athlete or pending attempt
  const currentAttempt = attempts.find((a) => a.athleteId === currentAthlete?.id) || attempts[0];
  const attemptWeight = currentAttempt ? currentAttempt.weightKg : 140;
  const plateLoading = BarLoaderCalculator.calculate(attemptWeight);

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

  const chiefVote = currentAttempt?.refereeVotes?.find((v) => v.refereeRole === 'chief')?.decision;
  const leftVote = currentAttempt?.refereeVotes?.find((v) => v.refereeRole === 'left')?.decision;
  const rightVote = currentAttempt?.refereeVotes?.find((v) => v.refereeRole === 'right')?.decision;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Public Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base tracking-wider text-white">ASCEND</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Live Stream
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Public Spectator Feed</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Supabase Realtime live sync badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-emerald-400">
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span>Realtime Connected</span>
            </div>

            <Link
              to="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              Organizer Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Event Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {event.name}
              </h1>
              {isLive ? (
                <span className="inline-flex items-center space-x-1.5 text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-700 animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                  <span>LIVE ON PLATFORM</span>
                </span>
              ) : event.status === 'completed' ? (
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  FINAL RESULTS
                </span>
              ) : (
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-700">
                  UPCOMING
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{event.venue}</span>
              </div>
              <span>•</span>
              <span>Sanction / Rules: <strong className="text-slate-300">{event.rulesSnapshot.profileId === 'ipf_inspired' ? 'IPF Technical Standard' : 'Ascend Open'}</strong></span>
            </div>
          </div>

          {/* Navigation view tabs */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1 self-stretch md:self-auto justify-center">
            <button
              onClick={() => setActiveTab('platform')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'platform'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Platform
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'leaderboard'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Official Standings
            </button>
          </div>
        </div>

        {/* Tab 1: Live Platform Feed */}
        {activeTab === 'platform' && (
          <div className="space-y-6">
            {currentAthlete ? (
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
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

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      currentAttempt?.majorityDecision === 'good_lift'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : currentAttempt?.majorityDecision === 'no_lift'
                        ? 'bg-red-950 text-red-300 border border-red-700'
                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                    }`}
                  >
                    {currentAttempt?.majorityDecision
                      ? currentAttempt.majorityDecision.replace('_', ' ')
                      : 'ATTEMPT IN PROGRESS'}
                  </span>
                </div>

                {/* Athlete Details */}
                <div className="mb-6">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {currentAthlete.firstName} {currentAthlete.lastName}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>
                      Bodyweight:{' '}
                      <strong className="text-slate-200">
                        {currentAthlete.officialBodyweightKg?.toFixed(1) || '—'} kg
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Squat Rack:{' '}
                      <strong className="text-slate-200">
                        {currentAthlete.rackHeights?.squatRackHeight || '—'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Bench Rack:{' '}
                      <strong className="text-slate-200">
                        {currentAthlete.rackHeights?.benchRackHeight || '—'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Weight Stage Display */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {currentAttempt?.liftType.replace('_', ' ').toUpperCase() || 'SQUAT'} — Attempt #
                        {currentAttempt?.attemptNumber || 1}
                      </span>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-6xl sm:text-7xl font-black text-red-500 tracking-tight font-mono">
                          {attemptWeight.toFixed(1)}
                        </span>
                        <span className="text-2xl font-bold text-slate-400">KG</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barbell Visualizer */}
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

                {/* Live Referee Lights */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
                    Referee Lights
                  </div>
                  <div className="flex items-center justify-center space-x-6 sm:space-x-12">
                    {/* Left Referee */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-14 h-14 rounded-full border-4 shadow-xl transition-all duration-300 flex items-center justify-center ${
                          leftVote === 'good_lift'
                            ? 'bg-white border-slate-200 shadow-white/40'
                            : leftVote === 'no_lift'
                            ? 'bg-red-600 border-red-700 shadow-red-600/50'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Left</span>
                    </div>

                    {/* Chief Referee */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-16 h-16 rounded-full border-4 shadow-xl transition-all duration-300 flex items-center justify-center ${
                          chiefVote === 'good_lift'
                            ? 'bg-white border-slate-200 shadow-white/40 scale-110'
                            : chiefVote === 'no_lift'
                            ? 'bg-red-600 border-red-700 shadow-red-600/50 scale-110'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                      <span className="text-[11px] font-extrabold text-white uppercase">Chief</span>
                    </div>

                    {/* Right Referee */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-14 h-14 rounded-full border-4 shadow-xl transition-all duration-300 flex items-center justify-center ${
                          rightVote === 'good_lift'
                            ? 'bg-white border-slate-200 shadow-white/40'
                            : rightVote === 'no_lift'
                            ? 'bg-red-600 border-red-700 shadow-red-600/50'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Right</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                No lifters currently on the platform for this event.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Leaderboard & Standings */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            event={event}
            results={results}
            athletes={athletes}
            attempts={attempts}
            onRefreshResults={() => loadData(event.id)}
          />
        )}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        Ascend Powerlifting • Real-Time Event Feed • IPF Section 21 Standards Compliant
      </footer>
    </div>
  );
};
