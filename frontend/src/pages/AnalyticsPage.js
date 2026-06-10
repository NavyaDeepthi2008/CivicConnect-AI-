import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Loader, MapPin, BarChart3 } from 'lucide-react';

const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#14b8a6'];

const STATUS_COLORS = {
  pending: '#f59e0b', under_review: '#3b82f6', in_progress: '#8b5cf6',
  resolved: '#22c55e', rejected: '#ef4444'
};

export default function AnalyticsPage() {
  const { token, t } = useApp();
  const [overview, setOverview] = useState(null);
  const [areaRisk, setAreaRisk] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalytics(token).then(r => r.json()),
      api.getAreaRisk(token).then(r => r.json()),
      api.getTrends(token).then(r => r.json()),
    ]).then(([ov, ar, tr]) => {
      setOverview(ov);
      setAreaRisk(ar);
      setTrends(tr);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={32} className="animate-spin text-civic-500" />
    </div>
  );

  const statusData = overview?.by_status?.map(s => ({
    name: s.status.replace('_', ' '),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6b7280'
  })) || [];

  const categoryData = overview?.by_category?.map((c, i) => ({
    name: c.category?.replace(' Issue', '') || 'Other',
    count: c.count,
    fill: COLORS[i % COLORS.length]
  })) || [];

  const monthlyData = overview?.monthly_trend || [];

  const getTrendIcon = (change) => {
    if (change > 5) return <TrendingUp size={14} className="text-red-500" />;
    if (change < -5) return <TrendingDown size={14} className="text-green-500" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-civic-500" /> {t('analytics')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Civic issue insights and trend analysis</p>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">📈 Monthly Issue Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3}
              dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">🗂️ Issues by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">📊 Status Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={true}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">📡 AI Trend Analysis</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map(trend => (
            <div key={trend.category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{trend.category}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getTrendIcon(trend.change_percent)}
                  <span className={`text-xs font-bold ${trend.change_percent > 5 ? 'text-red-500' : trend.change_percent < -5 ? 'text-green-500' : 'text-gray-500'}`}>
                    {trend.change_percent > 0 ? '+' : ''}{trend.change_percent}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This month: <strong className="text-gray-800 dark:text-gray-200">{trend.current_month}</strong> reports
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Last month: {trend.previous_month}
              </p>
              {Math.abs(trend.change_percent) > 15 && (
                <p className="text-xs mt-2 font-semibold text-amber-600 dark:text-amber-400">
                  ⚠️ {trend.category} {trend.change_percent > 0 ? 'increased' : 'decreased'} by {Math.abs(trend.change_percent)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Area Risk */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">🗺️ Area Risk Scores</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Areas with highest civic issue burden — prioritize resources here.</p>
        <div className="space-y-3">
          {areaRisk.slice(0, 8).map((area, i) => (
            <div key={area.area} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-civic-100 dark:bg-civic-900/30 text-civic-600 dark:text-civic-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate flex items-center gap-1">
                    <MapPin size={12} /> {area.area}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">{area.issue_count} issues</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${area.risk_score > 60 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : area.risk_score > 30 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                      Risk: {area.risk_score}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div className={`h-full rounded-full transition-all ${area.risk_score > 60 ? 'bg-red-500' : area.risk_score > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(area.risk_score, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
          {areaRisk.length === 0 && (
            <p className="text-center text-gray-400 py-6">No area data available yet</p>
          )}
        </div>
      </div>

      {/* By City */}
      {overview?.by_city?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">🏙️ Issues by City</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={overview.by_city}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="city" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
