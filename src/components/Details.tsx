/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Comanda, Friend, Item } from '../types';
import { ArrowLeft, Plus, Sparkles, UserPlus, Trash2, CheckCircle2, Copy, Check, CornerDownRight, Menu, Edit, Lock } from 'lucide-react';
import { identifyCurrency, CURRENCIES } from '../utils/currency';

interface DetailsProps {
  comanda: Comanda;
  friends: Friend[];
  userPixKey?: string;
  onBack: () => void;
  onUpdateComanda: (updated: Comanda) => void;
  onAddFriendGlobal: (name: string) => void;
  onOpenSidebar?: () => void;
  isAdmin?: boolean;
}

export default function Details({
  comanda,
  friends,
  userPixKey = '+55 11 98765-4321', // Fallback
  onBack,
  onUpdateComanda,
  onAddFriendGlobal,
  onOpenSidebar,
  isAdmin = false
}: DetailsProps) {
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({ 'item-2': true }); // Expand Fritas by default like mock image
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState('');

  // New item editor states
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemQty, setEditItemQty] = useState('1');
  const [editItemCategory, setEditItemCategory] = useState('');

  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');

  // Settle Up Screen / Bill division totals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isCurrencySettingsOpen, setIsCurrencySettingsOpen] = useState(false);

  const expandAllItems = () => {
    const next: Record<string, boolean> = {};
    comandasItems().forEach(item => {
      next[item.id] = true;
    });
    setExpandedItemIds(next);
  };

  const collapseAllItems = () => {
    setExpandedItemIds({});
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const comandasItems = () => {
    return comanda.items || [];
  };

  const formatCurrency = (val: number, currencyCode: string = 'BRL'): string => {
    const symbol = CURRENCIES[currencyCode]?.symbol || 'R$';
    return `${symbol} ${val.toFixed(2).replace('.', ',')}`;
  };

  const renderDualPrice = (valInBillCurrency: number): React.ReactNode => {
    const billCurrency = comanda.currency || 'BRL';
    const isForeign = billCurrency !== 'BRL';
    const exchangeRate = comanda.exchangeRate || 1.0;
    const valueInBRL = valInBillCurrency * exchangeRate;

    if (!isForeign) {
      return <span className="font-mono text-slate-800">{formatCurrency(valInBillCurrency, 'BRL')}</span>;
    }

    return (
      <div className="flex flex-col items-end leading-none">
        <span className="font-mono text-slate-800 font-bold text-xs sm:text-xs">{formatCurrency(valInBillCurrency, billCurrency)}</span>
        <span className="font-mono text-[9px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded mt-1 whitespace-nowrap block">
          {formatCurrency(valueInBRL, 'BRL')}
        </span>
      </div>
    );
  };

  const renderFooterTotal = (): React.ReactNode => {
    const totalOrig = getTotal();
    const billCurrency = comanda.currency || 'BRL';
    const isForeign = billCurrency !== 'BRL';
    const exchangeRate = comanda.exchangeRate || 1.0;
    const totalBRL = totalOrig * exchangeRate;

    if (!isForeign) {
      return (
        <div className="flex justify-between items-end border-b border-slate-800 pb-2.5">
          <div className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">VALOR TOTAL</div>
          <div className="font-mono text-xl font-bold text-emerald-400">
            R$ {totalOrig.toFixed(2).replace('.', ',')}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 w-full">
        <div className="flex flex-col gap-0.5">
          <div className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">VALOR TOTAL</div>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
            CÂMBIO: 1 {billCurrency} = R$ {exchangeRate.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <div className="flex flex-col items-end leading-none gap-1">
          <span className="font-mono text-xs text-slate-400 font-bold">
            {formatCurrency(totalOrig, billCurrency)}
          </span>
          <span className="font-mono text-xl font-bold text-emerald-400">
            {formatCurrency(totalBRL, 'BRL')}
          </span>
        </div>
      </div>
    );
  };

  // Formats date string from YYYY-MM-DD to e.g. "24 OUT 2023"
  const formatDatePT = (dateStr: string): string => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const day = parts[2];
        const months = ['JAN', 'OUT', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const monthName = months[monthNum - 1] || 'OUT';
        return `${day} ${monthName} ${year}`;
      }
      return dateStr.toUpperCase();
    } catch {
      return dateStr.toUpperCase();
    }
  };

  // State changes triggered inside details are reported back to parent
  const updateComandaName = (newName: string) => {
    onUpdateComanda({
      ...comanda,
      name: newName || 'SEM NOME'
    });
  };

  const toggleFriendOnItem = (itemId: string, friendId: string) => {
    const updatedItems = comanda.items.map(item => {
      if (item.id === itemId) {
        const alreadyHas = item.assignedTo.includes(friendId);
        const nextAssigned = alreadyHas
          ? item.assignedTo.filter(id => id !== friendId)
          : [...item.assignedTo, friendId];
        return { ...item, assignedTo: nextAssigned };
      }
      return item;
    });
    onUpdateComanda({ ...comanda, items: updatedItems });
  };

  const deleteItem = (itemId: string) => {
    const updatedItems = comanda.items.filter(item => item.id !== itemId);
    onUpdateComanda({ ...comanda, items: updatedItems });
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItemName.trim() || !editItemPrice) return;
    
    const price = parseFloat(editItemPrice);
    const quantity = parseFloat(editItemQty) || 1;
    
    const updatedItems = comanda.items.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          name: editItemName.trim(),
          price: price,
          quantity: quantity,
          category: editItemCategory.trim() || undefined
        };
      }
      return item;
    });

    onUpdateComanda({
      ...comanda,
      items: updatedItems
    });

    setEditingItem(null);
  };

  const handleCreateManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;
    
    const price = parseFloat(newItemPrice);
    const quantity = parseFloat(newItemQty) || 1;
    
    const newlyCreatedItem: Item = {
      id: `manual-item-${Date.now()}`,
      name: newItemName.trim(),
      price: price,
      quantity: quantity,
      assignedTo: friends.map(f => f.id), // Automatically assign to everyone by default
      category: newItemCategory.trim() || undefined
    };

    onUpdateComanda({
      ...comanda,
      items: [...comanda.items, newlyCreatedItem]
    });

    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty('1');
    setNewItemCategory('');
    setIsAddItemOpen(false);
  };

  const handleCreateFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    onAddFriendGlobal(newFriendName.trim());
    setNewFriendName('');
    setIsAddFriendOpen(false);
  };

  const updateServiceFee = (feePercent: number) => {
    onUpdateComanda({
      ...comanda,
      serviceFeePercent: feePercent
    });
  };

  // Math totals calculation
  const getSubtotal = (): number => {
    return comanda.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getServiceFeeValue = (): number => {
    // 10% is computed dynamically
    return Math.round((getSubtotal() * (comanda.serviceFeePercent / 100)) * 100) / 100;
  };

  const getTotal = (): number => {
    return Math.round((getSubtotal() + getServiceFeeValue()) * 100) / 100;
  };

  // Calculate distinct shares for checkout splits
  const getFriendsShares = () => {
    const shares: Record<string, number> = {};
    friends.forEach(f => { shares[f.id] = 0; });

    let unassignedSubtotal = 0;
    const multiplier = 1 + (comanda.serviceFeePercent / 100);

    comanda.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      if (item.assignedTo.length === 0) {
        // If an item is unassigned, its cost translates to unassigned
        // Let's divide it evenly among all friends, including its share of the service fee.
        unassignedSubtotal += itemTotal;
      } else {
        // Multiply by the service fee percent before dividing among assignees
        const share = (itemTotal * multiplier) / item.assignedTo.length;
        item.assignedTo.forEach(friendId => {
          if (shares[friendId] !== undefined) {
            shares[friendId] += share;
          }
        });
      }
    });

    // Add unassigned split evenly including its portion of the service fee
    if (unassignedSubtotal > 0 && friends.length > 0) {
      const extraShare = (unassignedSubtotal * multiplier) / friends.length;
      friends.forEach(f => {
        shares[f.id] += extraShare;
      });
    }

    return Object.entries(shares).map(([friendId, totalShare]) => {
      const friendObj = friends.find(f => f.id === friendId);
      return {
        friendId,
        name: friendObj?.name || 'Amigo',
        avatar: friendObj?.avatar || '?',
        color: friendObj?.color || '#D2D2D2',
        total: Math.round(totalShare * 100) / 100
      };
    }).filter(share => share.total > 0);
  };

  const getPaidStatus = () => {
    const activeShares = getFriendsShares();
    const total = getTotal();
    const paidSum = activeShares
      .filter(s => comanda.paidFriendIds?.includes(s.friendId))
      .reduce((sum, s) => sum + s.total, 0);
    const percentage = total > 0 ? Math.min(100, Math.round((paidSum / total) * 100)) : 0;
    return {
      total,
      paidSum,
      percentage
    };
  };

  const handleToggleFriendPaid = (friendId: string) => {
    const currentPaidIds = comanda.paidFriendIds || [];
    let updatedPaidIds: string[];
    if (currentPaidIds.includes(friendId)) {
      updatedPaidIds = currentPaidIds.filter(id => id !== friendId);
    } else {
      updatedPaidIds = [...currentPaidIds, friendId];
    }

    const activeShares = getFriendsShares();
    const activeFriendIds = activeShares.map(s => s.friendId);
    const allPaid = activeFriendIds.length > 0 && activeFriendIds.every(id => updatedPaidIds.includes(id));

    onUpdateComanda({
      ...comanda,
      paidFriendIds: updatedPaidIds,
      isPaid: allPaid
    });
  };

  const handleToggleEntireComandaPaid = () => {
    const activeShares = getFriendsShares();
    const activeFriendIds = activeShares.map(s => s.friendId);
    
    if (comanda.isPaid) {
      onUpdateComanda({
        ...comanda,
        paidFriendIds: [],
        isPaid: false
      });
    } else {
      onUpdateComanda({
        ...comanda,
        paidFriendIds: activeFriendIds,
        isPaid: true
      });
    }
  };

  const activeFriendsCount = friends.length || 4;

  const copyPixClipboard = () => {
    navigator.clipboard.writeText(userPixKey);
    setCopiedText(true);
    setTimeout(() => {
      setCopiedText(false);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      
      {/* Top action header bar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200/80 shadow-xs z-10">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onBack}
            className="flex items-center justify-center size-9 border border-slate-200 bg-white rounded-xl shadow-xs cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
            title="Voltar"
          >
            <ArrowLeft size={16} className="text-slate-650" />
          </button>
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="flex items-center justify-center size-9 border border-slate-200 bg-white text-slate-650 rounded-xl shadow-xs cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
              title="Menu Principal"
            >
              <Menu size={16} className="stroke-[2.2px]" />
            </button>
          )}
        </div>
        <div className="font-sans text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          DIVISÃO DA CONTA
        </div>
        {isAdmin ? (
          <button 
            onClick={() => setIsAddFriendOpen(true)}
            title="Adicionar Novo Amigo"
            className="flex items-center justify-center size-9 border border-slate-200 bg-white rounded-xl shadow-xs cursor-pointer hover:bg-slate-50 active:scale-95 transition-all text-slate-650"
          >
            <UserPlus size={16} />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* Main Form Scroller */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28 lg:pb-8">
        
        {/* Title and date info */}
        <div className="p-6 pb-2">
          <input
            type="text"
            value={comanda.name}
            disabled={!isAdmin}
            onChange={(e) => updateComandaName(e.target.value)}
            className={`w-full bg-transparent font-sans text-xl font-bold text-slate-900 pb-1 uppercase tracking-tight transition-all ${
              isAdmin ? 'border-b-2 border-transparent hover:border-dashed hover:border-slate-300 focus:border-indigo-500 focus:outline-none' : 'border-none select-none cursor-default'
            }`}
            placeholder="NOME DA COMANDA"
          />
          {!isAdmin && (
            <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-amber-800 text-[10px] font-sans font-bold uppercase tracking-wider select-none animate-fade-in">
              <Lock size={12} className="stroke-[2.5]" />
              <span>Modo de Visualização: Apenas o Administrador pode efetuar alterações</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 border-b border-slate-100 pb-2">
            <div className="flex gap-2 text-slate-400 font-sans text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              <span>{formatDatePT(comanda.date)}</span>
              <span>•</span>
              <span className="text-slate-705 font-extrabold">{activeFriendsCount} PESSOAS ATIVAS</span>
            </div>
            
            {/* Inline Minimize/Maximize controls */}
            <div className="flex items-center gap-2.5 text-[10.5px] uppercase font-sans font-bold tracking-wider">
              <button 
                onClick={expandAllItems} 
                className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Expandir Itens
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={collapseAllItems} 
                className="text-slate-450 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Minimizar Itens
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Grid Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 md:px-6 mt-2">
          
          {/* LEFT COLUMN: Items & Food registry (Cols 1-7) */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">

            {/* Referência de Moeda da Comanda */}
        <div className="hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0"></span>
            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2.5 py-0.5 rounded-md uppercase truncate">
              {comanda.currency || 'BRL'}
            </span>
          </div>
        </div>

        {/* Dynamic Items Listing representing layout in screenshots */}
        <div className="px-4 py-2 flex flex-col gap-3">
          {comanda.items.map((item) => {
            const isExpanded = !!expandedItemIds[item.id];
            const itemTotal = item.price * item.quantity;
            const isUnassigned = item.assignedTo.length === 0;

            return (
              <div 
                key={item.id}
                className={`bg-white border rounded-2xl p-4.5 flex flex-col gap-3 transition-all duration-200 ${
                  isUnassigned 
                    ? 'opacity-65 border-dashed border-red-200 bg-red-50/10' 
                    : 'border-slate-200/80 shadow-elegant hover:border-indigo-50'
                }`}
              >
                {/* Heading info */}
                <div 
                  onClick={() => toggleItemExpanded(item.id)}
                  className="flex justify-between items-start cursor-pointer group"
                >
                  <div className="flex-1 pr-4">
                    <h3 className={`font-sans font-bold text-sm leading-tight transition-colors ${
                      isUnassigned ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-indigo-600'
                    }`}>
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                    </h3>

                    {/* Quick Avatars of Assigned companions */}
                    {!isExpanded && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {isUnassigned ? (
                          <span className="font-sans text-[8px] text-rose-500 uppercase font-extrabold tracking-wider">
                            NENHUM MEMBRO ATRIBUÍDO
                          </span>
                        ) : (
                          item.assignedTo
                            .map((friendId) => friends.find(f => f.id === friendId))
                            .filter((friendObj): friendObj is Friend => !!friendObj)
                            .map((friendObj) => {
                              return (
                                <div 
                                  key={friendObj.id}
                                  className="size-6 rounded-md border flex items-center justify-center font-sans text-[9px] font-bold shadow-2xs"
                                  style={{
                                    backgroundColor: `${friendObj.color}15`,
                                    borderColor: friendObj.color,
                                    color: friendObj.color
                                  }}
                                  title={friendObj.name}
                                >
                                  {friendObj.avatar}
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`font-mono text-sm font-bold tracking-tight ${
                      isUnassigned ? 'line-through text-slate-450' : ''
                    }`}>
                      {renderDualPrice(itemTotal)}
                    </div>
                  </div>
                </div>

                {/* Sub-panel displaying active friend options */}
                {isExpanded && (
                  <div className="border-t border-dashed border-slate-150 mt-2 pt-3 flex flex-col gap-2.5">
                    <span className="font-sans text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      Selecione quem dividiu este item:
                    </span>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {friends.map((friend) => {
                        const isSelected = item.assignedTo.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            disabled={!isAdmin}
                            onClick={() => toggleFriendOnItem(item.id, friend.id)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-sans font-bold uppercase tracking-wider transition-all ${
                              !isAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:bg-slate-50'
                            } ${
                              isSelected 
                                ? 'bg-indigo-55 border-indigo-200/60 text-indigo-700 shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-550'
                            }`}
                          >
                            <div 
                              className="size-5 rounded-md flex items-center justify-center font-sans text-[9.5px] font-bold border"
                              style={{
                                backgroundColor: isSelected ? `${friend.color}15` : '#F8FAFC',
                                borderColor: isSelected ? friend.color : '#E2E8F0',
                                color: isSelected ? friend.color : '#64748B'
                              }}
                            >
                              {friend.avatar}
                            </div>
                            <span>{friend.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Calculated Split visualization of this item */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200">
                      <div className="font-sans text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        {isUnassigned ? (
                          <span className="text-rose-500 font-extrabold uppercase">Item excluído da soma individual</span>
                        ) : (
                          comanda.serviceFeePercent > 0 ? (
                            <span>R$ {((itemTotal * (1 + comanda.serviceFeePercent / 100)) / item.assignedTo.length).toFixed(2).replace('.', ',')} por pessoa (c/ {comanda.serviceFeePercent}% taxa)</span>
                          ) : (
                            <span>R$ {(itemTotal / item.assignedTo.length).toFixed(2).replace('.', ',')} por pessoa</span>
                          )
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditItemName(item.name);
                              setEditItemPrice(item.price.toString());
                              setEditItemQty(item.quantity.toString());
                            }}
                            className="text-indigo-650 hover:text-indigo-800 flex items-center gap-1 font-sans text-[9px] uppercase font-bold cursor-pointer transition-colors"
                            title="Editar este item"
                          >
                            <Edit size={11} />
                            <span>Editar</span>
                          </button>
                          <span className="text-slate-200">|</span>
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="text-rose-500 hover:text-rose-600 flex items-center gap-1 font-sans text-[9px] uppercase font-bold cursor-pointer transition-colors"
                            title="Deletar este item"
                          >
                            <Trash2 size={11} />
                            <span>Remover</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Dinamic Service Fee display */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-elegant">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-sans font-bold text-xs text-slate-800 block">Taxa de Serviço ({comanda.serviceFeePercent}%)</span>
                <span className="font-sans text-[9px] text-slate-400 font-bold uppercase block mt-0.5">Taxa calculada entre quem compartilha o item</span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={comanda.serviceFeePercent}
                  disabled={!isAdmin}
                  onChange={(e) => updateServiceFee(parseInt(e.target.value, 10))}
                  className={`border border-slate-200 rounded-lg p-1 px-1.5 font-sans text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all ${
                    !isAdmin ? 'bg-slate-100 cursor-not-allowed opacity-80' : 'bg-slate-50 cursor-pointer'
                  }`}
                >
                  {[0, 5, 10, 15, 20].map((percentage) => (
                    <option key={percentage} value={percentage}>
                      {percentage}%
                    </option>
                  ))}
                </select>
                <span className="font-mono text-xs font-bold text-slate-850 shrink-0">
                  R$ {getServiceFeeValue().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Trigger button for manual invoice insertions */}
          {isAdmin ? (
            <button 
              onClick={() => setIsAddItemOpen(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 rounded-2xl text-slate-500 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer bg-white shadow-xs"
            >
              <Plus size={14} />
              <span>ADICIONAR ITEM MANUAL</span>
            </button>
          ) : (
            <div className="w-full py-4 border border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-100 flex items-center justify-center gap-2 select-none">
              <Lock size={12} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider">Edição exclusiva para Administradores</span>
            </div>
          )}
        </div>

        {/* Closing LEFT COLUMN */}
        </div>

        {/* RIGHT COLUMN: Real-Time Settle & Live Checkout stats panel (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col gap-4.5 lg:sticky lg:top-4 self-start">
          
          {/* Quick calculations bento display */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-elegant flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-105 pb-2.5">
              <span className="size-2 rounded-full bg-indigo-600 animate-pulse" />
              <h4 className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Resumo Geral da Conta
              </h4>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                <span>Subtotal</span>
                <span className="font-mono text-slate-700 text-xs font-bold">R$ {getSubtotal().toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                <span>Serviço ({comanda.serviceFeePercent}%)</span>
                <span className="font-mono text-slate-700 text-xs font-bold">R$ {getServiceFeeValue().toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans mt-0.5">Valor Total</span>
                <div className="text-right leading-tight">
                  <span className="block font-mono text-xl font-bold text-indigo-600">
                    R$ {getTotal().toFixed(2).replace('.', ',')}
                  </span>
                  {(comanda.currency || 'BRL') !== 'BRL' && (
                    <span className="block font-mono text-[9px] text-slate-400 font-semibold uppercase tracking-tight mt-1">
                      {formatCurrency(getTotal(), comanda.currency)} ({comanda.currency})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress visualizer */}
            {(() => {
              const stats = getPaidStatus();
              return (
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-[9px] font-bold text-slate-450 uppercase">Recebido: R$ {stats.paidSum.toFixed(2).replace('.', ',')}</span>
                    <span className="text-[8.5px] font-bold uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded leading-none">
                      {stats.percentage}% PAGO
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-sans font-bold uppercase py-3 rounded-xl text-[10.5px] tracking-widest cursor-pointer active:scale-95 transition-all flex justify-center items-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow-lg mt-1"
            >
              <span>Visualizar Divisão</span>
              <CheckCircle2 size={13} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Quick checklist of participants */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-elegant flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <h4 className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Integrantes & Pagamento
              </h4>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
              {getFriendsShares().map((share) => {
                const hasPaid = comanda.paidFriendIds?.includes(share.friendId);
                return (
                  <div 
                    key={share.friendId}
                    onClick={() => {
                      if (isAdmin) handleToggleFriendPaid(share.friendId);
                    }}
                    className={`flex justify-between items-center p-2.5 border rounded-xl select-none transition-all duration-150 ${
                      isAdmin 
                        ? 'cursor-pointer active:scale-[0.99]' 
                        : 'cursor-default'
                    } ${
                      hasPaid
                        ? 'border-emerald-200 bg-emerald-50/10 text-emerald-800'
                        : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div 
                        className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                          hasPaid ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        <Check size={9} strokeWidth={4} className={hasPaid ? 'block' : 'hidden'} />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-sans text-[10px] leading-none shrink-0">{share.avatar}</span>
                        <span className={`text-[11px] font-sans font-bold uppercase truncate ${hasPaid ? 'line-through text-slate-400' : 'text-slate-750'}`}>
                          {share.name}
                        </span>
                      </div>
                    </div>
                    <span className={`font-mono text-[10.5px] font-bold shrink-0 ${hasPaid ? 'text-slate-400' : 'text-slate-800'}`}>
                      R$ {(share.total * (comanda.exchangeRate || 1.0)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                );
              })}
              {getFriendsShares().length === 0 && (
                <p className="text-center font-sans text-[10px] font-bold text-slate-400 uppercase py-6 tracking-wide">
                  Nenhum integrante com itens divididos.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Closing Grid Split container */}
        </div>
      </div>

      {/* Sticky Bottom Summary Dashboard (Mobile / Tablet Only, hidden on Desktop via lg:hidden) */}
      <div className="lg:hidden absolute bottom-0 left-0 w-full bg-slate-900 text-white p-3.5 px-5 pb-4 flex items-center justify-between gap-3.5 rounded-t-2xl shadow-elegant-lg z-25 animate-slide-up bg-opacity-[0.98] backdrop-blur-md">
        <div className="flex-1 min-w-0">
          {(() => {
            const totalOrig = getTotal();
            const billCurrency = comanda.currency || 'BRL';
            const isForeign = billCurrency !== 'BRL';
            const exchangeRate = comanda.exchangeRate || 1.0;
            const totalBRL = totalOrig * exchangeRate;

            return (
              <div className="flex flex-col leading-tight">
                <span className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400">VALOR TOTAL</span>
                {isForeign ? (
                  <div className="flex flex-col mt-0.5">
                    <span className="font-mono text-[9px] text-slate-400 font-semibold leading-none">
                      {formatCurrency(totalOrig, billCurrency)}
                    </span>
                    <span className="font-mono text-base font-extrabold text-emerald-400 leading-none mt-1">
                      {formatCurrency(totalBRL, 'BRL')}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-base font-extrabold text-emerald-400 mt-1">
                    R$ {totalOrig.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
        
        <button 
          onClick={() => setIsCheckoutOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-extrabold uppercase px-4.5 py-2.5 rounded-xl text-[10px] tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-1 shadow-md shadow-indigo-600/15 duration-200 shrink-0"
        >
          <span>FECHAR CONTA</span>
          <CheckCircle2 size={11} className="stroke-[2.5]" />
        </button>
      </div>

      {/* UI Modal - Close Account Split Breakdown & PIX */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg flex flex-col overflow-hidden max-h-[85vh] animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-950 text-white p-4.5 flex justify-between items-center shrink-0">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider">Divisão de Contas</h3>
              <div className="text-right flex flex-col items-end leading-none gap-1">
                <div className="font-mono text-xs text-emerald-400 font-bold">
                  R$ {(getTotal() * (comanda.exchangeRate || 1.0)).toFixed(2).replace('.', ',')}
                </div>
                {(comanda.currency || 'BRL') !== 'BRL' && (
                  <div className="font-mono text-[9px] text-slate-400 font-bold">
                    {formatCurrency(getTotal(), comanda.currency)}
                  </div>
                )}
              </div>
            </div>

            {/* Content scrolling list of summaries */}
            <div className="p-5 flex-1 overflow-y-auto no-scrollbar space-y-4">
              
              {/* Exact share computations with interactive payment state */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Divisão por Integrante (Clique para Confirmar)
                  </span>
                  
                  {/* Partial stats helper */}
                  {(() => {
                    const stats = getPaidStatus();
                    return (
                      <span className="font-sans text-[9.5px] font-black text-indigo-600 uppercase bg-indigo-50/70 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                        {stats.percentage}% PAGO
                      </span>
                    );
                  })()}
                </div>

                {/* Progress bar visualizer */}
                {(() => {
                  const stats = getPaidStatus();
                  return (
                    <div className="space-y-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl">
                      <div className="flex justify-between text-[8px] font-extrabold text-slate-500 uppercase">
                        <span>Recebido: R$ {stats.paidSum.toFixed(2).replace('.', ',')}</span>
                        <span>Faltando: R$ {(stats.total - stats.paidSum).toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
                
                <div className="space-y-2">
                  {getFriendsShares().map((share) => {
                    const hasPaid = comanda.paidFriendIds?.includes(share.friendId);
                    return (
                      <div 
                        key={share.friendId}
                        onClick={() => {
                          if (isAdmin) handleToggleFriendPaid(share.friendId);
                        }}
                        className={`flex justify-between items-center p-3 border rounded-xl select-none transition-all ${
                          isAdmin 
                            ? 'cursor-pointer active:scale-[0.99]' 
                            : 'cursor-default'
                        } ${
                          hasPaid 
                            ? 'border-emerald-250 bg-emerald-50/30 hover:bg-emerald-50/50 shadow-xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50/50 shadow-elegant'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Circle check status icon indicator */}
                          <div 
                            className={`size-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                              hasPaid 
                                ? 'bg-emerald-500 border-emerald-600 text-white' 
                                : 'border-slate-300 text-transparent bg-slate-50'
                            }`}
                          >
                            <Check size={10} className="stroke-[3]" />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div 
                              className="size-6 rounded-md border flex items-center justify-center font-sans text-[8.5px] font-bold shadow-2xs"
                              style={{
                                backgroundColor: `${share.color}15`,
                                borderColor: share.color,
                                color: share.color
                              }}
                            >
                              {share.avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-sans text-xs uppercase font-extrabold ${hasPaid ? 'line-through text-slate-400' : 'text-slate-705'}`}>
                                {share.name}
                              </span>
                              {hasPaid && (
                                <span className="text-[7.5px] text-emerald-600 font-extrabold uppercase leading-none mt-0.5">PAGO</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <div className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                            hasPaid 
                              ? 'bg-emerald-100/50 border-emerald-200 text-emerald-800' 
                              : 'bg-slate-50 border-slate-100 text-slate-800'
                          }`}>
                            R$ {(share.total * (comanda.exchangeRate || 1.0)).toFixed(2).replace('.', ',')}
                          </div>
                          {(comanda.currency || 'BRL') !== 'BRL' && (
                            <span className="font-mono text-[9px] text-slate-450 font-bold tracking-tight mt-0.5">
                              {formatCurrency(share.total, comanda.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {getFriendsShares().length === 0 && (
                    <p className="text-center font-sans text-xs font-bold text-rose-500 py-4 uppercase">
                      Por favor, atribua integrantes aos itens para visualizar a divisão!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Settle Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50 shrink-0">
              {isAdmin && (
                <button
                  onClick={handleToggleEntireComandaPaid}
                  className={`flex-1 p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider text-center transition-all active:scale-95 cursor-pointer block ${
                    comanda.isPaid 
                      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-550/10' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-550/10'
                  }`}
                >
                  {comanda.isPaid ? 'Estornar Todos' : 'Quitar Todos'}
                </button>
              )}
              
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 bg-slate-900 text-white p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-slate-950 active:scale-95 transition-all cursor-pointer text-center"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual Item Add Form Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg p-6 animate-scale-up">
            <h3 className="font-sans font-bold text-sm uppercase mb-4 border-b border-slate-100 pb-2.5 text-slate-900">
              Adicionar Item Manual
            </h3>
            
            <form onSubmit={handleCreateManualItem} className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nome do Item
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: SUCO DE CEVADA"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="EX: ALIMENTAÇÃO"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="EX: ALIMENTAÇÃO"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="EX: ALIMENTAÇÃO"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Preço ({CURRENCIES[comanda.currency || 'BRL']?.symbol || 'R$'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="18.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="3"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddItemOpen(false);
                    setNewItemName('');
                    setNewItemPrice('');
                    setNewItemQty('1');
                  }}
                  className="flex-1 border border-slate-200 bg-white text-slate-600 p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Item Edit Form Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg p-6 animate-scale-up">
            <h3 className="font-sans font-bold text-sm uppercase mb-4 border-b border-slate-100 pb-2.5 text-slate-900">
              Editar Item
            </h3>
            
            <form onSubmit={handleSaveEditItem} className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nome do Item
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: SUCO DE CEVADA"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="EX: ALIMENTAÇÃO"
                  value={editItemCategory}
                  onChange={(e) => setEditItemCategory(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Preço ({CURRENCIES[comanda.currency || 'BRL']?.symbol || 'R$'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="18.00"
                    value={editItemPrice}
                    onChange={(e) => setEditItemPrice(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="3"
                    value={editItemQty}
                    onChange={(e) => setEditItemQty(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border border-slate-200 bg-white text-slate-600 p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Item Add Form Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg p-6 animate-scale-up">
            <h3 className="font-sans font-bold text-sm uppercase mb-4 border-b border-slate-100 pb-2.5 text-slate-900">
              Adicionar Item Manual
            </h3>
            
            <form onSubmit={handleCreateManualItem} className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nome do Item
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: SUCO DE CEVADA"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Preço ({CURRENCIES[comanda.currency || 'BRL']?.symbol || 'R$'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="18.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="3"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddItemOpen(false);
                    setNewItemName('');
                    setNewItemPrice('');
                    setNewItemQty('1');
                  }}
                  className="flex-1 border border-slate-200 bg-white text-slate-600 p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amigo Addition Modal */}
      {isAddFriendOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] bg-white border border-slate-200 rounded-3xl shadow-elegant-lg p-6 animate-scale-up">
            <h3 className="font-sans font-bold text-sm uppercase mb-4 border-b border-slate-100 pb-2.5 text-slate-900">
              Adicionar Amigo
            </h3>
            
            <form onSubmit={handleCreateFriend} className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nome (Primeiro Nome)
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: CAMILA"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 font-sans text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 text-slate-700"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddFriendOpen(false);
                    setNewFriendName('');
                  }}
                  className="flex-1 border border-slate-200 bg-white text-slate-600 p-3 rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer active:scale-95 transition-all text-center"
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
