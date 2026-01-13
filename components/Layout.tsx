import React from 'react';
import { LayoutDashboard, Store, Vote, LogOut } from 'lucide-react';
import { ViewState, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  currentUser: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, currentUser }) => {
  return (
    <div className="min-h-screen bg-brand-offwhite relative overflow-hidden flex flex-col md:flex-row">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0">
         <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#203863" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
         </svg>
      </div>
      
      {/* Sidebar Navigation */}
      <aside className="bg-brand-dark text-white w-full md:w-64 flex-shrink-0 z-20 shadow-2xl flex flex-col md:h-screen sticky top-0">
        <div className="p-6 border-b border-brand-light/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center text-brand-dark font-bold text-xl">
            M
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">myslide</h1>
            <p className="text-xs text-brand-light">نظام الطلبات</p>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setCurrentView('home')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'home' ? 'bg-brand-light text-brand-dark font-bold' : 'hover:bg-white/10 text-white'}`}
              >
                <Store size={20} />
                <span>الرئيسية</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('voting')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'voting' ? 'bg-brand-light text-brand-dark font-bold' : 'hover:bg-white/10 text-white'}`}
              >
                <Vote size={20} />
                <span>التصويت والاقتراحات</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'admin' ? 'bg-brand-light text-brand-dark font-bold' : 'hover:bg-white/10 text-white'}`}
              >
                <LayoutDashboard size={20} />
                <span>لوحة التحكم</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Only show profile if user is NOT the fallback 'guest' */}
        {currentUser && currentUser.id !== 'guest' && (
            <div className="p-4 border-t border-brand-light/20 bg-black/20">
            <div className="flex items-center gap-3">
                <img src={currentUser.avatar || "https://picsum.photos/40"} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-brand-light" />
                <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-xs text-brand-light truncate">موظف</p>
                </div>
            </div>
            </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-60px)] md:h-screen relative z-10 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;