import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import {
  Users, Plus, Heart, MessageCircle, Pin, Trash2, Crown, ChevronDown,
  ChevronUp, Send, AlertCircle, RefreshCw, Tag, Megaphone, Bug, Lightbulb, Coffee
} from 'lucide-react';

interface CommunityReply {
  id: string;
  authorName: string;
  authorId: string;
  isAdmin: boolean;
  content: string;
  createdAt: string;
}

interface CommunityPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorId: string;
  isAdmin: boolean;
  isPinned: boolean;
  likes: string[];
  replies: CommunityReply[];
  createdAt: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Posts', icon: Users, color: 'text-text-muted' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, color: 'text-accent-purple' },
  { id: 'features', label: 'Feature Requests', icon: Lightbulb, color: 'text-accent-blue' },
  { id: 'bugs', label: 'Bug Reports', icon: Bug, color: 'text-accent-red' },
  { id: 'general', label: 'General Chat', icon: Coffee, color: 'text-wa-green' },
];

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  announcements: { label: 'Announcement', color: 'text-accent-purple', bg: 'bg-accent-purple/10 border-accent-purple/20' },
  features: { label: 'Feature Request', color: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue/20' },
  bugs: { label: 'Bug Report', color: 'text-accent-red', bg: 'bg-accent-red/10 border-accent-red/20' },
  general: { label: 'General', color: 'text-wa-green', bg: 'bg-wa-green/10 border-wa-green/20' },
};

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-accent-orange to-accent-pink rounded-full text-[10px] font-bold text-white">
      <Crown className="w-2.5 h-2.5" />ADMIN
    </span>
  );
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return <span>{days}d ago</span>;
  if (hours > 0) return <span>{hours}h ago</span>;
  if (mins > 0) return <span>{mins}m ago</span>;
  return <span>just now</span>;
}

