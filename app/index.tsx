import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const welcomeStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    logoText: {
        fontSize: 48,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 24,
    },
    footer: {
        paddingBottom: 40,
    },
    button: {
        height: 62,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    secondaryButton: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    }
});

export default function WelcomeScreen() {
    const { theme, t, user } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.replace('/(main)/dashboard');
        }
    }, [user, router]);

    return (
        <SafeAreaView style={[welcomeStyles.container, { backgroundColor: theme.background }]}>
            <View style={welcomeStyles.header}>
                <View style={[welcomeStyles.logoPlaceholder, { borderColor: theme.primary }]}>
                    <Ionicons name="book" size={48} color={theme.primary} />
                </View>
                <Text style={[welcomeStyles.appName, { color: theme.text }]}>{t.appName}</Text>
            </View>

            <View style={welcomeStyles.content}>
                <Text style={[welcomeStyles.welcome, { color: theme.text }]}>{t.welcome}</Text>
                <Text style={[welcomeStyles.subtitle, { color: theme.placeholder }]}>
                    {t.welcomeSubtitle}
                </Text>
            </View>

            <View style={welcomeStyles.footer}>
                <TouchableOpacity
                    style={[welcomeStyles.button, { backgroundColor: theme.primary, borderRadius: theme.radius }]}
                    onPress={() => router.push('/setup')}
                >
                    <Text style={welcomeStyles.buttonText}>{t.createAccount}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[welcomeStyles.secondaryButton]}
                    onPress={() => router.push('/setup')}
                >
                    <Text style={[welcomeStyles.secondaryButtonText, { color: theme.primary }]}>{t.login}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
