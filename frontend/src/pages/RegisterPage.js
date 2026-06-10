import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api, getLocation } from '../utils/api';
import { Eye, EyeOff, AlertCircle, MapPin, CheckCircle, UserPlus, Loader } from 'lucide-react';

export default function RegisterPage() {
  const { login, t, darkMode, setLocation: setCtxLocation } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1); // 1=location, 2=form

  const handleGetLocation = async () => {
    setLocLoading(true); setLocError('');
    try {
      const loc = await getLocation();
      setLocation(loc);
      setCtxLocation(loc);
      setStep(2);
    } catch (e) {
      setLocError(`Location error: ${e}. Please enable location and try again.`);
    }
    setLocLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) { setError('Location is required.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.register({
        ...form, latitude: location.lat, longitude: location.lng,
        area_name: location.area, city: location.city, state: location.state
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      login(data.token, data.user);
      navigate('/dashboard');
    } catch { setError('Connection error. Please try again.'); setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-civic-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-civic-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-display font-bold">CC</span>
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">{t('appName')}</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{t('register')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Join thousands of active citizens</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {step === 1 ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-civic-100 dark:bg-civic-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin size={36} className="text-civic-500" />
              </div>
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">{t('allowLocation')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">{t('locationRequired')}</p>
              {locError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-4 text-sm text-left">
                  <AlertCircle size={16} className="flex-shrink-0" /> {locError}
                </div>
              )}
              <button onClick={handleGetLocation} disabled={locLoading}
                className="w-full py-3 bg-civic-500 hover:bg-civic-600 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                {locLoading ? <><Loader size={18} className="animate-spin" /> {t('detectingLocation')}</> : <><MapPin size={18} /> {t('grantAccess')}</>}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg mb-5 text-sm">
                <CheckCircle size={16} />
                <div>
                  <p className="font-semibold">{t('locationDetected')}</p>
                  <p className="text-xs">{location?.area}, {location?.city}, {location?.state}</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-4 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: 'full_name', label: t('name'), type: 'text', placeholder: 'John Doe' },
                  { key: 'email', label: t('email'), type: 'email', placeholder: 'you@example.com' },
                  { key: 'phone', label: t('phone'), type: 'tel', placeholder: '9876543210' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <input type={type} required value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-civic-500 text-sm transition-all" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-civic-500 text-sm pr-10 transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirmPassword')}</label>
                  <input type="password" required value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-civic-500 text-sm transition-all" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-civic-500 hover:bg-civic-600 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" /> : <UserPlus size={18} />}
                  {loading ? 'Creating Account...' : t('register')}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-civic-500 font-semibold hover:underline">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
