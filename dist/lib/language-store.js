import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
export const useLanguageStore = create()(persist((set) => ({
    language: 'es',
    setLanguage: (lang) => set({ language: lang }),
    _hasHydrated: false,
    setHasHydrated: (state) => set({ _hasHydrated: state }),
}), {
    name: '3dprint-language',
    onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
    },
}));
// Hook to safely use language with hydration handling
export function useLanguage() {
    const { language, setLanguage, _hasHydrated } = useLanguageStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    // Return default language during SSR/before hydration
    return {
        language: mounted && _hasHydrated ? language : 'es',
        setLanguage,
        isHydrated: mounted && _hasHydrated,
    };
}
