import { DarkPinkTheme, DarkTheme, GreenTheme, PinkTheme, Theme } from '../constants/theme';
import { Language, translations } from '../constants/translations';
import { UserProfile } from '../lib/logic';
import { supabase } from '../lib/supabase';
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
    themeMode: 'green' | 'dark' | 'pink' | 'darkpink';
    toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<UserProfile | null>(null);
    const [language, setLangState] = useState<Language>('ar');
    const [carryOver, setCOState] = useState({ recitation: 0, memorization: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [themeMode, setThemeMode] = useState<'green' | 'dark' | 'pink' | 'darkpink'>('green');

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
                // 1. Initial Local Load
                const storedUser = await AsyncStorage.getItem('user_profile');
                const storedCO = await AsyncStorage.getItem('carry_over');
                const storedMode = await AsyncStorage.getItem('theme_mode');
                const storedSupabaseId = await AsyncStorage.getItem('supabase_user_id');

                let currentSupabaseId = storedSupabaseId;

                if (storedUser) {
                    let parsedUser = JSON.parse(storedUser);
                    setUserState(parsedUser);
                    setLangState(parsedUser.language || 'ar');
                }
                if (storedCO) setCOState(JSON.parse(storedCO));
                if (storedMode) setThemeMode(storedMode as any);

                // 2. Supabase Sync / Recovery
                if (currentSupabaseId) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentSupabaseId)
                        .single();

                    if (data && !error) {
                        const cloudUser: UserProfile = {
                            name: data.name,
                            language: data.language,
                            selectionMode: data.selection_mode,
                            selectedSurahs: data.selected_surahs,
                            selectedJuzs: data.selected_juzs,
                            selectedHizbs: data.selected_hizbs,
                            memPerDay: data.mem_per_day,
                            breakDays: data.break_days,
                            memSelectionMode: data.mem_selection_mode || 'systematic',
                            manualMemSelectionMode: data.manual_mem_selection_mode || 'surah',
                            manualMemSurahs: data.manual_mem_surahs || [],
                            manualMemJuzs: data.manual_mem_juzs || [],
                            manualMemHizbs: data.manual_mem_hizbs || [],
                            mainGoal: data.main_goal || 'memorize',
                        };
                        setUserState(cloudUser);
                        setLangState(cloudUser.language);
                        setCOState({
                            recitation: data.recitation_carry_over,
                            memorization: data.memorization_carry_over
                        });
                        setThemeMode(data.theme_mode);

                        // Update local cache
                        await AsyncStorage.setItem('user_profile', JSON.stringify(cloudUser));
                        await AsyncStorage.setItem('carry_over', JSON.stringify({
                            recitation: data.recitation_carry_over,
                            memorization: data.memorization_carry_over
                        }));
                        await AsyncStorage.setItem('theme_mode', data.theme_mode);
                    }
                }
            } catch (e) {
                console.error('Failed to load storage', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const syncToSupabase = async (
        updatedUser: UserProfile | null,
        updatedCO: { recitation: number; memorization: number },
        updatedMode: string
    ) => {
        try {
            let supabaseId = await AsyncStorage.getItem('supabase_user_id');
            const profileData = {
                name: updatedUser?.name,
                language: updatedUser?.language,
                selection_mode: updatedUser?.selectionMode,
                selected_surahs: updatedUser?.selectedSurahs,
                selected_juzs: updatedUser?.selectedJuzs,
                selected_hizbs: updatedUser?.selectedHizbs,
                mem_per_day: updatedUser?.memPerDay,
                break_days: updatedUser?.breakDays,
                mem_selection_mode: updatedUser?.memSelectionMode,
                manual_mem_selection_mode: updatedUser?.manualMemSelectionMode,
                manual_mem_surahs: updatedUser?.manualMemSurahs,
                manual_mem_juzs: updatedUser?.manualMemJuzs,
                manual_mem_hizbs: updatedUser?.manualMemHizbs,
                main_goal: updatedUser?.mainGoal,
                recitation_carry_over: updatedCO.recitation,
                memorization_carry_over: updatedCO.memorization,
                theme_mode: updatedMode,
                updated_at: new Date().toISOString(),
            };

            if (supabaseId) {
                await supabase.from('profiles').update(profileData).eq('id', supabaseId);
            } else {
                const { data, error } = await supabase.from('profiles').insert([profileData]).select().single();
                if (data && !error) {
                    await AsyncStorage.setItem('supabase_user_id', data.id);
                }
            }
        } catch (e) {
            console.warn('Supabase sync failed:', e);
        }
    };

    const setUser = async (newUser: UserProfile) => {
        setUserState(newUser);
        setLangState(newUser.language);
        await AsyncStorage.setItem('user_profile', JSON.stringify(newUser));
        syncToSupabase(newUser, carryOver, themeMode);
    };

    const toggleDarkMode = async () => {
        const modes: ('green' | 'dark' | 'pink' | 'darkpink')[] = ['green', 'dark', 'pink', 'darkpink'];
        const currentIndex = modes.indexOf(themeMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];

        setThemeMode(nextMode);
        await AsyncStorage.setItem('theme_mode', nextMode);
        syncToSupabase(user, carryOver, nextMode);
    };

    const setLanguage = async (lang: Language) => {
        setLangState(lang);
        if (user) {
            const updated = { ...user, language: lang };
            setUserState(updated);
            await AsyncStorage.setItem('user_profile', JSON.stringify(updated));
            syncToSupabase(updated, carryOver, themeMode);
        }
    };

    const setCarryOver = async (co: { recitation: number; memorization: number }) => {
        setCOState(co);
        await AsyncStorage.setItem('carry_over', JSON.stringify(co));
        syncToSupabase(user, co, themeMode);
    };

    let theme: Theme;
    if (themeMode === 'dark') theme = DarkTheme;
    else if (themeMode === 'pink') theme = PinkTheme;
    else if (themeMode === 'darkpink') theme = DarkPinkTheme;
    else theme = GreenTheme;

    const t = translations[language];

    return (
        <AppContext.Provider value={{
            user, setUser, theme, language, setLanguage, t, carryOver, setCarryOver, isLoading,
            isDarkMode: themeMode === 'dark', themeMode, toggleDarkMode
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
