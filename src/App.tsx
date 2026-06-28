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
  // UTF-8 Base64 Decoding Helper to read shared state in the access link
  const decodeSharedData = (base64Str: string) => {
    try {
      const decodedCharBytes = atob(base64Str).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('');
      const decodedStr = decodeURIComponent(decodedCharBytes);
      const parsed = JSON.parse(decodedStr);
      if (parsed && Array.isArray(parsed.comandas)) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse shared URL state data:', e);
    }
    return null;
  };

  // Shared access mode validation & custom URL parsing block
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const parsedModo = searchParams?.get('modo');
  const parsedExpira = searchParams?.get('expira');
  const parsedData = searchParams?.get('data');
  
  const isSharedMode = typeof window !== 'undefined' && (
    parsedModo === 'relatorio' || 
    parsedModo === 'dashboard' ||
    window.location.search.includes('shared=true')
  );

  const sharedData = isSharedMode && parsedData ? decodeSharedData(parsedData) : null;

  // Local storage state initialization hooks
  const [comandas, setComandas] = useState<Comanda[]>(() => {
    if (isSharedMode && sharedData && Array.isArray(sharedData.comandas)) {
      return sharedData.comandas;
    }
    const saved = localStorage.getItem('split_comandas');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_COMANDAS; }
    }
    return INITIAL_COMANDAS;
  });

  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    if (isSharedMode && sharedData && Array.isArray(sharedData.profiles)) {
      return sharedData.profiles;
    }
    const saved = localStorage.getItem('split_user_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (_) {}
    }
    // Starts empty! Permitting first registration as Leader.
    return [];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('split_active_profile_id') || '';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('split_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return {
      name: '',
      email: '',
      pixKey: '',
      avatar: ''
    };
  });

  // Dynamically derive the active split friends representation from the profiles list
  const friends: Friend[] = profiles.map((p, idx) => {
    const abbreviated = p.name ? p.name.trim().charAt(0).toUpperCase() : '?';
    const hexColors = ['#00E676', '#FF3B30', '#00B0FF', '#FFD600', '#AA00FF', '#FF6D00'];
    const color = p.isLeader || idx === 0 ? '#b28623' : hexColors[idx % hexColors.length];
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
  const isLeader = activeProfile?.isLeader === true || (profiles.length > 0 && profiles[0]?.id === activeProfile?.id);
  const isAutoOwner = activeProfile?.email?.trim().toLowerCase() === 'erariodigital@gmail.com';
  const isAdmin = !isSharedMode || isIdentityUnlocked;
  
  // Sync state changes with local storage securely
  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem('split_comandas', JSON.stringify(comandas));
    }
  }, [comandas, isSharedMode]);

  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem('split_user_profiles', JSON.stringify(profiles));
    }
  }, [profiles, isSharedMode]);

  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem('split_active_profile_id', activeProfileId);
    }
  }, [activeProfileId, isSharedMode]);

  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem('split_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile, isSharedMode]);

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
    setProfiles([]); // Clear all profiles as well so they can register their Leader initially
    setActiveProfileId('');
    setUserProfile({
      name: '',
      email: '',
      pixKey: '',
      avatar: ''
    });
    setActiveTab('comandas');
    setSelectedComandaId(null);
  };

  // Render the appropriate component
  const renderScreen = () => {
    if (profiles.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 relative overflow-y-auto no-scrollbar">
          <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden flex items-center justify-center">
            <span className="text-[10rem] font-black rotate-12 select-none text-slate-900">SPLIT</span>
          </div>

          <div className="z-10 bg-white border border-slate-200 p-6 rounded-3xl shadow-elegant max-w-sm w-full">
            <div className="size-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 shadow-sm mx-auto">
              <span className="text-2xl font-black">★</span>
            </div>
            
            <h2 className="text-slate-950 font-sans font-black text-xs uppercase tracking-widest mb-1.5">
              Cadastrar Perfil Líder
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-5 leading-normal">
              Crie o perfil principal do rolê. Apenas o Líder poderá adicionar novos perfis e alterar moedas.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const leadName = (formData.get('leadName') as string || '').trim().toUpperCase();
              const leadEmail = (formData.get('leadEmail') as string || '').trim().toLowerCase();
              const leadPix = (formData.get('leadPix') as string || '').trim();
              const leadPhone = (formData.get('leadPhone') as string || '').trim();

              if (!leadName || !leadEmail) return;

              const newId = `profile-${Date.now()}`;
              const newProfile: UserProfile = {
                id: newId,
                name: leadName,
                email: leadEmail,
                pixKey: leadPix,
                phone: leadPhone,
                avatar: '',
                isLeader: true,
                isAdmin: true
              };

              setProfiles([newProfile]);
              setActiveProfileId(newId);
              setUserProfile(newProfile);

              localStorage.setItem('split_user_profiles', JSON.stringify([newProfile]));
              localStorage.setItem('split_active_profile_id', newId);
              localStorage.setItem('split_user_profile', JSON.stringify(newProfile));
            }} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="font-sans text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Nome Completo do Líder *
                </label>
                <input
                  type="text"
                  name="leadName"
                  required
                  placeholder="EX: LUIZ ERARIO"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  E-mail do Líder *
                </label>
                <input
                  type="email"
                  name="leadEmail"
                  required
                  placeholder="EX: ERARIODIGITAL@GMAIL.COM"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Chave PIX de Reembolso (Opcional)
                </label>
                <input
                  type="text"
                  name="leadPix"
                  placeholder="EX: CPF, CONTATO OU CHAVE ALEATÓRIA"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  name="leadPhone"
                  placeholder="EX: (11) 98765-4321"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-sans font-extrabold text-[10px] uppercase py-3 rounded-xl tracking-wider cursor-pointer active:scale-95 transition-all shadow-md text-center"
              >
                Criar Perfil Líder do Rolê
              </button>
            </form>
          </div>
        </div>
      );
    }

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
    <div className="h-screen h-[100dvh] w-screen bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-sans flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
      
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
