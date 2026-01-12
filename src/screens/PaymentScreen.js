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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { formatNumber } from '../utils/formatNumber';

const PaymentScreen = ({ navigation, route }) => {
    const { cartItems, total } = useCart();

    // Get payment method and saleId from route params (from CheckoutScreen)
    const paymentMethod = route.params?.paymentMethod || 'installments';
    const saleId = route.params?.saleId;

    const [currency, setCurrency] = useState('usd');
    const [loading, setLoading] = useState(true);
    const [purchaseConditions, setPurchaseConditions] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState(null);
    const [error, setError] = useState(null);

    // Fetch purchase conditions on mount
    useEffect(() => {
        const fetchPurchaseConditions = async () => {
            if (!saleId) {
                setError('No se encontró el ID de venta. Por favor, regresa e intenta de nuevo.');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const isContado = paymentMethod === 'cash';
                console.log('[PaymentScreen] Calling API with saleId:', saleId, 'contado:', isContado);
                const response = await api.calculatePurchaseConditions(saleId, isContado);
                console.log('[PaymentScreen] API Response:', response);

                if (response.success) {
                    setPurchaseConditions(response.data);
                } else {
                    setError(response.error || 'Error al calcular condiciones');
                }
            } catch (err) {
                console.error('[PaymentScreen] Error:', err);
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        fetchPurchaseConditions();
    }, [saleId, paymentMethod]);

    // Fetch payment amount when currency changes
    useEffect(() => {
        const fetchPaymentAmount = async () => {
            if (!saleId) return;

            try {
                const moneda = currency === 'bs' ? 'BS' : 'USD';
                console.log('[PaymentScreen] Fetching payment amount in:', moneda);
                const response = await api.getInitialAmount(saleId, moneda);
                console.log('[PaymentScreen] Payment Amount Response:', response);

                if (response.success) {
                    setPaymentAmount(response.data);
                }
            } catch (err) {
                console.error('[PaymentScreen] Error fetching payment amount:', err);
            }
        };

        fetchPaymentAmount();
    }, [saleId, currency]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    };

    const handleConfirmPayment = () => {
        // Navigate to PaymentConfirmationScreen with selected currency and amounts
        // Use pago_hoy from purchaseConditions as the base USD amount
        const pagoHoyUsd = purchaseConditions?.pago_hoy || 0;
        const tasa = paymentAmount?.tasa_cambio || paymentAmount?.detalle?.tasa_aplicada || 1;
        const amountBs = pagoHoyUsd * tasa;
        const amountUsd = pagoHoyUsd;

        navigation.navigate('PaymentConfirmation', {
            saleId,
            currency,
            paymentAmount: currency === 'bs' ? amountBs : amountUsd,
            paymentAmountBs: amountBs,
            paymentAmountUsd: amountUsd,
            tasaCambio: tasa,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF007F" />
                    <Text style={styles.loadingText}>Calculando condiciones de pago...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Método de Pago</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color="#dc3545" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.retryButtonText}>Regresar</Text>
                        </TouchableOpacity>
                    </View>
                ) : purchaseConditions && (
                    <>
                        {/* Show installment plan or cash payment based on selection */}
                        {paymentMethod === 'installments' ? (
                            <View style={styles.methodDetails}>
                                <Text style={styles.methodTitle}>
                                    Plan de Cuotas Nivel {purchaseConditions.nivel || 'Estándar'}
                                </Text>

                                {/* First installment - Payment today */}
                                <View style={styles.costRow}>
                                    <View style={styles.cuotaInfo}>
                                        <Text style={[styles.costLabel, styles.highlightLabel]}>Cuota 1 (Hoy)</Text>
                                        <Text style={styles.cuotaDate}>Pago inicial</Text>
                                    </View>
                                    <Text style={[styles.costValue, styles.highlightValue]}>
                                        ${formatNumber(purchaseConditions.pago_hoy)}
                                    </Text>
                                </View>

                                {/* Remaining installments from API */}
                                {purchaseConditions.fechas_cuotas?.map((cuota) => (
                                    <View key={cuota.numero} style={styles.costRow}>
                                        <View style={styles.cuotaInfo}>
                                            <Text style={styles.costLabel}>Cuota {cuota.numero}</Text>
                                            <Text style={styles.cuotaDate}>{formatDate(cuota.fecha)}</Text>
                                        </View>
                                        <Text style={styles.costValue}>${formatNumber(cuota.monto)}</Text>
                                    </View>
                                ))}

                                <View style={styles.divider} />
                                <View style={styles.costRow}>
                                    <Text style={[styles.costLabel, { fontWeight: 'bold' }]}>Total</Text>
                                    <Text style={[styles.costValue, { color: '#FF007F', fontWeight: 'bold' }]}>
                                        ${formatNumber(purchaseConditions.total_venta ?? total)}
                                    </Text>
                                </View>

                                {purchaseConditions.credito_disponible !== undefined && (
                                    <View style={styles.creditInfo}>
                                        <Ionicons name="information-circle" size={16} color="#666" />
                                        <Text style={styles.creditText}>
                                            Crédito disponible: ${formatNumber(purchaseConditions.credito_disponible)}
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.noteText}>* El número de cuotas depende de tu Nivel de Afiliado.</Text>
                            </View>
                        ) : (
                            <View style={styles.methodDetails}>
                                <Text style={styles.methodTitle}>Pago de Contado</Text>
                                <View style={styles.cashPaymentContainer}>
                                    <Text style={styles.cashLabel}>Monto Total a Pagar Hoy</Text>
                                    <Text style={styles.cashAmount}>
                                        ${formatNumber(purchaseConditions.pago_hoy)}
                                    </Text>
                                </View>
                                <Text style={styles.noteText}>* El pago se realiza en una sola exhibición.</Text>
                            </View>
                        )}
                    </>
                )}

                <Text style={styles.sectionTitle}>Moneda de Pago</Text>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, currency === 'bs' && styles.activeTab]}
                        onPress={() => setCurrency('bs')}
                    >
                        <Text style={[styles.tabText, currency === 'bs' && styles.activeTabText]}>Bs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, currency === 'usd' && styles.activeTab]}
                        onPress={() => setCurrency('usd')}
                    >
                        <Text style={[styles.tabText, currency === 'usd' && styles.activeTabText]}>Dólares</Text>
                    </TouchableOpacity>
                </View>

                {/* Monto a pagar section */}
                <Text style={styles.sectionTitle}>Monto a pagar (Cuota Inicial)</Text>
                <View style={styles.summaryCard}>
                    {purchaseConditions ? (
                        <View style={styles.paymentAmountContainer}>
                            <Text style={styles.paymentAmountLabel}>
                                {currency === 'bs' ? 'Monto en Bolívares' : 'Monto en Dólares'}
                            </Text>
                            <Text style={styles.paymentAmountValue}>
                                {currency === 'bs' ? 'Bs. ' : '$'}
                                {formatNumber(
                                    currency === 'bs'
                                        ? (paymentAmount?.monto || (purchaseConditions.pago_hoy * (paymentAmount?.tasa_cambio || 1)))
                                        : purchaseConditions.pago_hoy
                                )}
                            </Text>
                            {currency === 'bs' && paymentAmount?.tasa_cambio && (
                                <Text style={styles.exchangeRateText}>
                                    Tasa: {formatNumber(paymentAmount.tasa_cambio)} Bs/$
                                </Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.loadingAmountContainer}>
                            <ActivityIndicator size="small" color="#FF007F" />
                            <Text style={styles.loadingAmountText}>Cargando monto...</Text>
                        </View>
                    )}
                </View>

                {/* Estimated Delivery Date */}
                <View style={styles.deliveryEstimateContainer}>
                    <Ionicons name="calendar-outline" size={18} color="#FF007F" />
                    <View style={styles.deliveryEstimateInfo}>
                        <Text style={styles.deliveryEstimateLabel}>Entrega estimada</Text>
                        <Text style={styles.deliveryEstimateValue}>
                            {(() => {
                                const today = new Date();
                                const minDate = new Date(today);
                                const maxDate = new Date(today);
                                minDate.setDate(today.getDate() + 21);
                                maxDate.setDate(today.getDate() + 28);
                                const options = { day: 'numeric', month: 'short' };
                                const minStr = minDate.toLocaleDateString('es-ES', options);
                                const maxStr = maxDate.toLocaleDateString('es-ES', options);
                                return `${minStr} - ${maxStr}`;
                            })()}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.placeOrderButton} onPress={handleConfirmPayment}>
                    <Text style={styles.placeOrderText}>Confirmar Pedido</Text>
                </TouchableOpacity>
            </View>
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
    errorContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 30,
        paddingVertical: 12,
        backgroundColor: '#FF007F',
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
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
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10,
        color: '#333',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 5,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#FF007F',
    },
    tabText: {
        color: '#999',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FF007F',
    },
    methodDetails: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    noteText: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
    },
    cuotaInfo: {
        flex: 1,
    },
    cuotaDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    highlightValue: {
        color: '#FF007F',
        fontWeight: 'bold',
    },
    highlightLabel: {
        color: '#FF007F',
        fontWeight: 'bold',
    },
    creditInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    creditText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#666',
    },
    cashPaymentContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    cashLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    cashAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    paymentAmountContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    paymentAmountLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    paymentAmountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    exchangeRateText: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
    loadingAmountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingAmountText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    costLabel: {
        fontSize: 14,
        color: '#666',
    },
    costValue: {
        fontSize: 14,
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    placeOrderButton: {
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
    placeOrderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    deliveryEstimateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFD6E7',
    },
    deliveryEstimateInfo: {
        marginLeft: 12,
    },
    deliveryEstimateLabel: {
        fontSize: 12,
        color: '#666',
    },
    deliveryEstimateValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF007F',
        marginTop: 2,
    },
});

export default PaymentScreen;
