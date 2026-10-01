import { useSyncExternalStore } from 'react';
import { subscribeStorage, getStorageRevision, getMealRecordsSnapshot } from '../utils/storage';

export const useStorageRevision = () =>
  useSyncExternalStore(subscribeStorage, getStorageRevision, () => 0);

export const useMealRecords = () => useSyncExternalStore(subscribeStorage, getMealRecordsSnapshot);
