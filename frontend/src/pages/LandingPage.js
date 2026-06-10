import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, AlertTriangle, Users, BarChart3, CheckCircle, Globe, Moon, Sun, ArrowRight, Shield, Zap, Heart } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' }, { code: 'bn', label: 'বাংলা' }
];

export default function LandingPage() {
  const { darkMode, setDarkMode, language, setLanguage, t } = useApp();
  const [showLang, setShowLang] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-civic-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-display font-bold">CC</span>
              </div>
              <span className="font-display font-bold text-lg text-gray-900 dark:text-white">{t('appName')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowLang(!showLang)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-civic-500 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Globe size={14} /> {LANGUAGES.find(l => l.code === language)?.label}
                </button>
                {showLang && (
                  <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 min-w-[140px]">
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => { setLanguage(l.code); setShowLang(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === l.code ? 'text-civic-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-civic-500 transition-colors">{t('login')}</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-civic-500 hover:bg-civic-600 text-white rounded-xl transition-colors shadow-md">{t('register')}</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden min-h-screen flex items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-civic-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-civic-950 -z-10" />
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-20 left-10 w-64 h-64 bg-civic-200 dark:bg-civic-800 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-100 dark:bg-blue-900 rounded-full blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-4 py-24 grid lg:grid-cols-2 gap-12 items-center w-full">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-civic-50 dark:bg-civic-900/30 text-civic-600 dark:text-civic-400 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-civic-200 dark:border-civic-800">
                <Zap size={14} /> AI-Powered Civic Platform
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
                {t('heroTitle').split('.').map((part, i) => (
                  <span key={i}>{part}{i < 2 ? <span className="text-civic-500">.</span> : ''} </span>
                ))}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{t('heroSubtitle')}</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-civic-500 hover:bg-civic-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-civic-500/30 hover:-translate-y-0.5">
                  {t('getStarted')} <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-civic-500 transition-all">
                  {t('login')}
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[
                  { n: '10K+', label: t('totalIssues') },
                  { n: '50K+', label: t('citizensHelped') },
                  { n: '8K+', label: t('issuesResolved') },
                  { n: '120+', label: t('citiesCovered') }
                ].map(({ n, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-display font-bold text-2xl text-civic-500">{n}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-xl">🛣️</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Pothole on MG Road</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reported 2 hours ago</p>
                  </div>
                  <span className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold px-2 py-1 rounded-full">High</span>
                </div>
                <div className="h-32 bg-gradient-to-br from-civic-100 to-blue-100 dark:from-civic-900/30 dark:to-blue-900/30 rounded-xl mb-4 flex items-center justify-center">
                  <MapPin size={32} className="text-civic-500" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Users size={14} /> 47 supporters</span>
                  <span className="flex items-center gap-1 text-yellow-500">⚡ Under Review</span>
                </div>
                <div className="mt-3 p-3 bg-civic-50 dark:bg-civic-900/20 rounded-lg border border-civic-100 dark:border-civic-800">
                  <p className="text-xs text-civic-700 dark:text-civic-300">🤖 AI Assistant: "Consider mentioning exact pothole dimensions and traffic impact for faster resolution."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('features')}</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Advanced AI-powered tools to make civic issue reporting smarter and more effective.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '🤖', title: 'AI Writing Assistant', desc: 'Get real-time suggestions to improve your complaint description and ensure all important details are included.' },
                { icon: '🎯', title: 'Smart Classification', desc: 'AI automatically categorizes issues and assigns priority levels based on content analysis.' },
                { icon: '🔍', title: 'Duplicate Detection', desc: 'Prevents duplicate reports by detecting similar nearby issues and suggesting to support existing ones.' },
                { icon: '🗺️', title: 'Interactive Map', desc: 'Visualize all reported issues on an interactive map with filtering and clustering capabilities.' },
                { icon: '📊', title: 'Data Analytics', desc: 'Comprehensive dashboards with trend analysis, area risk scores, and monthly reports.' },
                { icon: '🏛️', title: 'Municipal Dashboard', desc: 'Dedicated admin panel for municipal officers to manage, prioritize, and resolve civic issues.' },
              ].map(f => (
                <div key={f.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 card-hover">
                  <span className="text-3xl mb-4 block">{f.icon}</span>
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('howItWorks')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', icon: '📍', title: t('step1'), desc: 'App detects your location automatically with reverse geocoding.' },
                { step: '02', icon: '📝', title: t('step2'), desc: 'Fill in the issue details with AI assistance and upload photos.' },
                { step: '03', icon: '👍', title: t('step3'), desc: 'Nearby citizens vote to increase visibility and priority.' },
                { step: '04', icon: '✅', title: t('step4'), desc: 'Municipal team receives alert and works to resolve the issue.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="relative">
                  <div className="bg-civic-50 dark:bg-civic-900/20 rounded-2xl p-6 border border-civic-100 dark:border-civic-800 h-full">
                    <span className="text-5xl font-display font-bold text-civic-200 dark:text-civic-800 block mb-3">{step}</span>
                    <span className="text-3xl block mb-3">{icon}</span>
                    <h3 className="font-display font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Civic Awareness */}
        <section className="py-20 bg-gradient-to-br from-civic-600 to-civic-800 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Heart size={40} className="mx-auto mb-4 text-civic-200" />
            <h2 className="font-display text-4xl font-bold mb-4">Your Voice Matters</h2>
            <p className="text-civic-100 max-w-2xl mx-auto mb-8 text-lg leading-relaxed">
              Every civic issue reported is a step toward a better community. Together, citizens and authorities can build safer, cleaner, and more livable cities. Join thousands of active citizens making a difference today.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-civic-600 font-bold rounded-xl hover:bg-civic-50 transition-colors shadow-lg">
              {t('getStarted')} <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('contact')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Have questions? Reach out to us.</p>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: '📧', label: 'Email', value: 'support@civicconnect.gov.in' },
                { icon: '📞', label: 'Phone', value: '1800-CIVIC-AI (Toll Free)' },
                { icon: '🏛️', label: 'Office', value: 'Municipal Corporation Building, Vijayawada' }
              ].map(c => (
                <div key={c.label} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 min-w-[200px]">
                  <span className="text-3xl block mb-2">{c.icon}</span>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">{c.label}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-gray-900 dark:bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 bg-civic-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">CC</span>
              </div>
              <span className="font-display font-bold">{t('appName')}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('footer')}</p>
            <p className="text-gray-600 text-xs mt-2">© 2024 CivicConnect AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
