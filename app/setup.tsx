import { useApp } from '@/context/AppContext';
import { SelectionMode, UserProfile, daysOfWeek, getHizbRange, getJuzRange, getSurahRange, overlaps } from '@/lib/logic';
import { Ionicons } from '@expo/vector-icons';
import * as QuranMetadata from '@kmaslesa/quran-metadata';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const setupStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    darkToggle: {
        padding: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
    },
    langSwitch: {
        flexDirection: 'row',
        marginTop: 4,
    },
    langTextBtn: {
        marginEnd: 12,
        paddingBottom: 2,
    },
    langLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    formSection: {
        marginBottom: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 16,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    genderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    choiceButton: {
        flex: 1,
        height: 48,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginEnd: 8,
    },
    choiceText: {
        fontSize: 15,
        fontWeight: '600',
    },
    surahSelectBtn: {
        height: 52,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakDaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    dayChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1.5,
        marginEnd: 10,
        marginBottom: 10,
    },
    dayChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    surahItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 18,
        marginBottom: 8,
        borderWidth: 1,
    },
    surahName: {
        fontSize: 16,
        fontWeight: '500',
    },
    searchInput: {
        height: 54,
        paddingHorizontal: 18,
        margin: 16,
        borderWidth: 1.5,
        fontSize: 16,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
    },
    stepperButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        fontSize: 20,
        fontWeight: '800',
    }
});

