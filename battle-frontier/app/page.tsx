'use client';

import React, { useState } from 'react';
import { Play, Zap, Terminal, Swords } from 'lucide-react';
import { MatchModal } from '@/components/MatchModel';
import { Navbar } from '@/components/shared/Navbar';
import { BrowserMockup } from '@/components/home/BrowserMockup';

export default function Home() {
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('create');
  
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">
      
      <Navbar setIsMatchModalOpen={setIsMatchModalOpen} setActiveTab={setActiveTab}/>

      <MatchModal 
        isOpen={isMatchModalOpen} 
        onClose={() => setIsMatchModalOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="pt-12 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-10">

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Step into the Arena <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Let Your Code Speak!
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            The ultimate 1v1 coding battleground. Challenge developers worldwide, 
            climb the ELO leaderboard, and prove your algorithmic mastery.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setIsMatchModalOpen(true)}
              className="cursor-pointer w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              <Swords size={18} />
              Find Match
            </button>
          </div>
        </div>

        <BrowserMockup />

      </main>
    </div>
  );
}
