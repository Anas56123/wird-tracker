import { useApp } from '@/context/AppContext';
import { daysOfWeek, getHizbRange } from '@/lib/logic';
import { Ionicons } from '@expo/vector-icons';
import * as QuranMetadata from '@kmaslesa/quran-metadata';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const reportStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    info: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    list: {
        marginBottom: 40,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 22,
        borderWidth: 1.5,
        marginBottom: 16,
        gap: 16,
    },
    dayInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 18,
        fontWeight: '700',
    },
    checkbox: {
        width: 32,
        height: 32,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        height: 62,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    }
});

export default function WeeklyReport() {
    const { theme, t, user, setCarryOver, language } = useApp();
    const router = useRouter();
    const [missedDays, setMissedDays] = useState<string[]>([]);

    if (!user) return null;
    const isAr = language === 'ar';

    const toggleMissed = (day: string) => {
        if (missedDays.includes(day)) {
            setMissedDays(missedDays.filter(d => d !== day));
        } else {
            setMissedDays([...missedDays, day]);
        }
    };

    const handleSubmit = async () => {
        const activeDays = daysOfWeek.filter(d => !(user.breakDays || []).includes(d)).length;
        if (activeDays === 0) return router.back();

        // Calculate portions to carry over
        let totalRecPortionPages = 0;
        if (user.selectionMode === 'surah') {
            const suraList = QuranMetadata.getSuraList();
            const selectedSurahsData = suraList.filter((s: any) => (user.selectedSurahs || []).includes(s.index));
            totalRecPortionPages = selectedSurahsData.reduce((acc: number, s: any) => acc + s.totalPages, 0);
        } else if (user.selectionMode === 'juz') {
            const juzList = QuranMetadata.getJuzList();
            const selectedJuzsData = juzList.filter((j: any) => (user.selectedJuzs || []).includes(j.id));
            totalRecPortionPages = selectedJuzsData.reduce((acc: number, j: any) => acc + (j.endPage - j.startPage + 1), 0);
        } else if (user.selectionMode === 'hizb') {
            totalRecPortionPages = (user.selectedHizbs || []).reduce((acc: number, id: number) => {
                const range = getHizbRange(id);
                return acc + (range[1] - range[0] + 1);
            }, 0);
        }

        const dailyRec = totalRecPortionPages / activeDays;
        const dailyMem = user.memPerDay;

        const missedRec = missedDays.length * dailyRec;
        const missedMem = missedDays.length * dailyMem;

        await setCarryOver({
            recitation: missedRec,
            memorization: missedMem,
        });

        router.replace('/(main)/dashboard');
    };

    return (
        <SafeAreaView style={[reportStyles.container, { backgroundColor: theme.background, direction: isAr ? 'rtl' : 'ltr' }]}>
            <ScrollView contentContainerStyle={reportStyles.scrollContent}>
                <View style={[reportStyles.header, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center' }}>
                        <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.primary} />
                        <Text style={{ fontSize: 16, color: theme.primary, marginLeft: isAr ? 0 : 4, marginRight: isAr ? 4 : 0 }}>{t.dashboard}</Text>
                    </TouchableOpacity>
                    <Text style={[reportStyles.title, { color: theme.text }]}>{t.report}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <Text style={[reportStyles.info, { color: theme.placeholder, textAlign: isAr ? 'right' : 'center' }]}>{t.reportInfo}</Text>

                <View style={reportStyles.list}>
                    {daysOfWeek.map(day => {
                        const isBreak = (user.breakDays || []).includes(day);
                        const isMissed = missedDays.includes(day);

                        return (
                            <TouchableOpacity
                                key={day}
                                onPress={() => !isBreak && toggleMissed(day)}
                                disabled={isBreak}
                                style={[
                                    reportStyles.dayRow,
                                    {
                                        borderColor: theme.border,
                                        backgroundColor: isBreak ? theme.secondary : theme.card,
                                        opacity: isBreak ? 0.7 : 1,
                                        flexDirection: isAr ? 'row-reverse' : 'row',
                                        borderRadius: theme.radius / 1.5
                                    }
                                ]}
                            >
                                <View style={[reportStyles.dayInfo, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                                    <Text style={[reportStyles.dayText, { color: theme.text, marginHorizontal: 12 }]}>
                                        {t[day]}
                                    </Text>
                                    {isBreak && (
                                        <Text style={{ fontSize: 13, color: theme.placeholder, fontWeight: '700' }}>
                                            ({t.break})
                                        </Text>
                                    )}
                                </View>
                                {!isBreak && (
                                    <View style={[
                                        reportStyles.checkbox,
                                        {
                                            borderColor: isMissed ? theme.error : theme.border,
                                            backgroundColor: isMissed ? theme.error + '20' : 'transparent',
                                            borderRadius: theme.radius / 3
                                        }
                                    ]}>
                                        <Ionicons
                                            name={isMissed ? "close-circle" : "checkmark-circle-outline"}
                                            size={24}
                                            color={isMissed ? theme.error : theme.border}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[reportStyles.submitButton, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                    onPress={handleSubmit}
                >
                    <Text style={reportStyles.submitButtonText}>{t.submitReport || "Submit Report"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
