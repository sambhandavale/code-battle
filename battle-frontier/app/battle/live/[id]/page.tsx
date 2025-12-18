'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Terminal, Play, Send, Settings, 
  Maximize2, Minimize2, RotateCcw, 
  CheckCircle2, 
  X,
  XCircle,
  Swords
} from 'lucide-react';
import axios from 'axios';
import { Badge, PlayerCard } from '@/components/battle/PlayerCard';
import toast, { Toaster } from 'react-hot-toast';
import { useStreamItem } from '@motiadev/stream-client-react';
import { api } from '@/lib/services/apiRequests';
import { Metadata } from 'next';

interface TestCaseResult {
    id: number;
    input: any;
    expected: any;
    actual: any;
    status: string;
    passed: boolean;
}

interface MatchStreamEvent {
  type: 'START_RACE' | 'GAME_OVER' | 'CODE_FEEDBACK' | 'PLAYER_JOINED';
  timestamp?: number;
  action?: 'RUN_TESTS' | 'SUBMIT_SOLUTION';
  startTime?: number;
  endTime?: number;
  winner?: string;
  playerId?: string;
  success?: boolean;
  error?: string;
  players?: string[];
  results?: TestCaseResult[];
}

interface MatchData {
  matchId: string;
  status: 'WAITING' | 'RACING' | 'FINISHED';
  players: string[];
  duration: number;
  startTime?: number;
  endTime?: number;
  problem: {
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    task: string;
    input_format: string;
    output_format: string;
    constraints: string;
    template: Record<string, string>;
    examples: any[];
  };
}

