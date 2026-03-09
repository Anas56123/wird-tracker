import { DarkTheme, GirlTheme, GreenTheme, Theme } from '@/constants/theme';
import { Language, translations } from '@/constants/translations';
import { UserProfile } from '@/lib/logic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

interface AppContextType {
    user: UserProfile | null;
    setUser: (user: UserProfile) => void;
    theme: Theme;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: any;
    carryOver: { recitation: number; memorization: number };
    setCarryOver: (co: { recitation: number; memorization: number }) => void;
    isLoading: boolean;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<UserProfile | null>(null);
    const [language, setLangState] = useState<Language>('ar');
    const [carryOver, setCOState] = useState({ recitation: 0, memorization: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const isAr = language === 'ar';
        if (I18nManager.isRTL !== isAr) {
            I18nManager.allowRTL(isAr);
            I18nManager.forceRTL(isAr);
        }
    }, [language]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user_profile');
                const storedCO = await AsyncStorage.getItem('carry_over');
                const storedDM = await AsyncStorage.getItem('dark_mode');

                if (storedUser) {
                    let parsedUser = JSON.parse(storedUser);

                    // Migration: Convert old structure to new separate fields
                    if (!parsedUser.selectedSurahs) parsedUser.selectedSurahs = parsedUser.selectedIds || [];
                    if (!parsedUser.selectedJuzs) parsedUser.selectedJuzs = [];
                    if (!parsedUser.selectedHizbs) parsedUser.selectedHizbs = [];
                    if (!parsedUser.selectionMode) parsedUser.selectionMode = 'surah';

                    setUserState(parsedUser);
                    setLangState(parsedUser.language || 'ar');
                }
                if (storedCO) {
                    setCOState(JSON.parse(storedCO));
                }
                if (storedDM) {
                    setDarkMode(JSON.parse(storedDM));
                }
            } catch (e) {
                console.error('Failed to load storage', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const setUser = async (newUser: UserProfile) => {
        setUserState(newUser);
        setLangState(newUser.language);
        await AsyncStorage.setItem('user_profile', JSON.stringify(newUser));
    };

    const toggleDarkMode = async () => {
        setDarkMode(prev => {
            const newVal = !prev;
            AsyncStorage.setItem('dark_mode', JSON.stringify(newVal));
            return newVal;
        });
    };

    const setLanguage = async (lang: Language) => {
        setLangState(lang);
        if (user) {
            const updated = { ...user, language: lang };
            setUserState(updated);
            await AsyncStorage.setItem('user_profile', JSON.stringify(updated));
        }
    };

    const setCarryOver = async (co: { recitation: number; memorization: number }) => {
        setCOState(co);
        await AsyncStorage.setItem('carry_over', JSON.stringify(co));
    };

    let theme: Theme = isDarkMode ? DarkTheme : GreenTheme;
    if (user?.gender === 'girl') {
        theme = GirlTheme;
    }

    const t = translations[language];

    return (
        <AppContext.Provider value={{
            user, setUser, theme, language, setLanguage, t, carryOver, setCarryOver, isLoading, isDarkMode, toggleDarkMode
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
