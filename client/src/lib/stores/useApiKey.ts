import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_API_KEY } from '../services/deepseekService';

interface ApiKeyState {
  deepseekApiKey: string | null;
  setDeepseekApiKey: (key: string) => void;
}

export const useApiKey = create<ApiKeyState>()(
  persist(
    (set) => ({
      deepseekApiKey: DEFAULT_API_KEY, // Use the default key initially
      setDeepseekApiKey: (key) => set({ deepseekApiKey: key }),
    }),
    {
      name: 'novaseo-api-key-storage',
      // You can add custom encryption for additional security
    }
  )
);