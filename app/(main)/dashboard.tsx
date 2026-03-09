import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const dashboardStyles = StyleSheet.create({
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
    greeting: {
        fontSize: 16,
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
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
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginStart: 12,
    },
    topIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileIcon: {
        fontSize: 22,
    },
    statsCard: {
        padding: 24,
        marginBottom: 32,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    statsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        opacity: 0.9,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.8,
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 19,
        fontWeight: '800',
    },
    carryOverTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 8,
        marginTop: 16,
        alignSelf: 'flex-start',
    },
    carryOverText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        marginBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 16,
        borderWidth: 1.5,
    },
    iconBox: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    infoCard: {
        alignItems: 'center',
        marginTop: 10,
    },
    infoText: {
        fontSize: 14,
        fontStyle: 'italic',
    }
});

export default function Dashboard() {
    const { theme, t, user, carryOver, isDarkMode, toggleDarkMode, setLanguage, language } = useApp();
    const router = useRouter();

    if (!user) return null;

    return (
        <SafeAreaView style={[dashboardStyles.container, { backgroundColor: theme.background, direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
            <ScrollView contentContainerStyle={dashboardStyles.scrollContent}>
                <View style={dashboardStyles.header}>
                    <View>
                        <Text style={[dashboardStyles.greeting, { color: theme.placeholder }]}>{language === 'ar' ? 'السلام عليكم،' : 'Salam,'}</Text>
                        <Text style={[dashboardStyles.userName, { color: theme.text }]}>{user.name}</Text>
                        <View style={dashboardStyles.langSwitch}>
                            {(['en', 'ar', 'fr'] as const).map(lang => (
                                <TouchableOpacity
                                    key={lang}
                                    onPress={() => setLanguage(lang)}
                                    style={[
                                        dashboardStyles.langTextBtn,
                                        language === lang && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
                                    ]}
                                >
                                    <Text style={[dashboardStyles.langLabel, { color: language === lang ? theme.primary : theme.placeholder, fontSize: 13, fontWeight: '700' }]}>
                                        {lang.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <TouchableOpacity style={[dashboardStyles.topIconBtn]} onPress={toggleDarkMode}>
                            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={24} color={theme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[dashboardStyles.profileButton, { backgroundColor: theme.secondary }]}
                            onPress={() => router.push('/setup')}
                        >
                            <Ionicons name="person" size={22} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[dashboardStyles.statsCard, { backgroundColor: theme.primary, borderRadius: theme.radius }]}>
                    <Text style={dashboardStyles.statsTitle}>{t.thisLevel}</Text>
                    <View style={[dashboardStyles.statsRow, { flexDirection: language === 'ar' ? 'row-reverse' : 'row' }]}>
                        <View style={dashboardStyles.statItem}>
                            <Text style={dashboardStyles.statLabel}>{t.recitation}</Text>
                            <Text style={dashboardStyles.statValue}>{t.pages_count.replace('{count}', carryOver.recitation.toString())}</Text>
                        </View>
                        <View style={dashboardStyles.statItem}>
                            <Text style={dashboardStyles.statLabel}>{t.memorization}</Text>
                            <Text style={dashboardStyles.statValue}>{t.pages_count.replace('{count}', carryOver.memorization.toString())}</Text>
                        </View>
                    </View>
                    <View style={[dashboardStyles.carryOverTag, { borderRadius: theme.radius / 3 }]}>
                        <Text style={dashboardStyles.carryOverText}>{t.carryOverInfo || "Points from yesterday: 0"}</Text>
                    </View>
                </View>

                <View style={dashboardStyles.actions}>
                    <TouchableOpacity
                        style={[dashboardStyles.actionButton, { borderColor: theme.border, backgroundColor: theme.card, borderRadius: theme.radius / 1.5 }]}
                        onPress={() => router.push('/(main)/report')}
                    >
                        <View style={[dashboardStyles.iconBox, { backgroundColor: theme.secondary, borderRadius: theme.radius / 2.5, marginEnd: 16 }]}>
                            <Ionicons name="calendar-outline" size={32} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[dashboardStyles.actionTitle, { color: theme.text }]}>{t.weeklyReport}</Text>
                            <Text style={{ color: theme.placeholder, fontSize: 13 }}>{t.reportSub || "Submit your daily progress"}</Text>
                        </View>
                        <Ionicons name={language === 'ar' ? "chevron-back" : "chevron-forward"} size={24} color={theme.border} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[dashboardStyles.actionButton, { borderColor: theme.border, backgroundColor: theme.card, borderRadius: theme.radius / 1.5 }]}
                        onPress={() => router.push('/preview')}
                    >
                        <View style={[dashboardStyles.iconBox, { backgroundColor: theme.secondary, borderRadius: theme.radius / 2.5, marginEnd: 16 }]}>
                            <Ionicons name="grid-outline" size={32} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[dashboardStyles.actionTitle, { color: theme.text }]}>{t.previewTable}</Text>
                            <Text style={{ color: theme.placeholder, fontSize: 13 }}>{t.previewSub || "View your weekly schedule"}</Text>
                        </View>
                        <Ionicons name={language === 'ar' ? "chevron-back" : "chevron-forward"} size={24} color={theme.border} />
                    </TouchableOpacity>
                </View>

                <View style={dashboardStyles.infoCard}>
                    <Text style={[dashboardStyles.infoText, { color: theme.placeholder }]}>
                        {language === 'ar' ? 'أيام الراحة: ' : 'Breaks: '}
                        {user.breakDays.map(d => t[d]).join(', ') || (language === 'ar' ? 'لا يوجد' : 'None')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// REMOVED DUPLICATE STYLES AT BOTTOM


