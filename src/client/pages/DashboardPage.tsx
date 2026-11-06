import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CompetitionEvent, EventStatus } from '../../core/types/competition';
import { DataClient } from '../services/data-client';
import { SupabaseService } from '../../core/services/supabase';
import { ASCEND_OPEN_PROFILE } from '../../core/competition-profiles/ascend-open.profile';
import { IPF_COMPETITION_PROFILE } from '../../core/competition-profiles/ipf-technical.profile';
import {
  Dumbbell,
  Plus,
  Radio,
  Eye,
  LogOut,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface DashboardPageProps {
  isOrganizer: boolean;
  organizerEmail?: string;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  isOrganizer,
  organizerEmail,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Event Form State
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVenue, setNewVenue] = useState('');
  const [newProfile, setNewProfile] = useState<'ascend_open' | 'ipf_technical'>('ascend_open');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Route protection: If not organizer, redirect to login
    if (!isOrganizer) {
      navigate('/login');
      return;
    }
    loadEvents();
  }, [isOrganizer, navigate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await DataClient.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events in dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (event: CompetitionEvent) => {
    try {
      if (event.isPublished || event.status === 'published' || event.status === 'live') {
        await DataClient.unpublishEvent(event.id);
      } else {
        await DataClient.publishEvent(event.id);
      }
      await loadEvents();
    } catch (err) {
      console.error('Error toggling event publishing:', err);
    }
  };

  const handleSetStatus = async (eventId: string, newStatus: EventStatus) => {
    try {
      await DataClient.updateEventStatus(eventId, newStatus);
      await loadEvents();
    } catch (err) {
      console.error('Error updating event status:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedRules =
        newProfile === 'ipf_technical' ? IPF_COMPETITION_PROFILE : ASCEND_OPEN_PROFILE;

      const created = await DataClient.createEvent({
        name: newName.trim(),
        date: newDate,
        venue: newVenue.trim() || 'Platform 1',
        organizer: organizerEmail || 'Ascend Meet Director',
        rulesSnapshot: JSON.parse(JSON.stringify(selectedRules)),
      });

      setIsModalOpen(false);
      setNewName('');
      setNewVenue('');
      await loadEvents();
      // Navigate to manage the newly created event
      navigate(`/dashboard/events/${created.id}`);
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await SupabaseService.signOut();
    onLogout();
    navigate('/');
  };

  // Stats
  const totalEvents = events.length;
  const liveCount = events.filter((e) => e.status === 'live').length;
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const draftCount = events.filter((e) => e.status === 'draft' || e.status === 'unpublished').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Organizer Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 ring-1 ring-red-500/40">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-lg tracking-wider text-white">ASCEND</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-400 border border-amber-800">
                    Organizer Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Authenticated Management Dashboard</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="text-right hidden sm:block">
              <span className="text-xs font-medium text-slate-300 block">
                {organizerEmail || 'Meet Director'}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Authorized</span>
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-red-800 transition flex items-center space-x-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Competition Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, configure, publish, and officiate powerlifting competitions.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center space-x-2 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Competition</span>
          </button>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Meets</span>
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-black text-white mt-2 font-mono">{totalEvents}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live Now</span>
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-red-400 mt-2 font-mono">{liveCount}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Published</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-400 mt-2 font-mono">{publishedCount}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Drafts</span>
              <Shield className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-black text-slate-400 mt-2 font-mono">{draftCount}</div>
          </div>
        </div>

        {/* Competitions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Managed Competitions</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
                {events.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading competitions...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No competitions found. Click "Create New Competition" to start.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {events.map((ev) => {
                const isLive = ev.status === 'live';
                const isPublished = ev.isPublished || ev.status === 'published' || isLive;
                const isIPF = ev.rulesSnapshot?.profileId === 'ipf_inspired';

                return (
                  <div
                    key={ev.id}
                    className="p-5 hover:bg-slate-800/40 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate">{ev.name}</h3>
                        
                        {/* Status Badges */}
                        {isLive && (
                          <span className="inline-flex items-center space-x-1.5 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>LIVE</span>
                          </span>
                        )}
                        {ev.status === 'published' && (
                          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700">
                            PUBLISHED
                          </span>
                        )}
                        {ev.status === 'draft' && (
                          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            DRAFT
                          </span>
                        )}
                        {ev.status === 'completed' && (
                          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                            COMPLETED
                          </span>
                        )}
                        {ev.status === 'unpublished' && (
                          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            UNPUBLISHED
                          </span>
                        )}

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {isIPF ? 'IPF Technical' : 'Ascend Open'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ev.venue}</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <span>
                          Organizer: <strong className="text-slate-300">{ev.organizer}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      {/* State Transition Steppers */}
                      {ev.status === 'draft' || ev.status === 'unpublished' ? (
                        <button
                          onClick={() => handleTogglePublish(ev)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                          title="Publish event to public homepage"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                      ) : null}

                      {ev.status === 'published' && (
                        <>
                          <button
                            onClick={() => handleSetStatus(ev.id, 'live')}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-red-600/30"
                            title="Start competition live"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Go Live</span>
                          </button>
                          <button
                            onClick={() => handleTogglePublish(ev)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                            title="Hide from public"
                          >
                            <span>Unpublish</span>
                          </button>
                        </>
                      )}

                      {ev.status === 'live' && (
                        <button
                          onClick={() => handleSetStatus(ev.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-bold transition flex items-center space-x-1.5"
                          title="Finalize competition results"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finalize</span>
                        </button>
                      )}

                      {/* Public View link if published */}
                      {isPublished && (
                        <Link
                          to={`/event/${ev.id}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
                          title="View public live page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Public View</span>
                        </Link>
                      )}

                      {/* Primary Action: Open Meet Console */}
                      <Link
                        to={`/dashboard/events/${ev.id}`}
                        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition flex items-center space-x-1.5"
                      >
                        <span>Open Meet Console</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create New Competition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white">Create New Competition</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Competition Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024 State Powerlifting Open"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Platform 1"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Federation / Rules Engine Profile
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                  <label
                    className={`border rounded-xl p-3 cursor-pointer flex flex-col space-y-1 transition ${
                      newProfile === 'ascend_open'
                        ? 'border-red-500 bg-red-950/20'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value="ascend_open"
                      checked={newProfile === 'ascend_open'}
                      onChange={() => setNewProfile('ascend_open')}
                      className="sr-only"
                    />
                    <span className="text-xs font-bold text-white">Ascend Open</span>
                    <span className="text-[11px] text-slate-400">
                      Flexible rules, bodyweight ratio ranking, optional referee workflows.
                    </span>
                  </label>

                  <label
                    className={`border rounded-xl p-3 cursor-pointer flex flex-col space-y-1 transition ${
                      newProfile === 'ipf_technical'
                        ? 'border-red-500 bg-red-950/20'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value="ipf_technical"
                      checked={newProfile === 'ipf_technical'}
                      onChange={() => setNewProfile('ipf_technical')}
                      className="sr-only"
                    />
                    <span className="text-xs font-bold text-white">IPF Technical</span>
                    <span className="text-[11px] text-slate-400">
                      Strict weight categories, official weigh-in, 3-referee majority judging.
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  New competitions are created in <strong>Draft</strong> mode by default. They will
                  not appear on the public homepage until explicitly published.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Competition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
