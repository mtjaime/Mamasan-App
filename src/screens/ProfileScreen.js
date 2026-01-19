import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    Image,
    Linking,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, signOut } = useAuth();
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Hardcoded light theme since dark mode is removed
    const theme = {
        background: '#fff',
        text: '#000',
        subText: '#666',
        headerIcon: 'black',
        menuIcon: '#666',
        border: '#f0f0f0',
    };

    const handleLogout = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error("Error signing out:", error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Eliminar Cuenta",
            "¿Estás seguro? Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, historial de compras y configuraciones.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setDeletingAccount(true);
                        try {
                            const result = await api.deleteAccount();
                            if (result.success) {
                                await signOut();
                                Alert.alert(
                                    "Cuenta Eliminada",
                                    "Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir."
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    result.error || "No se pudo eliminar la cuenta. Por favor intenta de nuevo."
                                );
                            }
                        } catch (error) {
                            console.error("Error deleting account:", error);
                            Alert.alert(
                                "Error",
                                "Ocurrió un error al eliminar tu cuenta. Por favor intenta de nuevo."
                            );
                        } finally {
                            setDeletingAccount(false);
                        }
                    }
                }
            ]
        );
    };

    const renderMenuItem = (icon, title, onPress, hasArrow = true) => (
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon} size={24} color={theme.menuIcon} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: theme.text }]}>{title}</Text>
            </View>
            {hasArrow && <Ionicons name="chevron-forward" size={24} color={theme.subText} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.headerIcon} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileHeader}>
                    <Image
                        source={require('../../assets/mamasan-logo.png')}
                        style={styles.profileLogo}
                        resizeMode="contain"
                    />
                    {user ? (
                        <>
                            <Text style={[styles.profileName, { color: theme.text }]}>
                                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
                            </Text>
                            <Text style={[styles.profileEmail, { color: theme.subText }]}>{user.email}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.profileName, { color: theme.text }]}>MAMA SAN</Text>
                            <Text style={[styles.profileEmail, { color: theme.subText }]}>Invitado</Text>
                        </>
                    )}
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Soporte</Text>
                {renderMenuItem('settings-outline', 'Cómo funciona', () => navigation.navigate('HowItWorks'))}
                {renderMenuItem('help-circle-outline', 'Preguntas Frecuentes', () => { })}

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre MAMA SAN</Text>
                {renderMenuItem('information-circle-outline', 'Sobre Nosotros', () => { })}
                {renderMenuItem('document-text-outline', 'Términos y Condiciones', () => navigation.navigate('Terms'))}

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Síguenos</Text>
                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton} onPress={() => Linking.openURL('https://www.instagram.com/mamasan.app/')}>
                        <Ionicons name="logo-instagram" size={32} color="#E1306C" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton} onPress={() => Linking.openURL('https://www.tiktok.com/@mamasan.app?lang=es')}>
                        <Ionicons name="logo-tiktok" size={32} color="#000000" />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.supportEmail, { color: theme.subText }]}>info@mamasan.app</Text>

                {user ? (
                    <>
                        <TouchableOpacity
                            style={[styles.loginButton, styles.logoutButton]}
                            onPress={handleLogout}
                            disabled={deletingAccount}
                        >
                            <Text style={styles.loginButtonText}>Cerrar Sesión</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteAccount}
                            disabled={deletingAccount}
                        >
                            {deletingAccount ? (
                                <ActivityIndicator color="#DC2626" size="small" />
                            ) : (
                                <Text style={styles.deleteButtonText}>Eliminar Cuenta</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                )}
            </ScrollView >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileLogo: {
        width: 150,
        height: 100,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileEmail: {
        color: '#666',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 15,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        marginRight: 15,
    },
    menuText: {
        fontSize: 16,
    },
    darkModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    loginButton: {
        backgroundColor: '#FF007F', // Fucsia
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#DC2626', // Red for logout
        marginTop: 20,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    socialContainer: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 20,
        paddingLeft: 10,
    },
    socialButton: {
        marginRight: 20,
    },
    supportEmail: {
        fontSize: 16,
        color: '#666',
        marginLeft: 10,
        marginBottom: 20,
    },
    deleteButton: {
        marginTop: 15,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DC2626',
        backgroundColor: 'transparent',
    },
    deleteButtonText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ProfileScreen;
