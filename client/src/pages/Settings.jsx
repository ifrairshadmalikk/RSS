import { Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../components/AuthContext.jsx';
import { Card, Loader } from '../components/Ui.jsx';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', bio: '', profilePicture: '', preferredCountries: [], preferredCategories: [], notificationsEnabled: true, browserNotificationsEnabled: false, emailAlertsEnabled: false, pdfAlertsEnabled: false });
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'admin');
      loadProfile();
      if (user.role === 'admin') {
        loadAdminUsers();
      }
    }
  }, [user]);

  async function loadProfile() {
    try {
      const { data } = await api.get('/profile');
      setFormData({
        name: data.user.name || '',
        bio: data.user.bio || '',
        profilePicture: data.user.profilePicture || '',
        preferredCountries: data.user.preferredCountries || [],
        preferredCategories: data.user.preferredCategories || [],
        notificationsEnabled: data.user.notificationsEnabled !== false,
        browserNotificationsEnabled: data.user.browserNotificationsEnabled === true,
        emailAlertsEnabled: false,
        pdfAlertsEnabled: false
      });
      setProfile(data.user);
    } catch (error) {
      console.error('Failed to load profile', error);
    }
  }

  async function loadAdminUsers() {
    try {
      setAdminLoading(true);
      const { data } = await api.get('/profile/admin/users');
      setAdminUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setAdminLoading(false);
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    try {
      setLoading(true);
      let payload = { ...formData, emailAlertsEnabled: false, pdfAlertsEnabled: false };
      if (formData.browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          payload = { ...payload, browserNotificationsEnabled: false };
          setFormData((current) => ({ ...current, browserNotificationsEnabled: false }));
        }
      }
      const { data } = await api.put('/profile', payload);
      updateUser(data.user);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  function uploadProfilePicture(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Profile picture must be smaller than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, profilePicture: reader.result }));
    reader.readAsDataURL(file);
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

  if (!profile && !isAdmin) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <p className="page-kicker">Workspace</p>
        <h2 className="page-title">Settings</h2>
      </div>

      {/* User Profile Settings */}
      {profile && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Profile Settings</h3>
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="" className="h-16 w-16 rounded object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded bg-slate-900 text-lg font-bold text-white dark:bg-cyan-500">
                  {formData.name.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'}
                </div>
              )}
              <div>
                <label className="btn-secondary cursor-pointer">
                  <Upload size={16} />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={uploadProfilePicture} className="sr-only" />
                </label>
                {formData.profilePicture && (
                  <button type="button" onClick={() => setFormData({ ...formData, profilePicture: '' })} className="btn-secondary ml-2">
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input className="field w-full" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-3 rounded border border-slate-200 p-4 dark:border-slate-800">
              <label className="flex items-center justify-between gap-4 text-sm font-medium">
                <span>In-app notification sound</span>
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                  className="h-5 w-5 accent-cyan-600"
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm font-medium">
                <span>Browser notifications</span>
                <input
                  type="checkbox"
                  checked={formData.browserNotificationsEnabled}
                  onChange={(e) => setFormData({ ...formData, browserNotificationsEnabled: e.target.checked })}
                  className="h-5 w-5 accent-cyan-600"
                />
              </label>
            </div>
            {message && <p className={`text-sm rounded p-3 ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}
            <button disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      )}

      {/* Admin User Management */}
      {isAdmin && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold">User Management</h3>
          {adminLoading ? (
            <Loader />
          ) : adminUsers.length === 0 ? (
            <p className="text-sm text-slate-500">No other users.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u._id} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="py-3 px-4">{u.name}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">
                        <select value={u.role} onChange={(e) => updateUserRole(u._id, e.target.value)} className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => deleteUser(u._id)} className="icon-button h-9 w-9 border-transparent bg-transparent text-rose-600 hover:border-rose-200 hover:text-rose-700 dark:bg-transparent dark:hover:border-rose-900" aria-label="Delete user">
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
      )}
    </div>
  );
}
