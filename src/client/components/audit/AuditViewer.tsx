import React from 'react';
import { AuditLogEntry } from '../../../core/types/audit';
import { History, ShieldCheck, User, Calendar, FileText } from 'lucide-react';

interface AuditViewerProps {
  logs: AuditLogEntry[];
}

export const AuditViewer: React.FC<AuditViewerProps> = ({ logs }) => {
  return (
    <div className="py-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <History className="w-5 h-5 text-red-400" />
          <span>Immutable Competition Audit Trail (Append-Only)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Every registration, weigh-in verification, attempt declaration, referee decision, jury override, and status transition is recorded with timestamp and actor attribution.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Actor & Role</th>
                <th className="p-3">Audit Details & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 uppercase text-slate-300 font-sans font-medium text-[11px]">
                      {log.entityType}
                    </td>
                    <td className="p-3 font-sans text-slate-200">
                      <div>{log.actorId}</div>
                      <div className="text-[10px] text-slate-500">{log.actorRole}</div>
                    </td>
                    <td className="p-3 font-sans text-slate-300 max-w-md">
                      <div>{log.reason || '-'}</div>
                      {log.updatedValue && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                          Updated: {JSON.stringify(log.updatedValue)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No audit records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
