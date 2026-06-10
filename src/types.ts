/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Friend {
  id: string;
  name: string;
  avatar: string; // single character avatar (e.g. 'L', 'M', 'J')
  color: string;  // color class or hex (such as #00E676, bg-primary, etc.)
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // Friend IDs
}

export interface Comanda {
  id: string;
  name: string;
  date: string; // e.g., '24 OUT 2023' or '2026-05-25'
  items: Item[];
  serviceFeePercent: number; // e.g. 10
  isPaid: boolean;
  code: string; // e.g., 'TAB #0492'
  paidFriendIds?: string[]; // IDs of friends who have paid their share
  currency?: string;     // e.g. 'BRL', 'USD', 'EUR', 'ARS'
  exchangeRate?: number;  // e.g. 5.20 - rate to convert to BRL
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  pixKey: string;
  avatar: string; // base64 or URL or SVG initials
  phone?: string;
}
