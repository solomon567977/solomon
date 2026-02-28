import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Search, 
  Bell, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Play, 
  Pause,
  ArrowRight, 
  ArrowLeft,
  Plus,
  Lock,
  Sparkles,
  TrendingUp,
  User,
  Volume2,
  VolumeX,
  Music,
  Settings,
  X,
  LogIn,
  LogOut,
  Shield,
  Clock,
  ExternalLink,
  Instagram,
  Download,
  Copy,
  Check,
  Palette,
  Type,
  Moon,
  Sun,
  Trash2,
  Layout,
  BarChart3,
  MessageSquare,
  Send,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Confession, View } from './types';
import { toPng } from 'html-to-image';
import { MOCK_CONFESSIONS } from './constants';

export default function App() {
  const [view, setView] = useState<View>('feed');
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeStep, setComposeStep] = useState(1);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [likedHearts, setLikedHearts] = useState<Set<string>>(new Set());
  const [bookmarkedHearts, setBookmarkedHearts] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [theme, setTheme] = useState('romantic');
  const [font, setFont] = useState('sans');
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingCustomSong, setIsAddingCustomSong] = useState(false);
  const [customSong, setCustomSong] = useState({ title: '', artist: '', url: '' });
  const [newConfession, setNewConfession] = useState({
    to: '',
    content: '',
    music: { title: '', artist: '', audioUrl: '' },
    mood: 'Love' as any,
    expiry: 'Permanent' as any,
    generateCode: false
  });

  const MOOD_TAGS = [
    { label: 'Love', icon: '❤️', color: 'bg-rose-100 text-rose-600' },
    { label: 'Heartbreak', icon: '💔', color: 'bg-slate-100 text-slate-600' },
    { label: 'Secret Crush', icon: '🌙', color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Regret', icon: '🌧️', color: 'bg-blue-100 text-blue-600' },
    { label: 'Appreciation', icon: '🌸', color: 'bg-pink-100 text-pink-600' },
    { label: 'Passion', icon: '🔥', color: 'bg-orange-100 text-orange-600' }
  ];

  const audioRef = useRef<HTMLAudioElement>(null);
  const confessionAudioRef = useRef<HTMLAudioElement>(null);

  const THEMES = {
    romantic: { primary: '#d02525', bg: '#f8f6f6', start: '#fef2f2', mid: '#fee2e2', end: '#fecaca', text: 'text-slate-900' },
    midnight: { primary: '#818cf8', bg: '#0f172a', start: '#1e293b', mid: '#0f172a', end: '#1e1b4b', text: 'text-slate-100' },
    sunset: { primary: '#f59e0b', bg: '#fffbeb', start: '#fff7ed', mid: '#ffedd5', end: '#fed7aa', text: 'text-slate-900' },
    minimal: { primary: '#18181b', bg: '#fafafa', start: '#f4f4f5', mid: '#e4e4e7', end: '#d4d4d8', text: 'text-slate-900' },
    wine: { primary: '#fb7185', bg: '#4c0519', start: '#4c0519', mid: '#881337', end: '#4c0519', text: 'text-rose-100' }
  };

  const FONTS = {
    sans: '"Plus Jakarta Sans", sans-serif',
    cursive: '"Dancing Script", cursive',
    serif: '"Playfair Display", serif',
    mono: '"JetBrains Mono", monospace'
  };

  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = THEMES[theme as keyof typeof THEMES];
    root.style.setProperty('--primary-color', selectedTheme.primary);
    root.style.setProperty('--bg-color', selectedTheme.bg);
    root.style.setProperty('--gradient-start', selectedTheme.start);
    root.style.setProperty('--gradient-mid', selectedTheme.mid);
    root.style.setProperty('--gradient-end', selectedTheme.end);
    root.style.setProperty('--font-family', FONTS[font as keyof typeof FONTS]);
    
    if (theme === 'midnight' || theme === 'wine') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    if (theme === 'wine') {
      document.body.classList.add('wine-theme');
    } else {
      document.body.classList.remove('wine-theme');
    }
  }, [theme, font]);

  // Draft saving
  useEffect(() => {
    const savedDraft = localStorage.getItem('confession_draft');
    if (savedDraft) {
      try {
        setNewConfession(JSON.parse(savedDraft));
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('confession_draft', JSON.stringify(newConfession));
  }, [newConfession]);

  useEffect(() => {
    fetchConfessions();
  }, []);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      
      if (!isSupabaseConfigured || !supabase) {
        setConfessions(MOCK_CONFESSIONS);
        return;
      }

      const { data, error } = await supabase
        .from('Secret Hearts')
        .select('confession, like');

      if (error) {
        console.error('Supabase Fetch Error:', error);
        throw new Error(error.message || 'Could not fetch from table "Secret Hearts"');
      }

      if (data && data.length > 0) {
        const parsed = data.map(item => {
          try {
            const confessionData = JSON.parse(item.confession);
            return {
              ...confessionData,
              // Without an ID column, we use the raw confession string as a unique key
              id: item.confession, 
              likes: item.like || 0
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as Confession[];
        setConfessions(parsed);
      } else {
        // Table is empty, don't show mock data if we successfully connected
        setConfessions([]);
      }
    } catch (error) {
      console.error('Error fetching confessions:', error);
      setConfessions(MOCK_CONFESSIONS);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTED_SONGS = [
    { title: "Enchanted", artist: "Taylor Swift", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Photograph", artist: "Ed Sheeran", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { title: "Chemistry", artist: "Post Malone", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { title: "Lover", artist: "Taylor Swift", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { title: "Perfect", artist: "Ed Sheeran", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  ];

  const filteredConfessions = confessions.filter(c => 
    c.to.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.secretCode && c.secretCode.toUpperCase() === searchQuery.toUpperCase())
  );

  const likedConfessions = confessions.filter(c => likedHearts.has(c.id));

  const [isPosting, setIsPosting] = useState(false);
  const [lastPostTime, setLastPostTime] = useState(0);
  const [sharingConfession, setSharingConfession] = useState<Confession | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  const handleDownloadStory = async () => {
    if (!storyRef.current) return;
    setIsGeneratingImage(true);
    try {
      // Wait for fonts to be ready
      await document.fonts.ready;
      
      const dataUrl = await toPng(storyRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
        // Skip problematic stylesheets if any remain
        filter: (node: any) => {
          const skipTags = ['IFRAME', 'SCRIPT', 'VIDEO'];
          if (node.tagName && skipTags.includes(node.tagName)) return false;
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `secret-heart-${sharingConfession?.secretCode || 'story'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
      alert("Failed to generate story image. This is often due to browser security restrictions on remote fonts. Try again or take a screenshot!");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + (sharingConfession?.secretCode ? `?code=${sharingConfession.secretCode}` : '');
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard! Share it in your Instagram bio or DMs.");
  };

  const handlePost = async () => {
    // Anti-spam check
    const now = Date.now();
    if (now - lastPostTime < 30000) { // 30 seconds between posts
      alert("Your heart is beating too fast! Please wait a moment before sharing another secret.");
      return;
    }

    if (!newConfession.content) {
      alert("Please write something in your heart first.");
      return;
    }

    // Toxic pattern detection (simple)
    const toxicWords = ['hate', 'kill', 'die', 'stupid', 'ugly'];
    const lowerContent = newConfession.content.toLowerCase();
    if (toxicWords.some(word => lowerContent.includes(word))) {
      alert("Let's keep this space beautiful. Please share your feelings with kindness.");
      return;
    }

    setIsPosting(true);
    
    if (!isSupabaseConfigured || !supabase) {
      alert("Database not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
      setIsPosting(false);
      return;
    }

    // Generate secret code if requested
    const secretCode = newConfession.generateCode 
      ? `SH-${Math.floor(1000 + Math.random() * 9000)}` 
      : undefined;

    // Calculate expiry date
    let expiryDate: string | undefined;
    if (newConfession.expiry === '30 Days') {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      expiryDate = date.toISOString();
    }

    const confessionObj = {
      to: newConfession.to || 'Someone Special',
      from: 'Anonymous',
      content: newConfession.content,
      timestamp: new Date().toLocaleString(),
      likes: 0,
      comments: 0,
      shares: 0,
      mood: newConfession.mood,
      secretCode,
      expiryDate,
      reactions: { feltThis: 0, stayStrong: 0, beautiful: 0, magical: 0 },
      replies: [],
      music: newConfession.music.title ? newConfession.music : undefined
    };

    try {
      const confessionJson = JSON.stringify(confessionObj);
      
      const { error } = await supabase
        .from('Secret Hearts')
        .insert([
          { 
            confession: confessionJson,
            like: 0
          }
        ]);

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw new Error(error.message || 'Unknown database error');
      }

      const savedConfession: Confession = {
        ...confessionObj,
        id: confessionJson,
        likes: 0
      };
      
      setConfessions(prev => [savedConfession, ...prev.filter(c => !MOCK_CONFESSIONS.find(m => m.id === c.id))]);
      setLastPostTime(now);
      
      // Clear draft
      localStorage.removeItem('confession_draft');
      
      setView('feed');
      setComposeStep(1);
      setNewConfession({ 
        to: '', 
        content: '', 
        music: { title: '', artist: '', audioUrl: '' },
        mood: 'Love',
        expiry: 'Permanent',
        generateCode: false
      });
      
      if (activeAudioId === 'preview') {
        confessionAudioRef.current?.pause();
        setActiveAudioId(null);
      }

      if (secretCode) {
        alert(`Your secret code is: ${secretCode}. Share it with your special someone!`);
      }
    } catch (error: any) {
      console.error('Error saving confession:', error);
      alert(`Failed to save confession: ${error.message || 'Check your Supabase RLS policies.'}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // Simulate login
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        // Stop any confession audio
        if (confessionAudioRef.current) {
          confessionAudioRef.current.pause();
          setActiveAudioId(null);
        }
        audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const toggleConfessionAudio = (id: string, url?: string) => {
    if (!url || !confessionAudioRef.current) return;

    if (activeAudioId === id) {
      confessionAudioRef.current.pause();
      setActiveAudioId(null);
    } else {
      // Pause background music
      if (isMusicPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      }
      
      confessionAudioRef.current.src = url;
      confessionAudioRef.current.play().catch(e => console.log("Playback failed", e));
      setActiveAudioId(id);
    }
  };

  const toggleLike = async (id: string) => {
    const isCurrentlyLiked = likedHearts.has(id);
    const confessionToUpdate = confessions.find(c => c.id === id);
    if (!confessionToUpdate) return;

    const newLikeCount = isCurrentlyLiked ? Math.max(0, confessionToUpdate.likes - 1) : confessionToUpdate.likes + 1;

    try {
      // Optimistic update
      setLikedHearts(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });

      setConfessions(prev => prev.map(c => c.id === id ? { ...c, likes: newLikeCount } : c));
      
      if (!isSupabaseConfigured || !supabase) return;

      // Update Supabase using the confession text as the unique identifier
      const { error } = await supabase
        .from('Secret Hearts')
        .update({ like: newLikeCount })
        .eq('confession', id); // 'id' here is the raw JSON string from the database

      if (error) throw error;
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      setLikedHearts(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setConfessions(prev => prev.map(c => c.id === id ? { ...c, likes: confessionToUpdate.likes } : c));
    }
  };

  const toggleReaction = async (id: string, reactionType: keyof NonNullable<Confession['reactions']>) => {
    const confessionToUpdate = confessions.find(c => c.id === id);
    if (!confessionToUpdate) return;

    const currentReactions = confessionToUpdate.reactions || { feltThis: 0, stayStrong: 0, beautiful: 0, magical: 0 };
    const newReactions = { ...currentReactions, [reactionType]: currentReactions[reactionType] + 1 };

    try {
      setConfessions(prev => prev.map(c => c.id === id ? { ...c, reactions: newReactions } : c));

      if (!isSupabaseConfigured || !supabase) return;

      // Update Supabase
      const updatedConfessionData = { ...confessionToUpdate, reactions: newReactions };
      delete (updatedConfessionData as any).id;
      delete (updatedConfessionData as any).rawConfession;

      const { error } = await supabase
        .from('Secret Hearts')
        .update({ confession: JSON.stringify(updatedConfessionData) })
        .eq('confession', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating reaction:', error);
      setConfessions(prev => prev.map(c => c.id === id ? { ...c, reactions: currentReactions } : c));
    }
  };

  const handlePrivateReply = async (id: string, replyContent: string) => {
    const confessionToUpdate = confessions.find(c => c.id === id);
    if (!confessionToUpdate || !replyContent) return;

    const newReply = {
      id: Math.random().toString(36).substr(2, 9),
      content: replyContent,
      timestamp: new Date().toLocaleString(),
      isPrivate: true
    };

    const currentReplies = confessionToUpdate.replies || [];
    const newReplies = [...currentReplies, newReply];

    try {
      setConfessions(prev => prev.map(c => c.id === id ? { ...c, replies: newReplies, comments: (c.comments || 0) + 1 } : c));

      if (!isSupabaseConfigured || !supabase) return true;

      // Update Supabase
      const updatedConfessionData = { ...confessionToUpdate, replies: newReplies, comments: (confessionToUpdate.comments || 0) + 1 };
      delete (updatedConfessionData as any).id;
      delete (updatedConfessionData as any).rawConfession;

      const { error } = await supabase
        .from('Secret Hearts')
        .update({ confession: JSON.stringify(updatedConfessionData) })
        .eq('confession', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending private reply:', error);
      setConfessions(prev => prev.map(c => c.id === id ? { ...c, replies: currentReplies, comments: confessionToUpdate.comments } : c));
      return false;
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedHearts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const StarParticles = () => {
    const stars = Array.from({ length: 50 });
    return (
      <div className="stars-container">
        {stars.map((_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`, 
              width: `${Math.random() * 3}px`, 
              height: `${Math.random() * 3}px`, 
              '--duration': `${2 + Math.random() * 4}s`,
              '--opacity': 0.3 + Math.random() * 0.5
            } as any} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen romantic-gradient flex flex-col">
      {theme === 'wine' && <StarParticles />}
      {/* Background Music */}
      <audio 
        ref={audioRef} 
        loop 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
      />
      
      {/* Confession Song Player */}
      <audio 
        ref={confessionAudioRef} 
        onEnded={() => setActiveAudioId(null)}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Settings className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Personalize</h2>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                      <Palette className="w-4 h-4" />
                      <span>Color Theme</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(THEMES).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setTheme(key)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${theme === key ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: value.primary }} />
                          <span className="font-bold text-sm capitalize text-slate-700">{key}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                      <Type className="w-4 h-4" />
                      <span>Font Style</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(FONTS).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setFont(key)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${font === key ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                          style={{ fontFamily: value }}
                        >
                          <span className="font-bold text-sm capitalize text-slate-700">{key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-primary/10"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                  <Heart className="w-8 h-8 fill-primary" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
                <p className="text-slate-500 font-medium">Sign in to share your heart's secrets</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="you@university.edu"
                    className="w-full p-4 rounded-xl border-2 border-primary/10 bg-primary/[0.01] focus:border-primary/40 focus:ring-0 font-medium"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full p-4 rounded-xl border-2 border-primary/10 bg-primary/[0.01] focus:border-primary/40 focus:ring-0 font-medium"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all mt-4"
                >
                  Sign In
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  Don't have an account? <button className="text-primary font-bold hover:underline">Create one</button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-card border-b border-primary/10 px-4 md:px-20 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-2 text-primary cursor-pointer group"
              onClick={() => setView('feed')}
            >
              <Heart className="w-8 h-8 fill-primary group-hover:scale-110 transition-transform" />
              <h2 className="text-slate-900 text-3xl font-bold tracking-tight">Secret Hearts</h2>
            </div>
            
            <div className="hidden md:flex">
              <div className="relative flex items-center w-64 h-10 bg-white/50 border border-primary/10 rounded-xl px-3">
                <Search className="w-5 h-5 text-primary/60" />
                <input 
                  type="text"
                  placeholder="Search secrets..."
                  className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-primary/40 ml-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden lg:flex items-center gap-8">
              <button 
                onClick={() => setView('feed')}
                className={`text-sm font-bold transition-colors ${view === 'feed' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-600 hover:text-primary'}`}
              >
                Confessions
              </button>
              <button 
                onClick={() => setView('liked')}
                className={`text-sm font-bold transition-colors ${view === 'liked' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-600 hover:text-primary'}`}
              >
                Liked Hearts
              </button>
              <button 
                onClick={() => setView('my-hearts')}
                className={`text-sm font-bold transition-colors ${view === 'my-hearts' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-600 hover:text-primary'}`}
              >
                My Hearts
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className={`text-sm font-bold transition-colors ${view === 'dashboard' ? 'text-primary border-b-2 border-primary pb-1' : 'text-slate-600 hover:text-primary'}`}
              >
                Dashboard
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-white/60 text-slate-700 hover:bg-primary/10 hover:text-primary transition-all border border-primary/5"
                title="Personalize"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleMusic}
                className="p-2 rounded-xl bg-white/60 text-primary hover:bg-primary/10 transition-all border border-primary/5"
                title={isMusicPlaying ? "Mute Music" : "Play Music"}
              >
                {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              {!isLoggedIn ? (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-xl bg-white/60 text-slate-700 hover:bg-primary/10 hover:text-primary transition-all border border-primary/5">
                    <Bell className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden cursor-pointer">
                    <img 
                      src="https://picsum.photos/seed/user123/100/100" 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'feed' && (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <div className="flex flex-col lg:flex-row items-center gap-12 py-8">
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> A space for unspoken love
                  </div>
                  <h1 className="text-6xl md:text-7xl font-bold text-slate-900 leading-tight">
                    Some feelings are <span className="text-primary italic">too beautiful</span> to stay unspoken
                  </h1>
                  <p className="text-slate-600 text-lg max-w-xl font-medium">
                    A dreamy, romantic anonymous confession space for college students to share what's truly in their hearts without fear.
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <button 
                      onClick={() => setView('compose')}
                      className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      Start Confessing <Heart className="w-4 h-4 fill-white" />
                    </button>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('latest-hearts');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-8 py-4 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      Browse Feed
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                    <img 
                      src="https://picsum.photos/seed/romantic/800/600" 
                      alt="Romantic Couple" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
                      <p className="italic text-lg font-cursive">"I saw you by the fountain today. You were wearing that blue scarf, and for a moment, the world just... stopped."</p>
                    </div>
                  </div>
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                </div>
              </div>

              <div id="latest-hearts" className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold text-slate-900">Latest Hearts</h2>
                  <button className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-primary font-bold animate-pulse">Gathering whispers...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredConfessions.map((confession) => (
                      <div key={confession.id}>
                        <ConfessionCard 
                          confession={confession} 
                          isLiked={likedHearts.has(confession.id)}
                          isBookmarked={bookmarkedHearts.has(confession.id)}
                          onLike={() => toggleLike(confession.id)}
                          onBookmark={() => toggleBookmark(confession.id)}
                          isActiveAudio={activeAudioId === confession.id}
                          onToggleAudio={() => toggleConfessionAudio(confession.id, confession.music?.audioUrl)}
                          onReaction={(type) => toggleReaction(confession.id, type)}
                          onReply={(content) => handlePrivateReply(confession.id, content)}
                          onShare={() => setSharingConfession(confession)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA Section */}
              <div className="glass-card rounded-3xl p-12 text-center space-y-6 border-2 border-primary/5">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                  <Heart className="w-8 h-8 fill-primary" />
                </div>
                <h2 className="text-4xl font-bold text-slate-900">Ready to share your secret?</h2>
                <p className="text-slate-600 max-w-md mx-auto font-medium">
                  Join thousands of students expressing their true feelings anonymously. Your heart is safe with us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setView('compose')}
                    className="px-10 py-4 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all"
                  >
                    Post a Heart
                  </button>
                  <div className="relative flex items-center">
                    <Shield className="absolute left-4 w-5 h-5 text-primary/40" />
                    <input 
                      type="text"
                      placeholder="Enter Secret Code..."
                      className="pl-12 pr-4 py-4 rounded-xl border-2 border-primary/10 bg-white focus:border-primary outline-none font-bold text-sm w-full sm:w-64"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const code = (e.target as HTMLInputElement).value.toUpperCase();
                          const found = confessions.find(c => c.secretCode === code);
                          if (found) {
                            setSearchQuery(code);
                            const element = document.getElementById('latest-hearts');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            alert("Secret code not found. The heart might have expired or the code is incorrect.");
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-slate-900 text-5xl font-bold tracking-tight">Your Emotion Dashboard</h1>
                <p className="text-primary/70 text-base font-medium">A private view of your heart's journey.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 rounded-3xl text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary mb-2">
                    <Heart className="w-6 h-6 fill-primary" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{confessions.length}</p>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Confessions Shared</p>
                </div>
                <div className="glass-card p-8 rounded-3xl text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto text-rose-600 mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {confessions.reduce((acc, c) => acc + (c.likes || 0), 0)}
                  </p>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Likes Received</p>
                </div>
                <div className="glass-card p-8 rounded-3xl text-center space-y-2">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto text-indigo-600 mb-2">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {MOOD_TAGS[Math.floor(Math.random() * MOOD_TAGS.length)].label}
                  </p>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Most Used Mood</p>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Private Replies to Your Secrets
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {confessions.filter(c => c.replies && c.replies.length > 0).map(c => (
                    <div key={c.id} className="glass-card p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                        <p className="font-bold text-primary">To: {c.to}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.timestamp}</p>
                      </div>
                      <div className="space-y-3">
                        {c.replies?.map(reply => (
                          <div key={reply.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-slate-700 italic">"{reply.content}"</p>
                              <p className="text-[10px] text-slate-400">{reply.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {confessions.filter(c => c.replies && c.replies.length > 0).length === 0 && (
                    <div className="text-center py-12 glass-card rounded-3xl">
                      <p className="text-slate-400 font-medium italic">No private replies yet. Your secrets are still waiting for an answer.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {view === 'liked' && (
            <motion.div 
              key="liked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-slate-900 text-5xl font-bold tracking-tight">Liked Hearts</h1>
                <p className="text-primary/70 text-base font-medium">The stories that touched your soul.</p>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-primary font-bold animate-pulse">Finding your favorites...</p>
                </div>
              ) : likedConfessions.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {likedConfessions.map((confession) => (
                    <div key={confession.id}>
                      <ConfessionCard 
                        confession={confession} 
                        isLiked={likedHearts.has(confession.id)}
                        isBookmarked={bookmarkedHearts.has(confession.id)}
                        onLike={() => toggleLike(confession.id)}
                        onBookmark={() => toggleBookmark(confession.id)}
                        isActiveAudio={activeAudioId === confession.id}
                        onToggleAudio={() => toggleConfessionAudio(confession.id, confession.music?.audioUrl)}
                        onReaction={(type) => toggleReaction(confession.id, type)}
                        onReply={(content) => handlePrivateReply(confession.id, content)}
                        onShare={() => setSharingConfession(confession)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6 items-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <Heart className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">No liked hearts</h3>
                  <p className="text-slate-500 mb-6 font-medium">You haven't liked any secrets yet. Browse the feed to find some!</p>
                  <button 
                    onClick={() => setView('feed')}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    Go to Feed
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'my-hearts' && (
            <motion.div 
              key="my-hearts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-slate-900 text-5xl font-bold tracking-tight">My Hearts</h1>
                <p className="text-primary/70 text-base font-medium">Your unspoken feelings, kept safe here.</p>
              </div>
              <div className="flex flex-col gap-6 items-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Heart className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">No hearts yet</h3>
                <p className="text-slate-500 mb-6 font-medium">You haven't shared any secrets yet. Ready to start?</p>
                <button 
                  onClick={() => setView('compose')}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Post your first Heart
                </button>
              </div>
            </motion.div>
          )}

          {view === 'compose' && (
            <motion.div 
              key="compose"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-primary/10 overflow-hidden">
                {/* Progress Header */}
                <div className="p-6 md:p-8 border-b border-primary/5 bg-primary/[0.02]">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-primary font-bold text-xs uppercase tracking-widest">Step {composeStep} of 3</h3>
                      <h1 className="text-slate-900 text-3xl font-bold mt-1">
                        {composeStep === 1 ? 'Recipient' : composeStep === 2 ? 'Compose Confession' : 'Select Music'}
                      </h1>
                    </div>
                    <span className="text-primary font-bold text-lg">{Math.round((composeStep / 3) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${(composeStep / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                  {composeStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800">Who is this for?</h2>
                        <p className="text-slate-500 font-medium">Give a hint about the recipient (e.g., "The girl in the red scarf")</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                          <input 
                            type="text"
                            placeholder="To: ..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-primary/10 bg-primary/[0.01] focus:border-primary/40 focus:ring-0 text-lg font-medium"
                            value={newConfession.to}
                            onChange={(e) => setNewConfession({...newConfession, to: e.target.value})}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Mood</label>
                          <div className="grid grid-cols-3 gap-2">
                            {MOOD_TAGS.map((mood) => (
                              <button
                                key={mood.label}
                                onClick={() => setNewConfession({...newConfession, mood: mood.label})}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${newConfession.mood === mood.label ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                              >
                                <span className="text-xl">{mood.icon}</span>
                                <span className="text-[10px] font-bold text-slate-600">{mood.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setView('feed')}
                          className="flex-1 py-4 rounded-xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => setComposeStep(2)}
                          disabled={!newConfession.to}
                          className="flex-[2] py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  )}

                  {composeStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800">What's on your mind?</h2>
                        <p className="text-slate-500 font-medium">Share your story anonymously. Your heart is safe with us.</p>
                      </div>
                      <div className="relative">
                        <textarea 
                          className="w-full min-h-[250px] p-6 rounded-xl border-2 border-primary/10 bg-primary/[0.01] focus:border-primary/40 focus:ring-0 text-slate-800 text-xl leading-relaxed placeholder:text-slate-400 resize-none font-cursive"
                          placeholder="Write what your heart desires..."
                          value={newConfession.content}
                          onChange={(e) => setNewConfession({...newConfession, content: e.target.value})}
                        />
                        <div className="absolute bottom-4 right-4 text-slate-300">
                          <Sparkles className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2 text-primary/60">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs font-semibold uppercase tracking-tighter">End-to-End Encrypted</span>
                        </div>
                        <span className="text-slate-400 text-xs font-medium">{newConfession.content.length} / 2000 characters</span>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setComposeStep(1)}
                          className="flex-1 py-4 rounded-xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button 
                          onClick={() => setComposeStep(3)}
                          disabled={!newConfession.content}
                          className="flex-[2] py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] disabled:opacity-50 transition-all"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  )}

                   {composeStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800">Add a Melody</h2>
                        <p className="text-slate-500 font-medium">Choose a song that captures the essence of your feelings.</p>
                      </div>
                      
                      {!isAddingCustomSong ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {SUGGESTED_SONGS.map((song) => (
                              <div 
                                key={song.title}
                                onClick={() => setNewConfession({...newConfession, music: song})}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${newConfession.music.title === song.title ? 'border-primary bg-primary/5 shadow-md' : 'border-primary/5 hover:border-primary/20 bg-slate-50'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleConfessionAudio('preview', song.audioUrl);
                                    }}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 ${activeAudioId === 'preview' && confessionAudioRef.current?.src === song.audioUrl ? 'bg-primary' : 'bg-slate-400'}`}
                                  >
                                    {activeAudioId === 'preview' && confessionAudioRef.current?.src === song.audioUrl ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                                  </button>
                                  <div>
                                    <p className="text-slate-900 font-bold text-sm">{song.title}</p>
                                    <p className="text-slate-500 text-xs font-medium">{song.artist}</p>
                                  </div>
                                </div>
                                {newConfession.music.title === song.title && (
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                                    <Plus className="w-4 h-4 rotate-45" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <button 
                            onClick={() => setIsAddingCustomSong(true)}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                          >
                            <Music className="w-5 h-5" /> Add Custom Song (Spotify/Link)
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border-2 border-primary/10">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800">Custom Song Details</h3>
                            <button onClick={() => setIsAddingCustomSong(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Song Title</label>
                              <input 
                                type="text"
                                className="w-full p-3 rounded-lg border border-slate-200 focus:border-primary outline-none"
                                placeholder="e.g. As It Was"
                                value={customSong.title}
                                onChange={(e) => setCustomSong({...customSong, title: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Artist</label>
                              <input 
                                type="text"
                                className="w-full p-3 rounded-lg border border-slate-200 focus:border-primary outline-none"
                                placeholder="e.g. Harry Styles"
                                value={customSong.artist}
                                onChange={(e) => setCustomSong({...customSong, artist: e.target.value})}
                              />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Spotify/Audio URL (Optional)</label>
                                <a 
                                  href={`https://open.spotify.com/search/${encodeURIComponent(customSong.title + ' ' + customSong.artist)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Search Spotify
                                </a>
                              </div>
                              <input 
                                type="text"
                                className="w-full p-3 rounded-lg border border-slate-200 focus:border-primary outline-none"
                                placeholder="Paste Spotify link or audio URL..."
                                value={customSong.url}
                                onChange={(e) => setCustomSong({...customSong, url: e.target.value})}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if (customSong.title && customSong.artist) {
                                  setNewConfession({
                                    ...newConfession, 
                                    music: { 
                                      title: customSong.title, 
                                      artist: customSong.artist, 
                                      audioUrl: customSong.url 
                                    }
                                  });
                                  setIsAddingCustomSong(false);
                                }
                              }}
                              className="w-full py-3 rounded-lg bg-primary text-white font-bold shadow-lg"
                            >
                              Confirm Song
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-bold text-slate-800">Generate Secret Code</p>
                              <p className="text-[10px] text-slate-500">Share this code to let them find it easily.</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setNewConfession({...newConfession, generateCode: !newConfession.generateCode})}
                            className={`w-12 h-6 rounded-full transition-all relative ${newConfession.generateCode ? 'bg-primary' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newConfession.generateCode ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-bold text-slate-800">Confession Expiry</p>
                              <p className="text-[10px] text-slate-500">How long should this secret last?</p>
                            </div>
                          </div>
                          <select 
                            className="bg-transparent text-sm font-bold text-primary outline-none"
                            value={newConfession.expiry}
                            onChange={(e) => setNewConfession({...newConfession, expiry: e.target.value as any})}
                          >
                            <option value="Permanent">Permanent</option>
                            <option value="30 Days">30 Days</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setComposeStep(2)}
                          className="flex-1 py-4 rounded-xl border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button 
                          onClick={handlePost}
                          disabled={isPosting}
                          className="flex-[2] py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isPosting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Whispering...
                            </>
                          ) : (
                            <>Post Heart</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-10 py-6 bg-slate-50 border-t border-primary/5 text-center">
                  <p className="text-xs text-slate-400 italic">
                    "True love stories never have endings, but they all have a beginning."
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {sharingConfession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-md w-full flex flex-col gap-6 items-center"
            >
              <button 
                onClick={() => setSharingConfession(null)}
                className="absolute -top-12 right-0 text-white hover:text-primary transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Story Preview Container */}
              <div className="w-full aspect-[9/16] max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl relative" ref={storyRef}>
                <div className={`absolute inset-0 ${theme === 'wine' ? 'bg-[#2D0A14]' : 'romantic-gradient'} flex flex-col p-8 items-center justify-center text-center gap-8`}>
                  {theme === 'wine' && <StarParticles />}
                  
                  <div className="space-y-4 z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Heart className="w-16 h-16 fill-primary text-primary" />
                      <h2 className="text-primary font-bold text-3xl">Secret Hearts</h2>
                    </div>
                    <div className="h-0.5 w-24 bg-primary/20 mx-auto rounded-full" />
                  </div>

                  <div className="space-y-6 z-10 flex-1 flex flex-col justify-center">
                    <div className="space-y-2">
                      <p className="text-primary/60 font-bold uppercase tracking-[0.2em] text-sm">To: {sharingConfession.to}</p>
                      {sharingConfession.mood && (
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                          {sharingConfession.mood}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-800 text-3xl leading-relaxed italic font-cursive px-4">
                      "{sharingConfession.content}"
                    </p>

                    <p className="text-slate-500 text-sm font-medium">From: {sharingConfession.from}</p>
                  </div>

                  <div className="space-y-6 z-10 w-full">
                    {sharingConfession.music && (
                      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/20 shadow-lg">
                        <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-white">
                          <Music className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-slate-900 font-bold text-base leading-tight">{sharingConfession.music.title}</p>
                          <p className="text-slate-500 text-sm font-medium">{sharingConfession.music.artist}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-primary/40 text-[10px] font-bold uppercase tracking-widest">Read more at</p>
                      <p className="text-primary font-bold text-lg tracking-tighter">secrethearts.love</p>
                      {sharingConfession.secretCode && (
                        <p className="text-slate-400 font-mono text-xs mt-2">CODE: {sharingConfession.secretCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={handleDownloadStory}
                  disabled={isGeneratingImage}
                  className="flex items-center justify-center gap-2 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-xl disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Save Image
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-primary/30"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
              </div>

              <p className="text-white/60 text-xs text-center px-8">
                Download the image and upload it to your Instagram Story. 
                Don't forget to tag <span className="text-primary font-bold">#SecretHearts</span>!
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-auto px-4 py-8 glass-card border-t border-primary/10 text-center">
        <div className="flex items-center justify-center gap-2 text-primary mb-2">
          <Heart className="w-5 h-5 fill-primary" />
          <span className="font-bold text-xl">Secret Hearts</span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-4">© 2026 Secret Hearts University. Made with love for the dreamers.</p>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
          <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase: Waiting for Keys'}
          </span>
        </div>
      </footer>

      {/* Floating Action Button */}
      {view !== 'compose' && (
        <motion.button 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setView('compose')}
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/50 flex items-center justify-center z-50"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      )}
    </div>
  );
}

interface ConfessionCardProps {
  confession: Confession;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  isActiveAudio: boolean;
  onToggleAudio: () => void;
  onReaction: (type: keyof NonNullable<Confession['reactions']>) => void;
  onReply: (content: string) => Promise<boolean>;
  onShare: () => void;
}

function ConfessionCard({ confession, isLiked, isBookmarked, onLike, onBookmark, isActiveAudio, onToggleAudio, onReaction, onReply, onShare }: ConfessionCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyContent) return;
    setIsSendingReply(true);
    const success = await onReply(replyContent);
    if (success) {
      setReplyContent('');
      setShowReplyForm(false);
      alert("Your anonymous reply has been whispered to the poster.");
    }
    setIsSendingReply(false);
  };

  const reactions = confession.reactions || { feltThis: 0, stayStrong: 0, beautiful: 0, magical: 0 };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Heart className="w-24 h-24 fill-primary" />
      </div>
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-primary font-bold text-xl">To: {confession.to}</h3>
            {confession.mood && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {confession.mood}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">From: {confession.from} • {confession.timestamp}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {confession.isTrending && (
            <div className="px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Trending
            </div>
          )}
          {confession.secretCode && (
            <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
              Code: {confession.secretCode}
            </div>
          )}
        </div>
      </div>

      <p className="text-slate-800 text-2xl leading-relaxed italic font-cursive">
        "{confession.content}"
      </p>

      {confession.music && (
        <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between border border-primary/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleAudio}
              className="bg-primary w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              {isActiveAudio ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>
            <div>
              <p className="text-slate-900 font-bold text-sm">{confession.music.title}</p>
              <p className="text-slate-500 text-xs font-medium">{confession.music.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActiveAudio && (
              <div className="flex gap-0.5 items-end h-3">
                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-primary" />
                <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-primary" />
                <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-0.5 bg-primary" />
              </div>
            )}
            <Sparkles className="w-5 h-5 text-primary/40" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button onClick={() => onReaction('feltThis')} className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition-all flex items-center gap-2 group/react">
          <span className="text-sm group-hover/react:scale-125 transition-transform">💗</span>
          <span className="text-[10px] font-bold text-slate-500 group-hover/react:text-rose-600">{reactions.feltThis}</span>
        </button>
        <button onClick={() => onReaction('stayStrong')} className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all flex items-center gap-2 group/react">
          <span className="text-sm group-hover/react:scale-125 transition-transform">🥺</span>
          <span className="text-[10px] font-bold text-slate-500 group-hover/react:text-blue-600">{reactions.stayStrong}</span>
        </button>
        <button onClick={() => onReaction('beautiful')} className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-pink-50 border border-slate-100 hover:border-pink-200 transition-all flex items-center gap-2 group/react">
          <span className="text-sm group-hover/react:scale-125 transition-transform">🌹</span>
          <span className="text-[10px] font-bold text-slate-500 group-hover/react:text-pink-600">{reactions.beautiful}</span>
        </button>
        <button onClick={() => onReaction('magical')} className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-2 group/react">
          <span className="text-sm group-hover/react:scale-125 transition-transform">💫</span>
          <span className="text-[10px] font-bold text-slate-500 group-hover/react:text-indigo-600">{reactions.magical}</span>
        </button>

        <button 
          onClick={onShare}
          className="ml-auto p-2 rounded-full hover:bg-primary/10 text-slate-400 hover:text-primary transition-all flex items-center gap-2"
          title="Share to Instagram"
        >
          <Instagram className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Share Story</span>
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-primary/5">
        <div className="flex gap-6">
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-bold">{confession.comments || 0}</span>
          </button>
          <button 
            onClick={onLike}
            className="flex items-center gap-2 group/btn"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-primary text-primary scale-110' : 'text-slate-400 group-hover/btn:text-primary'} transition-all`} />
            <span className="text-slate-600 text-sm font-bold">
              {isLiked ? (confession.likes + 1) : confession.likes}
            </span>
          </button>
        </div>
        <button 
          onClick={onBookmark}
          className={`${isBookmarked ? 'text-primary' : 'text-slate-400'} hover:text-primary transition-colors`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showReplyForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              <div className="relative">
                <textarea 
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none text-sm resize-none"
                  placeholder="Whisper an anonymous reply..."
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <button 
                  onClick={handleReplySubmit}
                  disabled={isSendingReply || !replyContent}
                  className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-lg shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> This reply is private and anonymous. Only the poster can see it.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
