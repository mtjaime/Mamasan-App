import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';

import Constants from 'expo-constants';

// Google Sign-In (requires Development Build, not available in Expo Go)
let GoogleSignin = null;
let statusCodes = null;
let isGoogleSignInAvailable = false;
let googleSignInError = null;

// Only attempt to load Google Sign-In if NOT running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
    try {
        const googleSignInModule = require('@react-native-google-signin/google-signin');
        GoogleSignin = googleSignInModule.GoogleSignin;
        statusCodes = googleSignInModule.statusCodes;

        // Configure Google Sign-In (don't throw on failure)
        try {
            console.log('Configuring Google Sign-In with webClientId...');
            GoogleSignin.configure({
                webClientId: '1040825181143-fga2j8ak16ttarcnqe0qh5g410o6bgci.apps.googleusercontent.com',
                offlineAccess: true,
            });
            isGoogleSignInAvailable = true;
            console.log('Google Sign-In configured successfully');
            console.log('WebClientId: 1040825181143-fga2j8ak16ttarcnqe0qh5g410o6bgci');
        } catch (configError) {
            console.log('Google Sign-In configuration failed:', configError.message);
            googleSignInError = configError.message;
            isGoogleSignInAvailable = false;
        }
    } catch (error) {
        console.log('Google Sign-In module not available:', error.message);
        isGoogleSignInAvailable = false;
    }
} else {
    console.log('Running in Expo Go - Google Sign-In disabled');
}

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign Up

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const { signIn, signUp, googleSignIn, appleSignIn } = useAuth();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);
    const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

    // Check if Apple Authentication is available
    useEffect(() => {
        if (Platform.OS === 'ios') {
            AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
        }
    }, []);

    const handleGoogleLogin = async () => {
        if (!isGoogleSignInAvailable) {
            showAlert(
                'No disponible',
                'Google Sign-In no está disponible en este dispositivo. Por favor usa otro método de inicio de sesión.'
            );
            return;
        }

        setGoogleLoading(true);
        try {
            // Skip Play Services check on iOS (not applicable)
            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices();
            }
            const userInfo = await GoogleSignin.signIn();
            console.log('Google User Info:', userInfo);

            const { idToken } = userInfo.data || userInfo;

            if (!idToken) {
                throw new Error('No ID Token found');
            }

            console.log('Calling googleSignIn from AuthContext with idToken...');
            await googleSignIn(idToken);
            console.log('Google Sign-In successful!');
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
                // user cancelled the login flow - do nothing
            } else if (error.code === statusCodes?.IN_PROGRESS) {
                // operation in progress - do nothing
            } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
                showAlert('Error', 'Google Play Services no disponible');
            } else {
                // Show actual error message for debugging (App Store requirement)
                showAlert('Error Google Login', `No se pudo iniciar sesión: ${error.message} (Code: ${error.code})`);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setAppleLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            console.log('Apple credential:', credential);

            if (credential.identityToken) {
                await appleSignIn(credential.identityToken);
                console.log('Apple Sign-In successful!');
            } else {
                throw new Error('No identity token received');
            }
        } catch (error) {
            console.error('Apple Sign-In Error:', error);
            if (error.code === 'ERR_REQUEST_CANCELED') {
                // User cancelled - do nothing
            } else {
                showAlert('Error Apple Login', `No se pudo iniciar sesión: ${error.message}`);
            }
        } finally {
            setAppleLoading(false);
        }
    };

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    const closeAlert = () => {
        setAlertVisible(false);
    };

    const handleAuth = async () => {
        if (!email || !password) {
            showAlert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                try {
                    await signIn(email, password);
                    // Navigation is handled automatically by App.js when user state changes
                } catch (error) {
                    if (error.message.includes('403') || error.message.includes('verific')) {
                        showAlert(
                            'Cuenta no verificada',
                            'Tu cuenta necesita ser verificada. ¿Quieres ingresar el código ahora?',
                            [
                                { text: 'Cancelar', style: 'cancel', onPress: closeAlert },
                                {
                                    text: 'Verificar',
                                    onPress: () => {
                                        closeAlert();
                                        navigation.navigate('VerifyEmail', { email });
                                    }
                                }
                            ]
                        );
                    } else {
                        throw error;
                    }
                }
            } else {
                console.log('LoginScreen: Attempting signup for', email);
                const data = await signUp(email, password);
                console.log('LoginScreen: Signup successful, data:', JSON.stringify(data, null, 2));

                if (data?.requires_verification) {
                    console.log('LoginScreen: Navigating to VerifyEmail');
                    showAlert(
                        'Verificación requerida',
                        'Hemos enviado un código a tu email. Por favor ingrésalo para continuar.',
                        [{
                            text: 'OK',
                            onPress: () => {
                                closeAlert();
                                navigation.navigate('VerifyEmail', { email });
                            }
                        }]
                    );
                } else {
                    console.log('LoginScreen: Signup success but NO verification required');
                    showAlert('Éxito', 'Cuenta creada. Por favor inicia sesión.', [{ text: 'OK', onPress: () => { closeAlert(); setIsLogin(true); } }]);
                }
            }
        } catch (error) {
            showAlert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic colors based on state
    const primaryColor = isLogin ? '#FF007F' : '#7B1FA2'; // Pink for Login, Purple for Signup

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Back button removed as this is now the root screen */}

                <View style={styles.headerContainer}>
                    <Image
                        source={require('../../assets/mamasan-logo-v2.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>{isLogin ? 'Bienvenido' : 'Crear Cuenta'}</Text>
                    <Text style={styles.subtitle}>
                        {isLogin ? 'Ingresa tus datos para continuar' : 'Regístrate para empezar a comprar'}
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPasswordContainer}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Google Sign-In button - Visible for Login AND Sign Up */}
                    {isGoogleSignInAvailable && (
                        <TouchableOpacity
                            style={[styles.button, styles.googleButton]}
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading || appleLoading}
                        >
                            <Ionicons name="logo-google" size={24} color="#333" style={{ marginRight: 10 }} />
                            <Text style={styles.googleButtonText}>Acceder con Google</Text>
                            {googleLoading && <ActivityIndicator size="small" color="#333" style={{ marginLeft: 10 }} />}
                        </TouchableOpacity>
                    )}

                    {/* Apple Sign-In button - Visible for Login AND Sign Up */}
                    {appleAuthAvailable && (
                        <View style={styles.appleButtonContainer}>
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                cornerRadius={12}
                                style={styles.appleButton}
                                onPress={handleAppleLogin}
                            />
                            {appleLoading && (
                                <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                    style={styles.appleLoadingIndicator}
                                />
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={[styles.switchButtonText, { color: isLogin ? '#7B1FA2' : '#FF007F' }]}>
                            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={closeAlert}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 30,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 40,
        alignItems: 'center', // Center content
    },
    logo: {
        width: 300,
        height: 160,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 55,
        backgroundColor: '#f9f9f9',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    button: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#666',
        fontSize: 14,
    },
    googleButton: {
        backgroundColor: '#fff',
        marginTop: 15,
        flexDirection: 'row',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    googleButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    googleButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    googleButtonTextDisabled: {
        color: '#999',
    },
    appleButtonContainer: {
        marginTop: 15,
        position: 'relative',
    },
    appleButton: {
        height: 55,
        width: '100%',
    },
    appleLoadingIndicator: {
        position: 'absolute',
        right: 15,
        top: '50%',
        marginTop: -10,
    },
});

export default LoginScreen;
