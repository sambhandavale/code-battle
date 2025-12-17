import { useState, useEffect } from "react";
import { Swords, X, Clock, Users, Copy, ArrowRight, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import { useStreamItem } from '@motiadev/stream-client-react';

// 👇 1. Extract Listener to a Sub-Component
// This component ONLY mounts when we have a valid Match ID.
// This guarantees the hook initializes with the correct ID from the very first render.
const MatchListener = ({ matchId }: { matchId: string }) => {
  const router = useRouter();

  const { data: streamData } = useStreamItem<{ type: string; players: string[] }>({
    streamName: 'match',
    groupId: matchId, // No 'dummy-group' logic needed here
    id: 'message'
  });

  useEffect(() => {
    if (streamData?.type === 'PLAYER_JOINED') {
        toast.success("Opponent Connected! Starting...", { icon: '⚔️' });
        setTimeout(() => {
            router.push(`/battle/live/${matchId}`);
        }, 500);
    }
  }, [streamData, matchId, router]);

  return null; // This component is invisible logic
};

export const MatchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [selectedTime, setSelectedTime] = useState(10);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  
  // Initialize nickname immediately to avoid empty string issues
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('battle_nickname') || '';
    return '';
  });
  
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!nickname.trim()) {
        toast.error("Please enter a nickname");
        return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Creating room...');

    try {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        localStorage.setItem('battle_nickname', nickname);

        const response = await fetch('http://localhost:3000/match/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: nickname, 
                matchId: randomCode,
                time: selectedTime
            }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        
        // 👇 This state change triggers the <MatchListener /> to mount
        setGeneratedCode(randomCode);
        
        toast.success('Room created!', { id: loadingToast });

    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (matchId: string) => {
    if (!nickname.trim()) {
        toast.error("Please enter a nickname");
        return;
    }
    if (!matchId) {
        toast.error("Please enter a Match ID");
        return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Joining match...');

    try {
      localStorage.setItem('battle_nickname', nickname);

      const response = await fetch('http://localhost:3000/match/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: nickname, 
          matchId: matchId 
        }),
      });

      if (!response.ok) throw new Error(`Invalid Code or Room Full`);

      const data = await response.json();
      toast.success('Joined successfully!', { id: loadingToast });
      
      router.push(`/battle/live/${matchId}`);

    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Could not join room.", { id: loadingToast });
    } finally {
        setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
        navigator.clipboard.writeText(generatedCode);
        toast.success("Code copied!");
    }
  };

  const showNicknameInput = !generatedCode || activeTab === 'join';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* 👇 2. Render the listener conditionally */}
      {/* It only exists (and connects) once we have a code */}
      {generatedCode && <MatchListener matchId={generatedCode} />}

      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Start a Battle</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-slate-50 m-5 rounded-xl border border-slate-100">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Create Match
          </button>
          <button 
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'join' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Join Match
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">

          {/* Nickname Input */}
          {showNicknameInput && (
             <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Your Nickname</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Enter your name"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300 transition"
                    />
                </div>
             </div>
          )}
          
          {/* CREATE TAB CONTENT */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {!generatedCode ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Select Duration</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[5, 10, 20].map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition ${
                            selectedTime === time 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-slate-100 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          <Clock size={16} className={selectedTime === time ? 'text-blue-600' : 'text-slate-400'} />
                          {time} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreate}
                    disabled={isLoading || !nickname}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 ${(isLoading || !nickname) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Creating...' : <>Generate Room Code <ArrowRight size={16} /></>}
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Users size={28} className="text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-1">Room Created!</h4>
                  <p className="text-slate-500 text-sm mb-6">Share this code with <strong>{nickname}</strong>'s opponent</p>
                  
                  <div 
                    onClick={copyToClipboard}
                    className="bg-slate-100 border-2 border-slate-200 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition group"
                  >
                    <span className="font-mono text-2xl font-bold text-slate-800 tracking-widest">{generatedCode}</span>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 flex items-center gap-1">
                      <Copy size={14} /> COPY
                    </span>
                  </div>
                  
                  <p className="mt-6 text-xs text-slate-400 animate-pulse">Waiting for opponent to join...</p>
                </div>
              )}
            </div>
          )}

          {/* JOIN TAB CONTENT */}
          {activeTab === 'join' && (
            <div className="space-y-6">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Enter Room Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. X8J-9L2"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300 transition"
                  />
               </div>
               
               <button 
                onClick={() => handleJoin(joinCode)}
                className={`w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${(isLoading || !nickname || joinCode.length < 3) ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={joinCode.length < 3 || isLoading || !nickname}
               >
                 {isLoading ? 'Joining...' : <>Join Battle <Swords size={16} /></>}
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};