export default function BattlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [myNickname, setMyNickname] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('battle_nickname') || '';
        }
        return '';
    });

    // State
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Action States
    const [submitting, setSubmitting] = useState(false);
    const [running, setRunning] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{ success: boolean; msg?: string } | null>(null);
    const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);


    // Code & UI
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [timeLeft, setTimeLeft] = useState<string>("00:00");
    const [activeTab, setActiveTab] = useState<'desc' | 'cases'>('desc');
    const [matchResult, setMatchResult] = useState<string>('');

    const { data: latestMessage } = useStreamItem<MatchStreamEvent>({
        streamName: 'match',
        groupId: id,
        id: 'message'
    });

    useEffect(() => {
        if (!latestMessage) return;

        // Debugging: Check if timestamp is updating
        console.log("Stream Update:", latestMessage.timestamp, latestMessage.type);

        if (latestMessage.type === 'CODE_FEEDBACK' && latestMessage.playerId === myNickname) {
            
            // 🛑 Force stop loading states immediately when ANY feedback arrives for me
            toast.dismiss();
            setRunning(false);
            setSubmitting(false);

            // ... Process results ...
            if (latestMessage.action === 'RUN_TESTS') {
                setTestResults(latestMessage.results || []);
                setActiveTab('cases');
                if (latestMessage.success) toast.success("Tests Passed", { icon: '✅' });
                else toast.error("Tests Failed");
            } 
            else if (latestMessage.action === 'SUBMIT_SOLUTION') {
                if (latestMessage.success) {
                    toast.success("Accepted!", { icon: '🚀' });
                    setSubmissionResult({ success: true, msg: "All Test Cases Passed!" });
                } else {
                    toast.error("Solution Failed");
                    setTestResults(latestMessage.results || []);
                    setActiveTab('cases'); 
                    setSubmissionResult({ success: false, msg: latestMessage.error || "Wrong Answer" });
                }
            }
        }

        // B: Handle Player Joined
        if (latestMessage.type === 'PLAYER_JOINED') {
            if (latestMessage.players) {
                setMatchData((prev: any) => prev ? ({ ...prev, players: latestMessage.players! }) : null);
            }
            if (latestMessage.playerId !== myNickname) {
                toast(`${latestMessage.playerId} joined!`, { icon: '👋' });
            }
        }

        // C: Handle Game Over
        if (latestMessage.type === 'GAME_OVER') {
        setMatchData((prev: any) => prev ? ({ 
            ...prev, 
            status: 'FINISHED', 
            winnerId: latestMessage.winner || null 
        }) : null);

        if (latestMessage.winner === myNickname) {
            toast("🏆 You Won!", { icon: "🎉", duration: 5000 });
            setMatchResult('YOU WON');
        } else {
            toast("💀 You Lost", { icon: "🥀" });
            setMatchResult('YOU LOST');
        }
        }

        // D: Handle Race Start
        if (latestMessage.type === 'START_RACE') {
        setMatchData((prev: any) => prev ? ({ 
            ...prev, 
            status: 'RACING', 
            startTime: latestMessage.startTime || Date.now(), 
            endTime: latestMessage.endTime || 0 
        }) : null);
        toast("🏁 Race Started!", { icon: "go" });
        }

    }, [latestMessage, myNickname]);

    useEffect(() => {
        const fetchMatch = async () => {
            try {
                const data = await api.getAction<any>(`/match/${id}`);
                
                setMatchData(data);
                
                if (data.problem?.template?.javascript) {
                    setCode(data.problem.template.javascript);
                }
            } catch (error) {
                console.error("Failed to fetch match:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMatch();
    }, [id]);

    useEffect(() => {
        if (!matchData) return;
        if (matchData.status === 'FINISHED') {
            setTimeLeft("00:00");
            return; 
        }
        const calculateTime = () => {
        const now = Date.now();
        const end = matchData.endTime || 0; 
        if (matchData.status === 'WAITING') {
            const minutes = Math.floor((matchData.duration || 300000) / 60000);
            return `${minutes}:00`;
        }
        const diff = end - now;
        if (diff <= 0) return "00:00";
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };
        setTimeLeft(calculateTime() || "00:00");
        const interval = setInterval(() => {
            const timeString = calculateTime();
            setTimeLeft(timeString || "00:00");
            if (timeString === "00:00") clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [matchData]);

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        if (matchData?.problem?.template && matchData.problem.template[newLang]) {
            setCode(matchData.problem.template[newLang]);
        }
    };

    const handleRun = async () => {
        if (!matchData || !myNickname) return;
        
        setRunning(true);
        setTestResults(null); 
        toast.loading("Running test cases...", { duration: 8000 });
        
        try {
            // Uses the new utility name
            await api.postAction('/match/run', {
                matchId: matchData.matchId,
                playerId: myNickname,
                language,
                code,
                type: "RUN_TESTS"
            });
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to execute code");
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!matchData || !myNickname) return;
        
        setSubmitting(true);
        setSubmissionResult(null); 
        toast.loading("Submitting...", { duration: 10000 });

        try {
            // Uses the new utility name
            await api.postAction('/match/submit', {
                matchId: matchData.matchId,
                playerId: myNickname,
                language,
                code,
                type: "SUBMIT_SOLUTION"
            });
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to submit");
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 animate-pulse">Loading Arena...</div>;
    if (!matchData) return <div className="h-screen flex items-center justify-center text-rose-500 font-bold">Match not found or API error</div>;

    const { problem, players, status } = matchData;
    const opponentName = players.find((p: string) => p !== myNickname) || "Opponent";
    const isSpectator = !players.includes(myNickname);

    let statusDotClass = "bg-red-500";

    if (matchResult === 'YOU WON') {
        // Priority 1: Game Over - Won
        statusDotClass = "bg-emerald-500";
    } else if (matchResult === 'YOU LOST') {
        // Priority 2: Game Over - Lost
        statusDotClass = "bg-red-500";
    } else if (status === 'RACING') {
        // Priority 3: Game Active
        statusDotClass = "bg-emerald-500 animate-pulse";
    }

    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans relative">
            <Toaster position="top-center" />
            
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
                        <Swords size={20} />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">CodeBattle.</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 mx-2" />
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
                        {matchResult ? matchResult : status}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 border border-slate-200">
                    ID: {matchData.matchId}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* LEFT PANE: Description / Test Cases */}
                <div className="w-full md:w-5/12 lg:w-4/12 h-[40vh] md:h-auto flex flex-col bg-white border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h1 className="text-xl font-bold text-slate-900">{problem?.title}</h1>
                            <Badge color={problem?.difficulty === 'Easy' ? 'green' : problem?.difficulty === 'Medium' ? 'yellow' : 'red'}>
                                {problem?.difficulty || 'Easy'}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex border-b border-slate-100 px-5 gap-6 text-sm font-medium">
                        <button onClick={() => setActiveTab('desc')} className={`py-3 border-b-2 transition-colors ${activeTab === 'desc' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            Description
                        </button>
                        <button onClick={() => setActiveTab('cases')} className={`py-3 border-b-2 transition-colors ${activeTab === 'cases' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            {testResults ? 'Test Results' : 'Examples'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
                        {activeTab === 'desc' ? (
                            <div className="prose prose-sm max-w-none text-slate-600">
                                <p className="mb-4">{problem?.description}</p>
                                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-4 border border-blue-100">
                                    <strong>Task:</strong> {problem?.task}
                                </div>
                                <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 mt-6">Input Format</h3>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 font-mono text-xs">{problem?.input_format}</div>
                                <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 mt-6">Output Format</h3>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 font-mono text-xs">{problem?.output_format}</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {testResults ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-slate-800">Execution Results</h3>
                                            <button onClick={() => setTestResults(null)} className="text-xs text-blue-600 hover:underline">Clear</button>
                                        </div>
                                        {testResults.map((result, idx) => (
                                            <div key={idx} className={`border rounded-lg overflow-hidden ${result.passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                                                <div className="p-3 flex items-center gap-3 border-b border-black/5">
                                                    {result.passed ? <CheckCircle2 size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
                                                    <span className={`text-sm font-bold ${result.passed ? 'text-green-800' : 'text-red-800'}`}>Test Case {idx + 1}</span>
                                                    <span className="ml-auto text-xs font-mono opacity-70">{result.status}</span>
                                                </div>
                                                {!result.passed && (
                                                    <div className="p-3 text-xs space-y-2 bg-white/50">
                                                        <div className="grid grid-cols-[70px_1fr] gap-2">
                                                            <span className="font-semibold text-slate-500">Input:</span>
                                                            <code className="font-mono bg-slate-100 px-1 rounded">{JSON.stringify(result.input)}</code>
                                                        </div>
                                                        <div className="grid grid-cols-[70px_1fr] gap-2">
                                                            <span className="font-semibold text-slate-500">Expected:</span>
                                                            <code className="font-mono bg-slate-100 px-1 rounded">{JSON.stringify(result.expected)}</code>
                                                        </div>
                                                        <div className="grid grid-cols-[70px_1fr] gap-2">
                                                            <span className="font-semibold text-red-500">Actual:</span>
                                                            <code className="font-mono bg-red-50 text-red-700 px-1 rounded break-all">{JSON.stringify(result.actual)}</code>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    problem?.examples?.map((ex: any, idx: number) => (
                                        <div key={idx} className="group">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Example {idx + 1}</span>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                                <div className="p-3 border-b border-slate-100 grid grid-cols-[60px_1fr] gap-2">
                                                    <span className="text-xs font-semibold text-slate-500">Input:</span>
                                                    <code className="text-xs font-mono text-slate-800">{ex.input}</code>
                                                </div>
                                                <div className="p-3 grid grid-cols-[60px_1fr] gap-2">
                                                    <span className="text-xs font-semibold text-slate-500">Output:</span>
                                                    <code className="text-xs font-mono text-slate-800">{ex.output}</code>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Code Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative min-h-0">
                    <PlayerCard name={isSpectator ? players[0] : opponentName} isOpponent={true} timeLeft={timeLeft} status={status} />

                    <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md px-2 py-1.5 focus:outline-none"
                            >
                            {Object.keys(matchData.problem.template).map((lang) => (
                                <option key={lang} value={lang}>
                                {lang.toUpperCase()}
                                </option>
                            ))}
                            </select>

                            <button onClick={() => handleLanguageChange(language)} className="p-1.5 text-slate-400 hover:text-slate-600 transition"><RotateCcw size={14} /></button>
                        </div>
                    </div>

                    <div className="flex-1 relative min-h-0">
                        <Editor height="100%" language={language} value={code} theme="light" onChange={(value) => setCode(value || '')} options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', padding: { top: 16, bottom: 16 }, fontFamily: 'JetBrains Mono, monospace' }} />
                        {submissionResult && (
                            <div className={`absolute bottom-4 left-4 right-4 z-20 p-4 rounded-lg border shadow-xl flex justify-between items-start animate-in slide-in-from-bottom-2 ${submissionResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                <div>
                                    <strong className="block font-bold mb-1">{submissionResult.success ? 'Verdict: Accepted' : 'Verdict: Failed'}</strong>
                                    <p className="font-mono text-xs whitespace-pre-wrap">{submissionResult.msg}</p>
                                </div>
                                <button onClick={() => setSubmissionResult(null)} className="opacity-50 hover:opacity-100"><X size={16} /></button>
                            </div>
                        )}
                    </div>

                    <PlayerCard name={isSpectator ? players[1] : myNickname} isOpponent={false} timeLeft={timeLeft} status={status} />

                    <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
                        <div className="flex gap-3 ml-auto">
                            <button onClick={handleRun} disabled={running || submitting || isSpectator} className={`flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition ${(running) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {running ? 'Running...' : <><Play size={16} fill="currentColor" /> Run</>}
                            </button>
                            <button onClick={handleSubmit} disabled={submitting || running || isSpectator} className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-bold shadow-lg transition hover:translate-y-[-1px] ${submitting || isSpectator ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}>
                                {submitting ? 'Judging...' : <><Send size={16} /> Submit</>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const CodeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);