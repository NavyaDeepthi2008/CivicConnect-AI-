import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api, getLocation } from '../utils/api';
import {
  Upload, MapPin, Lightbulb, AlertTriangle, CheckCircle,
  X, Loader, Sparkles, RefreshCw, Image as ImageIcon
} from 'lucide-react';

const CATEGORIES = [
  { value: 'Road Issue', label: '🛣️ Road / Pothole', icon: '🛣️' },
  { value: 'Water Issue', label: '💧 Water / Drainage', icon: '💧' },
  { value: 'Sanitation Issue', label: '🗑️ Garbage / Sanitation', icon: '🗑️' },
  { value: 'Electrical Issue', label: '💡 Street Light / Electric', icon: '💡' },
  { value: 'Safety Issue', label: '🚨 Safety / Crime', icon: '🚨' },
  { value: 'Environmental Issue', label: '🌿 Pollution / Environment', icon: '🌿' },
  { value: 'Traffic Issue', label: '🚦 Traffic', icon: '🚦' },
  { value: 'General Issue', label: '📋 Other', icon: '📋' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', color: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400', dot: 'bg-green-400' },
  { value: 'medium', label: 'Medium', color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400' },
  { value: 'high', label: 'High', color: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400', dot: 'bg-red-400' },
];

export default function RaiseIssuePage() {
  const { token, user, t } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category: '', severity: 'medium',
    latitude: '', longitude: '', area_name: '', city: '', state: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // AI states
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCategory, setAiCategory] = useState(null);
  const [aiPriority, setAiPriority] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const descTimer = useRef(null);
  const titleTimer = useRef(null);
  const fileInputRef = useRef(null);

  // Pre-fill location from user profile
  useEffect(() => {
    if (user?.latitude) {
      setForm(f => ({
        ...f,
        latitude: user.latitude, longitude: user.longitude,
        area_name: user.area_name || '', city: user.city || '', state: user.state || ''
      }));
    }
  }, [user]);

  // AI writing assist on description change
  useEffect(() => {
    if (descTimer.current) clearTimeout(descTimer.current);
    if (form.description.length > 15) {
      descTimer.current = setTimeout(async () => {
        setAiLoading(true);
        try {
          const res = await api.writingAssist(token, form.description);
          const data = await res.json();
          setAiSuggestions(data);
        } catch { }
        setAiLoading(false);
      }, 1000);
    } else {
      setAiSuggestions(null);
    }
    return () => clearTimeout(descTimer.current);
  }, [form.description]);

  // AI classify on title change
  useEffect(() => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (form.title.length > 5) {
      titleTimer.current = setTimeout(async () => {
        try {
          const res = await api.classifyIssue(token, { title: form.title, description: form.description });
          const data = await res.json();
          setAiCategory(data);
          if (!form.category) setForm(f => ({ ...f, category: data.category }));
        } catch { }
      }, 800);
    }
    return () => clearTimeout(titleTimer.current);
  }, [form.title]);

  // Duplicate check
  useEffect(() => {
    if (form.title.length > 10 && form.latitude) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDuplicate(token, {
            title: form.title, latitude: form.latitude, longitude: form.longitude
          });
          const data = await res.json();
          if (data.duplicate) setDuplicate(data.existing_issue);
          else setDuplicate(null);
        } catch { }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [form.title, form.latitude]);

  // AI priority based on severity + category
  useEffect(() => {
    if (form.severity === 'high') setAiPriority('High');
    else if (form.severity === 'low') setAiPriority('Low');
    else setAiPriority('Medium');
  }, [form.severity]);

  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const loc = await getLocation();
      setForm(f => ({ ...f, latitude: loc.lat, longitude: loc.lng, area_name: loc.area, city: loc.city, state: loc.state }));
    } catch (e) {
      setError('Location detection failed: ' + e);
    }
    setLocLoading(false);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...images, ...files].slice(0, 5);
    setImages(newFiles);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImage = (idx) => {
    const newFiles = images.filter((_, i) => i !== idx);
    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImages(newFiles); setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { setError('Title and description are required.'); return; }
    if (!form.latitude) { setError('Please detect your location first.'); return; }
    setError(''); setLoading(true);

    const formData = new FormData();
    Object.keys(form).forEach(k => formData.append(k, form[k]));
    images.forEach(img => formData.append('images', img));

    try {
      const res = await api.createIssue(token, formData);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit issue'); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => navigate(`/issues/${data.id}`), 1500);
    } catch { setError('Connection error. Please try again.'); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Issue Submitted!</h2>
        <p className="text-gray-500 dark:text-gray-400">Redirecting to your issue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('raiseIssue')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Report a civic issue in your area. AI will assist you.</p>
      </div>

      {/* Duplicate Warning */}
      {duplicate && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex gap-3 animate-fade-in">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{t('alreadyExists')}</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">"{duplicate.title}" – {duplicate.vote_count} supporters</p>
            <p className="text-amber-600 dark:text-amber-500 text-xs mt-1">{t('supportInstead')}</p>
            <button onClick={() => navigate(`/issues/${duplicate.id}`)}
              className="mt-2 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors">
              View Existing Issue
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg">Issue Details</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('issueTitle')} *</label>
            <input type="text" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Large pothole near city bus stop on MG Road"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500 transition-all" />

            {/* AI Category Badge */}
            {aiCategory && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('aiClassified')}:</span>
                <span className="inline-flex items-center gap-1 bg-civic-50 dark:bg-civic-900/30 text-civic-600 dark:text-civic-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-civic-200 dark:border-civic-800">
                  {aiCategory.icon} {aiCategory.category}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')} *</label>
            <textarea rows={5} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the issue in detail. Mention exact location, duration, and any safety concerns..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500 resize-none transition-all" />

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">{form.description.length} characters</span>
              {aiLoading && (
                <span className="flex items-center gap-1 text-xs text-civic-500">
                  <Sparkles size={12} className="animate-spin" /> AI analyzing...
                </span>
              )}
            </div>
          </div>

          {/* AI Suggestions Panel */}
          {aiSuggestions && (aiSuggestions.suggestions?.length > 0 || aiSuggestions.missing_info?.length > 0) && (
            <div className="bg-gradient-to-br from-civic-50 to-blue-50 dark:from-civic-900/20 dark:to-blue-900/20 border border-civic-200 dark:border-civic-800 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-civic-500" />
                <span className="font-semibold text-civic-700 dark:text-civic-300 text-sm">{t('aiSuggestions')}</span>
              </div>
              {aiSuggestions.missing_info?.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700 dark:text-gray-300">{tip}</p>
                </div>
              ))}
              {aiSuggestions.suggestions?.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <Lightbulb size={13} className="text-civic-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700 dark:text-gray-300">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category & Severity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg">Classification</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('category')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${form.category === cat.value ? 'border-civic-500 bg-civic-50 dark:bg-civic-900/30 text-civic-700 dark:text-civic-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-civic-300'}`}>
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  {cat.label.replace(cat.icon + ' ', '')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('severity')}
              {aiPriority && (
                <span className={`ml-2 text-xs font-bold ${aiPriority === 'High' ? 'text-red-500' : aiPriority === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                  ⚡ AI: {aiPriority} Priority
                </span>
              )}
            </label>
            <div className="flex gap-3">
              {SEVERITIES.map(sev => (
                <button key={sev.value} type="button"
                  onClick={() => setForm({ ...form, severity: sev.value })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.severity === sev.value ? sev.color + ' border-current' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${sev.dot}`} /> {sev.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg">{t('location')}</h2>
            <button type="button" onClick={detectLocation} disabled={locLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-civic-50 dark:bg-civic-900/30 text-civic-600 dark:text-civic-400 border border-civic-200 dark:border-civic-800 rounded-lg text-sm font-medium hover:bg-civic-100 transition-colors disabled:opacity-60">
              {locLoading ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Detect Location
            </button>
          </div>

          {form.latitude ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <MapPin size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {form.area_name || 'Unknown Area'}, {form.city}, {form.state}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                  {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-600">
              <MapPin size={24} className="mx-auto mb-2 opacity-40" />
              Click "Detect Location" to auto-fill your location
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Area / Locality</label>
              <input type="text" value={form.area_name}
                onChange={e => setForm({ ...form, area_name: e.target.value })}
                placeholder="Your area name"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
              <input type="text" value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg">Evidence Photos</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Upload up to 5 photos of the issue (JPG, PNG, WebP)</p>

          <div
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-civic-400 hover:bg-civic-50 dark:hover:bg-civic-900/10 transition-all">
            <Upload size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('uploadImages')}</p>
            <p className="text-xs text-gray-400 mt-1">Click to browse files</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current.click()}
                  className="aspect-square border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 hover:border-civic-400 transition-colors">
                  <ImageIcon size={20} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {t('cancel')}
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-civic-500 hover:bg-civic-600 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><Loader size={18} className="animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle size={18} /> {t('submit')} Issue</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
