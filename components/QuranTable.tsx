import { generateWeeklyTable, UserProfile } from '@/lib/logic';
import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

interface Props {
    user: UserProfile;
    carryOver: { recitation: number; memorization: number };
    t: any;
    theme: any;
}

const QuranTable: React.FC<Props> = ({ user, carryOver, t, theme }) => {
    const tableData = generateWeeklyTable(user, carryOver, t);
    const isAr = user.language === 'ar';

    return (
        <ImageBackground
            source={require('@/assets/images/mosque_bg.png')}
            style={[styles.container, { backgroundColor: theme.background }]}
            imageStyle={{ opacity: 0.1, resizeMode: 'cover' }}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.primary }]}>{t.appName}</Text>
                    <Text style={[styles.headerSub, { color: theme.text }]}>{t.student}: {user.name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerLabel, { color: theme.placeholder }]}>{t.week} 1</Text>
                </View>
            </View>

            {/* Grid Table */}
            <View style={[
                styles.table,
                {
                    borderColor: theme.border,
                    borderStartWidth: 1.5,
                    borderTopWidth: 1.5,
                    direction: isAr ? 'rtl' : 'ltr',
                    borderRadius: theme.radius / 2,
                    backgroundColor: (theme.background.toLowerCase() === '#f7fcf9' || theme.background.toLowerCase() === '#fff1f2')
                        ? theme.card + 'E6' // Light mode: 90% opacity
                        : theme.card // Dark mode: 100% opacity for better contrast
                }
            ]}>
                {/* Table Header Row */}
                <View style={[styles.row, { backgroundColor: theme.primary }]}>
                    <View style={{ flex: 1, borderEndWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.border, justifyContent: 'center' }}>
                        <Text style={styles.cellHeader}>{t.day}</Text>
                    </View>
                    <View style={{ flex: 1.5, borderEndWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.border, justifyContent: 'center' }}>
                        <Text style={styles.cellHeader}>{t.recitationLabel}</Text>
                    </View>
                    <View style={{ flex: 1.2, borderEndWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.border, justifyContent: 'center' }}>
                        <Text style={styles.cellHeader}>{t.memorizationLabel}</Text>
                    </View>
                </View>

                {/* Rows */}
                {tableData.map((row, idx) => (
                    <View key={idx} style={[styles.row, row.isBreak && { backgroundColor: theme.secondary + 'CC' }]}>
                        <View style={[styles.cell, { flex: 1, borderEndWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.border }]}>
                            <Text style={[styles.cellText, { fontWeight: '800', color: theme.text }]}>{row.day}</Text>
                        </View>
                        <View style={[styles.cell, { flex: 1.5, borderEndWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.border }]}>
                            <Text style={[styles.cellText, { color: theme.text }]}>{row.recitation}</Text>
                        </View>
                        <View style={[styles.cell, { flex: 1.2, borderEndWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.border }]}>
                            <Text style={[styles.cellText, { color: theme.text }]}>{row.memorization}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.watermark}>
                <Text style={{ fontSize: 10, color: '#ccc' }}>{t.generatedBy} {t.appName}</Text>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 30,
        width: 850, // Wide landscape width
        minHeight: 500,
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    headerSub: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
    },
    headerLabel: {
        fontSize: 14,
        color: '#888',
    },
    table: {
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    row: {
        flexDirection: 'row',
        minHeight: 52,
    },
    rowReverse: {
        flexDirection: 'row-reverse',
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    cellHeader: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 15,
        textAlign: 'center',
    },
    cellText: {
        fontSize: 14,
        color: '#013220',
        textAlign: 'center',
        fontWeight: '500',
    },
    watermark: {
        alignItems: 'center',
        marginTop: 40,
        width: '100%',
    }
});

export default QuranTable;
