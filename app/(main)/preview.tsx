import QuranTable from '@/components/QuranTable';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

const previewStyles = StyleSheet.create({
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
        marginBottom: 20,
        marginTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    previewContainer: {
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
        marginBottom: 32,
    },
    footer: {
        paddingBottom: 40,
    },
    button: {
        height: 62,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    outlineButton: {
        height: 60,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineButtonText: {
        fontSize: 17,
        fontWeight: '800',
    },
});

export default function PreviewScreen() {
    const { theme, t, user, carryOver, language } = useApp();
    const router = useRouter();
    const viewShotRef = useRef<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!user) return null;
    const isAr = language === 'ar';

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            if (Platform.OS === 'web') {
                // Fallback for Web: Use higher-level view-shot or alert
                Alert.alert('Web Export', isAr ? 'للتصدير على الويب، يرجى استخدام طباعة المتصفح (Cmd+P) أو التقاط صورة للجدول أدناه.' : 'To export on web, please use your browser\'s Print to PDF (Cmd+P) or screenshot the table below.');
                setIsExporting(false);
                return;
            }

            const uri = await viewShotRef.current.capture();
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert(isAr ? 'المشاركة غير متاحة' : 'Sharing is not available on this platform');
                return;
            }
            await Sharing.shareAsync(uri);
        } catch (e) {
            console.error(e);
            Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'فشل في إنشاء الصورة' : 'Failed to generate image');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SafeAreaView style={[previewStyles.container, { backgroundColor: theme.background, direction: isAr ? 'rtl' : 'ltr' }]}>
            <View style={[previewStyles.header, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center' }}>
                    <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.primary} />
                    <Text style={{ fontSize: 16, color: theme.primary, marginLeft: isAr ? 0 : 4, marginRight: isAr ? 4 : 0 }}>{t.dashboard}</Text>
                </TouchableOpacity>
                <Text style={[previewStyles.title, { color: theme.text }]}>{t.preview}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={previewStyles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[previewStyles.previewContainer, { backgroundColor: '#fff', borderRadius: theme.radius / 1.5 }]}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                        <QuranTable user={user} carryOver={carryOver} t={t} theme={theme} />
                    </ViewShot>
                </View>

                <View style={previewStyles.footer}>
                    <TouchableOpacity
                        style={[previewStyles.button, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                        onPress={handleExport}
                        disabled={isExporting}
                    >
                        <Text style={previewStyles.buttonText}>{isExporting ? '...' : t.exportPng}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[previewStyles.outlineButton, { borderColor: theme.border, borderRadius: theme.radius }]}
                        onPress={() => router.replace('/(main)/dashboard')}
                    >
                        <Text style={[previewStyles.outlineButtonText, { color: theme.primary }]}>{t.dashboard}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
