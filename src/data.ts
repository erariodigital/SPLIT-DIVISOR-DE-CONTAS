/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Friend, Comanda } from './types';

export const INITIAL_FRIENDS: Friend[] = [
  { id: '1', name: 'LUCAS', avatar: 'L', color: '#00E676' },
  { id: '2', name: 'MARIA', avatar: 'M', color: '#D2D2D2' },
  { id: '3', name: 'JOÃO', avatar: 'J', color: '#00E676' },
  { id: '4', name: 'PEDRO', avatar: 'P', color: '#00E676' },
];

export const INITIAL_COMANDAS: Comanda[] = [
  {
    id: 'comanda-1',
    name: 'BAR DO AROEIRA',
    date: '2023-10-24', // '24 OUT 2023'
    code: 'TAB #0492',
    isPaid: true,
    serviceFeePercent: 10,
    items: [
      {
        id: 'item-1',
        name: 'Cerveja IPA',
        price: 18.00,
        quantity: 3,
        assignedTo: ['1', '2', '3'] // Lucas, Maria, João
      },
      {
        id: 'item-2',
        name: 'Porção de Fritas (Grande)',
        price: 42.50,
        quantity: 1,
        assignedTo: ['1', '2', '3', '4'] // Lucas, Maria, João, Pedro
      },
      {
        id: 'item-3',
        name: 'Caipirinha Limão',
        price: 18.00,
        quantity: 2,
        assignedTo: [] // Nenhum membro atribuído (represented as crossed out or inactive)
      }
    ]
  },
  {
    id: 'comanda-2',
    name: 'PIZZA SEXTA',
    date: '2023-10-18', // '18 OUT 2023'
    code: 'TAB #0812',
    isPaid: true,
    serviceFeePercent: 10,
    items: [
      {
        id: 'item-2-1',
        name: 'Pizza Meio a Meio G',
        price: 68.00,
        quantity: 1,
        assignedTo: ['1', '2']
      },
      {
        id: 'item-2-2',
        name: 'Garrafa Guaraná 2L',
        price: 12.00,
        quantity: 0.5, // representation of sharing price, or let's say quantity 1 with price 12
        assignedTo: ['1', '2']
      }
    ]
  },
  {
    id: 'comanda-3',
    name: 'CHURRASCO DOMINGO',
    date: '2023-10-15', // '15 OUT 2023'
    code: 'TAB #1243',
    isPaid: false,
    serviceFeePercent: 10,
    items: [
      {
        id: 'item-3-1',
        name: 'Corte de Picanha',
        price: 160.00,
        quantity: 1,
        assignedTo: ['2', '3', '4']
      },
      {
        id: 'item-3-2',
        name: 'Cerveja Original Garrafa',
        price: 12.00,
        quantity: 11,
        assignedTo: ['1', '3', '4']
      }
    ]
  },
  {
    id: 'comanda-4',
    name: 'CHURRASCO MENSAL',
    date: '2023-09-22',
    code: 'TAB #2241',
    isPaid: true,
    serviceFeePercent: 10,
    items: [
      {
        id: 'item-4-1',
        name: 'Combo Churrasco Premium',
        price: 409.10,
        quantity: 1,
        assignedTo: ['1', '2', '3', '4']
      }
    ]
  },
  {
    id: 'comanda-5',
    name: 'CINEMA + PIPOCA',
    date: '2023-09-10',
    code: 'TAB #1092',
    isPaid: true,
    serviceFeePercent: 10,
    items: [
      {
        id: 'item-5-1',
        name: 'Ingresso Inteira',
        price: 45.00,
        quantity: 2,
        assignedTo: ['2', '3']
      },
      {
        id: 'item-5-2',
        name: 'Combo Pipoca Gigante',
        price: 55.00,
        quantity: 1,
        assignedTo: ['2', '3']
      }
    ]
  },
  {
    id: 'comanda-6',
    name: 'UBER FESTA',
    date: '2023-10-02',
    code: 'TAB #0032',
    isPaid: false,
    serviceFeePercent: 0,
    items: [
      {
        id: 'item-6-1',
        name: 'Uber Black ida e volta',
        price: 42.00,
        quantity: 1,
        assignedTo: ['1', '3']
      }
    ]
  }
];

// Presets which can be "scanned" in camera mode for a fun, interactive OCR simulation experience!
export const MOCK_RECEIPT_PRESETS = [
  {
    id: 'preset-outback',
    storeName: 'OUTBACK STEAKHOUSE',
    items: [
      { name: 'Ribs On The Barbie', price: 94.90, quantity: 1 },
      { name: 'Chopp Brahma Caneca', price: 14.50, quantity: 4 },
      { name: 'Bloomin Onion', price: 54.00, quantity: 1 },
      { name: 'Refil Refris', price: 16.90, quantity: 2 }
    ]
  },
  {
    id: 'preset-madere',
    storeName: 'MADERO BURGER',
    items: [
      { name: 'Madero Cheeseburger', price: 49.00, quantity: 3 },
      { name: 'Batata Frita M', price: 19.00, quantity: 2 },
      { name: 'Lemonade Pink', price: 12.00, quantity: 3 },
      { name: 'Duo Brigadeiro de Colher', price: 22.00, quantity: 1 }
    ]
  },
  {
    id: 'preset-padaria',
    storeName: 'PADARIA BELLA VISTA',
    items: [
      { name: 'Pão de Queijo Copo', price: 12.50, quantity: 2 },
      { name: 'Suco Laranja Integral', price: 10.00, quantity: 3 },
      { name: 'Pingado Grande', price: 7.50, quantity: 4 },
      { name: 'Bolo de Cenoura Calda', price: 16.00, quantity: 1 }
    ]
  },
  {
    id: 'preset-starbucks-ny',
    storeName: 'STARBUCKS NEW YORK ($ - USD)',
    items: [
      { name: 'Caramel Macchiato', price: 5.75, quantity: 2 },
      { name: 'Avocado Toast', price: 8.50, quantity: 1 },
      { name: 'Chai Latte', price: 4.95, quantity: 3 },
      { name: 'Blueberry Scone', price: 3.80, quantity: 2 }
    ]
  },
  {
    id: 'preset-bistro-paris',
    storeName: 'LE BISTRO DE PARIS (€ - EUR)',
    items: [
      { name: 'Croissant au Beurre', price: 3.50, quantity: 4 },
      { name: 'Café au Lait', price: 4.80, quantity: 4 },
      { name: 'Quiche Lorraine', price: 14.50, quantity: 2 },
      { name: 'Crème Brûlée', price: 9.00, quantity: 2 }
    ]
  }
];
