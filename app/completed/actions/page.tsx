'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCompletedActions,
  softDeleteAction,
  type CompletedAction,
} from '@/lib/data';
import { usePermissions } from '@/hooks/usePermissions';
import NoAccess from '@/components/ui/NoAccess';

export default function CompletedActionsPage() {
  const [actions, setActions] = useState<CompletedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    loading: permLoading,
    error: permError,
    can,
  } = usePermissions();

  const canReadActions = can('actions', 'read');
  const canDeleteActions = can('actions', 'delete');

  const permissionError = useMemo(() => {
    if (permError) {
      return 'عدم دریافت مجوزهای کاربر';
    }
    if (!permLoading && !permError && !canReadActions) {
      return 'برای مشاهده فهرست اقدامات به سطح دسترسی actions.read نیاز دارید.';
    }
    return null;
  }, [permError, permLoading, canReadActions]);

  const loadData = useCallback(async () => {
    if (permLoading || permError || !canReadActions) {
      if (!permLoading) {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompletedActions();
      setActions(data);
    } catch (err) {
      console.error(err);
      setError('?????? ??????? ?? ??? ????? ??.');
    } finally {
      setLoading(false);
    }
  }, [permLoading, permError, canReadActions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(
    async (actionId: number) => {
      if (!canDeleteActions) {
        return;
      }

      const confirmed = window.confirm('??? ?? ??? ??? ??? ????? ????? ??????');
      if (!confirmed) return;

      try {
        await softDeleteAction(actionId);
        await loadData();
      } catch (err) {
        console.error(err);
        setError('??? ????? ?? ???? ????? ??.');
      }
    },
    [canDeleteActions, loadData],
  );

  if (permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="card w-full max-w-xs p-6 text-center text-sm text-text2">
          در حال بررسی مجوزهای دسترسی...
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <NoAccess
          title="دسترسی به گزارش اقدامات محدود است"
          description={permissionError}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-text">????????? ????</h1>
        <p className="mt-2 text-sm text-text2">
          ???? ?????????? ?? ??????? ????? ????? ??? ???.
        </p>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-divider text-sm">
            <thead className="bg-primarySubtle text-text">
              <tr>
                <th className="px-4 py-3 text-right font-medium">????? ?????</th>
                <th className="px-4 py-3 text-right font-medium">?????</th>
                <th className="px-4 py-3 text-right font-medium">??? ???????</th>
                <th className="px-4 py-3 text-right font-medium">??????</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-text2" colSpan={4}>
                    ?? ??? ????????...
                  </td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-text2" colSpan={4}>
                    ?????? ???? ????? ???? ?????.
                  </td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id} className="border-b border-divider">
                    <td className="px-4 py-3 font-medium text-primary">
                      {action.indicator}
                    </td>
                    <td className="px-4 py-3">
                      {action.project_name ?? action.project}
                    </td>
                    <td className="px-4 py-3">{action.request_type}</td>
                    <td className="px-4 py-3">
                      {canDeleteActions ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(action.id)}
                          className="btn-danger px-4 py-2 text-xs"
                        >
                          ???
                        </button>
                      ) : (
                        <span className="text-xs text-text2">اجازه حذف ندارید</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
    </div>
  );
}
