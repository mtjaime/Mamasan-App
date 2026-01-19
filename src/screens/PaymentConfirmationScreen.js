import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Platform,
    StatusBar,
    ActivityIndicator,
    TextInput,
    Image,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { api } from '../services/api';
import { formatNumber } from '../utils/formatNumber';

const PaymentConfirmationScreen = ({ navigation, route }) => {
    // Get params from previous screen
    const {
        saleId,
        currency,
        paymentAmount,
        paymentAmountBs,
        paymentAmountUsd,
        tasaCambio,
        quotaId,
        quotaNumber,
        isQuotaPayment
    } = route.params || {};

    console.log('[PaymentConfirmation] Route params:', {
        saleId,
        currency,
        paymentAmount,
        paymentAmountBs,
        paymentAmountUsd,
        tasaCambio,
    });

    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [banks, setBanks] = useState([]);
    const [selectedPaymentType, setSelectedPaymentType] = useState(null);
    const [selectedPaymentTypeData, setSelectedPaymentTypeData] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);

    // Dynamic payment amount from API - use the correct amount based on currency
    // Initialize with paymentAmount which already contains the correct value for the selected currency
    const [displayAmount, setDisplayAmount] = useState(
        paymentAmount || (currency === 'bs' ? paymentAmountBs : paymentAmountUsd) || 0
    );

    // Form fields
    const [referenceNumber, setReferenceNumber] = useState('');
    const [depositedAmount, setDepositedAmount] = useState('');
    const [sourceBank, setSourceBank] = useState(null);
    const [receiptImage, setReceiptImage] = useState(null);
    const [receiptBase64, setReceiptBase64] = useState(null);

    const [submitting, setSubmitting] = useState(false);

    // Custom alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('warning'); // 'warning', 'success', 'error'
    const [alertCallback, setAlertCallback] = useState(null);

    const showCustomAlert = (title, message, type = 'warning', callback = null) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertCallback(() => callback);
        setAlertVisible(true);
    };

    const handleAlertClose = () => {
        setAlertVisible(false);
        if (alertCallback) {
            alertCallback();
        }
    };

    // Generate dynamic payment instructions based on API data
    const getPaymentInstructions = (paymentData) => {
        if (!paymentData) {
            return {
                title: 'Método de Pago',
                instructions: [{ text: 'Cargando información...', copyable: false }]
            };
        }

        const tipoPago = paymentData.tipo_pago || 'Método de Pago';
        const isPagoMovil = tipoPago.toLowerCase().includes('pago movil') || tipoPago.toLowerCase().includes('pago móvil');
        const isTransferencia = tipoPago.toLowerCase().includes('transferencia');

        if (paymentData.informacion) {
            // Handle TRANSFERENCIA format specifically
            if (isTransferencia) {
                const info = paymentData.informacion;
                const instructions = [];

                // Extract Banco name (first part before the period)
                const bancoMatch = info.match(/^([^.]+)/);
                if (bancoMatch) {
                    instructions.push({ text: `Banco: ${bancoMatch[1].trim()}`, copyable: false });
                }

                // Extract Tipo de Cuenta and Número
                const cuentaMatch = info.match(/(Cta\.\s*\w+)\s*No\.\s*(\d+)/i);
                if (cuentaMatch) {
                    instructions.push({ text: `Tipo: ${cuentaMatch[1]}`, copyable: false });
                    instructions.push({
                        text: `Nro. Cuenta: ${cuentaMatch[2]}`,
                        copyable: true,
                        copyValue: cuentaMatch[2],
                        copyLabel: 'Nro. Cuenta'
                    });
                }

                // Extract Titular (text after account number, before Rif)
                const titularMatch = info.match(/\d{15,}\s+([^.]+?)(?:\s*\.?\s*Rif)/i);
                if (titularMatch) {
                    const titular = titularMatch[1].trim();
                    instructions.push({
                        text: `Titular: ${titular}`,
                        copyable: true,
                        copyValue: titular,
                        copyLabel: 'Titular'
                    });
                }

                // Extract RIF
                const rifMatch = info.match(/Rif[:\s]*([JVE]?[-]?\d+)/i);
                if (rifMatch) {
                    const rifFull = rifMatch[1];
                    const rifNumbers = rifFull.replace(/[^0-9]/g, ''); // Only numbers for copying
                    instructions.push({
                        text: `RIF: ${rifFull}`,
                        copyable: true,
                        copyValue: rifNumbers,
                        copyLabel: 'RIF'
                    });
                }

                // Extract Email
                const emailMatch = info.match(/Email[:\s]*([^\s]+@[^\s]+)/i);
                if (emailMatch) {
                    instructions.push({
                        text: `Email: ${emailMatch[1]}`,
                        copyable: true,
                        copyValue: emailMatch[1],
                        copyLabel: 'Email'
                    });
                }

                return {
                    title: tipoPago,
                    instructions: instructions.length > 0 ? instructions : [{ text: paymentData.informacion, copyable: false }]
                };
            }

            // Handle PAGO MOVIL format
            if (isPagoMovil) {
                const infoLines = paymentData.informacion
                    .split(/\.\s*/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                const instructions = infoLines.map(line => {
                    // Check if line contains phone number
                    const phoneMatch = line.match(/Teléfono[:\s]*([0-9-]+)/i);
                    if (phoneMatch) {
                        const phoneNumber = phoneMatch[1].replace(/-/g, '');
                        return {
                            text: line,
                            copyable: true,
                            copyValue: phoneNumber,
                            copyLabel: 'Teléfono'
                        };
                    }

                    // Check if line contains RIF
                    const rifMatch = line.match(/RIF[:\s]*[JVE]?[-]?([0-9]+)/i);
                    if (rifMatch) {
                        const rifNumber = rifMatch[1];
                        return {
                            text: line,
                            copyable: true,
                            copyValue: rifNumber,
                            copyLabel: 'RIF'
                        };
                    }

                    return { text: line, copyable: false };
                });

                return {
                    title: tipoPago,
                    instructions: instructions
                };
            }

            // Handle ZELLE format
            const isZelle = tipoPago.toLowerCase().includes('zelle');
            if (isZelle) {
                const info = paymentData.informacion;
                const instructions = [];

                // Extract Email
                const emailMatch = info.match(/([^\s]+@[^\s]+)/i);
                if (emailMatch) {
                    instructions.push({
                        text: `Email: ${emailMatch[1]}`,
                        copyable: true,
                        copyValue: emailMatch[1],
                        copyLabel: 'Email'
                    });
                }

                // Extract Name/Titular if present
                const nameMatch = info.match(/(?:Nombre|Titular|Name)[:\s]*([^.@]+?)(?:\s*[.@]|$)/i);
                if (nameMatch) {
                    instructions.push({
                        text: `Nombre: ${nameMatch[1].trim()}`,
                        copyable: true,
                        copyValue: nameMatch[1].trim(),
                        copyLabel: 'Nombre'
                    });
                }

                // If no specific fields found, just show the info
                if (instructions.length === 0) {
                    const infoLines = info
                        .split(/\.\s*/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

                    infoLines.forEach(line => {
                        // Check if this line is an email
                        const lineEmailMatch = line.match(/([^\s]+@[^\s]+)/);
                        if (lineEmailMatch) {
                            instructions.push({
                                text: line,
                                copyable: true,
                                copyValue: lineEmailMatch[1],
                                copyLabel: 'Email'
                            });
                        } else {
                            instructions.push({ text: line, copyable: false });
                        }
                    });
                }

                return {
                    title: tipoPago,
                    instructions: instructions.length > 0 ? instructions : [{ text: info, copyable: false }]
                };
            }

            // Default: split by periods for other payment types
            const infoLines = paymentData.informacion
                .split(/\.\s*/)
                .map(line => line.trim())
                .filter(line => line.length > 0);

            return {
                title: tipoPago,
                instructions: infoLines.map(line => ({ text: line, copyable: false }))
            };
        }

        // Fallback if no informacion field
        return {
            title: tipoPago,
            instructions: [{ text: 'Por favor realiza el pago según las instrucciones.', copyable: false }]
        };
    };

    // Copy to clipboard helper
    const copyToClipboard = async (value, label) => {
        await Clipboard.setStringAsync(value);
    };

    useEffect(() => {
        const fetchPaymentData = async () => {
            setLoading(true);
            try {
                const moneda = currency === 'bs' ? 'BS' : 'USD';

                // Fetch payment methods
                const response = await api.getPaymentMethods(moneda);

                if (response.success) {
                    console.log('[PaymentConfirmation] Payment methods data:', JSON.stringify(response.data.metodos_pago, null, 2));
                    setPaymentMethods(response.data.metodos_pago || []);
                    setBanks(response.data.bancos || []);

                    // Set defaults
                    if (response.data.metodos_pago?.length > 0) {
                        setSelectedPaymentType(response.data.metodos_pago[0].id);
                        setSelectedPaymentTypeData(response.data.metodos_pago[0]);
                    }
                    if (response.data.bancos?.length > 0) {
                        setSourceBank(response.data.bancos[0].id);
                    }
                }

                // Fetch payment amount from API (especially for BS to get current exchange rate)
                if (saleId) {
                    const amountResponse = await api.getInitialAmount(saleId, moneda);
                    console.log('[PaymentConfirmation] Initial amount response:', amountResponse);

                    if (amountResponse.success && amountResponse.data) {
                        // Use monto_bs for BS currency, monto for USD
                        const amount = currency === 'bs'
                            ? amountResponse.data.monto_bs
                            : amountResponse.data.monto;
                        if (amount) {
                            setDisplayAmount(amount);
                        }
                    }
                }
            } catch (err) {
                console.error('[PaymentConfirmation] Error fetching payment data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentData();
    }, [currency, saleId]);

    // Update payment type data when selection changes
    useEffect(() => {
        const selected = paymentMethods.find(m => m.id === selectedPaymentType);
        setSelectedPaymentTypeData(selected);
    }, [selectedPaymentType, paymentMethods]);

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para adjuntar el comprobante.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setReceiptImage(result.assets[0].uri);
            // Save base64 with data URI prefix
            const mimeType = result.assets[0].uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
            setReceiptBase64(`data:${mimeType};base64,${result.assets[0].base64}`);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar la foto.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setReceiptImage(result.assets[0].uri);
            // Save base64 with data URI prefix
            const mimeType = result.assets[0].uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
            setReceiptBase64(`data:${mimeType};base64,${result.assets[0].base64}`);
        }
    };

    const handleSubmit = async () => {
        const isCashPayment = selectedPaymentTypeData?.tipo_pago?.toLowerCase().includes('cash');

        // Skip validation only for Cash payments (except image)
        if (!isCashPayment) {
            if (!referenceNumber.trim()) {
                showCustomAlert('Campo requerido', 'Por favor ingresa el número de referencia.', 'warning');
                return;
            }
            if (!depositedAmount.trim()) {
                showCustomAlert('Campo requerido', 'Por favor ingresa el monto transferido.', 'warning');
                return;
            }
            if (!sourceBank) {
                showCustomAlert('Campo requerido', 'Por favor selecciona el banco desde donde realizaste el pago.', 'warning');
                return;
            }
        }

        // Receipt/photo is required for ALL payment types
        if (!receiptImage) {
            const imageLabel = isCashPayment ? 'la foto de los billetes' : 'el comprobante de pago';
            showCustomAlert('Campo requerido', `Por favor adjunta ${imageLabel}.`, 'warning');
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Use the base64 image that was captured when picking/taking the photo
            const comprobanteBase64 = receiptBase64;
            if (!comprobanteBase64) {
                showCustomAlert('Error', 'No se pudo procesar la imagen del comprobante. Por favor selecciona de nuevo.', 'error');
                setSubmitting(false);
                return;
            }
            console.log('[PaymentConfirmation] Using base64 image, length:', comprobanteBase64.length);

            // Step 2: Clean and validate deposited amount
            // Remove thousand separators (commas) and validate format
            const cleanedAmount = depositedAmount.trim().replace(/,/g, '');
            const decimalFormatRegex = /^\d+\.\d{2}$/;
            if (!isCashPayment && !decimalFormatRegex.test(cleanedAmount)) {
                setSubmitting(false);
                showCustomAlert(
                    'Formato incorrecto',
                    'Por favor ingresa el monto con 2 decimales. Ejemplo: 150.00 o 5,240.68',
                    'warning'
                );
                return;
            }

            const depositedAmountParsed = parseFloat(cleanedAmount) || 0;

            // Get bank code from selected bank ID
            const selectedBankData = banks.find(b => b.id === sourceBank);
            const bankCode = selectedBankData?.codigo || selectedBankData?.nombre || null;

            let response;

            // Step 3: Determine if this is a quota payment or initial payment
            if (isQuotaPayment && quotaId) {
                // Quota payment - use submitQuotaPayment
                const quotaPaymentData = {
                    id_cuota: quotaId,
                    monto: paymentAmountUsd || paymentAmount, // Monto en USD (original)
                    monto_bs: currency === 'bs' ? displayAmount : 0, // Monto en BS
                    metodo_pago: selectedPaymentTypeData?.tipo_pago || 'Desconocido',
                    banco: bankCode,
                    referencia: referenceNumber || null,
                    comprobante_base64: comprobanteBase64
                };

                console.log('[PaymentConfirmation] Submitting QUOTA payment:', quotaPaymentData);
                response = await api.submitQuotaPayment(quotaPaymentData);
            } else {
                // Initial payment - use submitInitialPayment
                // When currency is BS, we need to send both monto (USD) and monto_bs (BS)
                const paymentData = {
                    id_venta: saleId,
                    monto: paymentAmountUsd || paymentAmount, // USD amount
                    monto_bs: currency === 'bs' ? displayAmount : null, // BS amount
                    monto_transferido: depositedAmountParsed,
                    moneda: currency === 'bs' ? 'BS' : 'USD',
                    metodo_pago: selectedPaymentTypeData?.tipo_pago || 'Desconocido',
                    banco: bankCode,
                    referencia: referenceNumber || null,
                    comprobante_base64: comprobanteBase64
                };

                console.log('[PaymentConfirmation] Submitting INITIAL payment:', paymentData);
                response = await api.submitInitialPayment(paymentData);
            }

            if (response.success) {
                setSubmitting(false);
                const successMessage = isQuotaPayment
                    ? `Tu comprobante de pago de la Cuota ${quotaNumber || ''} ha sido enviado. Lo verificaremos pronto.`
                    : 'Tu comprobante de pago ha sido enviado. Lo verificaremos pronto.';
                showCustomAlert(
                    'Pago Registrado',
                    successMessage,
                    'success',
                    () => navigation.navigate('Main', { screen: 'Orders' })
                );
            } else {
                setSubmitting(false);
                const errorMessage = response.error || 'No se pudo registrar el pago. Intenta de nuevo.';
                showCustomAlert('Error', errorMessage, 'error');
            }
        } catch (error) {
            console.error('[PaymentConfirmation] Submit error:', error);
            setSubmitting(false);
            showCustomAlert('Error', 'Ocurrió un error al enviar el pago. Intenta de nuevo.', 'error');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF007F" />
                    <Text style={styles.loadingText}>Cargando métodos de pago...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const instructions = getPaymentInstructions(selectedPaymentTypeData);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmar Pago</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Amount to pay */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Monto a pagar</Text>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountValue}>
                            {currency === 'bs' ? 'Bs. ' : '$'}
                            {formatNumber(displayAmount)}
                        </Text>
                        <TouchableOpacity
                            style={styles.amountCopyButton}
                            onPress={() => copyToClipboard(formatNumber(displayAmount), 'Monto')}
                        >
                            <Ionicons name="copy-outline" size={20} color="#FF007F" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payment Type Selector */}
                <Text style={styles.sectionTitle}>Tipo de Pago</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedPaymentType}
                        onValueChange={(value) => setSelectedPaymentType(value)}
                        style={styles.picker}
                    >
                        {paymentMethods.map((method) => (
                            <Picker.Item
                                key={method.id}
                                label={method.tipo_pago}
                                value={method.id}
                            />
                        ))}
                    </Picker>
                </View>

                {/* Payment Instructions */}
                <View style={styles.instructionsCard}>
                    <View style={styles.instructionsHeader}>
                        <Ionicons name="information-circle" size={20} color="#FF007F" />
                        <Text style={styles.instructionsTitle}>{instructions.title}</Text>
                    </View>
                    <View style={styles.instructionsList}>
                        {instructions.instructions.map((instruction, index) => (
                            <View key={index} style={styles.instructionRow}>
                                <Text style={styles.instructionBullet}>•</Text>
                                <Text style={styles.instructionText}>{instruction.text}</Text>
                                {instruction.copyable && (
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={() => copyToClipboard(instruction.copyValue, instruction.copyLabel)}
                                    >
                                        <Ionicons name="copy-outline" size={18} color="#FF007F" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Special message for Cash payment */}
                    {selectedPaymentTypeData?.tipo_pago?.toLowerCase().includes('cash') && (
                        <View style={styles.cashMessageContainer}>
                            <Ionicons name="call-outline" size={18} color="#FF007F" />
                            <Text style={styles.cashMessageText}>
                                El equipo de Mamá SAN se pondrá en contacto contigo para coordinar la entrega del efectivo.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Show form fields for BS payments and Zelle, hide only for Cash */}
                {!selectedPaymentTypeData?.tipo_pago?.toLowerCase().includes('cash') && (
                    <>
                        {/* Reference Number */}
                        <Text style={styles.sectionTitle}>Nro de Referencia</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 123456789"
                            value={referenceNumber}
                            onChangeText={setReferenceNumber}
                            keyboardType="numeric"
                        />

                        {/* Deposited Amount */}
                        <Text style={styles.sectionTitle}>Monto Transferido</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={currency === 'bs' ? 'Ej: 1500.00' : 'Ej: 50.00'}
                            value={depositedAmount}
                            onChangeText={setDepositedAmount}
                            keyboardType="decimal-pad"
                        />

                        {/* Source Bank */}
                        <Text style={styles.sectionTitle}>
                            {currency === 'usd' ? 'Banco desde donde transferiste' : 'Banco desde donde pagaste'}
                        </Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={sourceBank}
                                onValueChange={(value) => setSourceBank(value)}
                                style={styles.picker}
                            >
                                {banks.map((bank) => (
                                    <Picker.Item
                                        key={bank.id}
                                        label={bank.nombre}
                                        value={bank.id}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </>
                )}

                {/* Receipt Image */}
                <Text style={styles.sectionTitle}>
                    {selectedPaymentTypeData?.tipo_pago?.toLowerCase().includes('cash')
                        ? 'Foto de los billetes'
                        : 'Comprobante de Pago'}
                </Text>
                {selectedPaymentTypeData?.tipo_pago?.toLowerCase().includes('cash') && (
                    <Text style={styles.photoInstructions}>
                        Por favor toma una foto clara de los billetes que vas a entregar
                    </Text>
                )}
                <View style={styles.imageSection}>
                    {receiptImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: receiptImage }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setReceiptImage(null)}
                            >
                                <Ionicons name="close-circle" size={28} color="#FF007F" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imageButtons}>
                            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                                <Ionicons name="image" size={24} color="#FF007F" />
                                <Text style={styles.imageButtonText}>Galería</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                                <Ionicons name="camera" size={24} color="#FF007F" />
                                <Text style={styles.imageButtonText}>Cámara</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Enviar Comprobante</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Alert Modal */}
            <Modal
                visible={alertVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleAlertClose}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertContainer}>
                        <View style={[
                            styles.alertIconContainer,
                            alertType === 'success' && styles.alertIconSuccess,
                            alertType === 'error' && styles.alertIconError,
                        ]}>
                            <Ionicons
                                name={
                                    alertType === 'success' ? 'checkmark-circle' :
                                        alertType === 'error' ? 'close-circle' :
                                            'alert-circle'
                                }
                                size={50}
                                color="white"
                            />
                        </View>
                        <Text style={styles.alertTitle}>{alertTitle}</Text>
                        <Text style={styles.alertMessage}>{alertMessage}</Text>
                        <TouchableOpacity
                            style={[
                                styles.alertButton,
                                alertType === 'success' && styles.alertButtonSuccess,
                            ]}
                            onPress={handleAlertClose}
                        >
                            <Text style={styles.alertButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    amountCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#FF007F',
    },
    amountLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountCopyButton: {
        marginLeft: 12,
        padding: 8,
        backgroundColor: '#FFF0F5',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 15,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    instructionsCard: {
        backgroundColor: '#FFF5F8',
        borderRadius: 12,
        padding: 15,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#FFE0EB',
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FFE0EB',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF007F',
        marginLeft: 8,
    },
    instructionsList: {
        paddingLeft: 5,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    instructionBullet: {
        fontSize: 14,
        color: '#FF007F',
        marginRight: 10,
        fontWeight: 'bold',
    },
    instructionText: {
        fontSize: 14,
        color: '#444',
        flex: 1,
        lineHeight: 20,
    },
    copyButton: {
        padding: 4,
        marginLeft: 8,
    },
    cashMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF0F5',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#FF007F',
    },
    cashMessageText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 10,
        flex: 1,
        lineHeight: 18,
    },
    photoInstructions: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 15,
        fontSize: 16,
    },
    imageSection: {
        marginTop: 10,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    imageButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FF007F',
        borderStyle: 'dashed',
        padding: 20,
        alignItems: 'center',
    },
    imageButtonText: {
        marginTop: 8,
        fontSize: 14,
        color: '#FF007F',
        fontWeight: '500',
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        resizeMode: 'contain',
        backgroundColor: '#f0f0f0',
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 14,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    submitButton: {
        backgroundColor: '#FF007F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#FF007F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    // Custom Alert Modal Styles
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    alertIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF007F',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    alertIconSuccess: {
        backgroundColor: '#4CAF50',
    },
    alertIconError: {
        backgroundColor: '#F44336',
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    alertButton: {
        backgroundColor: '#FF007F',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        minWidth: 120,
    },
    alertButtonSuccess: {
        backgroundColor: '#4CAF50',
    },
    alertButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default PaymentConfirmationScreen;
