import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  ThumbsUp, MessageSquare, MapPin, Calendar, User,
  ArrowLeft, Send, Loader, Clock, Tag, AlertCircle
} from 'lucide-react';

const STATUS_STEPS = ['pending', 'under_review', 'in_progress', 'resolved'];

const CATEGORY_ICONS = {
  'Road Issue': '🛣️', 'Water Issue': '💧', 'Sanitation Issue': '🗑️',
  'Electrical Issue': '💡', 'Safety Issue': '🚨', 'Environmental Issue': '🌿', 'General Issue': '📋'
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const { token, user, t } = useApp();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => { fetchIssue(); }, [id]);

  const fetchIssue = async () => {
    setLoading(true);
    try {
      const res = await api.getIssue(token, id);
      const data = await res.json();
      setIssue(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await api.voteIssue(token, id);
      const data = await res.json();
      setIssue(prev => ({ ...prev, vote_count: data.vote_count, user_voted: data.voted }));
    } catch { }
    setVoting(false);
  };

  const handleComment = async () => {
    if (!comment.trim() || commenting) return;
    setCommenting(true);
    try {
      const res = await api.addComment(token, id, comment);
      const data = await res.json();
      setIssue(prev => ({ ...prev, comments: [...(prev.comments || []), data] }));
      setComment('');
    } catch { }
    setCommenting(false);
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={32} className="animate-spin text-civic-500" />
    </div>
  );

  if (!issue) return (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">Issue not found.</div>
  );

  const statusIndex = STATUS_STEPS.indexOf(issue.status);
  const icon = CATEGORY_ICONS[issue.ai_category || issue.category] || '📋';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-civic-500 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl">{icon}</span>
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white leading-tight">{issue.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full status-${issue.status}`}>
                  {t(issue.status) || issue.status}
                </span>
                {issue.ai_priority && (
                  <span className={`text-xs font-bold priority-${issue.ai_priority}`}>
                    ⚡ {issue.ai_priority} Priority
                  </span>
                )}
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">
                  {issue.ai_category || issue.category}
                </span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="flex items-center gap-1"><MapPin size={13} /> {issue.area_name || issue.city || 'Unknown'}</span>
            <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(issue.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><User size={13} /> {issue.reporter?.full_name || 'Anonymous'}</span>
            <span className="flex items-center gap-1"><Tag size={13} /> #{issue.id}</span>
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">{issue.description}</p>

          {/* AI Summary */}
          {issue.ai_summary && (
            <div className="bg-civic-50 dark:bg-civic-900/20 border border-civic-100 dark:border-civic-800 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-civic-600 dark:text-civic-400 mb-1">🤖 AI Summary</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{issue.ai_summary}</p>
            </div>
          )}

          {/* Vote */}
          <div className="flex items-center gap-3">
            <button onClick={handleVote} disabled={voting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${issue.user_voted ? 'bg-civic-500 text-white border-civic-500 shadow-md' : 'border-civic-200 dark:border-civic-800 text-civic-600 dark:text-civic-400 hover:bg-civic-50 dark:hover:bg-civic-900/20'}`}>
              {voting ? <Loader size={16} className="animate-spin" /> : <ThumbsUp size={16} fill={issue.user_voted ? 'currentColor' : 'none'} />}
              {issue.user_voted ? t('voted') : t('vote')} · {issue.vote_count}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MessageSquare size={15} /> {issue.comments?.length || 0} {t('comments')}
            </span>
          </div>
        </div>

        {/* Status Progress */}
        {issue.status !== 'rejected' && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Progress</p>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i <= statusIndex ? 'bg-civic-500 border-civic-500 text-white' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                      {i <= statusIndex ? '✓' : i + 1}
                    </div>
                    <span className="text-xs mt-1 text-gray-500 dark:text-gray-400 capitalize whitespace-nowrap hidden sm:block">
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded transition-all ${i < statusIndex ? 'bg-civic-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {issue.images?.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Evidence Photos ({issue.images.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {issue.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(img)}
                  className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity group">
                  <img src={`http://localhost:5000${img}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📍 Location</p>
          <div className="h-36 bg-gradient-to-br from-civic-50 to-blue-50 dark:from-civic-900/20 dark:to-blue-900/20 rounded-xl border border-civic-100 dark:border-civic-800 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={28} className="text-civic-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{issue.area_name}, {issue.city}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{issue.latitude?.toFixed(4)}, {issue.longitude?.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> {t('comments')} ({issue.comments?.length || 0})
        </h2>

        {/* Add Comment */}
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-civic-100 dark:bg-civic-900 flex items-center justify-center flex-shrink-0">
            <span className="text-civic-600 dark:text-civic-300 font-bold text-sm">{user?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
              placeholder={t('addComment')}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-civic-500" />
            <button onClick={handleComment} disabled={!comment.trim() || commenting}
              className="px-4 py-2.5 bg-civic-500 hover:bg-civic-600 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium">
              {commenting ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>

        {/* Comment List */}
        <div className="space-y-4">
          {issue.comments?.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-600">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No comments yet. Start the discussion!</p>
            </div>
          )}
          {issue.comments?.map(c => (
            <div key={c.id} className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">{c.author_name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.author_name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <img src={`http://localhost:5000${selectedImg}`} alt="" className="max-w-full max-h-full rounded-xl shadow-2xl" />
          <button onClick={() => setSelectedImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
