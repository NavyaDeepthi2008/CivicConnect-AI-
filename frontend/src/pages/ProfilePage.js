import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { User, Mail, Phone, MapPin, CheckCircle, AlertTriangle, Edit3, Save, X, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser, token, t } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await api.updateProfile
        ? await fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        })
        : null;
      if (res && res.ok) {
        const data = await res.json();
        setUser(data);
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { setError('Failed to save changes'); }
    setSaving(false);
  };

  const statsData = [
    { label: t('totalReports'), value: user?.total_reports || 0, icon: '📋', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { label: t('activeReports'), value: user?.active_reports || 0, icon: '⏳', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    { label: t('resolvedReports'), value: user?.resolved_reports || 0, icon: '✅', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  ];

  const resolutionRate = user?.total_reports > 0
    ? Math.round((user.resolved_reports / user.total_reports) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('profile')}</h1>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-civic-500 to-civic-700 relative">
          {user?.role === 'admin' && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
              <Shield size={12} /> Admin
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-700 shadow-lg flex items-center justify-center">
              <span className="font-display font-bold text-3xl text-civic-500">
                {user?.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${editing ? 'bg-civic-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {editing ? (saving ? '...' : <><Save size={15} /> Save</>) : <><Edit3 size={15} /> Edit</>}
            </button>
          </div>

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg mb-4 text-sm">
              <CheckCircle size={16} /> Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-4 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('name')}</label>
              {editing ? (
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
              ) : (
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                  <User size={16} className="text-gray-400" /> {user?.full_name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('email')}</label>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <Mail size={16} className="text-gray-400" /> {user?.email}
                <span className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">Verified</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('phone')}</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
              ) : (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <Phone size={16} className="text-gray-400" /> {user?.phone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Area</label>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <MapPin size={16} className="text-gray-400" />
                {user?.area_name && `${user.area_name}, `}{user?.city}, {user?.state}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Member Since</label>
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </div>
            </div>

            {editing && (
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                <X size={15} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statsData.map(({ label, value, icon, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color} border border-current/10 text-center`}>
            <span className="text-2xl block mb-1">{icon}</span>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-xs opacity-70 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Resolution Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">Resolution Rate</h3>
          <span className="font-display font-bold text-2xl text-civic-500">{resolutionRate}%</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-civic-400 to-civic-600 rounded-full transition-all duration-1000"
            style={{ width: `${resolutionRate}%` }} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {user?.resolved_reports || 0} of {user?.total_reports || 0} issues resolved
        </p>
      </div>

      {/* Civic Contribution Badge */}
      {(user?.total_reports || 0) >= 1 && (
        <div className="bg-gradient-to-r from-civic-500 to-civic-700 rounded-2xl p-6 text-white text-center">
          <span className="text-4xl block mb-3">🏆</span>
          <h3 className="font-display font-bold text-xl mb-1">Active Citizen</h3>
          <p className="text-civic-100 text-sm">Thank you for making your community better!</p>
        </div>
      )}
    </div>
  );
}
