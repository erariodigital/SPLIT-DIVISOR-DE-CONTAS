/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Comanda, Friend } from '../types';
import { Plus, Search, FileText, Menu } from 'lucide-react';
import { CURRENCIES } from '../utils/currency';

const brandLogo = '/src/assets/images/split_brutalist_logo_1781082679930.png';

interface HomeProps {
  comandas: Comanda[];
  friends: Friend[];
  onSelectComanda: (id: string) => void;
  onAddManualComanda: (name: string) => void;
  onOpenSidebar?: () => void;
}

export default function Home({
  comandas,
  friends,
  onSelectComanda,
  onAddManualComanda,
  onOpenSidebar
}: HomeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newComandaName, setNewComandaName] = useState('');

  // Dynamic persistent custom logo state (User Identity)
  const [appLogo, setAppLogo] = useState<string>(() => {
    return localStorage.getItem('split_custom_app_logo') || brandLogo;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setAppLogo(localStorage.getItem('split_custom_app_logo') || brandLogo);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const calculateComandaTotal = (comanda: Comanda): number => {
    const itemsTotal = comanda.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    const serviceFee = itemsTotal * (comanda.serviceFeePercent / 100);
    const totalOriginal = Math.round((itemsTotal + serviceFee) * 100) / 100;
    return totalOriginal * (comanda.exchangeRate || 1.0);
  };

  const formatDatePT = (dateStr: string): string => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const day = parts[2];
        const months = ['JAN', 'FEB', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const monthName = months[monthNum - 1] || 'OUT';
        return `${day} ${monthName} ${year}`;
      }
      return dateStr.toUpperCase();
    } catch {
      return dateStr.toUpperCase();
    }
  };

  const filteredComandas = comandas.filter((comanda) =>
    comanda.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComandaName.trim()) return;
    onAddManualComanda(newComandaName.trim());
    setNewComandaName('');
    setIsNewModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header com estilo Professional Polish */}
      <div className="flex items-center justify-between bg-white p-6 pb-5 border-b border-slate-200/80 shadow-xs animate-fade-in">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="flex items-center justify-center size-9 border border-slate-200 bg-white text-slate-600 rounded-xl shadow-xs cursor-pointer hover:bg-slate-50 active:scale-95 transition-all mr-0.5 shrink-0"
              title="Menu Principal"
              id="home-menu-toggle"
            >
              <Menu size={17} className="stroke-[2.2px]" />
            </button>
          )}
          
          {/* Miniature Branded Gold Coin Logo Tag */}
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#271a06] to-[#120a01] border border-[#b28623]/60 flex items-center justify-center shrink-0 shadow-md shadow-amber-955/20 overflow-hidden relative">
            <img 
              src={appLogo} 
              alt="Logo Split" 
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col gap-0.5 pr-1">
            <h1 className="text-slate-900 font-sans text-sm font-black uppercase tracking-wider">
              SPLIT — DIVISOR DE CONTAS
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Gerenciamento Oficial de Comandas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-[10px] font-sans font-extrabold uppercase tracking-wider shadow-md shadow-indigo-600/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={13} className="stroke-[2.5px]" />
            <span>Nova Comanda</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa Minimalista */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="PESQUISAR COMANDA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent font-sans text-xs font-semibold uppercase tracking-wider focus:outline-none placeholder-slate-400 text-slate-800"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="text-[10px] font-sans font-bold text-slate-400 hover:text-slate-600 uppercase shrink-0 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Comandas */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3.5 pb-24">
        {filteredComandas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 py-14 border border-dashed border-slate-300 rounded-2xl text-center bg-white shadow-elegant">
            <p className="font-sans text-slate-500 text-xs font-bold uppercase mb-2">NENHUMA COMANDA ENCONTRADA</p>
            <p className="text-[11px] text-slate-400 max-w-[240px] uppercase leading-relaxed">
              Registre uma nova comanda para começar a dividir seus gastos de forma simples!
            </p>
            <div className="flex flex-col gap-2 w-full mt-6 max-w-xs">
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold uppercase py-3 rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                Registrar Nova Comanda
              </button>
            </div>
          </div>
        ) : (
          filteredComandas.map((comanda) => {
            const total = calculateComandaTotal(comanda);
            const originalCurrency = comanda.currency || 'BRL';
            const isForeign = originalCurrency !== 'BRL';

            // Calculate active friends in this comanda (who have assigned items)
            const activeFriends = Array.from(new Set(comanda.items.flatMap(item => item.assignedTo)));
            const totalActiveCount = activeFriends.length > 0 ? activeFriends.length : friends.length;
            const paidCount = (comanda.paidFriendIds || []).filter(id => {
              if (activeFriends.length > 0) {
                return activeFriends.includes(id);
              }
              return friends.some(f => f.id === id);
            }).length;

            const isPartiallyPaid = !comanda.isPaid && paidCount > 0;

            return (
              <div
                key={comanda.id}
                onClick={() => onSelectComanda(comanda.id)}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-elegant p-4.5 flex justify-between items-center cursor-pointer transition-all hover:border-indigo-200 hover:shadow-md hover:scale-[1.005] active:scale-[0.99]"
              >
                <div className="flex flex-col flex-1 mr-4 overflow-hidden">
                  <div className="flex items-center mb-1">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                      comanda.isPaid ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {comanda.isPaid ? 'FINALIZADA' : 'EM ABERTO'}
                    </span>
                    {isPartiallyPaid && (
                      <span className="ml-1.5 text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 uppercase animate-pulse shrink-0">
                        PARCIAL ({paidCount}/{totalActiveCount} PAGOU)
                      </span>
                    )}
                  </div>
                  <span className="font-sans font-bold text-slate-800 text-md uppercase truncate">
                    {comanda.name}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono mt-1 uppercase">
                    <span>{formatDatePT(comanda.date)}</span>
                    {isForeign && (
                      <>
                        <span className="text-slate-350">•</span>
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md font-mono text-[9px] border border-indigo-100/50">
                          {CURRENCIES[originalCurrency]?.symbol || '$'} {(comanda.items.reduce((acc, i) => acc + i.price * i.quantity, 0) * (1 + comanda.serviceFeePercent / 100)).toFixed(2).replace('.', ',')} {originalCurrency}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-slate-900 font-mono text-base font-bold whitespace-nowrap shrink-0 flex items-center bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl shadow-xs">
                  R$ {total.toFixed(2).replace('.', ',')}
                </div>
              </div>
            );
          })
        )}
      </main>



      {/* Modal Brutalista de Nova Comanda Manual */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-[340px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg p-6 animate-scale-up">
            <h3 className="font-sans font-bold text-lg uppercase text-slate-900 mb-2 pb-2 border-b border-slate-100">
              Nova Comanda
            </h3>
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="EX: PIZZARIA DA ESQUINA"
                  value={newComandaName}
                  onChange={(e) => setNewComandaName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 placeholder-slate-400"
                />
              </div>

              <div className="flex gap-2.5 pt-1.5">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider shadow-sm active:scale-[0.98] text-center cursor-pointer transition-all"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setNewComandaName('');
                  }}
                  className="flex-1 border border-slate-200 bg-white text-slate-600 p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-slate-50 active:scale-[0.98] text-center cursor-pointer transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
