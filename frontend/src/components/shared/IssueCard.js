import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';

const CATEGORY_ICONS = {
  'Road Issue': '🛣️', 'Water Issue': '💧', 'Sanitation Issue': '🗑️',
  'Electrical Issue': '💡', 'Safety Issue': '🚨', 'Environmental Issue': '🌿', 'General Issue': '📋'
};

export default function IssueCard({ issue, onVoteUpdate }) {
  const { token, t } = useApp();

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.voteIssue(token, issue.id);
      const data = await res.json();
      if (onVoteUpdate) onVoteUpdate(issue.id, data);
    } catch (err) { console.error(err); }
  };

  const statusClass = `status-${issue.status}`;
  const priorityClass = `priority-${issue.ai_priority}`;
  const icon = CATEGORY_ICONS[issue.ai_category || issue.category] || '📋';
  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Link to={`/issues/${issue.id}`} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 card-hover cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">{issue.title}</h3>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusClass}`}>
            {t(issue.status) || issue.status}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-3 leading-relaxed">{issue.description}</p>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {issue.ai_priority && (
            <span className={`text-xs font-semibold ${priorityClass}`}>
              ⚡ {issue.ai_priority} Priority
            </span>
          )}
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {issue.ai_category || issue.category}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span className="truncate max-w-[120px]">{issue.area_name || issue.city || 'Unknown area'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleVote} className={`flex items-center gap-1 hover:text-civic-500 transition-colors ${issue.user_voted ? 'text-civic-500' : ''}`}>
              <ThumbsUp size={13} fill={issue.user_voted ? 'currentColor' : 'none'} />
              <span>{issue.vote_count}</span>
            </button>
            <span className="flex items-center gap-1">
              <MessageSquare size={13} />
              {issue.comment_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {timeAgo(issue.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
