/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Comanda, Friend } from '../types';
import { LayoutDashboard, TrendingUp, Users, DollarSign, ArrowLeft, Share2, Check } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-750 text-white rounded-xl p-3 shadow-elegant-lg font-sans text-[10px] uppercase font-bold tracking-wider leading-snug">
        <p className="text-slate-300 mb-0.5">{data.name}</p>
        <p className="text-indigo-400 font-extrabold font-mono">
          R$ {data.value.toFixed(2).replace('.', ',')} ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  comandas: Comanda[];
  friends: Friend[];
  onBackToHome?: () => void;
  isSharedMode?: boolean;
}

export default function Dashboard({ comandas, friends, onBackToHome, isSharedMode = false }: DashboardProps) {
  const [activeMonthFilter] = useState<string>('todos');
  const [linkExpiryHrs, setLinkExpiryHrs] = useState<number>(2);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);

  const utf8B64Encode = (str: string) => {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch (e) {
      console.error('Error encoding:', e);
      return '';
    }
  };

  const handleCopySharedLink = () => {
    let base = window.location.origin + window.location.pathname;
    
    // Check if the origin/hostname is a Google AI Studio parent frame domain
    if (
      window.location.hostname.includes('google.com') || 
      window.location.hostname.includes('aistudio') || 
      window.location.hostname === ''
    ) {
      try {
        if (document.referrer && !document.referrer.includes('google.com') && !document.referrer.includes('aistudio')) {
          const refUrl = new URL(document.referrer);
          base = refUrl.origin + refUrl.pathname;
        } else {
          base = window.location.origin + '/';
        }
      } catch (_) {
        base = window.location.origin + '/';
      }
    }
    
    // Robust Host mapping: Map internal dev server urls to pre shared server urls
    if (base.includes('ais-dev-')) {
      base = base.replace('ais-dev-', 'ais-pre-');
    }

    if (base.endsWith('index.html')) {
      base = base.substring(0, base.length - 10);
    }
    if (!base.endsWith('/')) {
      base += '/';
    }
    
    const expiraTimestamp = Date.now() + linkExpiryHrs * 3600000;
    
    let dataParam = '';
    try {
      // Serialize current comandas and friends so the recipient loads identical state
      const payload = {
        comandas: comandas,
        profiles: friends.map(f => ({
          id: f.id,
          name: f.name,
          email: `${f.name.toLowerCase()}@email.com`,
          pixKey: '',
          phone: '',
          avatar: f.avatar
        }))
      };
      
      const jsonStr = JSON.stringify(payload);
      dataParam = `&data=${utf8B64Encode(jsonStr)}`;
    } catch (err) {
      console.error('Failed to bundle data payload for dashboard link:', err);
    }

    const sharedUrl = `${base}?modo=dashboard${dataParam}&expira=${expiraTimestamp}`;
    
    navigator.clipboard.writeText(sharedUrl)
      .then(() => {
        setShareToastMessage('LINK DO DASHBOARD COPIADO COM SUCESSO!');
        setTimeout(() => setShareToastMessage(null), 3000);
      })
      .catch(() => {
        setShareToastMessage('ERRO AO COPIAR LINK');
        setTimeout(() => setShareToastMessage(null), 3000);
      });
  };

  // Dynamically extract unique months
  const availableMonths = Array.from(
    new Set(comandas.map((c) => {
      try {
        if (!c.date) return '';
        const parts = c.date.split('-');
        if (parts.length > 1) return parts[1];
      } catch {}
      return '';
    }))
  ).filter(Boolean).sort((a, b) => b.localeCompare(a)) as string[];

  const getMonthFromDate = (dateStr: string): string => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length > 1) return parts[1];
    } catch {}
    return '';
  };

  const getMonthNamePT = (monthNumStr: string): string => {
    const months: Record<string, string> = {
      '01': 'JANEIRO',
      '02': 'FEVEREIRO',
      '03': 'MARÇO',
      '04': 'ABRIL',
      '05': 'MAIO',
      '06': 'JUNHO',
      '07': 'JULHO',
      '08': 'AGOSTO',
      '09': 'SETEMBRO',
      '10': 'OUTUBRO',
      '11': 'NOVEMBRO',
      '12': 'DEZEMBRO'
    };
    return months[monthNumStr] || 'OUTUBRO';
  };

  const filteredComandas = comandas.filter((comanda) => {
    if (activeMonthFilter !== 'todos') {
      const m = getMonthFromDate(comanda.date);
      if (m !== activeMonthFilter) return false;
    }
    return true;
  });

  // Calculate total spent in filtered comandas
  const getComandaTotal = (comanda: Comanda): number => {
    const itemsTotal = comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceFee = itemsTotal * (comanda.serviceFeePercent / 100);
    return Math.round((itemsTotal + serviceFee) * 100) / 100;
  };

  const totalFilteredValue = filteredComandas.reduce((sum, c) => sum + getComandaTotal(c), 0);

  // Calcula gastos por integrante
  const getSpendingData = () => {
    const spendingMap: Record<string, { id: string; name: string; value: number; color: string }> = {};
    friends.forEach(f => {
      spendingMap[f.id] = { id: f.id, name: f.name, value: 0, color: f.color };
    });

    filteredComandas.forEach(comanda => {
      const multiplier = 1 + (comanda.serviceFeePercent / 100);
      let unassignedSubtotal = 0;

      comanda.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (!item.assignedTo || item.assignedTo.length === 0) {
          unassignedSubtotal += itemTotal;
        } else {
          const itemFullCost = itemTotal * multiplier;
          const share = itemFullCost / item.assignedTo.length;
          item.assignedTo.forEach(friendId => {
            if (spendingMap[friendId]) {
              spendingMap[friendId].value += share;
            }
          });
        }
      });

      if (unassignedSubtotal > 0 && friends.length > 0) {
        const extraShare = (unassignedSubtotal * multiplier) / friends.length;
        friends.forEach(f => {
          if (spendingMap[f.id]) {
            spendingMap[f.id].value += extraShare;
          }
        });
      }
    });

    const list = Object.values(spendingMap).map(f => ({
      ...f,
      value: Math.round(f.value * 100) / 100,
    })).sort((a, b) => b.value - a.value);

    const sumValues = list.reduce((acc, curr) => acc + curr.value, 0) || 1;

    return list.map(item => ({
      ...item,
      percentage: Math.round((item.value / sumValues) * 100)
    }));
  };

  const spendingData = getSpendingData();
  const activeSpending = spendingData.filter(f => f.value > 0);

  // Stats calculation
  const highestSpender = activeSpending.length > 0 ? activeSpending[0] : null;
  const activeFriendsCount = friends.length || 1;
  const averageSpent = Math.round((totalFilteredValue / activeFriendsCount) * 100) / 100;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative select-none">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.01]">
        <div className="text-[6rem] font-sans font-extrabold text-slate-900 rotate-[-25deg] whitespace-nowrap uppercase tracking-widest select-none">
          DASHBOARD DE GASTOS
        </div>
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-20 flex flex-col bg-white border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center p-6 pb-6 gap-3 justify-between">
          {!isSharedMode && onBackToHome && (
            <button 
              onClick={onBackToHome}
              className="flex items-center justify-center size-8 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg shadow-xs cursor-pointer hover:bg-slate-100 active:scale-95 transition-all"
              title="Voltar para o Início"
            >
              <ArrowLeft size={14} className="stroke-[2.5px]" />
            </button>
          )}
          <h2 className="text-slate-900 text-xl font-sans font-bold leading-none tracking-tight flex-1 uppercase">
            DASHBOARD SPLIT
          </h2>
          {isSharedMode && (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-lg px-2.5 py-1 text-[7.5px] font-sans font-extrabold uppercase tracking-wider select-none shrink-0 mr-1 animate-pulse">
              <span>● Integrante (Leitura)</span>
            </div>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 shadow-xs">
            <LayoutDashboard size={13} className="text-slate-400" />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 w-full px-6 pt-6 pb-28 z-10 relative overflow-y-auto no-scrollbar">
        
        {/* Bento Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-elegant flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total</span>
              <DollarSign size={10} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[12px] sm:text-[13px] font-sans font-black text-slate-900 leading-none">
                R$ {totalFilteredValue.toFixed(0).replace('.', ',')}
              </p>
              <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 block">Dividido</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-elegant flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Média</span>
              <Users size={10} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[12px] sm:text-[13px] font-sans font-black text-slate-900 leading-none">
                R$ {averageSpent.toFixed(0).replace('.', ',')}
              </p>
              <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 block">Por integrante</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-elegant flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Destaque</span>
              <TrendingUp size={10} className="text-rose-500" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] sm:text-[12px] font-sans font-black text-slate-900 leading-none truncate uppercase" title={highestSpender?.name || '-'}>
                {highestSpender ? highestSpender.name : '-'}
              </p>
              <span className="text-[6.5px] font-bold text-rose-550 uppercase tracking-wide mt-0.5 block truncate">
                {highestSpender ? `R$ ${highestSpender.value.toFixed(0)}` : 'Nenhum'}
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart Card - "Gasto por Integrante" requested by user */}
        <div className="mb-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-elegant overflow-hidden flex flex-col items-center">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5 mb-4 flex items-center justify-start gap-1.5 font-sans w-full">
            <span className="size-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Gastos por Integrante (Gráfico de Pizza)
          </h4>

          {activeSpending.length === 0 ? (
            <div className="py-12 text-center w-full">
              <p className="text-xs text-slate-400 font-sans font-bold uppercase tracking-wider mb-1">Sem dados suficientes</p>
              <p className="text-[10px] text-slate-400 uppercase">Registre itens atribuídos nas comandas para ver o gráfico.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Pie Chart display inside a nice canvas frame */}
              <div className="h-48 w-full max-w-[240px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={activeSpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {activeSpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Visual center badge showing total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-black font-sans text-slate-900 mt-0.5">
                    R$ {totalFilteredValue.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Enhanced Visual Breakdown List / Labels */}
              <div className="w-full space-y-3.5 mt-5 pt-4 border-t border-slate-150">
                {spendingData.map((f) => {
                  const percentVal = f.percentage;
                  return (
                    <div key={f.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {/* Colored bullet badge */}
                          <div 
                            className="w-2.5 h-2.5 rounded-full border border-white shadow-xs shrink-0" 
                            style={{ backgroundColor: f.color }} 
                          />
                          <span className="font-sans uppercase tracking-wide leading-none">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-slate-900 leading-none">
                          <span>R$ {f.value.toFixed(2).replace('.', ',')}</span>
                          <span className="text-slate-400 text-[8.5px] font-sans font-medium">({percentVal}%)</span>
                        </div>
                      </div>
                      
                      {/* Tailored progress visualization bar */}
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${percentVal}%`, 
                            backgroundColor: f.color 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Share Link segment */}
      {!isSharedMode && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-25 pb-5 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 text-[8px] font-bold uppercase tracking-wider">
            <span className="text-slate-400 ml-1">EXPIRAÇÃO DO LINK:</span>
            <select
              value={linkExpiryHrs}
              onChange={(e) => setLinkExpiryHrs(Number(e.target.value))}
              className="bg-transparent text-slate-800 font-bold uppercase outline-none border-none p-0 focus:ring-0 leading-none text-[8.5px] cursor-pointer"
            >
              <option value={1}>1 Hora</option>
              <option value={2}>2 Horas</option>
              <option value={6}>6 Horas</option>
              <option value={24}>24 Horas</option>
            </select>
          </div>

          <button 
            onClick={handleCopySharedLink}
            className="w-full max-w-xs bg-emerald-600 text-white py-3 rounded-xl shadow-lg shadow-emerald-600/10 font-sans font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all active:scale-[0.99] cursor-pointer"
            title="Copiar link de acesso temporário para a dashboard em modo leitura"
          >
            <Share2 size={13} className="text-white" />
            <span>LINK ACESSO DASHBOARD</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {shareToastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-55 animate-fade-in">
          <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <Check size={11} strokeWidth={3} />
          </div>
          <span className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-100">
            {shareToastMessage}
          </span>
        </div>
      )}
    </div>
  );
}
