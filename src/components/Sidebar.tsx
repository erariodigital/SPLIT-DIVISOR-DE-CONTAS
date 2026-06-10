/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Comanda } from '../types';
import { X, Save, AlertTriangle, Check, ShieldAlert, Coins, Plus, Trash2, QrCode, Phone, Mail, Upload, Smartphone, Sparkles, RefreshCw, Image } from 'lucide-react';
import { CURRENCIES, identifyCurrency } from '../utils/currency';
import brandLogo from '../assets/images/split_brutalist_logo_1781082679930.png';

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
  
  // Custom states for interactive modules
  const [showQrCode, setShowQrCode] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  
  // Custom Dynamic persist logo states
  const [appLogo, setAppLogo] = useState<string>(() => {
    return localStorage.getItem('split_custom_app_logo') || brandLogo;
  });
  const [logoSuccessMsg, setLogoSuccessMsg] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAppLogo(base64String);
        localStorage.setItem('split_custom_app_logo', base64String);
        window.dispatchEvent(new Event('storage'));
        setLogoSuccessMsg(true);
        setTimeout(() => setLogoSuccessMsg(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setAppLogo(brandLogo);
    localStorage.removeItem('split_custom_app_logo');
    window.dispatchEvent(new Event('storage'));
    setLogoSuccessMsg(true);
    setTimeout(() => setLogoSuccessMsg(false), 3000);
  };

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
      name: 'NOVO PERFIL',
      email: 'novo.perfil@email.com',
      pixKey: '',
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    };
    const updated = [...profiles, newProfile];
    handleSaveAllProfiles(updated, newId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Profile CRUD: DELETE SPONTANEOUS PROFILE
  const handleDeleteCurrentProfile = () => {
    if (profiles.length <= 1) {
      // If there's only 1 profile left, reset it back to empty starting values instead of empty list
      const fallback: UserProfile = {
        id: 'profile-initial',
        name: 'JOÃO SILVA',
        email: 'joao.silva@email.com',
        pixKey: '+55 11 98765-4321',
        phone: '',
        avatar: ''
      };
      handleSaveAllProfiles([fallback], 'profile-initial');
    } else {
      const remaining = profiles.filter(p => p.id !== activeProfileId);
      const nextActive = remaining[0].id || 'profile-initial';
      handleSaveAllProfiles(remaining, nextActive);
    }
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
                src={appLogo} 
                alt="Logo Split" 
                className="size-full object-cover rounded-full"
                referrerPolicy="no-referrer"
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

          {/* SEÇÃO DE LOGO & IDENTIDADE DO APLICATIVO */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3.5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2">
              <Smartphone size={15} className="text-indigo-650 shrink-0" />
              <span className="font-sans text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-none">
                Identidade do App (Celular)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Actual Image Source representation */}
              <div className="size-16 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shadow-md overflow-hidden shrink-0 group relative">
                <img 
                  src={appLogo} 
                  alt="Logo Split" 
                  className="size-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold text-slate-800 uppercase block leading-tight">
                  Ícone do App
                </span>
                <p className="text-[8.5px] text-slate-400 uppercase tracking-wide leading-relaxed mt-0.5">
                  Esta foto de identificação representará SPLIT quando adicionado à home do celular.
                </p>
              </div>
            </div>

            {/* Inputs & Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {/* Custom File Upload Button */}
                <label className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-bold text-[9px] uppercase tracking-wider py-2 px-3 rounded-xl border border-indigo-150 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <Upload size={12} />
                  <span>Fazer Upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </label>

                {/* Reset button only if non-default custom logo is active */}
                {appLogo !== brandLogo && (
                  <button
                    onClick={handleResetLogo}
                    className="bg-slate-100 hover:bg-slate-250 text-slate-600 font-sans font-bold text-[9px] uppercase tracking-wider py-2 px-3 rounded-xl border border-slate-205 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    title="Restaurar Logo Brutalista Oficial"
                  >
                    <RefreshCw size={11} />
                    <span>Redefinir</span>
                  </button>
                )}
              </div>

              {logoSuccessMsg && (
                <div className="text-center py-0.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 font-sans text-[8.5px] font-bold uppercase tracking-wider animate-pulse">
                  Ícone Atualizado com Sucesso!
                </div>
              )}
            </div>


          </div>
          
          {/* Banner de Sucesso para Perfil ou câmbio */}
          {isSaved && (
            <div className="bg-emerald-550 text-white p-3 px-4 rounded-xl font-sans text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-md shadow-emerald-500/15 animate-fade-in">
              <Check size={14} className="stroke-[2.5]" />
              <span>Alterações Registradas!</span>
            </div>
          )}

          {/* DYNAMIC EXCHANGE CONTROL (If Comanda is open) */}
          {activeComanda && onUpdateComanda && (
            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-indigo-100/50 pb-2">
                <Coins size={15} className="text-indigo-600 shrink-0" />
                <span className="font-sans text-[10px] font-bold text-indigo-805 uppercase tracking-widest leading-none">
                  Moeda & Câmbio da Comanda
                </span>
              </div>

              {/* Selector dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Moeda Original
                </label>
                <select
                  value={activeComanda.currency || 'BRL'}
                  onChange={(e) => {
                    const nextCurr = e.target.value;
                    const nextRate = CURRENCIES[nextCurr]?.defaultRate || 1.0;
                    onUpdateComanda({
                      ...activeComanda,
                      currency: nextCurr,
                      exchangeRate: nextRate
                    });
                    setIsExchangeUpdated(true);
                    setTimeout(() => setIsExchangeUpdated(false), 2000);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-705 focus:outline-none focus:border-indigo-500"
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
                        onUpdateComanda({
                          ...activeComanda,
                          exchangeRate: originalDefault
                        });
                        setIsExchangeUpdated(true);
                        setTimeout(() => setIsExchangeUpdated(false), 2000);
                      }}
                      className="text-[8px] text-indigo-600 hover:underline font-bold uppercase cursor-pointer"
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
                        onUpdateComanda({
                          ...activeComanda,
                          exchangeRate: nextRate
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-750 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Auto identify */}
              <div className="pt-2 border-t border-indigo-100/40 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-indigo-700 uppercase">
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
                    onUpdateComanda({
                      ...activeComanda,
                      currency: identified,
                      exchangeRate: defaultRate
                    });
                    setIsExchangeUpdated(true);
                    setTimeout(() => setIsExchangeUpdated(false), 2000);
                  }}
                  className="bg-white hover:bg-slate-50 border border-indigo-250 text-indigo-600 text-[8px] font-sans font-extrabold uppercase px-2.5 py-1.5 rounded-lg tracking-wider cursor-pointer shadow-xs transition-all active:scale-95"
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

          {/* PERFIL SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans text-[10.5px] font-extrabold text-slate-400 tracking-wider uppercase block">
                Configurações de Perfil
              </span>
              <button
                type="button"
                onClick={handleCreateProfile}
                className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-650 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 uppercase transition-all active:scale-95 cursor-pointer"
                title="Cadastrar Novo Perfil"
              >
                <Plus size={10} className="stroke-[3]" />
                <span>Novo</span>
              </button>
            </div>

            {/* Profile Selection Dropdown */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-205 flex flex-col gap-2">
              <label className="font-sans text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Perfil em Edição / Ativo
              </label>
              <div className="flex gap-2">
                <select
                  value={activeProfileId}
                  onChange={(e) => setActiveProfileId(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-700 uppercase focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name || 'Sem Nome'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowDeleteProfileModal(true)}
                  className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Excluir Perfil Selecionado"
                >
                  <Trash2 size={15} />
                </button>
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
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: JOÃO SILVA"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                />
              </div>

              {/* Email (EDITABLE AS REQUESTED) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Endereço de E-mail
                </label>
                <div className="relative flex items-center">
                  <Mail size={13} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EX: JOAO.SILVA@EMAIL.COM"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-9 pr-3.5 py-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Telefone (NEWLY CREATED AS REQUESTED) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Telefone / WhatsApp
                </label>
                <div className="relative flex items-center">
                  <Phone size={13} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="EX: (11) 98765-4321"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-9 pr-3.5 py-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
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
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="EX: +55 11 98765-4321, CPF OU EMAIL"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 font-sans text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-705"
                />

                {pixKey.trim() && (
                  <div className="flex flex-col gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg border border-indigo-100 hover:border-indigo-200 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <QrCode size={12} />
                      <span>{showQrCode ? 'Ocultar QR Code Pix' : 'Gerar QR Code Pix'}</span>
                    </button>

                    {showQrCode && (
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex flex-col items-center gap-2.5 animate-fade-in shadow-inner">
                        <span className="font-sans text-[8.5px] font-black text-indigo-705 tracking-wider uppercase bg-white border border-slate-150 px-2 py-0.5 rounded-md shadow-2xs">
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
            <button
              onClick={handleSaveProfile}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 font-sans font-extrabold text-[10px] uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex justify-center items-center gap-1.5 cursor-pointer"
            >
              <Save size={13} />
              <span>Salvar Alterações do Perfil</span>
            </button>
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
            <div className="flex gap-2 mt-2">
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
