import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import IssueCard from '../components/shared/IssueCard';
import { Plus, Search, Filter, TrendingUp, MapPin, Star, AlertTriangle, User } from 'lucide-react';

const TABS = ['nearby', 'recent', 'voted', 'priority', 'mine'];

export default function DashboardPage() {
  const { user, token, t } = useApp();
  const [activeTab, setActiveTab] = useState('nearby');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const tabConfig = [
    { key: 'nearby', label: t('nearbyIssues'), icon: MapPin },
    { key: 'recent', label: t('recentIssues'), icon: TrendingUp },
    { key: 'voted', label: t('mostVoted'), icon: Star },
    { key: 'priority', label: t('highPriority'), icon: AlertTriangle },
    { key: 'mine', label: t('myIssues'), icon: User },
  ];

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'nearby') res = await api.getNearby(token);
      else if (activeTab === 'mine') res = await api.getMyIssues(token);
      else {
        const params = { sort: activeTab === 'voted' ? 'votes' : 'recent' };
        if (activeTab === 'priority') params.severity = 'high';
        if (filterCategory) params.category = filterCategory;
        if (filterStatus) params.status = filterStatus;
        if (search) params.search = search;
        res = await api.getIssues(token, params);
      }
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : data.issues || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchIssues(); }, [activeTab, filterCategory, filterStatus]);

  const handleSearch = (e) => { e.preventDefault(); fetchIssues(); };

  const handleVoteUpdate = (id, voteData) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, vote_count: voteData.vote_count, user_voted: voteData.voted } : i));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {t('welcome')}, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            <MapPin size={13} className="inline mr-1" />
            {user?.area_name}, {user?.city}
          </p>
        </div>
        <Link to="/raise-issue" className="flex items-center gap-2 px-4 py-2.5 bg-civic-500 hover:bg-civic-600 text-white font-semibold rounded-xl transition-all shadow-md text-sm flex-shrink-0">
          <Plus size={18} /> {t('raiseIssue')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('totalReports'), value: user?.total_reports || 0, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: t('activeReports'), value: user?.active_reports || 0, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
          { label: t('resolvedReports'), value: user?.resolved_reports || 0, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color} border border-current/10`}>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-xs opacity-80 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-civic-500">
          <option value="">All Categories</option>
          {['Road Issue', 'Water Issue', 'Sanitation Issue', 'Electrical Issue', 'Safety Issue', 'Environmental Issue'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-civic-500">
          <option value="">All Status</option>
          {['pending', 'under_review', 'in_progress', 'resolved', 'rejected'].map(s => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <button type="submit" className="px-4 py-2.5 bg-civic-500 text-white rounded-xl text-sm font-medium hover:bg-civic-600 transition-colors">
          <Search size={16} />
        </button>
      </form>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabConfig.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === key ? 'bg-civic-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-civic-500'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Issues Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : issues.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map(issue => <IssueCard key={issue.id} issue={issue} onVoteUpdate={handleVoteUpdate} />)}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <span className="text-5xl block mb-4">🏙️</span>
          <h3 className="font-display font-bold text-gray-900 dark:text-white mb-2">No issues found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Be the first to report a civic issue in your area.</p>
          <Link to="/raise-issue" className="inline-flex items-center gap-2 px-4 py-2 bg-civic-500 text-white rounded-xl text-sm font-medium">
            <Plus size={16} /> {t('raiseIssue')}
          </Link>
        </div>
      )}
    </div>
  );
}
