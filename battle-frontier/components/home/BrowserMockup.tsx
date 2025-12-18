import { Play, Terminal } from "lucide-react";

const PlayerHeader = ({ name, elo, time, avatarSeed, isOpponent = false, status }: any) => (
  <div className={`flex items-center justify-between p-2 md:p-3 ${isOpponent ? 'bg-red-50/50' : 'bg-blue-50/50'} border-b border-slate-100`}>
    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
      <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-lg overflow-hidden border-2 ${isOpponent ? 'border-red-200' : 'border-blue-200'} bg-white`}>
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={name} />
      </div>
      <div className="min-w-0"> {/* min-w-0 required for truncate to work in flex child */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
          {/* <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium hidden sm:inline-block ${isOpponent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {elo}
          </span> */}
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
          {status === 'typing' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>}
          {status}
        </p>
      </div>
    </div>
    
    {/* Chess Clock Style Timer */}
    <div className={`font-mono text-lg md:text-xl font-bold px-2 md:px-3 py-1 rounded-md shadow-sm border shrink-0 ${
      isOpponent 
        ? 'bg-white text-slate-400 border-slate-200' 
        : 'bg-slate-800 text-white border-slate-800'
    }`}>
      {time}
    </div>
  </div>
);

export const BrowserMockup = () => {
  return (
    <div className="relative mt-8 md:mt-12 mx-auto w-full max-w-6xl animate-fade-in-up px-2 md:px-4">
      
      {/* Browser Window Frame */}
      {/* Changed h-[600px] to h-auto with min-height constraints */}
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col h-auto md:h-[600px]">
        
        {/* Match Header */}
        <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 justify-between items-center px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
             <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
             <span className="hidden sm:inline">Connected</span>
             <span className="text-slate-300 hidden sm:inline">|</span>
             <span>Ping: 24ms</span>
          </div>
          <div className="bg-slate-200 px-3 py-1 rounded text-[10px] md:text-xs font-bold text-slate-600 truncate max-w-[150px] md:max-w-none">
            RANKED • 10 MIN
          </div>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
          </div>
        </div>

        {/* Main Layout: Stacked on Mobile (flex-col), Side-by-side on Desktop (md:flex-row) */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          
          {/* LEFT PANE: Description */}
          {/* w-full on mobile, 40% on desktop */}
          {/* Added h-[300px] for mobile scroll area */}
          <div className="w-full md:w-[40%] flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-white h-[300px] md:h-auto shrink-0">
            <div className="p-4 md:p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-slate-800">1. Two Sum</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Easy</span>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Given an array of integers <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">nums</code> and an integer <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">target</code>, return indices of the two numbers...
              </p>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Example 1:</p>
                <div className="font-mono text-xs text-slate-700 space-y-1">
                  <p><span className="text-slate-400">Input:</span> nums = [2,7,11,15], target = 9</p>
                  <p><span className="text-slate-400">Output:</span> [0,1]</p>
                </div>
              </div>
            </div>
            
            {/* Bottom Tabs */}
            <div className="mt-auto border-t border-slate-100 p-2 flex gap-2 text-xs font-medium text-slate-500 shrink-0 overflow-x-auto">
              <button className="bg-slate-100 px-3 py-1.5 rounded text-slate-700 whitespace-nowrap">Description</button>
              <button className="px-3 py-1.5 rounded whitespace-nowrap">Editorial</button>
              <button className="px-3 py-1.5 rounded whitespace-nowrap">Submissions</button>
            </div>
          </div>

          {/* RIGHT PANE: Editor */}
          {/* w-full on mobile, 60% on desktop */}
          <div className="w-full md:w-[60%] flex flex-col bg-slate-50 h-[500px] md:h-auto min-h-0">
            
            <PlayerHeader 
              name="Natali Craig" 
              elo="1485" 
              time="09:12" 
              avatarSeed="Natali" 
              isOpponent={true} 
              status="Thinking..."
            />

            {/* Code Editor Area */}
            <div className="flex-1 bg-white p-4 font-mono text-xs md:text-sm overflow-y-auto relative min-h-[200px]">
               {/* Line Numbers */}
               <div className="absolute left-0 top-4 w-8 md:w-10 text-right text-slate-300 select-none pr-2 md:pr-3 text-[10px] md:text-xs leading-6">
                  1<br/>2<br/>3<br/>4<br/>5
               </div>
               
               {/* Code Content */}
               <div className="pl-8 md:pl-10 leading-6 overflow-x-auto whitespace-nowrap md:whitespace-normal">
                  <p><span className="text-purple-600">class</span> <span className="text-yellow-600">Solution</span> <span className="text-slate-500">{' { '}</span></p>
                  <p>&nbsp;&nbsp;<span className="text-purple-600">public</span> <span className="text-blue-600">int[]</span> <span className="text-yellow-600">twoSum</span>(<span className="text-blue-600">int[]</span> nums, <span className="text-blue-600">int</span> target) <span className="text-slate-500">{' { '}</span></p>
                  <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-400">// Your code here...</span></p>
                  <div className="flex items-center">
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-600">int</span> complement = target - nums[i];</span>
                    <div className="w-0.5 h-5 bg-slate-800 ml-0.5 animate-pulse"></div>
                  </div>
                  <p>&nbsp;&nbsp;<span className="text-slate-500">{' } '}</span></p>
                  <p><span className="text-slate-500">{' } '}</span></p>
               </div>
            </div>

            <PlayerHeader 
              name="Orlando Diggs" 
              elo="1540" 
              time="09:45" 
              avatarSeed="Orlando" 
              isOpponent={false} 
              status="Writing code"
            />

            {/* Action Bar */}
            <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center shrink-0">
              <button className="text-slate-500 text-xs font-medium flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-50">
                <Terminal size={14} /> <span className="hidden sm:inline">Console</span>
              </button>
              <div className="flex gap-2">
                <button className="px-3 md:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                  Run
                </button>
                <button className="px-4 md:px-6 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-600/20">
                  <Play size={12} fill="currentColor" /> Submit
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Notification */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-4 md:px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 md:gap-4 animate-fade-in z-20 w-[90%] md:w-auto justify-center">
         <div className="text-2xl md:text-3xl">⚔️</div>
         <div>
            <p className="font-bold text-sm md:text-lg">Battle Started</p>
            <p className="text-[10px] md:text-xs text-slate-300">Win by passing all test cases first.</p>
         </div>
      </div>
    </div>
  )
}