import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { MapPin, Filter, Layers, X } from 'lucide-react';

const CATEGORY_COLORS = {
  'Road Issue': '#ef4444',
  'Water Issue': '#3b82f6',
  'Sanitation Issue': '#f59e0b',
  'Electrical Issue': '#eab308',
  'Safety Issue': '#8b5cf6',
  'Environmental Issue': '#22c55e',
  'General Issue': '#6b7280',
};

const CATEGORY_ICONS_MAP = {
  'Road Issue': '🛣️', 'Water Issue': '💧', 'Sanitation Issue': '🗑️',
  'Electrical Issue': '💡', 'Safety Issue': '🚨',
  'Environmental Issue': '🌿', 'General Issue': '📋'
};

export default function MapPage() {
  const { token, user, t } = useApp();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState(null);

  useEffect(() => {
    // Dynamic import for Leaflet to avoid SSR issues
    Promise.all([
      import('react-leaflet'),
      import('leaflet')
    ]).then(([rl, L]) => {
      // Fix leaflet icon issue
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setLeafletComponents(rl);
      setMapReady(true);
    });
  }, []);

  useEffect(() => { fetchIssues(); }, [filterCategory, filterStatus]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = { per_page: 100 };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const res = await api.getIssues(token, params);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const center = user?.latitude
    ? [user.latitude, user.longitude]
    : [17.3850, 78.4867]; // Default: Hyderabad

  const filtered = issues.filter(i => {
    if (filterCategory && (i.ai_category || i.category) !== filterCategory) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return true;
  });

  const createCustomIcon = (issue) => {
    if (!LeafletComponents) return null;
    const L = require('leaflet');
    const cat = issue.ai_category || issue.category;
    const color = CATEGORY_COLORS[cat] || '#6b7280';
    const emoji = CATEGORY_ICONS_MAP[cat] || '📋';
    return L.divIcon({
      className: '',
      html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:14px;">${emoji}</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  };

  return (
    <div className="max-w-full space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('map')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{filtered.length} issues shown</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-civic-500">
            <option value="">All Categories</option>
            {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-civic-500">
            <option value="">All Status</option>
            {['pending', 'under_review', 'in_progress', 'resolved', 'rejected'].map(s => (
              <option key={s} value={s}>{t(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg" style={{ height: '65vh' }}>
        {mapReady && LeafletComponents ? (
          <LeafletComponents.MapContainer
            center={center} zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0">
            <LeafletComponents.TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            {filtered.map(issue => (
              issue.latitude && issue.longitude ? (
                <LeafletComponents.Marker
                  key={issue.id}
                  position={[issue.latitude, issue.longitude]}
                  icon={createCustomIcon(issue)}
                  eventHandlers={{ click: () => setSelected(issue) }}>
                  <LeafletComponents.Popup>
                    <div className="p-1 min-w-[180px]">
                      <p className="font-bold text-sm text-gray-900 mb-1">{issue.title}</p>
                      <p className="text-xs text-gray-600 mb-2">{issue.ai_category || issue.category}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full status-${issue.status}`}>
                          {issue.status}
                        </span>
                        <span className="text-xs text-gray-500">👍 {issue.vote_count}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="mt-2 w-full px-2 py-1.5 bg-civic-500 text-white text-xs font-semibold rounded-lg hover:bg-civic-600 transition-colors">
                        View Details →
                      </button>
                    </div>
                  </LeafletComponents.Popup>
                </LeafletComponents.Marker>
              ) : null
            ))}
            {/* User Location */}
            {user?.latitude && (
              <LeafletComponents.CircleMarker
                center={[user.latitude, user.longitude]}
                radius={10} color="#0ea5e9" fillColor="#0ea5e9" fillOpacity={0.3}>
                <LeafletComponents.Popup>Your Location</LeafletComponents.Popup>
              </LeafletComponents.CircleMarker>
            )}
          </LeafletComponents.MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <MapPin size={40} className="text-civic-500 mx-auto mb-3 animate-bounce" />
              <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Layers size={12} /> Legend
          </p>
          <div className="space-y-1">
            {Object.entries(CATEGORY_ICONS_MAP).slice(0, 5).map(([cat, emoji]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-xs">{emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Issue Count Badge */}
        <div className="absolute top-4 right-4 z-10 bg-civic-500 text-white rounded-xl px-3 py-1.5 shadow-lg text-sm font-semibold">
          {filtered.length} Issues
        </div>
      </div>

      {/* Selected Issue Panel */}
      {selected && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex gap-4 items-start animate-slide-up">
          <span className="text-3xl">{CATEGORY_ICONS_MAP[selected.ai_category || selected.category] || '📋'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-gray-900 dark:text-white truncate">{selected.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{selected.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full status-${selected.status}`}>{selected.status}</span>
              <span className="text-xs text-gray-500">👍 {selected.vote_count}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} />{selected.area_name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={() => navigate(`/issues/${selected.id}`)}
              className="px-3 py-1.5 bg-civic-500 text-white text-xs font-semibold rounded-lg hover:bg-civic-600 transition-colors">
              View →
            </button>
            <button onClick={() => setSelected(null)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <X size={12} className="mx-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
