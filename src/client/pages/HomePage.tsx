import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompetitionEvent } from '../../core/types/competition';
import { DataClient } from '../services/data-client';
import { Dumbbell, ShieldCheck, Trophy, Calendar, MapPin, ArrowRight, Lock, Radio } from 'lucide-react';

interface HomePageProps {
  isOrganizer: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ isOrganizer }) => {
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedEvents();
  }, []);

  const loadPublishedEvents = async () => {
    try {
      setLoading(true);
      const all = await DataClient.getEvents();
      // Show published, live, and completed events on the public homepage
      const published = all.filter(
        (e) => e.isPublished || e.status === 'live' || e.status === 'published' || e.status === 'completed'
      );
      setEvents(published);
    } catch (err) {
      console.error('Failed to load published events:', err);
    } finally {
      setLoading(false);
    }
  };

  const liveEvents = events.filter((e) => e.status === 'live');
  const upcomingEvents = events.filter((e) => e.status === 'published');
  const completedEvents = events.filter((e) => e.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Public Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 ring-1 ring-red-500/40">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-wider text-white">ASCEND</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-950 text-red-400 border border-red-800/80">
                  Powerlifting
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Live Competition Platform & Standards Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isOrganizer ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2 transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition"
              >
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span>Organizer Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Official Powerlifting Meets & Live Scoring</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Follow Powerlifting Meets <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              In Real Time
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400">
            Real-time attempts, bar loading breakdown, referee decision consensus lights, and official IPF-compliant leaderboards.
          </p>
        </div>
      </section>

      {/* Ongoing Competitions Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Live Competitions */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h2 className="text-xl font-bold text-white tracking-wide">Live Competitions (On Platform)</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading competitions...</div>
          ) : liveEvents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
              No competitions are currently live on the platform. Check upcoming events below.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-900 border border-red-900/50 hover:border-red-600 rounded-2xl p-6 shadow-xl relative overflow-hidden transition group"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span>LIVE</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                        {evt.rulesSnapshot.profileName}
                      </span>
                      <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition">
                        {evt.name}
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{evt.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{evt.venue}</span>
                      </div>
                    </div>

                    <Link
                      to={`/event/${evt.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition"
                    >
                      <span>View Live Platform</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Competitions */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">Upcoming Competitions</h2>
          {upcomingEvents.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
              No upcoming competitions scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-lg transition space-y-4"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      {evt.rulesSnapshot.profileName}
                    </span>
                    <h3 className="text-lg font-bold text-white">{evt.name}</h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{evt.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{evt.venue}</span>
                    </div>
                  </div>

                  <Link
                    to={`/event/${evt.id}`}
                    className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <span>View Roster & Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Competitions */}
        {completedEvents.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-wide">Completed Competitions (Official Results)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow space-y-3"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                    Official Results Finalized
                  </span>
                  <h3 className="text-base font-bold text-white">{evt.name}</h3>
                  <div className="text-xs text-slate-400">
                    {evt.date} • {evt.venue}
                  </div>
                  <Link
                    to={`/event/${evt.id}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-400 hover:text-red-300 pt-1"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>View Final Standings</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
        Ascend Competition Engine • Public Spectator Gateway • Powered by Supabase & Vite
      </footer>
    </div>
  );
};