export default function SetupScreen() {
    const { theme, t, setUser, language, setLanguage, isDarkMode, toggleDarkMode, user } = useApp();
    const router = useRouter();

    const [name, setName] = useState(user?.name || '');
    const [gender, setGender] = useState<'boy' | 'girl'>(user?.gender || 'boy');
    const [memPerDay, setMemPerDay] = useState(user?.memPerDay?.toString() || '1');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>(user?.selectionMode || 'surah');

    // Separate states for linked selection
    const [selectedSurahs, setSelectedSurahs] = useState<number[]>(user?.selectedSurahs || []);
    const [selectedJuzs, setSelectedJuzs] = useState<number[]>(user?.selectedJuzs || []);
    const [selectedHizbs, setSelectedHizbs] = useState<number[]>(user?.selectedHizbs || []);

    const [breaks, setBreaks] = useState<string[]>(user?.breakDays || []);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortType, setSortType] = useState<'default' | 'oldest' | 'newest'>('default');
    const [filterType, setFilterType] = useState<'all' | 'meccan' | 'medinan'>('all');

    const handleSave = async () => {
        if (!name.trim()) return alert('Please enter your name');

        const profile: UserProfile = {
            name,
            gender,
            language,
            selectionMode,
            selectedSurahs,
            selectedJuzs,
            selectedHizbs,
            memPerDay: parseFloat(memPerDay) || 0,
            breakDays: breaks,
        };

        await setUser(profile);
        router.replace('/(main)/dashboard');
    };

    const toggleItem = (id: number) => {
        let currentRange: [number, number];
        let isAdding = false;

        if (selectionMode === 'surah') {
            isAdding = !selectedSurahs.includes(id);
            currentRange = getSurahRange(id);
        } else if (selectionMode === 'juz') {
            isAdding = !selectedJuzs.includes(id);
            currentRange = getJuzRange(id);
        } else {
            isAdding = !selectedHizbs.includes(id);
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

        setSelectedSurahs(prev => updateList(prev, getSurahRange, 114));
        setSelectedJuzs(prev => updateList(prev, getJuzRange, 30));
        setSelectedHizbs(prev => updateList(prev, getHizbRange, 60));
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

    // Helper to get modal items
    const getModalItems = () => {
        if (selectionMode === 'surah') {
            let suraList = QuranMetadata.getSuraList();

            // 1. Filtering by Revelation Place
            if (filterType === 'meccan') suraList = QuranMetadata.getSuraListPublishedInMekka();
            else if (filterType === 'medinan') suraList = QuranMetadata.getSuraListPublishedInMedina();

            // 2. Searching (includes Bosnian as requested)
            if (searchQuery) {
                const byName = QuranMetadata.searchSuraByName(searchQuery);
                const byAr = QuranMetadata.searchSuraByArabicName(searchQuery);
                const byEn = QuranMetadata.searchSuraByEnglishName(searchQuery);

                const combined = [...byName, ...byAr, ...byEn];
                const seen = new Set();
                const searchResults = combined.filter((s: any) => {
                    const isDuplicate = seen.has(s.index);
                    seen.add(s.index);
                    return !isDuplicate;
                });

                // Keep only search results that are in the current filtered list (if any filtering applied)
                const currentIds = new Set(suraList.map((s: any) => s.index));
                suraList = searchResults.filter((s: any) => currentIds.has(s.index));
            }

            // 3. Sorting
            if (sortType === 'oldest') suraList = suraList.sort((a: any, b: any) => a.orderInPublishing - b.orderInPublishing);
            else if (sortType === 'newest') suraList = suraList.sort((a: any, b: any) => b.orderInPublishing - a.orderInPublishing);
            else suraList = suraList.sort((a: any, b: any) => a.index - b.index);
            return suraList.map((s: any) => ({
                id: s.index,
                name: language === 'ar' ? s.name.arabic : s.name.englishTranscription,
                fullName: `${s.index}. ${language === 'ar' ? s.name.arabic : s.name.englishTranscription}`
            }));
        }
        if (selectionMode === 'juz') {
            const juzList = QuranMetadata.getJuzList();
            return juzList.map((j: any) => ({
                id: j.id,
                name: `${t.juz} ${j.id}`
            }));
        }
        if (selectionMode === 'hizb') {
            return Array.from({ length: 60 }, (_, i) => ({ id: i + 1, name: `${t.hizb} ${i + 1}` }));
        }
        return [];
    };

    return (
        <SafeAreaView style={[setupStyles.container, { backgroundColor: theme.background, direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={setupStyles.scrollContent}>
                    <View style={setupStyles.headerRow}>
                        <View>
                            <Text style={[setupStyles.title, { color: theme.text }]}>{t.createAccount}</Text>
                            <View style={setupStyles.langSwitch}>
                                {(['en', 'ar', 'fr'] as const).map(lang => (
                                    <TouchableOpacity
                                        key={lang}
                                        onPress={() => setLanguage(lang)}
                                        style={[setupStyles.langTextBtn, language === lang && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                                    >
                                        <Text style={[setupStyles.langLabel, { color: language === lang ? theme.primary : theme.placeholder }]}>
                                            {lang.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity style={setupStyles.darkToggle} onPress={toggleDarkMode}>
                            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={24} color={theme.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={setupStyles.formSection}>
                        <Text style={[setupStyles.label, { color: theme.text }]}>{t.name}</Text>
                        <TextInput
                            style={[
                                setupStyles.input,
                                { borderColor: theme.border, color: theme.text, backgroundColor: theme.card, textAlign: language === 'ar' ? 'right' : 'left', borderRadius: theme.radius / 2 }
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Name"
                            placeholderTextColor={theme.placeholder}
                        />

                        <Text style={[setupStyles.label, { color: theme.text, textAlign: language === 'ar' ? 'right' : 'left' }]}>{t.gender}</Text>
                        <View style={[setupStyles.genderRow, language === 'ar' && { flexDirection: 'row-reverse' }]}>
                            {(['boy', 'girl'] as const).map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        setupStyles.choiceButton,
                                        gender === g ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                        language === 'ar' ? { marginLeft: 8 } : { marginRight: 8 },
                                        { borderRadius: theme.radius / 2 }
                                    ]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text style={[setupStyles.choiceText, gender === g ? { color: '#fff' } : { color: theme.text }]}>
                                        {t[g]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[setupStyles.label, { color: theme.text, textAlign: language === 'ar' ? 'right' : 'left' }]}>{t.selectionMode}</Text>
                        <View style={[setupStyles.genderRow, language === 'ar' && { flexDirection: 'row-reverse' }]}>
                            {(['surah', 'juz', 'hizb'] as const).map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[
                                        setupStyles.choiceButton,
                                        selectionMode === mode ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                        language === 'ar' ? { marginLeft: 8 } : { marginRight: 8 },
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

                        <Text style={[setupStyles.label, { color: theme.text, textAlign: language === 'ar' ? 'right' : 'left' }]}>
                            {selectionMode === 'surah' ? t.selectSurahs : `${t[selectionMode]}`}
                        </Text>
                        <TouchableOpacity
                            style={[
                                setupStyles.surahSelectBtn,
                                { borderColor: theme.border, backgroundColor: theme.card, flexDirection: language === 'ar' ? 'row-reverse' : 'row', borderRadius: theme.radius / 2 }
                            ]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={{ color: theme.text, fontWeight: '600' }}>
                                {t.itemCount.replace('{count}', (selectionMode === 'surah' ? selectedSurahs : selectionMode === 'juz' ? selectedJuzs : selectedHizbs).length.toString())}
                            </Text>
                            <Ionicons name="apps" size={24} color={theme.primary} />
                        </TouchableOpacity>

                        <Text style={[setupStyles.label, { color: theme.text, textAlign: language === 'ar' ? 'right' : 'left' }]}>{t.memPerDay}</Text>
                        <View style={[
                            setupStyles.stepperContainer,
                            { borderColor: theme.border, backgroundColor: theme.card, flexDirection: language === 'ar' ? 'row-reverse' : 'row', borderRadius: theme.radius / 2 }
                        ]}>
                            <TouchableOpacity
                                onPress={() => setMemPerDay(String(Math.max(0, (parseFloat(memPerDay) || 0) - 1)))}
                                style={[setupStyles.stepperButton, { backgroundColor: theme.secondary }]}
                            >
                                <Ionicons name="remove" size={24} color={theme.primary} />
                            </TouchableOpacity>
                            <Text style={[setupStyles.stepperValue, { color: theme.text }]}>
                                {memPerDay}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setMemPerDay(String((parseFloat(memPerDay) || 1) + 1))}
                                style={[setupStyles.stepperButton, { backgroundColor: theme.secondary }]}
                            >
                                <Ionicons name="add" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[setupStyles.label, { color: theme.text, textAlign: language === 'ar' ? 'right' : 'left' }]}>{t.breakDays}</Text>
                        <View style={[setupStyles.breakDaysGrid, language === 'ar' && { flexDirection: 'row-reverse' }]}>
                            {daysOfWeek.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        setupStyles.dayChip,
                                        breaks.includes(day) ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border, backgroundColor: theme.card },
                                        language === 'ar' ? { marginLeft: 10 } : { marginRight: 10 },
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
                    </View>

                    <TouchableOpacity
                        style={[setupStyles.saveButton, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                        onPress={handleSave}
                    >
                        <Text style={setupStyles.saveButtonText}>{t.save}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={modalVisible} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={[setupStyles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[setupStyles.modalTitle, { color: theme.text }]}>
                            {selectionMode === 'surah' ? t.selectSurahs : `${t[selectionMode]}`}
                        </Text>
                        <TouchableOpacity onPress={() => { setModalVisible(false); setSearchQuery(''); }}>
                            <Text style={{ color: theme.primary, fontWeight: '700' }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    {selectionMode === 'surah' && (
                        <View>
                            <TextInput
                                style={[setupStyles.searchInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card, textAlign: language === 'ar' ? 'right' : 'left', borderRadius: theme.radius / 2 }]}
                                placeholder={t.search || "Search..."}
                                placeholderTextColor={theme.placeholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <View style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row', paddingHorizontal: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                                {(['all', 'meccan', 'medinan'] as const).map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        onPress={() => setFilterType(f)}
                                        style={{
                                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radius / 1.5,
                                            backgroundColor: filterType === f ? theme.primary : theme.secondary,
                                            marginRight: language === 'ar' ? 0 : 10, marginLeft: language === 'ar' ? 10 : 0, marginBottom: 10
                                        }}
                                    >
                                        <Text style={{ color: filterType === f ? '#fff' : theme.primary, fontSize: 13, fontWeight: '800' }}>
                                            {f.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row', paddingHorizontal: 16, marginBottom: 16 }}>
                                {(['default', 'oldest', 'newest'] as const).map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        onPress={() => setSortType(s)}
                                        style={{
                                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radius / 1.5,
                                            backgroundColor: sortType === s ? theme.primary : theme.secondary,
                                            marginRight: language === 'ar' ? 0 : 10, marginLeft: language === 'ar' ? 10 : 0
                                        }}
                                    >
                                        <Text style={{ color: sortType === s ? '#fff' : theme.primary, fontSize: 13, fontWeight: '800' }}>
                                            {s.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
                        {getModalItems().map((item: any) => {
                            const isSelected = (selectionMode === 'surah' ? selectedSurahs : selectionMode === 'juz' ? selectedJuzs : selectedHizbs).includes(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        setupStyles.surahItem,
                                        isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.card, borderColor: theme.border },
                                        { borderRadius: theme.radius / 2 }
                                    ]}
                                    onPress={() => toggleItem(item.id)}
                                >
                                    <Text style={[setupStyles.surahName, { color: isSelected ? '#fff' : theme.text }]}>{item.name}</Text>
                                    <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isSelected ? "#fff" : theme.border} />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