function PostCard({ post, currentUserId, isAdmin, onDelete, onPin, onRefresh }: {
  post: CommunityPost; currentUserId: string; isAdmin: boolean;
  onDelete: (id: string) => void; onPin: (id: string) => void; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(post.likes.includes(currentUserId));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const cat = categoryConfig[post.category] || categoryConfig.general;

  async function toggleLike() {
    try {
      const res = await fetch(`/api/community/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ authorId: currentUserId }),
      });
      const data = await res.json();
      if (data.ok) { setLiked(data.liked); setLikeCount(data.likes); }
    } catch {}
  }

  async function postReply() {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await fetch(`/api/community/posts/${post._id}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim(), authorName: currentUserId, authorId: currentUserId }),
      });
      setReplyText('');
      onRefresh();
    } catch {} finally { setPosting(false); }
  }

  return (
    <div className={`glass rounded-2xl overflow-hidden border ${post.isPinned ? 'border-accent-orange/30' : 'border-border'} transition-all hover:border-border/80`}>
      {post.isPinned && (
        <div className="bg-gradient-to-r from-accent-orange/10 to-accent-pink/10 px-4 py-1.5 flex items-center gap-1.5">
          <Pin className="w-3 h-3 text-accent-orange" />
          <span className="text-[10px] font-medium text-accent-orange">Pinned Post</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>{cat.label}</span>
              {post.isAdmin && <AdminBadge />}
            </div>
            <h3 className="text-sm font-semibold text-text-primary leading-snug">{post.title}</h3>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onPin(post._id)} title="Pin/Unpin" className="p-1.5 rounded-lg text-text-muted hover:text-accent-orange hover:bg-accent-orange/10 transition-colors">
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(post._id)} title="Delete" className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <span className="font-medium text-text-secondary">{post.authorName}</span>
            <span>·</span>
            <TimeAgo date={post.createdAt} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLike} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors ${liked ? 'bg-accent-red/10 text-accent-red' : 'text-text-muted hover:text-accent-red hover:bg-accent-red/10'}`}>
              <Heart className={`w-3 h-3 ${liked ? 'fill-accent-red' : ''}`} />
              {likeCount}
            </button>
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors">
              <MessageCircle className="w-3 h-3" />
              {post.replies.length}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {post.replies.length === 0 ? (
              <p className="text-[11px] text-text-muted text-center py-2">No replies yet. Be the first!</p>
            ) : (
              post.replies.map(r => (
                <div key={r.id} className={`flex gap-2.5 ${r.isAdmin ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${r.isAdmin ? 'bg-gradient-to-br from-accent-orange to-accent-pink text-white' : 'bg-wa-green/15 text-wa-green'}`}>
                    {(r.authorName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 rounded-xl p-2.5 ${r.isAdmin ? 'bg-gradient-to-br from-accent-orange/10 to-accent-pink/10 border border-accent-orange/20' : 'bg-bg-card'}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${r.isAdmin ? 'justify-end' : ''}`}>
                      <span className="text-[10px] font-medium text-text-secondary">{r.authorName}</span>
                      {r.isAdmin && <AdminBadge />}
                      <span className="text-[9px] text-text-muted"><TimeAgo date={r.createdAt} /></span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">{r.content}</p>
                  </div>
                </div>
              ))
            )}

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postReply(); } }}
                placeholder="Write a reply..."
                maxLength={500}
                className="flex-1 bg-bg-input border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all"
              />
              <button
                onClick={postReply}
                disabled={posting || !replyText.trim()}
                className="px-3 py-2 bg-wa-green text-white rounded-xl text-xs font-medium hover:bg-wa-dark-green disabled:opacity-50 transition-colors"
              >
                {posting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewPostModal({ onClose, onPosted, currentUser }: {
  onClose: () => void; onPosted: () => void;
  currentUser: { displayName: string; email: string; role: string } | null;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!title.trim() || !content.trim()) { setError('Title and content are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          authorName: currentUser?.displayName || 'Anonymous',
          authorId: currentUser?.email || 'anon',
        }),
      });
      const data = await res.json();
      if (data.ok) { onPosted(); onClose(); }
      else setError(data.error || 'Failed to post');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-lg animate-slide-up">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-wa-green" />New Post
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 transition-all"
            >
              <option value="general">💬 General Chat</option>
              <option value="features">💡 Feature Request</option>
              <option value="bugs">🐛 Bug Report</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="What's your topic?"
              className="w-full bg-bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Share your thoughts, request a feature, or describe a bug..."
              className="w-full bg-bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all resize-none"
            />
            <p className="text-[10px] text-text-muted text-right mt-1">{content.length}/5000</p>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-accent-red text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-text-secondary glass hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-wa-green text-white hover:bg-wa-dark-green disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Post</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);

  const currentUserId = currentUser?.email || currentUser?.id || 'anon';
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  async function loadPosts(category = activeTab) {
    setLoading(true);
    try {
      const q = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/community/posts${q}`);
      const data = await res.json();
      if (data.ok) setPosts(data.posts);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { loadPosts(activeTab); }, [activeTab]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    const adminToken = sessionStorage.getItem('admin-token');
    await fetch(`/api/community/posts/${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken || '' } });
    loadPosts();
  }

  async function handlePin(id: string) {
    const adminToken = sessionStorage.getItem('admin-token');
    await fetch(`/api/community/posts/${id}/pin`, { method: 'PATCH', headers: { 'x-admin-token': adminToken || '' } });
    loadPosts();
  }

  const pinnedPosts = posts.filter(p => p.isPinned);
  const regularPosts = posts.filter(p => !p.isPinned);

  return (
    <div className="space-y-6 animate-fade-in">
      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onPosted={() => loadPosts()}
          currentUser={currentUser}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-wa-green" />Community
          </h2>
          <p className="text-sm text-text-muted mt-1">Discuss features, report bugs, and chat with other users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadPosts()} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowNewPost(true)} className="flex items-center gap-2 px-4 py-2 bg-wa-green text-white rounded-xl text-sm font-semibold hover:bg-wa-dark-green transition-colors">
            <Plus className="w-4 h-4" />New Post
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive ? 'bg-wa-green text-white shadow-sm' : 'glass text-text-secondary hover:text-text-primary'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />{cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-wa-green/30 border-t-wa-green rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Loading posts...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pinnedPosts.map(post => (
            <PostCard key={post._id} post={post} currentUserId={currentUserId} isAdmin={isAdmin} onDelete={handleDelete} onPin={handlePin} onRefresh={() => loadPosts()} />
          ))}
          {regularPosts.map(post => (
            <PostCard key={post._id} post={post} currentUserId={currentUserId} isAdmin={isAdmin} onDelete={handleDelete} onPin={handlePin} onRefresh={() => loadPosts()} />
          ))}
          {posts.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-primary font-semibold mb-1">No posts yet</p>
              <p className="text-text-muted text-sm mb-4">Be the first to start a conversation!</p>
              <button onClick={() => setShowNewPost(true)} className="px-4 py-2 bg-wa-green text-white rounded-xl text-sm font-medium hover:bg-wa-dark-green transition-colors">
                Create First Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
