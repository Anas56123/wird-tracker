import { useApp } from '@/context/AppContext';
import { SelectionMode, UserProfile, daysOfWeek, getHizbRange, getJuzRange, getSurahRange, overlaps } from '@/lib/logic';
import { Ionicons } from '@expo/vector-icons';
import * as QuranMetadata from '@kmaslesa/quran-metadata';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInLeft, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const setupStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
        flexGrow: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    darkToggle: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    langSwitch: {
        flexDirection: 'row',
        marginTop: 6,
    },
    langTextBtn: {
        marginEnd: 16,
        paddingBottom: 4,
    },
    langLabel: {
        fontSize: 14,
        fontWeight: '800',
    },
    formSection: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 350,
    },
    label: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 20,
        marginTop: 20,
        textAlign: 'center',
        lineHeight: 30,
    },
    input: {
        height: 64,
        borderWidth: 2.5,
        paddingHorizontal: 20,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    genderRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
    },
    choiceButton: {
        flex: 1,
        height: 60,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    choiceText: {
        fontSize: 16,
        fontWeight: '800',
    },
    surahSelectBtn: {
        height: 64,
        borderWidth: 2.5,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    breakDaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        justifyContent: 'center',
        gap: 12,
    },
    dayChip: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    dayChipText: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
    footerContainer: {
        padding: 24,
        flexDirection: 'row',
        gap: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    navButton: {
        flex: 1,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    surahItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        marginBottom: 12,
        borderWidth: 1.5,
    },
    surahName: {
        fontSize: 18,
        fontWeight: '700',
    },
    searchInput: {
        height: 56,
        paddingHorizontal: 20,
        margin: 20,
        borderWidth: 2,
        fontSize: 16,
        fontWeight: '600',
    },
    progressIndicator: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    }
});

