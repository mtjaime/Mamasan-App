import React, { useState, useEffect, useRef } from 'react';
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
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import CustomAlert from '../components/CustomAlert';

const VerifyEmailScreen = ({ route, navigation }) => {
    const { email } = route.params;
    console.log('VerifyEmailScreen: Rendering 6-digit OTP screen for', email);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const inputRefs = useRef([]);

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    const closeAlert = () => {
        setAlertVisible(false);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleCodeChange = (text, index) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleBackspace = (key, index) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            showAlert('Error', 'El código debe tener 6 dígitos');
            return;
        }

        setLoading(true);
        try {
            const response = await api.verifyEmail(email, fullCode);
            if (response.success) {
                showAlert(
                    'Éxito',
                    'Cuenta verificada correctamente. Por favor inicia sesión.',
                    [{ text: 'OK', onPress: () => { closeAlert(); navigation.navigate('Login'); } }]
                );
            } else {
                showAlert('Error', response.error || 'Error al verificar el código');
            }
        } catch (error) {
            showAlert('Error', 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            const response = await api.resendVerification(email);
            if (response.success) {
                showAlert('Éxito', 'Se ha enviado un nuevo código a tu email');
                setTimeLeft(900); // Reset timer
            } else {
                showAlert('Error', response.error || 'Error al reenviar el código');
            }
        } catch (error) {
            showAlert('Error', 'Ocurrió un error inesperado');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Verificar Email</Text>
                    <Text style={styles.subtitle}>
                        Hemos enviado un código de verificación a:
                    </Text>
                    <Text style={styles.emailText}>{email}</Text>
                    <Text style={styles.timer}>
                        Expira en: {formatTime(timeLeft)}
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.codeContainer}>
                        {code.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={styles.codeInput}
                                value={digit}
                                onChangeText={(text) => handleCodeChange(text, index)}
                                onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Verificar</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResend}
                        disabled={resendLoading}
                    >
                        {resendLoading ? (
                            <ActivityIndicator color="#FF007F" size="small" />
                        ) : (
                            <Text style={styles.resendButtonText}>Reenviar código</Text>
                        )}
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
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
        left: 20,
        zIndex: 1,
    },
    headerContainer: {
        marginBottom: 40,
        marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 50 : 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emailText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
        marginBottom: 10,
    },
    timer: {
        fontSize: 14,
        color: '#FF007F',
        fontWeight: 'bold',
    },
    formContainer: {
        width: '100%',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    codeInput: {
        width: 45,
        height: 55,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    button: {
        backgroundColor: '#FF007F',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FF007F',
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
    resendButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendButtonText: {
        color: '#FF007F',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default VerifyEmailScreen;
