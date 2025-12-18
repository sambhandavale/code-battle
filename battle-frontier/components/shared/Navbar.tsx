import { Swords, Zap } from "lucide-react";

export const Navbar = ({setIsMatchModalOpen,setActiveTab}:{
    setIsMatchModalOpen:React.Dispatch<React.SetStateAction<boolean>>;
    setActiveTab:React.Dispatch<React.SetStateAction<string>>;
}) => (
    <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-slate-100/50">
        <div className="flex items-center gap-2">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
            <Swords size={20} />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">CodeBattle.</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-slate-500 font-medium text-sm">
            <div onClick={()=>{setIsMatchModalOpen(true);setActiveTab('join')}} className="cursor-pointer hover:text-blue-600 transition">Join</div>
            <div onClick={()=>{setIsMatchModalOpen(true);setActiveTab('create')}} className="cursor-pointer flex items-center gap-1 text-orange-500 bg-orange-50 px-4 py-2 rounded-xl text-xs font-bold">Create</div>
        {/* <a href="#" className="hover:text-blue-600 transition">Tournaments</a> */}
        {/* <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-full text-xs font-bold">
            <Zap size={12} fill="currentColor" />
            <span>PRO</span>
        </div> */}
        </div>
    </nav>
);