export const Badge = ({ children, color }: { children: React.ReactNode; color: 'green' | 'yellow' | 'red' | 'blue' }) => {
  const styles = {
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-rose-100 text-rose-700 border-rose-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[color]}`}>
      {children}
    </span>
  );
};

export const PlayerCard = ({ name, isOpponent = false, timeLeft, status }: { name: string, isOpponent?: boolean, timeLeft: string, status: string }) => (
  <div className={`flex items-center justify-between px-4 py-3 ${isOpponent ? 'bg-rose-50/50 border-b border-rose-100' : 'bg-slate-50 border-t border-slate-200'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg shadow-sm border-2 ${isOpponent ? 'border-rose-200' : 'border-blue-200'} overflow-hidden bg-white`}>
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
          alt={name}
          className="w-full h-full object-cover" 
        />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
          {name || 'Waiting...'}
          {/* {name && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">1200</span>} */}
        </p>
        <p className="text-xs text-slate-400 font-medium">
            {isOpponent ? 'Opponent' : 'You'} • <span className={status === 'RACING' ? 'text-green-600' : 'text-slate-400'}>{status}</span>
        </p>
      </div>
    </div>
    <div className={`font-mono text-xl font-bold px-3 py-1 rounded-md border shadow-sm transition-colors ${
        isOpponent 
            ? 'bg-white text-slate-400 border-slate-200' 
            : 'bg-slate-800 text-white border-slate-700'
    }`}>
        {timeLeft}
    </div>
  </div>
);