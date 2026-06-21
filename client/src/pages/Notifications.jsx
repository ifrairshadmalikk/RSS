import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Radio } from 'lucide-react';
import { api } from '../api/client.js';
import { Empty, Loader } from '../components/Ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { dateTime } from '../utils/format.js';

export default function Notifications() {
  const { data, loading, reload } = useAsync(async () => (await api.get('/notifications')).data, []);
  const { refreshNotifications } = useOutletContext() || {};

  useEffect(() => {
    if (!data?.items?.length) return;
    const unread = data.items.filter((item) => !item.read);
    if (!unread.length) return;

    Promise.all(unread.map((item) => api.patch(`/notifications/${item._id}/read`)))
      .then(async () => {
        await reload();
        refreshNotifications?.();
      })
      .catch((error) => console.error('Failed to mark notifications as read', error));
  }, [data, refreshNotifications, reload]);

  if (loading) return <Loader />;

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    reload();
    refreshNotifications?.();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="page-kicker">Alerts</p>
        <h2 className="page-title">Notifications</h2>
      </div>
      {!data.items.length && <Empty label="No breaking trend notifications yet." />}
      <div className="space-y-3">
        {data.items.map((item, index) => (
          <article key={item._id} className={`card-surface animate-in flex items-center justify-between gap-4 hover-lift ${item.read ? 'opacity-70' : 'border-l-4 border-l-cyan-600 dark:border-l-cyan-400'}`} style={{ animationDelay: `${index * 40}ms` }}>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-slate-100 text-cyan-700 dark:bg-slate-800 dark:text-cyan-300"><Radio size={18} /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold capitalize">{item.topic}</h3>
                  {!item.read && <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">Unread</span>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">{dateTime(item.createdAt)}</p>
              </div>
            </div>
            {!item.read && <button onClick={() => markRead(item._id)} className="btn-primary px-2.5" aria-label="Mark as read"><Check size={18} /></button>}
          </article>
        ))}
      </div>
    </div>
  );
}
