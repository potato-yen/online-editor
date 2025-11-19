// frontend/src/layouts/AppLayout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import SettingsMenu from '../components/SettingsMenu';
import { useAccountActions } from '../hooks/useAccountActions';

interface AppLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

export default function AppLayout({ children, user, onLogout }: AppLayoutProps) {
  const location = useLocation();
  
  // 取得使用者首字 (Avatar 用)
  const username = user?.user_metadata?.username || user?.email || '?';
  const initial = username.charAt(0).toUpperCase();
  const { onModifyUsername, onChangePassword, onDeleteAccount } = useAccountActions();

  return (
    <div className="flex h-screen w-full bg-surface-base overflow-hidden">
      {/* --- Left Sidebar --- */}
      <aside className="w-64 flex-shrink-0 border-r border-border-base bg-surface-layer flex flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-border-base">
          <div className="flex items-center gap-2 text-brand-DEFAULT">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-bold text-content-primary tracking-tight">Online Editor</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            to="/projects" 
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/projects' 
                ? "bg-brand-muted text-brand-DEFAULT" 
                : "text-content-secondary hover:bg-surface-panel hover:text-content-primary"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
            My Projects
          </Link>
          
          <SettingsMenu
            placement="right"
            onModifyUsername={onModifyUsername}
            onChangePassword={onChangePassword}
            onDeleteAccount={onDeleteAccount}
            renderTrigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-panel hover:text-content-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            )}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border-base">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-brand-active flex items-center justify-center text-white text-sm font-bold shadow-md">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary truncate">
                {username}
              </p>
              <p className="text-xs text-content-secondary truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium text-content-secondary hover:text-status-error hover:bg-status-error/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Gradient Decoration */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-surface-layer to-transparent pointer-events-none" />
        <div className="flex-1 overflow-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
