/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Comanda, Friend } from '../types';
import { FileText, Calendar, User, Search, Filter, Printer, Download, Eye, X, Check, ArrowDown, ArrowLeft, Share2 } from 'lucide-react';
import brandLogo from '../assets/images/split_logo_processed.png';

interface ReportsProps {
  comandas: Comanda[];
  friends: Friend[];
  onBackToHome?: () => void;
  isSharedMode?: boolean;
}

export default function Reports({ comandas, friends, onBackToHome, isSharedMode = false }: ReportsProps) {
  const [activeMonthFilter, setActiveMonthFilter] = useState<string>('todos'); // 'todos', '10', '09'
  const [activeFriendFilter, setActiveFriendFilter] = useState<string>('todos'); // 'todos', or friendId
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('todos'); // 'todos', 'pago', 'pendente'
  const [activePaymentFilter, setActivePaymentFilter] = useState<string>('todos'); // 'todos', 'pago', 'pendente'
  const [linkExpiryHrs, setLinkExpiryHrs] = useState<number>(2);

  // Dynamic persistent custom logo state (User Identity)
  const [appLogo] = useState<string>(() => {
    const stored = localStorage.getItem('split_custom_app_logo');
    if (stored && stored.startsWith('data:image/')) {
      return stored;
    }
    return brandLogo;
  });

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Print popup modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);

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
          // Robust fallback direct to the preview container URL in AI Studio
          base = "https://ais-pre-jais25csrw7f6vpppmo4sn-516872073432.us-east1.run.app/";
        }
      } catch (_) {
        base = "https://ais-pre-jais25csrw7f6vpppmo4sn-516872073432.us-east1.run.app/";
      }
    }
    
    // Normalize suffix (avoid trailing index.html issues)
    if (base.endsWith('index.html')) {
      base = base.substring(0, base.length - 10);
    }
    if (!base.endsWith('/')) {
      base += '/';
    }
    
    // Construct final URL with expiration
    const expiraTimestamp = Date.now() + linkExpiryHrs * 3600000;
    const sharedUrl = `${base}?modo=relatorio&expira=${expiraTimestamp}`;
    
    navigator.clipboard.writeText(sharedUrl)
      .then(() => {
        setShareToastMessage('LINK DE ACESSO COPIADO COM SUCESSO!');
        setTimeout(() => setShareToastMessage(null), 3000);
      })
      .catch(() => {
        setShareToastMessage('ERRO AO COPIAR LINK DE ACESSO');
        setTimeout(() => setShareToastMessage(null), 3000);
      });
  };

  // Dynamically extract unique months from existing comanda logs
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

  // Computes grand totals
  const getComandaTotal = (comanda: Comanda): number => {
    const itemsTotal = comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const serviceFee = itemsTotal * (comanda.serviceFeePercent / 100);
    return Math.round((itemsTotal + serviceFee) * 100) / 100;
  };

  const getMonthFromDate = (dateStr: string): string => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length > 1) return parts[1]; // returns month index string
    } catch {}
    return '';
  };

  const getYearFromDate = (dateStr: string): string => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length > 0) return parts[0];
    } catch {}
    return '';
  };

  // Convert month number string into PT-BR display month name
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

  // Extract day from YYYY-MM-DD
  const getDayFromDate = (dateStr: string): string => {
    try {
      if (!dateStr) return '01';
      const parts = dateStr.split('-');
      return parts[2] || '01';
    } catch {
      return '01';
    }
  };

  const getAbbreviatedMonthPT = (dateStr: string): string => {
    try {
      const monthIndex = getMonthFromDate(dateStr);
      const months: Record<string, string> = {
        '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'ABR', '05': 'MAI', '06': 'JUN',
        '07': 'JUL', '08': 'AGO', '09': 'SET', '10': 'OUT', '11': 'NOV', '12': 'DEZ'
      };
      return months[monthIndex] || 'OUT';
    } catch {
      return 'OUT';
    }
  };

  // Apply sequential multi-attribute filter arrays
  const filteredComandas = comandas.filter((comanda) => {
    // 1. Month verification
    if (activeMonthFilter !== 'todos') {
      const comIndex = getMonthFromDate(comanda.date);
      if (comIndex !== activeMonthFilter) return false;
    }

    // 2. Friend assignment verification
    if (activeFriendFilter !== 'todos') {
      const isFriendAssigned = comanda.items.some(item =>
        item.assignedTo.includes(activeFriendFilter)
      );
      if (!isFriendAssigned) return false;
    }

    // 3. Paid status verification
    if (activeStatusFilter !== 'todos') {
      const queryPaid = activeStatusFilter === 'pago';
      if (comanda.isPaid !== queryPaid) return false;
    }

    // 4. Payment status of friend(s) verification (paid vs defaulting/unpaid)
    if (activePaymentFilter !== 'todos') {
      const activeFriends = Array.from(new Set(comanda.items.flatMap(item => item.assignedTo)));
      const comandaFriends = activeFriends.length > 0 ? friends.filter(f => activeFriends.includes(f.id)) : friends;

      if (activeFriendFilter !== 'todos') {
        const hasPaid = comanda.isPaid || comanda.paidFriendIds?.includes(activeFriendFilter);
        if (activePaymentFilter === 'pago' && !hasPaid) return false;
        if (activePaymentFilter === 'pendente' && hasPaid) return false;
      } else {
        const pagouCount = comandaFriends.filter(f => comanda.isPaid || comanda.paidFriendIds?.includes(f.id)).length;
        const insolvCount = comandaFriends.filter(f => !comanda.isPaid && !comanda.paidFriendIds?.includes(f.id)).length;

        if (activePaymentFilter === 'pago' && pagouCount === 0) return false;
        if (activePaymentFilter === 'pendente' && insolvCount === 0) return false;
      }
    }

    return true;
  });

  // Calculation of total spending per friend in the filtered comandas:
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

    return Object.values(spendingMap).map(f => ({
      ...f,
      value: Math.round(f.value * 100) / 100,
    })).sort((a, b) => b.value - a.value);
  };

  // Unique chronological grouped headings (e.g., '10-2023' => MonthName Year)
  const groupedKeys: string[] = [];
  filteredComandas.forEach((comanda) => {
    const m = getMonthFromDate(comanda.date);
    const y = getYearFromDate(comanda.date);
    const key = `${m}-${y}`;
    if (!groupedKeys.includes(key)) {
      groupedKeys.push(key);
    }
  });

  // Sort groups chronologically
  groupedKeys.sort((a, b) => b.localeCompare(a));

  const totalFilteredValue = filteredComandas.reduce((sum, c) => sum + getComandaTotal(c), 0);

  const displayPrintPreview = () => {
    // Inject custom print styles directly to a temporary printed page flow
    setShowPrintModal(true);
  };

  const handleNativePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Erro ao imprimir:', e);
      alert('A impressão automática foi impedida pelo navegador devido às restrições do iframe. Por favor, clique em "ABRIR EM NOVA ABA" (no canto superior direito do painel de testes do AI Studio) para abrir a aplicação diretamente e imprimir sem restrições!');
    }
  };

  const handleShareReport = async () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const monthStr = activeMonthFilter === 'todos' ? 'TODOS OS MESES' : getMonthNamePT(activeMonthFilter);
    const friendStr = activeFriendFilter === 'todos' ? 'TODOS OS INTEGRANTES' : (friends.find(f => f.id === activeFriendFilter)?.name || '');
    const statusStr = activeStatusFilter.toUpperCase();
    const paymentStr = activePaymentFilter === 'todos' ? 'TODOS' : (activePaymentFilter === 'pago' ? 'PAGOU PARTE' : 'INADIMPLENTES');
    
    let reportText = `📊 *SPLIT — DIVISOR DE CONTAS*\n`;
    reportText += `📄 *Relatório de Fechamento Consolidado*\n`;
    reportText += `📅 Data de Emissão: ${dateStr}\n\n`;
    
    reportText += `🔍 *Filtros Aplicados:*\n`;
    reportText += `• Mês: ${monthStr}\n`;
    reportText += `• Integrante: ${friendStr}\n`;
    reportText += `• Status da Conta: ${statusStr}\n`;
    reportText += `• Situação Integrante: ${paymentStr}\n\n`;
    
    reportText += `📂 *Comandas listadas:*\n`;
    filteredComandas.forEach(c => {
      const total = getComandaTotal(c).toFixed(2).replace('.', ',');
      const activeFriends = Array.from(new Set(c.items.flatMap(item => item.assignedTo)));
      const comandaFriends = activeFriends.length > 0 ? friends.filter(f => activeFriends.includes(f.id)) : friends;
      const pagaram = comandaFriends.filter(f => c.isPaid || c.paidFriendIds?.includes(f.id)).map(f => f.name).join(', ');
      const inadimplentes = comandaFriends.filter(f => !c.isPaid && !c.paidFriendIds?.includes(f.id)).map(f => f.name).join(', ');
      
      reportText += `• ${c.name}: R$ ${total} (${c.date})\n`;
      if (pagaram) reportText += `  └─ Pagaram: ${pagaram}\n`;
      if (inadimplentes) reportText += `  └─ Inadimplentes: ${inadimplentes}\n`;
    });
    
    const spendingList = getSpendingData().filter(s => s.value > 0);
    if (spendingList.length > 0) {
      reportText += `\n👥 *Gasto Individual por Integrante:*\n`;
      spendingList.forEach(s => {
        reportText += `• ${s.name}: R$ ${s.value.toFixed(2).replace('.', ',')}\n`;
      });
    }
    
    reportText += `\n💰 *SOMA TOTAL: R$ ${totalFilteredValue.toFixed(2).replace('.', ',')}*\n\n`;
    reportText += `⚡ _Dividido com "Split" de forma rápida, transparente e prática!_ 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Relatório Financeiro - Split',
          text: reportText,
        });
        setShareToastMessage('Compartilhado com Sucesso!');
        setTimeout(() => setShareToastMessage(null), 3000);
      } catch (err) {
        console.warn('Erro ao compartilhar via API nativa:', err);
        // Fallback to clipboard if share failed/cancelled but wasn't AbortError
        if (err instanceof Error && err.name !== 'AbortError') {
          fallbackCopyToClipboard(reportText);
        }
      }
    } else {
      fallbackCopyToClipboard(reportText);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShareToastMessage('Relatório copiado para a Área de Transferência!');
        setTimeout(() => setShareToastMessage(null), 4000);
      })
      .catch(() => {
        setShareToastMessage('Erro ao copiar relatório automaticamente.');
        setTimeout(() => setShareToastMessage(null), 3000);
      });
  };
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative select-none">
      
      {/* Background Watermark matching 3rd screenshot layout */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.01]">
        <div className="text-[6rem] font-sans font-extrabold text-slate-900 rotate-[-25deg] whitespace-nowrap uppercase tracking-widest select-none">
          CONSOLIDAÇÃO DE CONTA
        </div>
      </div>

      {/* Header Top Title bar (exact to screenshot) */}
      <nav className="sticky top-0 z-20 flex flex-col bg-white border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center p-6 pb-2 gap-3 justify-between">
          {onBackToHome && (
            <button 
              onClick={onBackToHome}
              className="flex items-center justify-center size-8 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg shadow-xs cursor-pointer hover:bg-slate-100 active:scale-95 transition-all"
              title="Voltar para o Início"
            >
              <ArrowLeft size={14} className="stroke-[2.5px]" />
            </button>
          )}
          <h2 className="text-slate-900 text-xl font-sans font-bold leading-none tracking-tight flex-1 uppercase">
            RELATORIO SPLIT
          </h2>
          {isSharedMode && (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-lg px-2.5 py-1 text-[7.5px] font-sans font-extrabold uppercase tracking-wider select-none shrink-0 mr-1 animate-pulse">
              <span>● Integrante (Leitura)</span>
            </div>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 shadow-xs">
            <Filter size={13} className="text-slate-400" />
          </div>
        </div>

        {/* Filter Scrollbar segment */}
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 pb-4 pt-2 w-full">
          
          {/* Month selector toggle dropdown option selection style */}
          <div className="flex-1 min-w-[70px] sm:min-w-[85px] flex items-center gap-1 bg-indigo-50 border border-indigo-100/50 rounded-xl px-1.5 sm:px-2 py-1.5 shadow-xs justify-center">
            <span className="font-sans text-[7px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-700">MÊS:</span>
            <select
              value={activeMonthFilter}
              onChange={(e) => setActiveMonthFilter(e.target.value)}
              className="bg-transparent text-indigo-900 font-sans text-[7.5px] sm:text-[9px] font-bold uppercase border-none focus:outline-none focus:ring-0 p-0 cursor-pointer text-left leading-none shrink-0"
            >
              <option value="todos">Todos</option>
              {availableMonths.map(mNo => (
                <option key={mNo} value={mNo}>
                  {getMonthNamePT(mNo)}
                </option>
              ))}
            </select>
          </div>

          {/* Friends list filter */}
          <div className="flex-1 min-w-[75px] sm:min-w-[90px] flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 sm:px-2 py-1.5 shadow-xs justify-center">
            <span className="font-sans text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">INTEG.:</span>
            <select
              value={activeFriendFilter}
              onChange={(e) => setActiveFriendFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-sans text-[7.5px] sm:text-[9px] font-bold uppercase border-none focus:outline-none focus:ring-0 p-0 cursor-pointer text-left leading-none shrink-0"
            >
              <option value="todos">Todos</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="flex-1 min-w-[70px] sm:min-w-[85px] flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 sm:px-2 py-1.5 shadow-xs justify-center">
            <span className="font-sans text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">STATUS:</span>
            <select
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-sans text-[7.5px] sm:text-[9px] font-bold uppercase border-none focus:outline-none focus:ring-0 p-0 cursor-pointer text-left leading-none shrink-0"
            >
              <option value="todos">Todos</option>
              <option value="pago">PAGO</option>
              <option value="pendente">PENDENTE</option>
            </select>
          </div>

          {/* Payment (Situação) selector */}
          <div className="flex-1 min-w-[75px] sm:min-w-[95px] flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 sm:px-2 py-1.5 shadow-xs justify-center">
            <span className="font-sans text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">PAGAM.:</span>
            <select
              value={activePaymentFilter}
              onChange={(e) => setActivePaymentFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-sans text-[7.5px] sm:text-[9px] font-bold uppercase border-none focus:outline-none focus:ring-0 p-0 cursor-pointer text-left leading-none shrink-0"
            >
              <option value="todos">Todos</option>
              <option value="pago">Já pagou</option>
              <option value="pendente">Inadimplente</option>
            </select>
          </div>

        </div>
      </nav>

      {/* Main content Area listing rows */}
      <main className="flex-1 w-full px-6 pt-6 pb-28 z-10 relative overflow-y-auto no-scrollbar">
        
        {groupedKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white shadow-elegant mt-2 text-center">
            <p className="font-sans text-xs text-slate-400 font-bold uppercase py-6">NENHUMA COMANDA CORRESPONDE AOS FILTROS</p>
          </div>
        ) : (
          groupedKeys.map((groupKey) => {
            const [mNum, yNum] = groupKey.split('-');
            const groupComandas = filteredComandas.filter(c => getMonthFromDate(c.date) === mNum && getYearFromDate(c.date) === yNum);

            if (groupComandas.length === 0) return null;

            return (
              <section key={groupKey} className="mb-6">
                <h3 className="text-[10px] font-extrabold text-slate-400 mb-3.5 uppercase tracking-widest border-b border-slate-100 pb-1.5 font-sans">
                  {getMonthNamePT(mNum)} {yNum}
                </h3>
                
                <div className="flex flex-col gap-3">
                  {groupComandas.map((comanda) => {
                    const total = getComandaTotal(comanda);
                    const day = getDayFromDate(comanda.date);
                    const abbrevMo = getAbbreviatedMonthPT(comanda.date);

                    return (
                      <div 
                        key={comanda.id}
                        className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-elegant transition-all hover:scale-[1.005]"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {/* Left calendar-ticket aspect */}
                          <div className="w-11 text-center border-r border-slate-100 pr-3 shrink-0">
                            <span className="block text-[9px] font-bold text-slate-400 leading-none uppercase font-sans">
                              {abbrevMo}
                            </span>
                            <span className="block text-base font-bold font-sans leading-none mt-1 text-slate-700">
                              {day}
                            </span>
                          </div>

                          {/* Center meta descript */}
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-sans font-bold uppercase truncate max-w-[170px] text-slate-800">
                              {comanda.name}
                            </span>
                            <span className="text-[8px] font-bold text-slate-450 uppercase mt-0.5 font-sans tracking-wide">
                              {comanda.items.length} ITENS • {friends.length} INTEGRANTES
                            </span>
                            
                            {/* Member payment situation list (paid vs defaulting/unpaid) */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(() => {
                                const activeFriends = Array.from(new Set(comanda.items.flatMap(item => item.assignedTo)));
                                const comandaFriends = activeFriends.length > 0 ? friends.filter(f => activeFriends.includes(f.id)) : friends;
                                const pagaram = comandaFriends.filter(f => comanda.isPaid || comanda.paidFriendIds?.includes(f.id));
                                const inadimplentes = comandaFriends.filter(f => !comanda.isPaid && !comanda.paidFriendIds?.includes(f.id));
                                return (
                                  <>
                                    {pagaram.map(f => (
                                      <span key={f.id} className="text-[7.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 leading-none shrink-0" title="Pagou a parte">
                                        ✓ {f.name}
                                      </span>
                                    ))}
                                    {inadimplentes.map(f => (
                                      <span key={f.id} className="text-[7.5px] font-extrabold text-rose-600 bg-rose-50 border border-rose-150 rounded px-1.5 py-0.5 leading-none shrink-0" title="Inadimplente (Não pagou)">
                                        ✗ {f.name}
                                      </span>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Right billing values */}
                        <div className="text-right shrink-0 ml-2">
                          <span className="block text-sm font-bold font-mono text-slate-900">
                            R$ {total.toFixed(2).replace('.', ',')}
                          </span>
                          <span className={`block text-[9px] font-extrabold uppercase mt-0.5 font-sans ${
                            comanda.isPaid ? 'text-slate-400' : 'text-rose-500'
                          }`}>
                            {comanda.isPaid ? 'PAGO' : 'PENDENTE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Floating Export Button segment */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-25 pb-5 flex flex-col items-center">
        {/* Sum banner */}
        {filteredComandas.length > 0 && (
          <div className="mb-2 px-3 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-sm">
            SOMA FILTRADA: <strong className="text-indigo-400 font-extrabold">R$ {totalFilteredValue.toFixed(2).replace('.', ',')}</strong>
          </div>
        )}

        {!isSharedMode && (
          <div className="mb-2 flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 text-[8px] font-bold uppercase tracking-wider">
            <span className="text-slate-450 ml-1">EXPIRAÇÃO DO LINK:</span>
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
        )}

        <div className="flex gap-2 w-full max-w-xs">
          <button 
            onClick={displayPrintPreview}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl shadow-lg shadow-indigo-600/10 font-sans font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-[0.99] cursor-pointer"
          >
            <FileText size={13} className="text-white fill-[transparent]" />
            <span>GERAR PDF</span>
          </button>

          {!isSharedMode && (
            <button 
              onClick={handleCopySharedLink}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-xl shadow-lg shadow-emerald-600/10 font-sans font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all active:scale-[0.99] cursor-pointer"
              title="Gerar e copiar link de acesso para integrantes"
            >
              <Share2 size={13} className="text-white" />
              <span>LINK ACESSO</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal - Print Preview Invoice */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg flex flex-col overflow-hidden max-h-[90vh] animate-scale-up">
            
            {/* Header top drawer */}
            <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-400" size={15} />
                <h3 className="font-sans font-bold text-xs uppercase">Relatório Financeiro PDF</h3>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-white hover:text-indigo-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>



            {/* Print Area Preview */}
            <div className="p-6 flex-1 overflow-y-auto no-scrollbar font-mono text-xs text-slate-800 border-b border-slate-100 select-text bg-slate-50 relative">
              
              {/* Slanted subtle printable watermark */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.03] select-none">
                <div className="text-[3rem] font-sans font-extrabold text-slate-900 rotate-[-25deg] whitespace-nowrap uppercase tracking-widest">
                  RELATÓRIO DE FECHAMENTO
                </div>
              </div>

              {/* Invoice Layout */}
              <div id="print-area-id" className="space-y-4 pb-12 relative z-10">
                <div className="text-center border-b-2 border-dashed border-slate-200 pb-4">
                  {/* Branded Centered Logo for Print */}
                  <div className="flex justify-center mb-3">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-[#271a06] to-[#120a01] border border-[#b28623]/60 flex items-center justify-center overflow-hidden shadow-md">
                      <img 
                        src={appLogo || '/logo.png'} 
                        alt="Logo APP" 
                        className="size-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                    </div>
                  </div>
                  <h1 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-950">SPLIT — DIVISOR DE CONTAS</h1>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Relatório de fechamento consolidado</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase">Data de emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="space-y-1 py-1 text-[10px] uppercase font-bold text-slate-500 leading-relaxed border-b border-slate-100 pb-2">
                  <div><strong>FILTROS APLICADOS:</strong></div>
                  <div>- MÊS: {activeMonthFilter === 'todos' ? 'TODOS OS MESES' : getMonthNamePT(activeMonthFilter)}</div>
                  <div>- INTEGRANTE: {activeFriendFilter === 'todos' ? 'TODOS OS INTEGRANTES' : friends.find(f => f.id === activeFriendFilter)?.name}</div>
                  <div>- STATUS: {activeStatusFilter.toUpperCase()}</div>
                  {activePaymentFilter !== 'todos' && (
                    <div>- PAGAMENTO INTEGRANTE: {activePaymentFilter === 'pago' ? 'PAGOU A PARTE' : 'INADIMPLENTE'}</div>
                  )}
                </div>

                {/* Items table */}
                <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-100 p-2.5 font-sans font-bold flex justify-between uppercase border-b border-slate-200 text-[10px] text-slate-500">
                    <span>Comanda</span>
                    <span>Total da conta</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredComandas.map(c => (
                      <div key={c.id} className="p-2.5 flex justify-between items-center bg-white text-[11px]">
                        <div>
                          <strong className="block text-slate-800 uppercase font-bold">{c.name}</strong>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{c.date} • {c.items.length} itens</span>
                          <div className="flex flex-wrap gap-1 mt-1 font-sans text-[8px] font-bold">
                            {(() => {
                              const activeFriends = Array.from(new Set(c.items.flatMap(item => item.assignedTo)));
                              const comandaFriends = activeFriends.length > 0 ? friends.filter(f => activeFriends.includes(f.id)) : friends;
                              const pagaram = comandaFriends.filter(f => c.isPaid || c.paidFriendIds?.includes(f.id));
                              const inadimplentes = comandaFriends.filter(f => !c.isPaid && !c.paidFriendIds?.includes(f.id));
                              return (
                                <>
                                  {pagaram.map(f => (
                                    <span key={f.id} className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">✓ {f.name}</span>
                                  ))}
                                  {inadimplentes.map(f => (
                                    <span key={f.id} className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-100">✗ {f.name}</span>
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">R$ {getComandaTotal(c).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total box summarizer */}
                <div className="border border-indigo-100 bg-indigo-50 text-indigo-900 rounded-2xl p-4 flex justify-between items-center">
                  <span className="font-sans font-bold text-[10px] uppercase tracking-wider">SOMA DO PERÍODO</span>
                  <span className="text-sm font-black font-mono text-indigo-600">R$ {totalFilteredValue.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="text-[9px] text-center text-slate-400 uppercase leading-snug pt-4 border-t border-dashed border-slate-200">
                  "Dividido com Split" ajuda milhares de amigos a dividirem suas comandas de forma transparente e prática.
                </div>
              </div>

            </div>

            {/* Trigger Button bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleNativePrint}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-xs uppercase font-sans font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>Imprimir / PDF</span>
                </button>
                
                <button
                  onClick={handleShareReport}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs uppercase font-sans font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                >
                  <Share2 size={13} />
                  <span>Compartilhar</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-full border border-slate-205 bg-white text-slate-600 py-2.5 text-xs uppercase font-sans font-bold rounded-xl hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {shareToastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-55">
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
