import { RefreshCcw, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../components/AuthContext.jsx';
import { Card, Empty, Loader, Pill } from '../components/Ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { dateTime } from '../utils/format.js';

export default function Admin() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', url: '', category: 'General' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [adding, setAdding] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const feeds = useAsync(async () => (await api.get('/rss')).data, []);
  const dashboard = useAsync(async () => (await api.get('/dashboard')).data, []);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadAdminUsers();
    }
  }, [isAdmin]);

  async function loadAdminUsers() {
    try {
      setAdminUsersLoading(true);
      const { data } = await api.get('/profile/admin/users');
      setAdminUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function updateUserRole(userId, newRole) {
    try {
      await api.put(`/profile/admin/users/${userId}/role`, { role: newRole });
      loadAdminUsers();
    } catch (error) {
      alert('Failed to update user role');
    }
  }

  async function deleteUser(userId) {
    if (confirm('Are you sure? This cannot be undone.')) {
      try {
        await api.delete(`/profile/admin/users/${userId}`);
        loadAdminUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  }

  if ((feeds.loading || dashboard.loading || adminUsersLoading) && isAdmin) return <Loader />;

  async function addFeed(event) {
    event.preventDefault();
    setAdding(true);
    setMessage('');
    setMessageType('success');
    try {
      const { data } = await api.post('/rss/add', form);
      setForm({ name: '', url: '', category: 'General' });
      const discoveryMethod = data.resolved?.discoveredFrom === 'direct' ? 'directly' : `via ${data.resolved?.discoveredFrom}`;
      setMessageType('success');
      setMessage(`RSS feed added successfully and discovered ${discoveryMethod}!`);
      feeds.reload();
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Please provide a valid RSS feed URL or website with an RSS feed.');
    } finally {
      setAdding(false);
    }
  }

  async function removeFeed(id) {
    await api.delete(`/rss/${id}`);
    feeds.reload();
  }

  async function fetchNow() {
    await api.post('/rss/fetch');
    feeds.reload();
    dashboard.reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="page-kicker">Operations</p>
          <h2 className="page-title">Admin Panel</h2>
        </div>
        {isAdmin && <button onClick={fetchNow} className="btn-primary"><RefreshCcw size={16} /> Fetch now</button>}
      </div>

      {!isAdmin && <Empty label="Admin role required for admin panel access." />}

      {isAdmin && (
        <>
          {/* User Management Section */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-cyan-600" />
              <h3 className="text-lg font-semibold">User Management</h3>
            </div>
            {adminUsersLoading ? (
              <Loader />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Created</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u._id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-medium">{u.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="py-3 px-4">
                          <select 
                            value={u.role} 
                            onChange={(e) => updateUserRole(u._id, e.target.value)} 
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-800 dark:bg-slate-900"
                          >
                            <option value="admin">Admin</option>
                            <option value="analyst">Analyst</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">{dateTime(u.createdAt)}</td>
                        <td className="py-3 px-4">
                          <button 
                            onClick={() => deleteUser(u._id)} 
                            className="icon-button h-9 w-9 border-transparent bg-transparent text-rose-600 hover:border-rose-200 hover:text-rose-700 dark:bg-transparent dark:hover:border-rose-900" 
                            aria-label="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* RSS Feed Management Section */}
          <Card>
            <h3 className="mb-4 font-semibold">Add RSS Feed</h3>
            <form onSubmit={addFeed} className="grid gap-3 md:grid-cols-[1fr_2fr_180px_auto]">
              <input required placeholder="Source name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" />
              <input required placeholder="Website or RSS URL" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="field" />
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="field">
                {['General', 'Technology', 'Cryptocurrency', 'Politics', 'Business', 'Sports', 'Health', 'Entertainment', 'Science', 'War', 'Disaster', 'Climate', 'Culture', 'Education', 'Travel'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <button disabled={adding} className="btn-primary">{adding ? 'Finding...' : 'Add'}</button>
            </form>
            {message && (
              <p className={`mt-3 text-sm rounded p-2 ${messageType === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                {message}
              </p>
            )}
          </Card>

          {/* RSS Feeds List */}
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <h3 className="mb-4 font-semibold">Configured RSS Feeds</h3>
              {feeds.data?.items?.length === 0 ? (
                <p className="text-sm text-slate-500">No RSS feeds configured. Add one above to get started.</p>
              ) : (
                <div className="space-y-3">
                  {feeds.data?.items?.map((feed) => (
                    <div key={feed._id} className="flex items-center justify-between gap-3 rounded border border-slate-200/70 p-3 hover:border-cyan-300 dark:border-slate-800 dark:hover:border-cyan-700">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{feed.name}</p>
                        <p className="truncate text-xs text-slate-500">{feed.url}</p>
                        {feed.websiteUrl && <p className="truncate text-xs text-cyan-700 dark:text-cyan-300">Discovered from {feed.websiteUrl}</p>}
                        <p className="mt-1 text-xs text-slate-500">Last fetched: {dateTime(feed.lastFetchedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill className="bg-cyan-500/12 text-cyan-700 dark:text-cyan-300">rss</Pill>
                        <Pill className={feed.lastStatus === 'failed' ? 'bg-rose-500/12 text-rose-700' : 'bg-emerald-500/12 text-emerald-700'}>{feed.lastStatus}</Pill>
                        <button onClick={() => removeFeed(feed._id)} className="icon-button h-9 w-9 border-transparent bg-transparent text-slate-500 hover:border-rose-200 hover:text-rose-600 dark:bg-transparent dark:hover:border-rose-900" aria-label="Remove feed"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* AI Analysis Logs */}
            <Card>
              <h3 className="mb-4 font-semibold">AI Analysis Logs</h3>
              <div className="space-y-2">
                {dashboard.data?.aiLogs?.slice(0, 10).map((log) => (
                  <div key={log._id} className="rounded bg-slate-100/70 p-3 text-sm dark:bg-slate-900/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{log.provider}</span>
                      <Pill className={log.status === 'success' ? 'bg-emerald-500/12 text-emerald-700' : 'bg-rose-500/12 text-rose-700'}>{log.status}</Pill>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{dateTime(log.createdAt)} - {log.durationMs || 0}ms</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
