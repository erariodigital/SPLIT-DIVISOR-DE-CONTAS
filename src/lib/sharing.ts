import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Comanda, UserProfile } from '../types';

export interface SharedData {
  comandas: Comanda[];
  profiles: UserProfile[];
}

export const saveSharedData = async (data: SharedData, expiryTime: number): Promise<string> => {
  const docId = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const shareRef = doc(db, 'shares', docId);
  await setDoc(shareRef, {
    ...data,
    expiresAt: expiryTime
  });
  return docId;
};

export const loadSharedData = async (docId: string): Promise<SharedData | null> => {
  const shareRef = doc(db, 'shares', docId);
  const docSnap = await getDoc(shareRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.expiresAt < Date.now()) {
      return null;
    }
    return data as SharedData;
  }
  return null;
};
