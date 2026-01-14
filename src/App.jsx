import React, { useState, useEffect } from 'react';
import { api } from './api';
import ReactMarkdown from 'react-markdown';
import { 
  SignedIn, SignedOut, SignInButton, UserButton, useUser 
} from "@clerk/clerk-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  ArrowRight, Sparkles, PenTool, X, Grid, 
  TrendingUp, Activity, LogOut, Target, Plus, Trash2, Maximize2
} from 'lucide-react';

export default function App() {
  const [isDemo, setIsDemo] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-black selection:bg-black selection:text-white font-sans">
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        {isDemo ? (
          <Dashboard isDemo={true} onExitDemo={() => setIsDemo(false)} />
        ) : (
          <LandingPage onEnterDemo={() => setIsDemo(true)} />
        )}
      </SignedOut>
    </div>
  );
}

// --- LANDING PAGE ---
function LandingPage({ onEnterDemo }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in duration-700">
      <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tighter mb-8 leading-[0.85]">
        Mind<br/><span className="text-orange-600">Scribe.</span>
      </h1>
      <p className="text-xl md:text-2xl font-medium max-w-2xl leading-relaxed mb-12">
        The nonsense-free cognitive journal. <br/>
        Capture thoughts. Analyze patterns. No fluff.
      </p>
      <div className="flex flex-col md:flex-row gap-6">
        <SignInButton mode="modal">
          <button className="bg-black text-white px-10 py-4 text-lg font-bold uppercase tracking-widest hover:bg-orange-600 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
            Get Started
          </button>
        </SignInButton>
        <button onClick={onEnterDemo} className="bg-white text-black px-10 py-4 text-lg font-bold uppercase tracking-widest hover:bg-gray-100 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black">
          Try Demo Mode
        </button>
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard({ isDemo = false, onExitDemo }) {
  const { user } = useUser();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals & Popups
  const [showChat, setShowChat] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);
  
  // Chat
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  
  // Selection & Goals
  const [selectedIds, setSelectedIds] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  useEffect(() => { loadData(); }, []);

  const getUserId = () => isDemo ? 'demo_user' : (user ? user.id : 'demo_user');

  const loadData = async () => {
    try {
      const userId = getUserId();
      const e = await api.getEntries(userId);
      setEntries(e.data);
      const g = await api.getGoals(userId);
      setGoals(g.data);
    } catch (err) { console.error(err); }
  };

  // --- ACTIONS ---
  const handleLog = async () => {
    if (!newEntry.trim()) return;
    setLoading(true);
    await api.createEntry(getUserId(), newEntry);
    setNewEntry('');
    await loadData();
    setLoading(false);
  };

  const handleDeleteEntry = async (id, e) => {
    e.stopPropagation(); 
    if(window.confirm("Delete this entry?")) {
      await api.deleteEntry(id);
      await loadData();
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    await api.createGoal(getUserId(), newGoalTitle);
    setNewGoalTitle('');
    await loadData();
  };

  const handleDeleteGoal = async (id) => {
    await api.deleteGoal(id);
    await loadData();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchAnalyze = async () => {
    if (!selectedIds.length) return;
    setLoading(true);
    await api.analyzeBatch(selectedIds);
    setSelectedIds([]); 
    await loadData();
    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMsg('');
    const context = entries.slice(0, 5).map(e => e.content).join(" | ");
    const res = await api.chat(userMsg, context);
    setChatHistory(prev => [...prev, { role: 'ai', text: res.data.reply }]);
  };

  // --- TIME FIX (FORCE IST) ---
  // Helper: Force the browser to treat the string as UTC if missing 'Z'
  const ensureUTC = (dateString) => {
    if (!dateString) return new Date();
    // If string looks like "2026-01-14T16:00:00" append "Z" to make it UTC
    if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) {
      return new Date(dateString + 'Z');
    }
    return new Date(dateString);
  };

  const formatTimeIST = (dateString) => {
    return ensureUTC(dateString).toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateIST = (dateString) => {
    return ensureUTC(dateString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short'
    });
  };

  // --- CHART DATA ---
  const chartData = [...entries].reverse().map(e => ({
    date: formatDateIST(e.created_at),
    score: e.mood_score
  })).filter(e => e.score > 0);

  return (
    <div className="pb-32 animate-in fade-in duration-500 relative">
      
      {/* HEADER */}
      <header className="px-6 py-10 md:py-16 max-w-6xl mx-auto border-b-2 border-black flex justify-between items-start">
        <div>
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter leading-[0.9] mb-4">
            Hello, <br/>
            <span className="text-orange-600">
              {isDemo ? 'Demo User' : (user?.firstName || 'Writer')}.
            </span>
          </h1>
        </div>
        
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <button onClick={() => setShowGoalsModal(true)} className="group flex items-center gap-2 border-2 border-black px-5 py-2 font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            <Target size={18} /> Targets
          </button>
          <button onClick={() => setShowChat(true)} className="hidden md:flex group items-center gap-2 border-2 border-black px-5 py-2 font-bold hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            <Sparkles size={18} /> AI Insight
          </button>
          {isDemo ? (
             <button onClick={onExitDemo} className="flex items-center gap-2 border-2 border-black rounded-full px-4 py-2 hover:bg-gray-200 transition-colors text-sm font-bold">
               <LogOut size={16} /> Exit
             </button>
          ) : (
            <div className="border-2 border-black rounded-full p-1 hover:bg-orange-200 transition-colors">
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </header>

      {/* FIXED: MOVING MARQUEE */}
      <div className="border-b-2 border-black overflow-hidden bg-white whitespace-nowrap py-3 flex relative">
        <div className="animate-marquee flex gap-12 px-4 font-mono text-sm font-bold uppercase tracking-widest min-w-full">
          {goals.length > 0 ? [...goals, ...goals, ...goals].map((g, i) => ( 
            <span key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full border border-black"></span> 
              {g.title}
            </span>
          )) : (
             <span className="flex items-center gap-2 text-gray-400">// NO TARGETS SET // CLICK 'TARGETS' TO ADD</span>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 mt-12 space-y-20">

        {/* CHART */}
        {chartData.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                <Activity className="text-orange-600"/> Emotional Velocity
              </h2>
            </div>
            <div className="h-[300px] w-full border-2 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FA5515" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FA5515" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontFamily: 'Space Grotesk', fontSize: 12, fill: '#666'}} dy={10} />
                  <YAxis hide domain={[0, 10]} />
                  <Tooltip contentStyle={{backgroundColor: '#fff', border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontFamily: 'Space Grotesk'}} />
                  <Area type="monotone" dataKey="score" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" dot={{ stroke: 'black', strokeWidth: 2, fill: 'white', r: 4 }} activeDot={{ stroke: 'black', strokeWidth: 2, fill: '#FA5515', r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        ) : null}

        {/* INPUT */}
        <section className="relative">
          <div className="absolute -top-6 -left-6 text-9xl font-serif opacity-5 select-none pointer-events-none">Write</div>
          <div className="border-2 border-black bg-white p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <textarea 
              className="w-full p-6 text-xl md:text-2xl font-serif outline-none resize-none placeholder:text-gray-300 min-h-[160px]"
              placeholder="What are you thinking right now?"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
            />
            <div className="flex justify-between items-center px-6 py-4 border-t-2 border-black/10 bg-gray-50">
              <div className="flex gap-2 text-xs font-mono text-gray-400 uppercase tracking-widest pt-2">Markdown Supported</div>
              <button onClick={handleLog} disabled={loading || !newEntry.trim()} className="bg-black text-white px-8 py-3 font-bold text-sm tracking-widest uppercase hover:bg-orange-600 transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : 'Publish Entry'}
              </button>
            </div>
          </div>
        </section>

        {/* FEED */}
        <section className="space-y-12">
          <div className="flex items-center gap-4">
             <h2 className="text-4xl font-serif font-bold">Recent Logs</h2>
             <div className="h-1 flex-1 bg-black"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {entries.length === 0 && (
              <div className="col-span-2 text-center py-20 border-2 border-dashed border-gray-300">
                <p className="font-serif text-2xl text-gray-400">No entries yet.</p>
                <p className="text-gray-400 mt-2">Start writing to see your insights.</p>
              </div>
            )}
            
            {entries.map((entry) => {
              const isSelected = selectedIds.includes(entry.id);
              return (
                <div 
                  key={entry.id}
                  onClick={() => toggleSelect(entry.id)}
                  className={`group relative flex flex-col justify-between border-2 border-black bg-white p-8 cursor-pointer transition-all hover:-translate-y-2
                    ${isSelected ? 'shadow-[8px_8px_0px_0px_#FA5515] border-orange-600' : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}
                  `}
                >
                  {/* DELETE BUTTON */}
                  <button 
                    onClick={(e) => handleDeleteEntry(entry.id, e)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition-colors z-10 p-2"
                    title="Delete Entry"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div>
                    <div className="flex justify-between items-start mb-6 font-mono text-xs uppercase tracking-widest text-gray-500">
                      <span>{formatDateIST(entry.created_at)}</span>
                      <span>{formatTimeIST(entry.created_at)}</span>
                    </div>
                    <p className="text-lg md:text-xl font-medium leading-relaxed mb-6 line-clamp-6">{entry.content}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pt-6 border-t-2 border-black/5">
                      {entry.mood_score > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-black text-white px-3 py-1 text-sm font-bold uppercase">{entry.mood_label}</span>
                          <span className="font-mono text-xs font-bold text-gray-400">SCORE: {entry.mood_score}/10</span>
                        </div>
                      ) : <span className="text-sm font-bold text-gray-400">UNANALYZED</span>}
                      
                      <div className={`w-6 h-6 border-2 border-black flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'group-hover:bg-gray-100'}`}>
                        {isSelected && <ArrowRight size={16} />}
                      </div>
                    </div>

                    {/* EXPANDABLE AI NOTE */}
                    {entry.goal_analysis && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); setExpandedNote(entry.goal_analysis); }}
                        className="bg-[#FFFDF5] border border-black/10 p-4 relative hover:bg-orange-50 transition-colors group/note cursor-zoom-in"
                      >
                        <div className="absolute -top-3 left-4 bg-[#FFFDF5] px-2 text-xs font-bold text-orange-600 flex items-center gap-1 border border-black/10">
                          <PenTool size={12} /> AI NOTE
                        </div>
                        <p className="text-sm font-serif italic text-gray-800 line-clamp-2">"{entry.goal_analysis}"</p>
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                          <Maximize2 size={14} className="text-orange-600"/>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FLOATING ACTION DOCK */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40">
          <div className="bg-black text-white p-2 pl-6 pr-2 shadow-2xl flex items-center gap-8 border-2 border-black animate-in slide-in-from-bottom-4">
            <span className="font-mono text-sm font-bold">{selectedIds.length} SELECTED</span>
            <button onClick={handleBatchAnalyze} disabled={loading} className="bg-white text-black px-6 py-3 font-bold uppercase hover:bg-orange-500 hover:text-white transition-colors border-2 border-transparent hover:border-black">
              {loading ? 'Processing...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      )}

      {/* CHAT MODAL (MARKDOWN SUPPORTED) */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-[#F8F7F4] flex flex-col animate-in fade-in duration-200">
          <div className="px-6 py-6 border-b-2 border-black flex justify-between items-center bg-white">
            <h2 className="text-3xl font-serif font-black">AI Assistant</h2>
            <button onClick={() => setShowChat(false)} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-20 space-y-8 bg-white/50">
             {chatHistory.length === 0 && (
               <div className="text-center opacity-30 mt-20">
                 <h3 className="text-6xl font-serif font-bold mb-4">Talk to me.</h3>
                 <p className="text-xl">I've read your journal. I can find patterns.</p>
               </div>
             )}
             {chatHistory.map((msg, i) => (
               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-3xl text-lg p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] prose prose-lg
                   ${msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-black'}
                 `}>
                   {/* RENDER MARKDOWN HERE */}
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
               </div>
             ))}
          </div>
          <div className="p-6 md:p-10 border-t-2 border-black bg-white">
            <div className="max-w-4xl mx-auto relative">
              <input 
                className="w-full bg-transparent text-2xl md:text-3xl font-serif border-b-2 border-black/20 focus:border-black outline-none py-4 pr-16 placeholder:text-gray-300"
                placeholder="Ask a question..."
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
              />
              <button onClick={handleChat} className="absolute right-0 top-1/2 -translate-y-1/2 p-3 hover:bg-black hover:text-white rounded-full transition-colors">
                <TrendingUp size={32} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOALS MODAL */}
      {showGoalsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowGoalsModal(false)}>
           <div className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-3xl font-serif font-black">Targets</h3>
               <button onClick={() => setShowGoalsModal(false)}><X size={24}/></button>
             </div>
             <div className="flex gap-2 mb-8">
               <input className="flex-1 border-2 border-black p-3 font-mono text-sm outline-none focus:bg-gray-50" placeholder="ADD NEW GOAL..." value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddGoal()} />
               <button onClick={handleAddGoal} className="bg-black text-white px-4 border-2 border-black hover:bg-orange-600 hover:border-orange-600 transition-colors"><Plus size={20} /></button>
             </div>
             <div className="space-y-3 max-h-[300px] overflow-y-auto">
               {goals.length === 0 && <p className="text-gray-400 font-mono text-center py-4">NO TARGETS SET.</p>}
               {goals.map(g => (
                 <div key={g.id} className="flex justify-between items-center p-3 border-2 border-gray-100 hover:border-black transition-colors group">
                   <span className="font-medium">{g.title}</span>
                   <button onClick={() => handleDeleteGoal(g.id)} className="text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {/* EXPANDED NOTE POPUP */}
      {expandedNote && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setExpandedNote(null)}>
          <div className="bg-[#FFFDF5] max-w-2xl w-full p-8 md:p-12 border-2 border-black shadow-[12px_12px_0px_0px_#FA5515] relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-4 left-8 bg-black text-white px-4 py-1 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <PenTool size={14}/> AI Analysis
            </div>
            <button onClick={() => setExpandedNote(null)} className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white rounded-full transition-colors"><X size={24}/></button>
            <div className="prose prose-lg font-serif italic leading-loose text-gray-800">
               "{expandedNote}"
            </div>
          </div>
        </div>
      )}

    </div>
  );
}