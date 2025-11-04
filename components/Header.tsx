
import React from 'react';
import { User, UserRole } from '../types';
import { Tab } from '../App';

interface HeaderProps {
  user: User;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const baseNavItems: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'archive', label: 'Archive' },
  ];

  const adminNavItems: { id: Tab; label: string }[] = [
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  const navItems = user.role === UserRole.ADMIN ? [...baseNavItems, ...adminNavItems] : baseNavItems;


  return (
    <header className="bg-slate-800/50 backdrop-blur-md shadow-lg sticky top-0 z-10 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-xl text-cyan-400">Gemini Tracker</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-300">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
             <button
                onClick={onLogout}
                className="ml-4 px-3 py-1.5 text-sm bg-slate-700 hover:bg-red-600/50 text-slate-300 hover:text-white rounded-md transition-colors"
                aria-label="Logout"
              >
                Logout
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