export default function SetupScreen() {
    const { theme, t, setUser, language, setLanguage, themeMode, toggleDarkMode, user } = useApp();
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [name, setName] = useState(user?.name || '');
    const [memPerDay, setMemPerDay] = useState(user?.memPerDay?.toString() || '1');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>(user?.selectionMode || 'surah');

    const [selectedSurahs, setSelectedSurahs] = useState<number[]>(user?.selectedSurahs || []);
    const [selectedJuzs, setSelectedJuzs] = useState<number[]>(user?.selectedJuzs || []);
    const [selectedHizbs, setSelectedHizbs] = useState<number[]>(user?.selectedHizbs || []);

    const [breaks, setBreaks] = useState<string[]>(user?.breakDays || []);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [memSelectionMode, setMemSelectionMode] = useState<'systematic' | 'manual'>(user?.memSelectionMode || 'systematic');
    const [manualMemSelectionMode, setManualMemSelectionMode] = useState<SelectionMode>(user?.manualMemSelectionMode || 'surah');
    const [manualMemSurahs, setManualMemSurahs] = useState<number[]>(user?.manualMemSurahs || []);
    const [manualMemJuzs, setManualMemJuzs] = useState<number[]>(user?.manualMemJuzs || []);
    const [manualMemHizbs, setManualMemHizbs] = useState<number[]>(user?.manualMemHizbs || []);
    
    const [memModalVisible, setMemModalVisible] = useState(false);
    const [mainGoal, setMainGoal] = useState<'memorize' | 'revise'>(user?.mainGoal || 'memorize');

    const totalSteps = 5;
    const progressWidth = ((step + 1) / totalSteps) * 100;

    const handleSave = async () => {
        if (!name.trim()) return alert('Please enter your name');

        let finalSurahs = selectedSurahs;
        let finalJuzs = selectedJuzs;
        let finalHizbs = selectedHizbs;
        let finalMode = selectionMode;

        if (mainGoal === 'revise') {
            finalMode = 'surah';
            finalSurahs = Array.from({ length: 114 }, (_, i) => i + 1);
            finalJuzs = Array.from({ length: 30 }, (_, i) => i + 1);
            finalHizbs = Array.from({ length: 60 }, (_, i) => i + 1);
        }

        const newUser: UserProfile = {
            name,
            language,
            selectionMode: finalMode,
            selectedSurahs: finalSurahs,
            selectedJuzs: finalJuzs,
            selectedHizbs: finalHizbs,
            memPerDay: parseFloat(memPerDay),
            breakDays: breaks,
            memSelectionMode,
            manualMemSelectionMode,
            manualMemSurahs,
            manualMemJuzs,
            manualMemHizbs,
            mainGoal,
        };
        setUser(newUser);
        router.replace('/(main)/dashboard');
    };

    const nextStep = () => {
        if (step === 1 && !name.trim()) return alert('Name is required');
        
        let targetStep = step + 1;
        if (targetStep === 2 && mainGoal === 'revise') targetStep = 4;
        setStep(targetStep);
    };

    const prevStep = () => {
        let targetStep = step - 1;
        if (targetStep === 3 && mainGoal === 'revise') targetStep = 1;
        if (targetStep === 2 && mainGoal === 'revise') targetStep = 1;
        setStep(targetStep);
    };

    const toggleItem = (id: number, isMem = false) => {
        const mode = isMem ? manualMemSelectionMode : selectionMode;
        let currentRange: [number, number];
        let isAdding = false;

        if (mode === 'surah') {
            const list = isMem ? manualMemSurahs : selectedSurahs;
            isAdding = !list.includes(id);
            currentRange = getSurahRange(id);
        } else if (mode === 'juz') {
            const list = isMem ? manualMemJuzs : selectedJuzs;
            isAdding = !list.includes(id);
            currentRange = getJuzRange(id);
        } else {
            const list = isMem ? manualMemHizbs : selectedHizbs;
            isAdding = !list.includes(id);
            currentRange = getHizbRange(id);
        }

        const updateList = (current: number[], rangeGetter: (id: number) => [number, number], total: number) => {
            let newList = [...current];
            for (let i = 1; i <= total; i++) {
                const itemRange = rangeGetter(i);
                if (overlaps(currentRange, itemRange)) {
                    if (isAdding) {
                        if (!newList.includes(i)) newList.push(i);
                    } else {
                        newList = newList.filter(x => x !== i);
                    }
                }
            }
            return newList;
        };

        if (isMem) {
            setManualMemSurahs(prev => updateList(prev, getSurahRange, 114));
            setManualMemJuzs(prev => updateList(prev, getJuzRange, 30));
            setManualMemHizbs(prev => updateList(prev, getHizbRange, 60));
        } else {
            setSelectedSurahs(prev => updateList(prev, getSurahRange, 114));
            setSelectedJuzs(prev => updateList(prev, getJuzRange, 30));
            setSelectedHizbs(prev => updateList(prev, getHizbRange, 60));
        }
    };

    const toggleBreak = (day: string) => {
        if (breaks.includes(day)) {
            setBreaks(breaks.filter(d => d !== day));
        } else if (breaks.length < 2) {
            setBreaks([...breaks, day]);
        } else {
            alert(t.breakDays);
        }
    };

    const getModalItems = () => {
        let list = QuranMetadata.getSuraList();
        if (searchQuery) {
            const byName = QuranMetadata.searchSuraByName(searchQuery);
            const byAr = QuranMetadata.searchSuraByArabicName(searchQuery);
            const byEn = QuranMetadata.searchSuraByEnglishName(searchQuery);
            list = [...new Set([...byName, ...byAr, ...byEn].map(s => s.index))].map(idx => QuranMetadata.getSuraByIndex(idx));
        }
        return list.map((s: any) => ({
            id: s.index,
            name: language === 'ar' ? s.name.arabic : s.name.englishTranscription
        }));
    };

    const getSelectionModalItems = (isMem = false) => {
        const mode = isMem ? manualMemSelectionMode : selectionMode;
        if (mode === 'surah') return getModalItems();
        if (mode === 'juz') {
            return QuranMetadata.getJuzList().map((j: any) => ({
                id: j.id,
                name: `${t.juz} ${j.id}`
            }));
        }
        if (mode === 'hizb') {
            return Array.from({ length: 60 }, (_, i) => ({ id: i + 1, name: `${t.hizb} ${i + 1}` }));
        }
        return [];
    };

    const getSelectedLabel = (isMem = false) => {
        const mode = isMem ? manualMemSelectionMode : selectionMode;
        const list = isMem 
            ? (mode === 'surah' ? manualMemSurahs : mode === 'juz' ? manualMemJuzs : manualMemHizbs)
            : (mode === 'surah' ? selectedSurahs : mode === 'juz' ? selectedJuzs : selectedHizbs);
            
        if (list.length === 0) return t.itemCount.replace('{count}', '0');

        if (mode === 'surah') {
            const sorted = [...list].sort((a, b) => a - b);
            const names = sorted.slice(0, 2).map(id => {
                const s = QuranMetadata.getSuraByIndex(id);
                return language === 'ar' ? s.name.arabic : s.name.englishTranscription;
            });
            let label = names.join(', ');
            if (sorted.length > 2) label += ` +${sorted.length - 2}`;
            return label;
        }

        return t.itemCount.replace('{count}', list.length.toString());
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <Animated.View entering={FadeInDown.duration(600).springify()} style={setupStyles.formSection}>
                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.mainGoal}</Text>
                        <View style={[setupStyles.genderRow, language === 'ar' && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                                style={[
                                    setupStyles.choiceButton,
                                    mainGoal === 'memorize' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                    { borderRadius: theme.radius / 1.5 }
                                ]}
                                onPress={() => setMainGoal('memorize')}
                            >
                                <Text style={[setupStyles.choiceText, mainGoal === 'memorize' ? { color: '#fff' } : { color: theme.text }]}>
                                    {t.memorize}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    setupStyles.choiceButton,
                                    mainGoal === 'revise' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                    { borderRadius: theme.radius / 1.5 }
                                ]}
                                onPress={() => setMainGoal('revise')}
                            >
                                <Text style={[setupStyles.choiceText, mainGoal === 'revise' ? { color: '#fff' } : { color: theme.text }]}>
                                    {t.revise}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                );
            case 1:
                return (
                    <Animated.View entering={FadeInRight.duration(600).springify()} style={setupStyles.formSection}>
                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.name}</Text>
                        <TextInput
                            style={[
                                setupStyles.input,
                                { borderColor: theme.border, color: theme.text, backgroundColor: theme.card, textAlign: language === 'ar' ? 'right' : 'left', borderRadius: theme.radius / 2 }
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Type your name..."
                            placeholderTextColor={theme.placeholder}
                            autoFocus
                        />
                    </Animated.View>
                );
            case 2:
                return (
                    <Animated.View entering={FadeInRight.duration(600).springify()} style={setupStyles.formSection}>
                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.selectionMode + " (Recitation)"}</Text>
                        <View style={[setupStyles.genderRow, language === 'ar' && { flexDirection: 'row-reverse' }]}>
                            {(['surah', 'juz', 'hizb'] as const).map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[
                                        setupStyles.choiceButton,
                                        selectionMode === mode ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                        { borderRadius: theme.radius / 2 }
                                    ]}
                                    onPress={() => setSelectionMode(mode)}
                                >
                                    <Text style={[setupStyles.choiceText, selectionMode === mode ? { color: '#fff' } : { color: theme.text }]}>
                                        {t[mode]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[setupStyles.label, { color: theme.text }]}>
                            {selectionMode === 'surah' ? t.selectSurahs : `${t[selectionMode]}`}
                        </Text>
                        <TouchableOpacity
                            style={[
                                setupStyles.surahSelectBtn,
                                { borderColor: theme.border, backgroundColor: theme.card, flexDirection: language === 'ar' ? 'row-reverse' : 'row', borderRadius: theme.radius / 2 }
                            ]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 18 }}>
                                {getSelectedLabel()}
                            </Text>
                            <Ionicons name="apps" size={24} color={theme.primary} />
                        </TouchableOpacity>
                    </Animated.View>
                );
            case 3:
                return (
                    <Animated.View entering={FadeInRight.duration(600).springify()} style={setupStyles.formSection}>
                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.memPerDay}</Text>
                        <View style={[setupStyles.genderRow, language === 'ar' && { flexDirection: 'row-reverse' }]}>
                            {([0.5, 1, 2, 5] as const).map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        setupStyles.choiceButton,
                                        parseFloat(memPerDay) === opt ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                        { borderRadius: theme.radius / 2 }
                                    ]}
                                    onPress={() => setMemPerDay(opt.toString())}
                                >
                                    <Text style={[setupStyles.choiceText, parseFloat(memPerDay) === opt ? { color: '#fff' } : { color: theme.text }]}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.selectionMode + " (Memorization)"}</Text>
                        <View style={setupStyles.genderRow}>
                            <TouchableOpacity
                                style={[setupStyles.choiceButton, memSelectionMode === 'systematic' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }, { borderRadius: theme.radius / 1.5, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                                onPress={() => setMemSelectionMode('systematic')}
                            >
                                <Text style={[setupStyles.choiceText, memSelectionMode === 'systematic' ? { color: '#fff' } : { color: theme.text }]}>
                                    Systematic AI
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[setupStyles.choiceButton, memSelectionMode === 'manual' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }, { borderRadius: theme.radius / 1.5, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                                onPress={() => setMemSelectionMode('manual')}
                            >
                                <Text style={[setupStyles.choiceText, memSelectionMode === 'manual' ? { color: '#fff' } : { color: theme.text }]}>
                                    Choose Manual
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {memSelectionMode === 'manual' && (
                            <Animated.View entering={FadeInDown} style={{ marginTop: 20 }}>
                                <View style={setupStyles.genderRow}>
                                    {(['surah', 'juz', 'hizb'] as const).map(mode => (
                                        <TouchableOpacity
                                            key={mode}
                                            style={[
                                                setupStyles.choiceButton,
                                                manualMemSelectionMode === mode ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                                { borderRadius: theme.radius / 2.5 }
                                            ]}
                                            onPress={() => setManualMemSelectionMode(mode)}
                                        >
                                            <Text style={[setupStyles.choiceText, manualMemSelectionMode === mode ? { color: '#fff' } : { color: theme.text, fontSize: 14 }]}>
                                                {t[mode]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity
                                    style={[setupStyles.surahSelectBtn, { borderColor: theme.border, backgroundColor: theme.card, borderRadius: theme.radius / 2, marginTop: 12 }]}
                                    onPress={() => setMemModalVisible(true)}
                                >
                                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>
                                        {getSelectedLabel(true)}
                                    </Text>
                                    <Ionicons name="chevron-down" size={24} color={theme.primary} />
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </Animated.View>
                );
            case 4:
                return (
                    <Animated.View entering={FadeInRight.duration(600).springify()} style={setupStyles.formSection}>
                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.breakDays}</Text>
                        <View style={setupStyles.breakDaysGrid}>
                            {daysOfWeek.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        setupStyles.dayChip,
                                        breaks.includes(day) ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                        { borderRadius: theme.radius / 1.5 }
                                    ]}
                                    onPress={() => toggleBreak(day)}
                                >
                                    <Text style={[setupStyles.dayChipText, breaks.includes(day) ? { color: '#fff' } : { color: theme.text }]}>
                                        {language === 'ar' ? t[day] : t[day].substring(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    const isLastStep = step === 4;

    return (
        <SafeAreaView style={[setupStyles.container, { backgroundColor: theme.background, direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={setupStyles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={setupStyles.headerRow}>
                        <View>
                            <Animated.Text entering={FadeInLeft} style={[setupStyles.title, { color: theme.text }]}>{t.createAccount}</Animated.Text>
                            <View style={setupStyles.langSwitch}>
                                {(['en', 'ar', 'fr'] as const).map(lang => (
                                    <TouchableOpacity
                                        key={lang}
                                        onPress={() => setLanguage(lang)}
                                        style={[setupStyles.langTextBtn, language === lang && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                                    >
                                        <Text style={[setupStyles.langLabel, { color: language === lang ? theme.primary : theme.placeholder }]}>
                                            {lang.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity style={setupStyles.darkToggle} onPress={toggleDarkMode}>
                            <Ionicons
                                name={
                                    themeMode === 'pink' ? 'heart' :
                                        themeMode === 'darkpink' ? 'heart-dislike' :
                                            themeMode === 'dark' ? 'moon' : 'sunny'
                                }
                                size={28}
                                color={theme.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={setupStyles.progressIndicator}>
                        <Animated.View 
                            layout={Layout.springify()}
                            style={[setupStyles.progressBar, { width: `${progressWidth}%`, backgroundColor: theme.primary }]} 
                        />
                    </View>

                    {renderStepContent()}

                </ScrollView>

                <Animated.View layout={Layout.springify()} style={setupStyles.footerContainer}>
                    {step > 0 && (
                        <TouchableOpacity
                            style={[setupStyles.navButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 2.5, borderRadius: theme.radius }]}
                            onPress={prevStep}
                        >
                            <Text style={[setupStyles.navButtonText, { color: theme.text }]}>{t.back}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[setupStyles.navButton, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                        onPress={isLastStep ? handleSave : nextStep}
                    >
                        <Text style={setupStyles.navButtonText}>{isLastStep ? t.save : t.next}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>

            {/* Selection Modal (Recitation) */}
            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <Animated.View entering={FadeInDown.duration(400)} style={{ height: '90%', backgroundColor: theme.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
                        <View style={[setupStyles.modalHeader, { borderBottomColor: theme.border, direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
                            <Text style={[setupStyles.modalTitle, { color: theme.text }]}>
                                {selectionMode === 'surah' ? t.selectSurahs : `${t[selectionMode]}`}
                            </Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setSearchQuery(''); }}>
                                <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 20 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                            <TextInput
                                style={[setupStyles.searchInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card, textAlign: language === 'ar' ? 'right' : 'left', borderRadius: theme.radius / 2 }]}
                                placeholder={t.search || "Search..."}
                                placeholderTextColor={theme.placeholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                            {getSelectionModalItems().map((item: any) => {
                                const list = selectionMode === 'surah' ? selectedSurahs : selectionMode === 'juz' ? selectedJuzs : selectedHizbs;
                                const isSelected = list.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            setupStyles.surahItem,
                                            isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.card, borderColor: theme.border },
                                            { borderRadius: theme.radius / 2, flexDirection: language === 'ar' ? 'row-reverse' : 'row' }
                                        ]}
                                        onPress={() => toggleItem(item.id)}
                                    >
                                        <Text style={[setupStyles.surahName, { color: isSelected ? '#fff' : theme.text, fontWeight: '800' }]}>{item.name}</Text>
                                        <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={26} color={isSelected ? "#fff" : theme.border} />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Selection Modal (Memorization) */}
            <Modal visible={memModalVisible} animationType="fade" transparent>
                 <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <Animated.View entering={FadeInDown.duration(400)} style={{ height: '90%', backgroundColor: theme.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
                        <View style={[setupStyles.modalHeader, { borderBottomColor: theme.border, direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
                            <Text style={[setupStyles.modalTitle, { color: theme.text }]}>
                                Manual Memorization
                            </Text>
                            <TouchableOpacity onPress={() => { setMemModalVisible(false); setSearchQuery(''); }}>
                                <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 20 }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                            <TextInput
                                style={[setupStyles.searchInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card, textAlign: language === 'ar' ? 'right' : 'left', borderRadius: theme.radius / 2 }]}
                                placeholder={t.search || "Search..."}
                                placeholderTextColor={theme.placeholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                            {getSelectionModalItems(true).map((item: any) => {
                                const list = manualMemSelectionMode === 'surah' ? manualMemSurahs : manualMemSelectionMode === 'juz' ? manualMemJuzs : manualMemHizbs;
                                const isSelected = list.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            setupStyles.surahItem,
                                            isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.card, borderColor: theme.border },
                                            { borderRadius: theme.radius / 2, flexDirection: language === 'ar' ? 'row-reverse' : 'row' }
                                        ]}
                                        onPress={() => toggleItem(item.id, true)}
                                    >
                                        <Text style={[setupStyles.surahName, { color: isSelected ? '#fff' : theme.text, fontWeight: '800' }]}>{item.name}</Text>
                                        <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={26} color={isSelected ? "#fff" : theme.border} />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}
