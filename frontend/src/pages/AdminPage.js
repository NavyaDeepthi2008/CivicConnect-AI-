import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Shield, Users, AlertTriangle, CheckCircle, Clock,
  Search, Filter, Bell, Eye, ChevronDown, Loader, X
} from 'lucide-react';

const STATUSES = ['pending', 'under_review', 'in_progress', 'resolved', 'rejected'];

const PRIORITY_COLORS = {
  'High': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  'Medium': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  'Low': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export default function AdminPage() {
  const { token, t } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [activeTab, setActiveTab] = useState('issues');
  const [updatingId, setUpdatingId] = useState(null);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchIssues();
    fetchNotifications();
  }, []);

  useEffect(() => { fetchIssues(); }, [filterStatus, filterPriority]);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats(token);
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (search) params.search = search;
      const res = await api.getAllIssues(token, params);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications(token);
      const data = await res.json();
      setNotifications(data);
    } catch { }
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    setUpdatingId(issueId);
    try {
      const res = await api.updateStatus(token, issueId, newStatus);
      if (res.ok) {
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
        fetchStats();
      }
    } catch { }
    setUpdatingId(null);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const statCards = stats ? [
    { label: 'Total Issues', value: stats.total_issues, icon: '📋', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    { label: 'In Progress', value: stats.in_progress, icon: '🔧', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
    { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    { label: 'High Priority', value: stats.high_priority, icon: '🚨', color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
    { label: 'Total Citizens', value: stats.total_users, icon: '👥', color: 'bg-civic-50 dark:bg-civic-900/20 text-civic-600 dark:text-civic-400' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield size={24} className="text-civic-500" /> Municipal Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and resolve civic issues</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)}
            className="relative p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-civic-500 transition-colors">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                <button onClick={() => setShowNotif(false)}><X size={16} className="text-gray-500" /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 15).map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-sm ${!n.is_read ? 'bg-civic-50 dark:bg-civic-900/10' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">{n.type === 'high_priority' ? '🚨' : n.type === 'popular_issue' ? '🔥' : '📋'}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center py-8 text-gray-400 text-sm">No notifications yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color} border border-current/10 text-center`}>
            <span className="text-2xl block mb-1">{icon}</span>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-xs opacity-70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Resolution Rate */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Resolution Rate</span>
            <span className="font-display font-bold text-civic-500">{stats.resolution_rate}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            <div className="h-full bg-gradient-to-r from-civic-400 to-civic-600 rounded-full transition-all"
              style={{ width: `${stats.resolution_rate}%` }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchIssues()}
            placeholder="Search issues..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-civic-500">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-civic-500">
          <option value="">All Priority</option>
          {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={fetchIssues} className="px-4 py-2.5 bg-civic-500 text-white rounded-xl text-sm font-medium hover:bg-civic-600 transition-colors">
          Search
        </button>
      </div>

      {/* Issues Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Issue</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Votes</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">No issues found</td>
                </tr>
              ) : issues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="max-w-[200px]">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{issue.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{issue.area_name}, {issue.city}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      {issue.ai_category || issue.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {issue.ai_priority && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_COLORS[issue.ai_priority] || ''}`}>
                        {issue.ai_priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-600 dark:text-gray-400">👍 {issue.vote_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full status-${issue.status}`}>
                      {t(issue.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/issues/${issue.id}`)}
                        className="p-1.5 text-civic-500 hover:bg-civic-50 dark:hover:bg-civic-900/20 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                      <select
                        value={issue.status}
                        onChange={e => handleStatusUpdate(issue.id, e.target.value)}
                        disabled={updatingId === issue.id}
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-civic-500 cursor-pointer disabled:opacity-60">
                        {STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}
                      </select>
                      {updatingId === issue.id && <Loader size={14} className="animate-spin text-civic-500" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
