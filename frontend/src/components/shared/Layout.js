import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, AlertTriangle, Map, User, BarChart3,
  Moon, Sun, Globe, Bell, LogOut, Menu, X, MessageCircle,
  ChevronRight, Shield
} from 'lucide-react';
import Chatbot from './Chatbot';

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' }, { code: 'bn', label: 'বাংলা' }
];

export default function Layout({ children }) {
  const { user, logout, darkMode, setDarkMode, language, setLanguage, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/raise-issue', icon: AlertTriangle, label: t('raiseIssue') },
    { path: '/map', icon: Map, label: t('map') },
    { path: '/analytics', icon: BarChart3, label: t('analytics') },
    { path: '/profile', icon: User, label: t('profile') },
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: Shield, label: t('admin') }] : [])
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-civic-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">CC</span>
            </div>
            <span className="font-display font-bold text-gray-900 dark:text-white text-sm">CivicConnect</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-civic-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                <Icon size={18} />
                <span>{label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-civic-100 dark:bg-civic-900 flex items-center justify-center">
              <span className="text-civic-600 dark:text-civic-300 font-bold text-sm">
                {user?.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.city}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="relative">
              <button onClick={() => setShowLang(!showLang)} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 text-sm">
                <Globe size={16} /> <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === language)?.label}</span>
              </button>
              {showLang && (
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 min-w-[140px]">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setShowLang(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === l.code ? 'text-civic-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Dark mode */}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Chatbot FAB */}
      <button onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-civic-500 hover:bg-civic-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
        <MessageCircle size={24} />
      </button>
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  );
}
