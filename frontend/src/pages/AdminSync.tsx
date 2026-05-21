import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

interface BranchInfo {
  code: string;
  name: string;
}

type BranchStatus = 'pending' | 'syncing' | 'done' | 'failed';

interface BranchState {
  info: BranchInfo;
  status: BranchStatus;
  error?: string;
}

interface SyncSummary {
  total: number;
  synced: number;
  failed: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function getAuthToken(): string {
  return localStorage.getItem('token') ?? '';
}

const AdminSync: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTruncating, setIsTruncating] = useState(false);
  const [branches, setBranches] = useState<BranchState[]>([]);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resetState = () => {
    setSummary(null);
    setErrorMessage(null);
    setBranches([]);
  };

  const startStream = async () => {
    resetState();
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${BASE_URL}/api/transfer/sync-all-stream`, {
        headers: {
          Authorization: getAuthToken(),
          Accept: 'text/event-stream',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          const type = event.type as string;

          if (type === 'init') {
            const list = (event.branches as BranchInfo[]) ?? [];
            setBranches(list.map((b) => ({ info: b, status: 'pending' })));
          } else if (type === 'start') {
            const code = event.branchCode as string;
            setBranches((prev) =>
              prev.map((b) => b.info.code === code ? { ...b, status: 'syncing' } : b)
            );
          } else if (type === 'done') {
            const code = event.branchCode as string;
            setBranches((prev) =>
              prev.map((b) => b.info.code === code ? { ...b, status: 'done' } : b)
            );
          } else if (type === 'failed') {
            const code = event.branchCode as string;
            const err = (event.error as string) ?? 'Unknown error';
            setBranches((prev) =>
              prev.map((b) => b.info.code === code ? { ...b, status: 'failed', error: err } : b)
            );
          } else if (type === 'complete') {
            const s = event.summary as SyncSummary;
            setSummary(s);
            if (s.failed === 0) {
              toast.success(`Sync complete: ${s.synced}/${s.total} branches synced`);
            } else {
              toast.warning(`Sync done: ${s.synced} synced, ${s.failed} failed`);
            }
          } else if (type === 'error') {
            const msg = (event.message as string) ?? 'Unknown error';
            setErrorMessage(msg);
            toast.error(`Sync error: ${msg}`);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Streaming failed';
      setErrorMessage(msg);
      toast.error(`Sync failed: ${msg}`);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleTruncateAndSync = async () => {
    if (!window.confirm('This will DELETE all items, categories, and locations from the local database before re-syncing from ERP. Continue?')) return;
    resetState();
    setIsTruncating(true);
    try {
      const result = await api.post<{
        success: boolean;
        message: string;
        summary: { totalBranches: number; syncedBranches: number; failedBranches: number };
        successes: { branchCode: string; branchName: string }[];
        failures: { branchCode: string; branchName: string; error: string }[];
      }>('/api/transfer/truncate-and-sync-all', {});

      const s: SyncSummary = {
        total: result.summary.totalBranches,
        synced: result.summary.syncedBranches,
        failed: result.summary.failedBranches,
      };
      setSummary(s);

      const branchStates: BranchState[] = [
        ...result.successes.map((b) => ({
          info: { code: b.branchCode, name: b.branchName },
          status: 'done' as BranchStatus,
        })),
        ...result.failures.map((b) => ({
          info: { code: b.branchCode, name: b.branchName },
          status: 'failed' as BranchStatus,
          error: b.error,
        })),
      ];
      setBranches(branchStates);

      if (result.summary.failedBranches === 0) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Truncate & sync failed';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsTruncating(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const statusIcon = (status: BranchStatus) => {
    if (status === 'pending') return <span className="w-4 h-4 rounded-full bg-gray-300 inline-block" />;
    if (status === 'syncing') return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const isBusy = isStreaming || isTruncating;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ERP Sync</h2>
        <p className="text-sm text-gray-500 mt-1">
          Pull items, categories, and locations from the ERP (SQL Server) into the local PostgreSQL database.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={startStream}
          disabled={isBusy}
          className="flex items-center gap-2"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isStreaming ? 'Syncing…' : 'Sync from ERP'}
        </Button>

        {isStreaming && (
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}

        <Button
          variant="destructive"
          onClick={handleTruncateAndSync}
          disabled={isBusy}
          className="flex items-center gap-2"
        >
          {isTruncating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {isTruncating ? 'Truncating & Syncing…' : 'Truncate & Re-sync'}
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-700 rounded-md px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {summary && (
        <div className={`rounded-md border px-4 py-3 text-sm font-medium ${
          summary.failed === 0
            ? 'border-green-200 bg-green-50 text-green-800'
            : summary.synced === 0
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-yellow-200 bg-yellow-50 text-yellow-800'
        }`}>
          {summary.failed === 0
            ? `All ${summary.total} branches synced successfully.`
            : `${summary.synced} of ${summary.total} branches synced. ${summary.failed} failed.`}
        </div>
      )}

      {branches.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Branch Code</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Branch Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branches.map((b) => (
                <tr key={b.info.code} className="bg-white">
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">{b.info.code}</td>
                  <td className="px-4 py-2 text-gray-700">{b.info.name || '—'}</td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1.5">
                      {statusIcon(b.status)}
                      <span className={
                        b.status === 'done' ? 'text-green-700' :
                        b.status === 'failed' ? 'text-red-600' :
                        b.status === 'syncing' ? 'text-blue-600' :
                        'text-gray-400'
                      }>
                        {b.status === 'pending' ? 'Pending' :
                         b.status === 'syncing' ? 'Syncing…' :
                         b.status === 'done' ? 'Done' : 'Failed'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-red-500">{b.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSync;
