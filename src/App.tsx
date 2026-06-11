/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Comanda, Friend, UserProfile } from './types';
import { INITIAL_COMANDAS } from './data';
import Home from './components/Home';
import Details from './components/Details';
import Reports from './components/Reports';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { Receipt, FileText, LayoutDashboard } from 'lucide-react';

export default function App() {
  // Local storage state initialization hooks
  const [comandas, setComandas] = useState<Comanda[]>(() => {
    const saved = localStorage.getItem('split_comandas');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_COMANDAS; }
    }
    return INITIAL_COMANDAS;
  });

  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('split_user_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (_) {}
    }
    // Set default initial profiles corresponding to LUCAS, MARIA, JOÃO SILVA, PEDRO (JOÃO is Admin by default)
    return [
      { id: '1', name: 'LUCAS', email: 'lucas@email.com', pixKey: '', phone: '', avatar: '' },
      { id: '2', name: 'MARIA', email: 'maria@email.com', pixKey: '', phone: '', avatar: '' },
      { id: '3', name: 'JOÃO SILVA', email: 'joao.silva@email.com', pixKey: '+55 11 98765-4321', phone: '', avatar: '', isAdmin: true },
      { id: '4', name: 'PEDRO', email: 'pedro@email.com', pixKey: '', phone: '', avatar: '' },
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('split_active_profile_id') || '3';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('split_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return {
      name: 'JOÃO SILVA',
      email: 'joao.silva@email.com',
      pixKey: '+55 11 98765-4321',
      avatar: ''
    };
  });

  // Dynamically derive the active split friends representation from the profiles list
  const friends: Friend[] = profiles.map((p, idx) => {
    const abbreviated = p.name ? p.name.trim().charAt(0).toUpperCase() : '?';
    const hexColors = ['#00E676', '#FF3B30', '#00B0FF', '#FFD600', '#AA00FF', '#FF6D00'];
    const color = p.id === '3' || p.name.toUpperCase().includes('JOÃO') ? '#b28623' : hexColors[idx % hexColors.length];
    return {
      id: p.id || `friend-${idx}`,
      name: p.name.toUpperCase(),
      avatar: abbreviated,
      color: color
    };
  });

  // Navigation controllers
  const [activeTab, setActiveTab] = useState<'comandas' | 'relatorios' | 'dashboard'>('comandas');
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  // Shared access mode check from URL
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const parsedModo = searchParams?.get('modo');
  const parsedExpira = searchParams?.get('expira');
  
  const isSharedMode = typeof window !== 'undefined' && (
    parsedModo === 'relatorio' || 
    parsedModo === 'dashboard' ||
    window.location.search.includes('shared=true')
  );

  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');

  useEffect(() => {
    if (parsedExpira) {
      const expirationTime = Number(parsedExpira);
      if (isNaN(expirationTime)) return;

      const updateTimer = () => {
        const now = Date.now();
        const diff = expirationTime - now;
        if (diff <= 0) {
          setIsExpired(true);
          setTimeRemainingStr('EXPIRADO');
        } else {
          setIsExpired(false);
          const totalSeconds = Math.floor(diff / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          
          const pad = (num: number) => String(num).padStart(2, '0');
          setTimeRemainingStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [parsedExpira]);

  const [isIdentityUnlocked, setIsIdentityUnlocked] = useState(() => {
    return localStorage.getItem('split_identity_unlocked') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsIdentityUnlocked(localStorage.getItem('split_identity_unlocked') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const isAutoOwner = activeProfile?.email?.trim().toLowerCase() === 'erariodigital@gmail.com';
  const isAdmin = activeProfile?.isAdmin === true || isAutoOwner || isIdentityUnlocked;
  
  // Sync state changes with local storage securely
  useEffect(() => {
    localStorage.setItem('split_comandas', JSON.stringify(comandas));
  }, [comandas]);

  useEffect(() => {
    localStorage.setItem('split_user_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('split_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem('split_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Handlers for state updates across components
  const handleUpdateComanda = (updated: Comanda) => {
    setComandas(prevcomandas =>
      prevcomandas.map(c => (c.id === updated.id ? updated : c))
    );
  };

  const handleAddManualComanda = (name: string) => {
    const newComanda: Comanda = {
      id: `manual-comanda-${Date.now()}`,
      name: name.toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      code: `TAB #${Math.floor(1000 + Math.random() * 9000)}`,
      isPaid: false,
      serviceFeePercent: 10,
      items: []
    };
    
    setComandas(prev => [newComanda, ...prev]);
    setSelectedComandaId(newComanda.id);
  };

  const handleAddFriendGlobal = (name: string) => {
    const newId = `profile-${Date.now()}`;
    const newProfile: UserProfile = {
      id: newId,
      name: name.trim().toUpperCase(),
      email: `${name.trim().toLowerCase()}@email.com`,
      pixKey: '',
      phone: '',
      avatar: ''
    };
    setProfiles(prev => [...prev, newProfile]);
  };

  const handleResetApp = () => {
    localStorage.clear();
    setComandas([]); // Set comandas to empty, physically ready for the next outing
    setProfiles([
      { id: '1', name: 'LUCAS', email: 'lucas@email.com', pixKey: '', phone: '', avatar: '' },
      { id: '2', name: 'MARIA', email: 'maria@email.com', pixKey: '', phone: '', avatar: '' },
      { id: '3', name: 'JOÃO SILVA', email: 'joao.silva@email.com', pixKey: '+55 11 98765-4321', phone: '', avatar: '' },
      { id: '4', name: 'PEDRO', email: 'pedro@email.com', pixKey: '', phone: '', avatar: '' },
    ]);
    setActiveProfileId('3');
    setUserProfile({
      name: 'JOÃO SILVA',
      email: 'joao.silva@email.com',
      pixKey: '+55 11 98765-4321',
      avatar: ''
    });
    setActiveTab('comandas');
    setSelectedComandaId(null);
  };

  // Render the appropriate component
  const renderScreen = () => {
    if (isSharedMode) {
      if (isExpired) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 relative select-none h-full">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.01]">
              <div className="text-[6rem] font-sans font-extrabold text-slate-900 rotate-[-25deg] whitespace-nowrap uppercase tracking-widest">
                Acesso Expirado
              </div>
            </div>
            
            <div className="z-10 bg-white border border-slate-200 p-8 rounded-3xl shadow-elegant max-w-sm w-full flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 shadow-sm">
                <span className="text-2xl">⏳</span>
              </div>
              
              <h2 className="text-slate-950 font-sans font-black text-sm uppercase tracking-wider mb-2">
                Acesso Temporário Expirado
              </h2>
              <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider mb-6 leading-relaxed">
                Este link de leitura temporário expirou devido ao limite de tempo definido pelo organizador. Solicite um novo link de acesso para continuar.
              </p>
              
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-left font-sans text-[8.5px] font-bold text-slate-400 uppercase tracking-widest space-y-1">
                <div className="flex justify-between">
                  <span>Status do Link:</span>
                  <span className="text-rose-500 font-extrabold">Expirado</span>
                </div>
                <div className="flex justify-between">
                  <span>Hora Atual:</span>
                  <span className="text-slate-750 font-mono text-[9px]">{new Date().toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (parsedModo === 'dashboard') {
        return (
          <Dashboard
            comandas={comandas}
            friends={friends}
            isSharedMode={true}
          />
        );
      }

      return (
        <Reports
          comandas={comandas}
          friends={friends}
          isSharedMode={true}
        />
      );
    }

    if (selectedComandaId) {
      const activeComanda = comandas.find(c => c.id === selectedComandaId);
      if (activeComanda) {
        return (
          <Details
            comanda={activeComanda}
            friends={friends}
            userPixKey={userProfile.pixKey}
            onBack={() => setSelectedComandaId(null)}
            onUpdateComanda={handleUpdateComanda}
            onAddFriendGlobal={handleAddFriendGlobal}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            isAdmin={isAdmin}
          />
        );
      }
    }

    switch (activeTab) {
      case 'comandas':
        return (
          <Home
            comandas={comandas}
            friends={friends}
            onSelectComanda={(id) => setSelectedComandaId(id)}
            onAddManualComanda={handleAddManualComanda}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            isAdmin={isAdmin}
          />
        );
      case 'relatorios':
        return (
          <Reports
            comandas={comandas}
            friends={friends}
            onBackToHome={() => setActiveTab('comandas')}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            comandas={comandas}
            friends={friends}
            onBackToHome={() => setActiveTab('comandas')}
          />
        );
      default:
        return null;
    }
  };

  // Hide the navigation footer when actively scanning or editing a comanda item list, or in shared view mode
  const hideFooter = isSharedMode;

  return (
    <div className="h-screen h-[100dvh] w-screen bg-slate-100 text-slate-800 font-sans flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
      
      {/* Structured adaptive responsive wrapper container */}
      <div 
        className="w-full h-full md:h-[92vh] md:max-w-xl lg:max-w-4xl md:shadow-elegant-lg md:border md:border-slate-200/80 md:rounded-2xl bg-slate-50 flex flex-col relative overflow-hidden transition-all duration-300"
      >
        
        {/* Render actual active frame flow */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isSharedMode && parsedExpira && !isExpired && (
            <div className="bg-amber-500 border-b border-amber-600 text-slate-950 px-4 py-2 text-center text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 shrink-0 select-none">
              <span>⏱️</span>
              <span>O LINK DE ACESSO EXPIRA EM:</span>
              <span className="bg-slate-900 text-white rounded px-2 py-0.5 font-mono text-[10px] font-black tracking-normal">
                {timeRemainingStr}
              </span>
            </div>
          )}
          {renderScreen()}
        </div>

        {/* Bottom Navigation tab container - elevation aesthetics match prompts */}
        {!hideFooter && (
          <div className="flex bg-white px-4 pb-3 pt-2.5 border-t border-slate-100 shadow-sm z-15 select-none items-center justify-around shrink-0">
            
            {/* Comandas tab */}
            <button
              onClick={() => {
                setActiveTab('comandas');
                setSelectedComandaId(null);
              }}
              className={`flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer transition-all py-1 rounded-xl ${
                activeTab === 'comandas' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex h-6 items-center justify-center">
                <Receipt size={19} className={activeTab === 'comandas' ? 'stroke-[2.2px]' : 'stroke-[1.8px]'} />
              </div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider">Comandas</span>
            </button>

            {/* Reports tab */}
            <button
              onClick={() => {
                setActiveTab('relatorios');
                setSelectedComandaId(null);
              }}
              className={`flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer transition-all py-1 rounded-xl ${
                activeTab === 'relatorios' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex h-6 items-center justify-center">
                <FileText size={19} className={activeTab === 'relatorios' ? 'stroke-[2.2px]' : 'stroke-[1.8px]'} />
              </div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider">Relatórios</span>
            </button>

            {/* Dashboard tab */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedComandaId(null);
              }}
              className={`flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer transition-all py-1 rounded-xl ${
                activeTab === 'dashboard' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex h-6 items-center justify-center">
                <LayoutDashboard size={19} className={activeTab === 'dashboard' ? 'stroke-[2.2px]' : 'stroke-[1.8px]'} />
              </div>
              <span className="font-sans text-[10px] uppercase font-bold tracking-wider">Dashboard</span>
            </button>

          </div>
        )}

      </div>

      {/* Modern Sidebar Drawer integration */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        onResetApp={handleResetApp}
        activeComanda={selectedComandaId ? comandas.find(c => c.id === selectedComandaId) : null}
        onUpdateComanda={handleUpdateComanda}
        profiles={profiles}
        setProfiles={setProfiles}
        activeProfileId={activeProfileId}
        setActiveProfileId={setActiveProfileId}
      />

    </div>
  );
}
