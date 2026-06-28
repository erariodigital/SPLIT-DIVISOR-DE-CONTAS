/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Comanda } from '../types';
import { X, Save, AlertTriangle, Check, ShieldAlert, Coins, Plus, Trash2, QrCode, Phone, Mail, Upload, Smartphone, Sparkles, RefreshCw, Lock, Unlock, KeyRound } from 'lucide-react';
import { CURRENCIES, identifyCurrency } from '../utils/currency';
import brandLogo from '../assets/images/split_logo_processed.png';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetApp: () => void;
  activeComanda?: Comanda | null;
  onUpdateComanda?: (comanda: Comanda) => void;
  profiles: UserProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  activeProfileId: string;
  setActiveProfileId: React.Dispatch<React.SetStateAction<string>>;
}

export default function Sidebar({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onResetApp,
  activeComanda,
  onUpdateComanda,
  profiles,
  setProfiles,
  activeProfileId,
  setActiveProfileId
}: SidebarProps) {

  // Editor component states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  
  const [isSaved, setIsSaved] = useState(false);
  const [isExchangeUpdated, setIsExchangeUpdated] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Custom states for interactive modules
  const [showQrCode, setShowQrCode] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };
  
  // Fixed Logo representing the physical branding
  const appLogo = brandLogo;
  const logoError = false;

  // Sync editor values when selecting a different profile or updating profiles list
  useEffect(() => {
    const active = profiles.find(p => p.id === activeProfileId) || profiles[0];
    if (active) {
      setName(active.name);
      setEmail(active.email);
      setPixKey(active.pixKey);
      setPhone(active.phone || '');
      setAvatar(active.avatar || '');
      setShowQrCode(false); // Reset QR Code display on selection switch
    }
  }, [activeProfileId, profiles]);

  // Sync state with parent App.tsx when the active profile changes
  useEffect(() => {
    const active = profiles.find(p => p.id === activeProfileId) || profiles[0];
    if (active) {
      onUpdateProfile(active);
    }
  }, [activeProfileId, profiles, onUpdateProfile]);

  // Save all profiles helper to sync with Local Storage
  const handleSaveAllProfiles = (updatedProfiles: UserProfile[], nextActiveId: string) => {
    setProfiles(updatedProfiles);
    setActiveProfileId(nextActiveId);
    localStorage.setItem('split_user_profiles', JSON.stringify(updatedProfiles));
    localStorage.setItem('split_active_profile_id', nextActiveId);
  };

  // Profile CRUD: SAVE CHANGES
  const handleSaveProfile = () => {
    const updated = profiles.map(p => {
      if (p.id === activeProfileId) {
        return {
          id: p.id,
          name: name.trim() || 'Usuário',
          email: email.trim() || 'usuario@email.com',
          pixKey: pixKey.trim(),
          phone: phone.trim(),
          avatar
        };
      }
      return p;
    });
    handleSaveAllProfiles(updated, activeProfileId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Profile CRUD: CREATE NEW
  const handleCreateProfile = () => {
    const newId = `profile-${Date.now()}`;
    const newProfile: UserProfile = {
      id: newId,
      name: 'NOVO INTEGRANTE',
      email: 'integrante@email.com',
      pixKey: '',
      phone: '',
      avatar: ''
    };
    const updated = [...profiles, newProfile];
    handleSaveAllProfiles(updated, newId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Profile CRUD: DELETE SPONTANEOUS PROFILE
  const handleDeleteCurrentProfile = () => {
    const profileToDelete = profiles.find(p => p.id === activeProfileId);
    if (!profileToDelete) return;

    if (profileToDelete.isLeader || (profiles.length > 0 && profiles[0]?.id === profileToDelete.id)) {
      setDeleteError('O perfil Líder não pode ser excluído individualmente. Use "Zerar Dados" para recomeçar.');
      setTimeout(() => setDeleteError(''), 5000);
      return;
    }

    const remaining = profiles.filter(p => p.id !== activeProfileId);
    const nextActive = remaining[0]?.id || '';
    handleSaveAllProfiles(remaining, nextActive);
    setShowDeleteProfileModal(false);
  };

  // Avatar choices helper
  const pickSampleAvatar = (num: number) => {
    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop'
    ];
    setAvatar(avatars[num]);
  };

  // Dynamic PIX Payload Creator for genuine scanning feedback
  const getPixQRUrl = () => {
    const sanitizedKey = pixKey.trim().replace(/[^a-zA-Z0-9@+.-]/g, '');
    const payload = `00020101021126360014BR.GOV.BCB.PIX0114${sanitizedKey}5204000053039865802BR5915COMANDAS SYSTEM6009COMANDAPP62070503***6304`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload)}`;
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const isCurrentSessionLeader = true;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 animate-fade-in"
        id="sidebar-overlay"
      />

      {/* Drawer Container */}
      <div 
        className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[350px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out border-r border-slate-200"
        id="sidebar-drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-sans font-extrabold text-xs text-indigo-700 tracking-wider uppercase bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
              Painel Geral
            </span>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center justify-center size-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs active:scale-95 cursor-pointer"
            id="sidebar-close-btn"
          >
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">

          {/* Premium Handcrafted Gold Coin Logo representing the physical branding */}
          <div className="p-4 bg-gradient-to-br from-[#271a06] to-[#120a01] text-white rounded-2xl flex flex-col items-center justify-center gap-3 border border-[#b28623]/45 shadow-lg shadow-amber-955/20 overflow-hidden relative">
            {/* Soft Shimmer Reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-pulse pointer-events-none" />
            
            <div className="w-20 h-20 rounded-full border-2 border-[#b28623]/60 bg-gradient-to-br from-[#271a06] to-[#120a01] p-0.5 flex items-center justify-center shadow-lg shadow-amber-955/40 overflow-hidden shrink-0 relative transition-transform hover:scale-105 duration-300">
              <img 
                src={appLogo || '/logo.png'} 
                alt="Logo Split" 
                className="size-full object-cover rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </div>
            
            <div className="text-center">
              <span className="font-display font-black text-xs tracking-wider bg-gradient-to-r from-[#fef3c7] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent uppercase leading-none block">
                Comanda Split
              </span>
              <span className="text-[7.5px] font-sans font-black text-[#fef3c7]/50 tracking-widest uppercase block mt-1">
                Pizza • Beer • Mountains
              </span>
            </div>
          </div>

          {/* DYNAMIC EXCHANGE CONTROL (If Comanda is open, protected for Leader ONLY) */}
          <div className="p-4 bg-amber-50/20 border border-amber-200/60 rounded-2xl flex flex-col gap-3 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-amber-200/40 pb-2">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-[#b28623] shrink-0" />
                <span className="font-sans text-[10px] font-bold text-slate-705 uppercase tracking-widest leading-none">
                  Moeda & Câmbio da Comanda
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isCurrentSessionLeader ? (
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[6.5px] font-black uppercase px-1 py-0.5 rounded flex items-center gap-0.5" title="Acesso liberado para o Líder">
                    <Unlock size={8} strokeWidth={3} />
                    Líder
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-800 text-[6.5px] font-extrabold uppercase px-1 py-0.5 border border-amber-200 rounded flex items-center gap-0.5 animate-pulse" title="Acesso restrito ao Líder">
                    <Lock size={8} strokeWidth={3} />
                    Bloqueado
                  </span>
                )}
              </div>
            </div>

            {!isCurrentSessionLeader ? (
              <div className="bg-amber-50/55 border border-amber-100/50 p-3 rounded-xl flex flex-col gap-1.5 items-center text-center">
                <p className="text-[8.5px] text-amber-800 font-extrabold uppercase tracking-widest">
                  Configuração Restrita ao Líder
                </p>
                <p className="text-[8px] text-slate-500 font-bold uppercase leading-relaxed">
                  Apenas o Líder Geral do Rolê tem permissão para alterar taxas cambiais e moedas das comandas.
                </p>
              </div>
            ) : !activeComanda ? (
              <div className="p-2 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[8.5px] text-slate-450 font-bold uppercase tracking-wider">
                  Nenhuma comanda em edição no momento
                </p>
                <p className="text-[7.5px] text-slate-400 font-medium uppercase leading-normal mt-0.5">
                  Abra uma comanda clicando nela para editar suas taxas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Selector dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-[9px] font-bold text-slate-404 uppercase tracking-wider">
                    Moeda Original
                  </label>
                  <select
                    value={activeComanda.currency || 'BRL'}
                    onChange={(e) => {
                      const nextCurr = e.target.value;
                      const nextRate = CURRENCIES[nextCurr]?.defaultRate || 1.0;
                      onUpdateComanda?.({
                        ...activeComanda,
                        currency: nextCurr,
                        exchangeRate: nextRate
                      });
                      setIsExchangeUpdated(true);
                      setTimeout(() => setIsExchangeUpdated(false), 2000);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-1"
                  >
                    {Object.values(CURRENCIES).map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rate edit (if non-BRL) */}
                {(activeComanda.currency || 'BRL') !== 'BRL' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Taxa de Câmbio em Real
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          const currentCurr = activeComanda.currency || 'USD';
                          const originalDefault = CURRENCIES[currentCurr]?.defaultRate || 1.0;
                          onUpdateComanda?.({
                            ...activeComanda,
                            exchangeRate: originalDefault
                          });
                          setIsExchangeUpdated(true);
                          setTimeout(() => setIsExchangeUpdated(false), 2000);
                        }}
                        className="text-[8px] text-amber-600 hover:text-amber-800 hover:underline font-bold uppercase cursor-pointer"
                      >
                        Restaurar Padrão
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[10px] font-bold text-slate-400">R$</span>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={activeComanda.exchangeRate || 1.0}
                        onChange={(e) => {
                          const nextRate = parseFloat(e.target.value) || 1.0;
                          onUpdateComanda?.({
                            ...activeComanda,
                            exchangeRate: nextRate
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Auto identify */}
                <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-bold text-amber-850 uppercase truncate">
                    {(activeComanda.currency || 'BRL') === 'BRL'
                      ? 'Comanda em BRL no Brasil.'
                      : `Câmbio: R$ ${(activeComanda.exchangeRate || 1.0).toFixed(2).replace('.', ',')}`
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const identified = identifyCurrency(activeComanda.name);
                      const defaultRate = CURRENCIES[identified]?.defaultRate || 1.0;
                      onUpdateComanda?.({
                        ...activeComanda,
                        currency: identified,
                        exchangeRate: defaultRate
                      });
                      setIsExchangeUpdated(true);
                      setTimeout(() => setIsExchangeUpdated(false), 2000);
                    }}
                    className="bg-white hover:bg-amber-50/30 border border-amber-300 text-amber-700 text-[8.5px] font-sans font-extrabold uppercase px-2 py-1 rounded-lg tracking-wider cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
                    title="Analisar nome do estabelecimento para atualizar moeda"
                  >
                    Auto-Identificar
                  </button>
                </div>

                {isExchangeUpdated && (
                  <span className="text-[8px] text-emerald-600 font-bold uppercase text-center tracking-wide block animate-fade-in -mt-1">
                    Taxa Atualizada na Comanda!
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Banner de Sucesso para Perfil ou câmbio */}
          {isSaved && (
            <div className="bg-emerald-550 text-white p-3 px-4 rounded-xl font-sans text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-md shadow-emerald-500/15 animate-fade-in">
              <Check size={14} className="stroke-[2.5]" />
              <span>Alterações Registradas!</span>
            </div>
          )}



          {/* APPEARANCE SECTION */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <span className="font-sans text-[10.5px] font-extrabold text-slate-400 tracking-wider uppercase block">
              Aparência
            </span>
            <button
              onClick={toggleTheme}
              className="text-[9px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase transition-all active:scale-95 cursor-pointer"
            >
              {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          </div>

          {/* PERFIL SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans text-[10.5px] font-extrabold text-slate-400 tracking-wider uppercase block">
                Configurações de Perfil
              </span>
              {isCurrentSessionLeader && (
                <button
                  type="button"
                  onClick={handleCreateProfile}
                  className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-650 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 uppercase transition-all active:scale-95 cursor-pointer"
                  title="Cadastrar Novo Perfil"
                >
                  <Plus size={10} className="stroke-[3]" />
                  <span>Novo</span>
                </button>
              )}
            </div>

            {/* Profile Selection Dropdown */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-205 flex flex-col gap-2">
              <label className="font-sans text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Perfil Ativo ou Em Edição
              </label>
              <div className="flex gap-2">
                <select
                  value={activeProfileId}
                  onChange={(e) => setActiveProfileId(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-700 uppercase focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {profiles.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {p.name || 'Sem Nome'} {p.isLeader || idx === 0 ? '★ LÍDER' : '• AMIGO'}
                    </option>
                  ))}
                </select>

                {isCurrentSessionLeader && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setShowDeleteProfileModal(true);
                    }}
                    className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Excluir Perfil Selecionado"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Editor Input Fields */}
            <div className="space-y-3.5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  disabled={!isCurrentSessionLeader}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: LUIZ ERARIO"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Endereço de E-mail
                </label>
                <div className="relative flex items-center">
                  <Mail size={13} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    disabled={!isCurrentSessionLeader}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EX: ERARIODIGITAL@GMAIL.COM"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-9 pr-3.5 py-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Telefone / WhatsApp
                </label>
                <div className="relative flex items-center">
                  <Phone size={13} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    disabled={!isCurrentSessionLeader}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="EX: (11) 98765-4321"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-9 pr-3.5 py-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Chave PIX with dynamic QR code capability */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Chave PIX para Reembolso
                </label>
                <input
                  type="text"
                  value={pixKey}
                  disabled={!isCurrentSessionLeader}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="EX: CPF, CELULAR OU CHAVE ALEATÓRIA"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-505 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-705 disabled:opacity-75 disabled:cursor-not-allowed"
                />

                {pixKey.trim() && (
                  <div className="flex flex-col gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-707 text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg border border-indigo-100 hover:border-indigo-200 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <QrCode size={12} />
                      <span>{showQrCode ? 'Ocultar QR Code Pix' : 'Gerar QR Code Pix'}</span>
                    </button>

                    {showQrCode && (
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex flex-col items-center gap-2.5 animate-fade-in shadow-inner">
                        <span className="font-sans text-[8.5px] font-black text-indigo-750 tracking-wider uppercase bg-white border border-slate-150 px-2 py-0.5 rounded-md shadow-2xs">
                          PIX ATIVO: REEMBOLSO RÁPIDO
                        </span>
                        
                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                          <img 
                            src={getPixQRUrl()} 
                            alt="QR Code Pix"
                            className="w-36 h-36 object-contain rounded-md"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="text-center">
                          <p className="font-sans text-[8px] font-semibold text-slate-400 uppercase tracking-wide">
                            Escaneie para transferir
                          </p>
                          <p className="font-mono text-[9px] text-slate-700 bg-white border border-slate-150 rounded-md py-1 px-2.5 mt-1 select-all break-all max-w-[210px] truncate">
                            {pixKey}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            {!isCurrentSessionLeader ? (
              <div className="bg-slate-100 border border-slate-200 text-slate-400 p-3.5 rounded-xl text-[9px] font-sans font-extrabold uppercase tracking-widest text-center flex items-center justify-center gap-1.5 leading-normal">
                <Lock size={12} className="stroke-[3] text-amber-500 shrink-0" />
                <span>Apenas o Líder pode salvar perfis</span>
              </div>
            ) : (
              <button
                onClick={handleSaveProfile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 font-sans font-extrabold text-[10px] uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex justify-center items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} />
                <span>Salvar Alterações do Perfil</span>
              </button>
            )}
          </div>

          {/* DANGER AREA WITH RESET */}
          <div className="pt-5 border-t border-dashed border-red-200 flex flex-col gap-3">
            <button
              onClick={() => setShowClearDataModal(true)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 px-4 font-sans font-extrabold text-[10px] uppercase tracking-wider shadow-md shadow-rose-600/15 transition-all flex justify-center items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trash2 size={12} />
              <span>Zerar Dados (Novo Rolê)</span>
            </button>
            <button
              onClick={() => setShowDeleteProfileModal(true)}
              className="font-sans text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest p-1 cursor-pointer transition-colors"
            >
              Excluir Perfil Atual
            </button>
          </div>
        </div>

        {/* Brand signature at bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <span className="font-sans text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            Comandas App v1.3
          </span>
        </div>
      </div>

      {/* Delete profile confirmation modal */}
      {showDeleteProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[300px] bg-white border border-slate-200 rounded-2xl shadow-elegant-lg p-5 flex flex-col gap-3 text-center animate-scale-up">
            <h3 className="font-sans font-bold text-sm text-slate-900 uppercase">
              Excluir este perfil?
            </h3>
            <p className="text-[10px] text-slate-500 uppercase leading-normal">
              Você tem certeza de que deseja apagar o perfil <strong className="text-slate-700">{name || 'Este Perfil'}</strong>?
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-100 text-red-650 p-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider leading-normal">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleDeleteCurrentProfile}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-sans font-bold text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                Sim, Excluir
              </button>
              <button
                onClick={() => setShowDeleteProfileModal(false)}
                className="flex-1 border border-slate-200 bg-white text-slate-600 py-2 rounded-xl font-sans font-bold text-[10px] uppercase hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Clear all data confirmation modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[300px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg p-5 flex flex-col gap-3 text-center animate-scale-up">
            <div className="size-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-sans font-bold text-sm text-slate-900 uppercase">
              Limpar tudo para Novo Rolê?
            </h3>
            <p className="text-[10px] text-slate-500 uppercase leading-normal">
              Isso apagará permanentemente todo o histórico de comandas e gastos para começar o próximo rolê do zero.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  onResetApp();
                  setShowClearDataModal(false);
                  onClose();
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-sans font-bold text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                Limpar Tudo
              </button>
              <button
                onClick={() => setShowClearDataModal(false)}
                className="flex-1 border border-slate-200 bg-white text-slate-600 py-2.5 rounded-xl font-sans font-bold text-[10px] uppercase hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
