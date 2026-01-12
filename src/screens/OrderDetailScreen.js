import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    StatusBar,
    Platform,
    Modal,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { formatNumber } from '../utils/formatNumber';
import ProductTimeline from '../components/ProductTimeline';

// Gradient color schemes for different statuses
const STATUS_GRADIENTS = {
    success: ['#4CAF50', '#66BB6A'],       // Green gradient
    processing: ['#FF007F', '#FF5C8D'],    // Fucsia gradient
    pending: ['#7B1FA2', '#9C27B0'],       // Purple gradient
    canceled: ['#9E9E9E', '#BDBDBD'],      // Gray gradient for canceled
    default: ['#9E9E9E', '#BDBDBD'],       // Gray gradient
};

const OrderDetailScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [quotas, setQuotas] = useState([]);
    const [pagoInicial, setPagoInicial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Currency selection modal state
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [selectedQuotaForPayment, setSelectedQuotaForPayment] = useState(null);
    const [modalCurrency, setModalCurrency] = useState('bs');
    const [modalAmountBs, setModalAmountBs] = useState(0);
    const [modalAmountUsd, setModalAmountUsd] = useState(0);
    const [loadingAmount, setLoadingAmount] = useState(false);

    // Products section collapsed by default
    const [showProducts, setShowProducts] = useState(false);

    // Tracking modal state
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [selectedItemForTracking, setSelectedItemForTracking] = useState(null);

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getOrderDetail(orderId);

            if (response.success) {
                setOrder(response.data.order);
                setItems(response.data.items || []);
                setQuotas(response.data.quotas || []);
                setPagoInicial(response.data.pago_inicial || null);
            } else {
                setError(response.error || 'Error al cargar el pedido');
            }
        } catch (err) {
            console.error('Error fetching order detail:', err);
            setError('Error al cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return formatNumber(amount || 0);
    };

    // Bank code to name mapping
    const BANK_CODES = {
        '0102': 'Banco de Venezuela',
        '0104': 'Venezolano de Crédito',
        '0105': 'Mercantil',
        '0108': 'Provincial BBVA',
        '0114': 'Bancaribe',
        '0115': 'Exterior',
        '0116': 'Occidental de Descuento',
        '0128': 'Caroní',
        '0134': 'Banesco',
        '0137': 'Sofitasa',
        '0138': 'Plaza',
        '0146': 'Fondo Común',
        '0151': 'BFC',
        '0156': '100% Banco',
        '0157': 'Del Sur',
        '0163': 'Banco del Tesoro',
        '0166': 'Agrícola de Venezuela',
        '0168': 'Bangente',
        '0169': 'Mi Banco',
        '0171': 'Activo',
        '0172': 'Bancamiga',
        '0173': 'Internacional de Desarrollo',
        '0174': 'Banplus',
        '0175': 'Bicentenario',
        '0177': 'Banfanb',
        '0191': 'BNC',
        // Alternative lowercase keys for common banks
        'banco_de_venezuela': 'Banco de Venezuela',
        'banesco': 'Banesco',
        'mercantil': 'Mercantil',
        'provincial': 'Provincial BBVA',
        'bod': 'BOD',
        'bancamiga': 'Bancamiga',
        'bancaribe': 'Bancaribe',
        'exterior': 'Banco Exterior',
        'tesoro': 'Banco del Tesoro',
        'bicentenario': 'Bicentenario',
        'bnc': 'BNC',
        'banplus': 'Banplus',
        'pago_movil': 'Pago Móvil',
    };

    const getBankName = (bankCode) => {
        if (!bankCode) return '-';
        // Try direct lookup
        const name = BANK_CODES[bankCode] || BANK_CODES[bankCode.toLowerCase()];
        if (name) return name;
        // If it's already a readable name (contains space or is capitalized), return as is
        if (bankCode.includes(' ') || /^[A-Z]/.test(bankCode)) {
            return bankCode;
        }
        // Convert snake_case to Title Case
        return bankCode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    // Payment method names mapping
    const PAYMENT_METHODS = {
        'pago_movil': 'Pago Móvil',
        'transferencia': 'Transferencia',
        'zelle': 'Zelle',
        'cash': 'Efectivo',
        'binance': 'Binance Pay',
        'paypal': 'PayPal',
        'cash_usd': 'Efectivo USD',
        'cash_bs': 'Efectivo Bs',
    };

    const getPaymentMethodName = (method) => {
        if (!method) return '-';
        const name = PAYMENT_METHODS[method] || PAYMENT_METHODS[method.toLowerCase()];
        if (name) return name;
        // Convert snake_case to Title Case
        return method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get gradient colors for status
    const getStatusGradient = (status) => {
        switch (status?.toLowerCase()) {
            case 'completado':
            case 'entregado':
            case 'pagada':
            case 'pagada puntual':
            case 'aprobado':
                return STATUS_GRADIENTS.success;
            case 'en proceso':
            case 'procesando':
            case 'orden confirmada':
            case 'por entregar':
                return STATUS_GRADIENTS.processing;
            case 'pendiente':
            case 'validacion':
            case 'pago en revisión':
            case 'por pagar':
                return STATUS_GRADIENTS.pending;
            case 'rechazado':
            case 'pago rechazado':
            case 'cancelado':
            case 'cancelada':
            case 'cancelado por mora':
            case 'atrasada':
            case 'mora_critica':
                return STATUS_GRADIENTS.canceled;
            default:
                return STATUS_GRADIENTS.default;
        }
    };

    const getQuotaStatusGradient = (status) => {
        switch (status?.toLowerCase()) {
            case 'pagada':
            case 'pagado':
            case 'pagada puntual':
                return STATUS_GRADIENTS.success;
            case 'por pagar':
            case 'pendiente':
            case 'en revisión':
                return STATUS_GRADIENTS.pending;
            case 'atrasada':
            case 'mora_critica':
            case 'rechazado':
                return STATUS_GRADIENTS.error;
            case 'inicial':
                return STATUS_GRADIENTS.default;
            default:
                return STATUS_GRADIENTS.default;
        }
    };

    // Status Badge Component with Gradient
    const StatusBadge = ({ status, style }) => {
        const gradientColors = getStatusGradient(status);

        // Transform display name for specific statuses
        const getDisplayName = (statusText) => {
            if (statusText?.toLowerCase() === 'orden confirmada') {
                return 'Por entregar';
            }
            return statusText;
        };

        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.statusBadge, style]}
            >
                <Text style={styles.statusText}>{getDisplayName(status)}</Text>
            </LinearGradient>
        );
    };

    // Quota Status Badge with Gradient
    const QuotaStatusBadge = ({ status, style }) => {
        const gradientColors = getQuotaStatusGradient(status);
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.quotaStatusBadge, style]}
            >
                <Text style={styles.quotaStatusText}>{status}</Text>
            </LinearGradient>
        );
    };

    // Find the next quota that needs to be paid (first non-paid quota)
    const getNextPayableQuota = () => {
        if (!quotas || quotas.length === 0) return null;

        // Find the first quota that is 'por pagar', 'pendiente', or 'atrasada'
        const payableStatuses = ['por pagar', 'pendiente', 'atrasada', 'mora_critica'];
        return quotas.find(q => payableStatuses.includes(q.estatus?.toLowerCase()));
    };

    const handlePayQuota = async (quota) => {
        // Show currency selection modal
        setSelectedQuotaForPayment(quota);
        setModalCurrency('bs');
        const quotaAmountUsd = quota.monto || 0;
        setModalAmountUsd(quotaAmountUsd);
        setModalAmountBs(0); // Reset BS amount
        setShowCurrencyModal(true);
        setLoadingAmount(true);

        // Fetch the exchange rate from rates endpoint and calculate BS amount
        try {
            console.log('[OrderDetail] Fetching exchange rate for quota:', quota.id_cuota);
            const response = await api.getExchangeRate();
            console.log('[OrderDetail] Exchange rate response:', JSON.stringify(response));

            if (response.success && response.data?.tipo_cambio?.tasa) {
                const tasa = response.data.tipo_cambio.tasa;
                const amountBs = quotaAmountUsd * tasa;
                console.log('[OrderDetail] Tasa:', tasa, '| Monto USD:', quotaAmountUsd, '| Monto BS:', amountBs);
                setModalAmountBs(amountBs);
            } else {
                // Fallback: calculate with default rate
                console.warn('[OrderDetail] API did not return valid rate:', response);
                const fallbackAmount = quotaAmountUsd * 50;
                console.log('[OrderDetail] Using fallback amount:', fallbackAmount);
                setModalAmountBs(fallbackAmount);
            }
        } catch (err) {
            console.error('[OrderDetail] Error fetching exchange rate:', err);
            const fallbackAmount = quotaAmountUsd * 50;
            setModalAmountBs(fallbackAmount);
        } finally {
            setLoadingAmount(false);
        }
    };

    const handleConfirmPayment = () => {
        setShowCurrencyModal(false);
        if (selectedQuotaForPayment) {
            // Navigate to payment screen with quota info
            navigation.navigate('PaymentConfirmation', {
                saleId: orderId,
                currency: modalCurrency,
                paymentAmount: modalCurrency === 'bs' ? modalAmountBs : modalAmountUsd,
                paymentAmountBs: modalAmountBs,
                paymentAmountUsd: modalAmountUsd, // Always pass USD amount for API
                quotaId: selectedQuotaForPayment.id_cuota,
                quotaNumber: selectedQuotaForPayment.numero_cuota,
                isQuotaPayment: true
            });
        }
    };

    // Calculate totals for display
    const calculateManejoEnvio = () => {
        const shipping = order?.monto_shipping || 0;
        const tarifaManejo = order?.monto_tarifa_manejo || 0;
        const tarifaProductos = order?.monto_tarifa_productos || 0;
        const tarifasAdicionales = order?.monto_tarifas_adicionales || 0;
        return shipping + tarifaManejo + tarifaProductos + tarifasAdicionales;
    };

    // Check if order can be cancelled (only "por entregar" status)
    const isOrderCancellable = () => {
        const status = (order?.estado_display || order?.estado_venta)?.toLowerCase();
        return status === 'orden confirmada' || status === 'por entregar' || status === 'en proceso';
    };

    // State for cancel operation
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [cancelError, setCancelError] = useState(null);
    const [refundData, setRefundData] = useState(null);

    // Cancel form fields
    const [cancelFormData, setCancelFormData] = useState({
        motivo_solicitud: '',
        telefono_pago_movil: '',
        banco_pago_movil: '',
        cedula_tipo: 'V',
        cedula_numero: ''
    });

    // List of Venezuelan banks
    const bancosList = [
        'Banco de Venezuela',
        'Banesco',
        'Mercantil',
        'Provincial BBVA',
        'BOD',
        'Banco del Tesoro',
        'Banco Exterior',
        'Banco Plaza',
        'Banco Bicentenario',
        'Banco Nacional de Crédito',
        'Banco Fondo Común',
        'Bancaribe',
        '100% Banco',
        'Banco Activo',
        'Banco Caroní',
        'Bancrecer',
        'Bangente',
        'Banplus',
        'Sofitasa',
        'Del Sur',
        'Banco Agrícola de Venezuela'
    ];

    // Handle cancel order - show form modal
    const handleCancelOrder = () => {
        setCancelFormData({
            motivo_solicitud: '',
            telefono_pago_movil: '',
            banco_pago_movil: '',
            cedula_tipo: 'V',
            cedula_numero: ''
        });
        setShowCancelModal(true);
    };

    // Validate cancel form
    const validateCancelForm = () => {
        const { motivo_solicitud, telefono_pago_movil, banco_pago_movil, cedula_tipo, cedula_numero } = cancelFormData;

        if (motivo_solicitud.length < 10) {
            setCancelError('El motivo debe tener al menos 10 caracteres');
            return false;
        }
        if (motivo_solicitud.length > 500) {
            setCancelError('El motivo debe tener máximo 500 caracteres');
            return false;
        }
        const phoneDigits = telefono_pago_movil.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            setCancelError('Teléfono inválido (debe tener 10-11 dígitos)');
            return false;
        }
        if (!banco_pago_movil) {
            setCancelError('Selecciona un banco');
            return false;
        }
        const cedulaDigits = cedula_numero.replace(/\D/g, '');
        if (cedulaDigits.length < 7 || cedulaDigits.length > 9) {
            setCancelError('Cédula inválida (debe tener 7-9 dígitos)');
            return false;
        }
        return true;
    };

    // Confirm the cancel order action
    const confirmCancelOrder = async () => {
        setCancelError(null);

        if (!validateCancelForm()) {
            return;
        }

        setShowCancelModal(false);
        setCancellingOrder(true);

        try {
            const cancelData = {
                motivo_solicitud: cancelFormData.motivo_solicitud,
                telefono_pago_movil: cancelFormData.telefono_pago_movil.replace(/\D/g, ''),
                banco_pago_movil: cancelFormData.banco_pago_movil,
                cedula_titular_pago_movil: `${cancelFormData.cedula_tipo}${cancelFormData.cedula_numero.replace(/\D/g, '')}`
            };

            const response = await api.cancelOrder(orderId, cancelData);
            console.log('[Cancel Order] Response:', JSON.stringify(response, null, 2));

            if (response.success) {
                setCancellingOrder(false);
                setRefundData(response.data);
                setShowSuccessModal(true);
            } else {
                setCancellingOrder(false);
                // Extract error message from various possible response formats
                let errorMsg = 'No se pudo procesar la solicitud';
                if (response.error) {
                    if (typeof response.error === 'string') {
                        errorMsg = response.error;
                    } else if (response.error.message) {
                        errorMsg = response.error.message;
                    }
                }
                console.log('[Cancel Order] Error:', errorMsg);
                setCancelError(errorMsg);
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            setCancellingOrder(false);
            setCancelError('Ocurrió un error de conexión');
        }
    };

    // Handle success modal close
    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigation.goBack();
    };

    const nextPayableQuota = getNextPayableQuota();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Cargando detalle...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetail}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const manejoEnvio = calculateManejoEnvio();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orden #{order?.id_venta}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Order Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <StatusBadge status={order?.estado_display || order?.estado_venta} />
                    </View>
                    <View style={styles.statusDetails}>
                        {/* Subtotal (monto_articulos) */}
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Subtotal</Text>
                            <Text style={styles.statusValue}>${formatCurrency(order?.monto_articulos)}</Text>
                        </View>

                        {/* Tax */}
                        {order?.monto_tax > 0 && (
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Tax</Text>
                                <Text style={styles.statusValue}>${formatCurrency(order?.monto_tax)}</Text>
                            </View>
                        )}

                        {/* Manejo y Envío */}
                        {manejoEnvio > 0 && (
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Manejo y Envío</Text>
                                <Text style={styles.statusValue}>${formatCurrency(manejoEnvio)}</Text>
                            </View>
                        )}

                        {/* Descuento */}
                        {order?.monto_descuento > 0 && (
                            <View style={styles.statusRow}>
                                <Text style={[styles.statusLabel, { color: '#4CAF50' }]}>Descuento</Text>
                                <Text style={[styles.statusValue, { color: '#4CAF50' }]}>-${formatCurrency(order?.monto_descuento)}</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Total */}
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, styles.totalLabel]}>Total</Text>
                            <Text style={[styles.statusValue, styles.totalValue]}>${formatCurrency(order?.monto_total_venta)}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Section - Collapsible */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.collapsibleHeader}
                        onPress={() => setShowProducts(!showProducts)}
                    >
                        <Text style={styles.sectionTitle}>Productos ({items.length})</Text>
                        <Ionicons
                            name={showProducts ? "chevron-up" : "chevron-down"}
                            size={22}
                            color="#757575"
                        />
                    </TouchableOpacity>

                    {showProducts && items.map((item, index) => (
                        <View key={item.cod_articulo || index} style={styles.itemCard}>
                            <View style={styles.itemMainRow}>
                                <Image
                                    source={{ uri: item.imagen || 'https://via.placeholder.com/80' }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName} numberOfLines={2}>
                                        {item.descripcion}
                                    </Text>
                                    <View style={styles.itemPriceRow}>
                                        <Text style={styles.itemQuantity}>Cant: {item.cantidad}</Text>
                                        <Text style={styles.itemPrice}>${formatCurrency(item.subtotal)}</Text>
                                    </View>
                                </View>
                                {/* Tracking Icon Button */}
                                <TouchableOpacity
                                    style={styles.trackingIconButton}
                                    onPress={() => {
                                        setSelectedItemForTracking(item);
                                        setShowTrackingModal(true);
                                    }}
                                >
                                    <Ionicons name="navigate-circle" size={28} color="#FF007F" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Plan de Pagos Section - includes Pago Inicial and Quotas */}
                {(pagoInicial || quotas.length > 0) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Plan de Pagos</Text>

                        {/* Pago Inicial - shown in same style as quotas */}
                        {pagoInicial && (
                            <View style={styles.quotaCard}>
                                <View style={styles.quotaHeader}>
                                    <Text style={styles.quotaNumber}>Pago Inicial</Text>
                                    <QuotaStatusBadge status={
                                        ['aprobado', 'validado', 'pagada', 'pagado'].includes(pagoInicial.estatus?.toLowerCase()) ? 'Pagado' :
                                            pagoInicial.estatus?.toLowerCase() === 'pendiente' ? 'Pendiente' :
                                                pagoInicial.estatus?.toLowerCase() === 'validacion' ? 'En revisión' :
                                                    ['rechazado', 'pago rechazado'].includes(pagoInicial.estatus?.toLowerCase()) ? 'Rechazado' :
                                                        pagoInicial.estatus || 'Pendiente'
                                    } />
                                </View>
                                <View style={styles.quotaDetails}>
                                    <View style={styles.quotaRow}>
                                        <Text style={styles.quotaLabel}>Monto</Text>
                                        <Text style={styles.quotaValue}>${formatCurrency(pagoInicial.monto)}</Text>
                                    </View>
                                    {pagoInicial.monto_bs > 0 && (
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Monto Bs</Text>
                                            <Text style={styles.quotaValue}>Bs. {formatCurrency(pagoInicial.monto_bs)}</Text>
                                        </View>
                                    )}
                                    {pagoInicial.fecha_pago && (
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Fecha de pago</Text>
                                            <Text style={styles.quotaValue}>{formatDate(pagoInicial.fecha_pago)}</Text>
                                        </View>
                                    )}
                                    {pagoInicial.metodo_pago && (
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Método</Text>
                                            <Text style={styles.quotaValue}>{getPaymentMethodName(pagoInicial.metodo_pago)}</Text>
                                        </View>
                                    )}
                                    {pagoInicial.banco && (
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Banco</Text>
                                            <Text style={styles.quotaValue}>{getBankName(pagoInicial.banco)}</Text>
                                        </View>
                                    )}
                                    {pagoInicial.referencia && (
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Referencia</Text>
                                            <Text style={styles.quotaValue}>{pagoInicial.referencia}</Text>
                                        </View>
                                    )}
                                </View>
                                {pagoInicial.motivo_rechazo && (
                                    <View style={styles.rejectionBox}>
                                        <Ionicons name="warning" size={16} color="#F44336" />
                                        <Text style={styles.rejectionText}>{pagoInicial.motivo_rechazo}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Quotas */}
                        {quotas.map((quota, index) => {
                            const isNextPayable = nextPayableQuota?.id_cuota === quota.id_cuota;
                            const isPending = ['por pagar', 'pendiente', 'atrasada', 'mora_critica'].includes(quota.estatus?.toLowerCase());

                            return (
                                <View key={quota.id_cuota || index} style={[
                                    styles.quotaCard,
                                    isNextPayable && styles.quotaCardHighlight
                                ]}>
                                    <View style={styles.quotaHeader}>
                                        <Text style={styles.quotaNumber}>Cuota {quota.numero_cuota}</Text>
                                        <QuotaStatusBadge status={quota.estatus} />
                                    </View>
                                    <View style={styles.quotaDetails}>
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Monto</Text>
                                            <Text style={styles.quotaValue}>${formatCurrency(quota.monto)}</Text>
                                        </View>
                                        <View style={styles.quotaRow}>
                                            <Text style={styles.quotaLabel}>Fecha límite</Text>
                                            <Text style={styles.quotaValue}>{formatDate(quota.fecha_limite_pago)}</Text>
                                        </View>
                                        {(quota.pago?.fecha_pago || quota.fecha_efectiva_pago) && (
                                            <View style={styles.quotaRow}>
                                                <Text style={styles.quotaLabel}>Fecha de pago</Text>
                                                <Text style={styles.quotaValue}>{formatDate(quota.pago?.fecha_pago || quota.fecha_efectiva_pago)}</Text>
                                            </View>
                                        )}
                                        {quota.monto_intereses_mora > 0 && (
                                            <View style={styles.quotaRow}>
                                                <Text style={[styles.quotaLabel, { color: '#F44336' }]}>Intereses mora</Text>
                                                <Text style={[styles.quotaValue, { color: '#F44336' }]}>
                                                    ${formatCurrency(quota.monto_intereses_mora)}
                                                </Text>
                                            </View>
                                        )}
                                        {quota.saldo_pendiente > 0 && (
                                            <View style={styles.quotaRow}>
                                                <Text style={styles.quotaLabel}>Saldo pendiente</Text>
                                                <Text style={[styles.quotaValue, { color: '#E91E63', fontWeight: 'bold' }]}>
                                                    ${formatCurrency(quota.saldo_pendiente)}
                                                </Text>
                                            </View>
                                        )}
                                        {(quota.pago?.metodo_pago || quota.metodo_pago) && (
                                            <View style={styles.quotaRow}>
                                                <Text style={styles.quotaLabel}>Método</Text>
                                                <Text style={styles.quotaValue}>{getPaymentMethodName(quota.pago?.metodo_pago || quota.metodo_pago)}</Text>
                                            </View>
                                        )}
                                        {quota.pago?.banco && (
                                            <View style={styles.quotaRow}>
                                                <Text style={styles.quotaLabel}>Banco</Text>
                                                <Text style={styles.quotaValue}>{getBankName(quota.pago.banco)}</Text>
                                            </View>
                                        )}
                                        {(quota.pago?.referencia || quota.referencia) && (
                                            <View style={styles.quotaRow}>
                                                <Text style={styles.quotaLabel}>Referencia</Text>
                                                <Text style={[styles.quotaValue, { fontWeight: '600' }]}>{quota.pago?.referencia || quota.referencia}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Pay Button - Only show on the next payable quota */}
                                    {isNextPayable && isPending && (
                                        <TouchableOpacity
                                            style={styles.payQuotaButton}
                                            onPress={() => handlePayQuota(quota)}
                                        >
                                            <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                                            <Text style={styles.payQuotaButtonText}>Pagar Cuota</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}

                        {/* Cancel Order Button - Only show for cancellable orders */}
                        {isOrderCancellable() && (
                            <TouchableOpacity
                                style={styles.cancelOrderButton}
                                onPress={handleCancelOrder}
                                disabled={cancellingOrder}
                            >
                                {cancellingOrder ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                                        <Text style={styles.cancelOrderButtonText}>Solicitar Devolución</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Notes Section */}
                {order?.notas_cliente && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notas</Text>
                        <View style={styles.notesCard}>
                            <Text style={styles.notesText}>{order.notas_cliente}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Currency Selection Modal - Bottom Sheet */}
            <Modal
                visible={showCurrencyModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCurrencyModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCurrencyModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                        onPress={() => { }}
                    >
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowCurrencyModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#757575" />
                        </TouchableOpacity>

                        {/* Moneda de Pago Section */}
                        <Text style={styles.modalSectionTitle}>Moneda de Pago</Text>
                        <View style={styles.currencyTabs}>
                            <TouchableOpacity
                                style={[
                                    styles.currencyTab,
                                    styles.currencyTabLeft,
                                    modalCurrency === 'bs' && styles.currencyTabActive
                                ]}
                                onPress={() => setModalCurrency('bs')}
                            >
                                <Text style={[
                                    styles.currencyTabText,
                                    modalCurrency === 'bs' && styles.currencyTabTextActive
                                ]}>Bs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.currencyTab,
                                    styles.currencyTabRight,
                                    modalCurrency === 'usd' && styles.currencyTabActive
                                ]}
                                onPress={() => setModalCurrency('usd')}
                            >
                                <Text style={[
                                    styles.currencyTabText,
                                    modalCurrency === 'usd' && styles.currencyTabTextActive
                                ]}>Dólares</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Monto a pagar Section */}
                        <Text style={styles.modalSectionTitle}>Monto a pagar</Text>
                        <View style={styles.amountCard}>
                            <Text style={styles.amountLabel}>
                                {modalCurrency === 'bs' ? 'Monto en Bolívares' : 'Monto en Dólares'}
                            </Text>
                            {loadingAmount ? (
                                <ActivityIndicator size="small" color="#FF007F" />
                            ) : (
                                <Text style={styles.amountValue}>
                                    {modalCurrency === 'bs'
                                        ? `Bs. ${formatCurrency(modalAmountBs)}`
                                        : `$ ${formatCurrency(modalAmountUsd)}`
                                    }
                                </Text>
                            )}
                        </View>

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={styles.modalConfirmButton}
                            onPress={handleConfirmPayment}
                        >
                            <Text style={styles.modalConfirmText}>Continuar</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Tracking Modal */}
            <Modal
                visible={showTrackingModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTrackingModal(false)}
            >
                <TouchableOpacity
                    style={styles.trackingModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTrackingModal(false)}
                >
                    <View style={styles.trackingModalContainer} onStartShouldSetResponder={() => true}>
                        <View style={styles.trackingModalHeader}>
                            <Text style={styles.trackingModalTitle}>Estado del Producto</Text>
                            <TouchableOpacity onPress={() => setShowTrackingModal(false)}>
                                <Ionicons name="close" size={24} color="#757575" />
                            </TouchableOpacity>
                        </View>

                        {selectedItemForTracking && (
                            <>
                                <View style={styles.trackingModalProduct}>
                                    <Image
                                        source={{ uri: selectedItemForTracking.imagen || 'https://via.placeholder.com/60' }}
                                        style={styles.trackingModalImage}
                                    />
                                    <Text style={styles.trackingModalProductName} numberOfLines={2}>
                                        {selectedItemForTracking.descripcion}
                                    </Text>
                                </View>

                                <ProductTimeline
                                    estado={selectedItemForTracking.estado_compra || order?.estado}
                                    compact={false}
                                />
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Cancel Order Form Modal */}
            <Modal
                visible={showCancelModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCancelModal(false)}
            >
                <View style={styles.cancelFormModalOverlay}>
                    <View style={styles.cancelFormModalContainer}>
                        <View style={styles.cancelFormHeader}>
                            <Text style={styles.cancelFormTitle}>Solicitar Devolución</Text>
                            <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                                <Ionicons name="close" size={24} color="#757575" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.cancelFormScrollView} showsVerticalScrollIndicator={false}>
                            <Text style={styles.cancelFormSubtitle}>
                                Para procesar tu devolución, necesitamos tus datos de Pago Móvil donde recibirás el reembolso.
                            </Text>

                            {/* Error Message */}
                            {cancelError && (
                                <View style={styles.cancelFormError}>
                                    <Ionicons name="alert-circle" size={18} color="#F44336" />
                                    <Text style={styles.cancelFormErrorText}>{cancelError}</Text>
                                </View>
                            )}

                            {/* Motivo */}
                            <View style={styles.cancelFormGroup}>
                                <Text style={styles.cancelFormLabel}>Motivo de la solicitud *</Text>
                                <TextInput
                                    style={styles.cancelFormTextArea}
                                    placeholder="Describe el motivo de la devolución (mín. 10 caracteres)"
                                    placeholderTextColor="#9E9E9E"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={cancelFormData.motivo_solicitud}
                                    onChangeText={(text) => setCancelFormData({ ...cancelFormData, motivo_solicitud: text })}
                                    maxLength={500}
                                />
                                <Text style={styles.cancelFormCharCount}>{cancelFormData.motivo_solicitud.length}/500</Text>
                            </View>

                            {/* Teléfono */}
                            <View style={styles.cancelFormGroup}>
                                <Text style={styles.cancelFormLabel}>Teléfono Pago Móvil *</Text>
                                <TextInput
                                    style={styles.cancelFormInput}
                                    placeholder="04XX1234567"
                                    placeholderTextColor="#9E9E9E"
                                    keyboardType="phone-pad"
                                    value={cancelFormData.telefono_pago_movil}
                                    onChangeText={(text) => setCancelFormData({ ...cancelFormData, telefono_pago_movil: text })}
                                    maxLength={11}
                                />
                            </View>

                            {/* Banco Selector */}
                            <View style={styles.cancelFormGroup}>
                                <Text style={styles.cancelFormLabel}>Banco *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bancoScrollView}>
                                    {bancosList.map((banco) => (
                                        <TouchableOpacity
                                            key={banco}
                                            style={[
                                                styles.bancoChip,
                                                cancelFormData.banco_pago_movil === banco && styles.bancoChipSelected
                                            ]}
                                            onPress={() => setCancelFormData({ ...cancelFormData, banco_pago_movil: banco })}
                                        >
                                            <Text style={[
                                                styles.bancoChipText,
                                                cancelFormData.banco_pago_movil === banco && styles.bancoChipTextSelected
                                            ]}>{banco}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Cédula */}
                            <View style={styles.cancelFormGroup}>
                                <Text style={styles.cancelFormLabel}>Cédula del Titular *</Text>
                                <View style={styles.cedulaContainer}>
                                    <View style={styles.cedulaTipoContainer}>
                                        {['V', 'E', 'J'].map((tipo) => (
                                            <TouchableOpacity
                                                key={tipo}
                                                style={[
                                                    styles.cedulaTipoButton,
                                                    cancelFormData.cedula_tipo === tipo && styles.cedulaTipoButtonSelected
                                                ]}
                                                onPress={() => setCancelFormData({ ...cancelFormData, cedula_tipo: tipo })}
                                            >
                                                <Text style={[
                                                    styles.cedulaTipoText,
                                                    cancelFormData.cedula_tipo === tipo && styles.cedulaTipoTextSelected
                                                ]}>{tipo}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        style={styles.cedulaInput}
                                        placeholder="12345678"
                                        placeholderTextColor="#9E9E9E"
                                        keyboardType="number-pad"
                                        value={cancelFormData.cedula_numero}
                                        onChangeText={(text) => setCancelFormData({ ...cancelFormData, cedula_numero: text })}
                                        maxLength={9}
                                    />
                                </View>
                            </View>

                            {/* Warning Note */}
                            <View style={styles.warningBox}>
                                <Ionicons name="information-circle" size={20} color="#FF9800" />
                                <Text style={styles.warningText}>
                                    Se aplicarán penalidades del 35% (TDCM) + $4 por cada cuota atrasada (TACU). El monto final a devolver será calculado automáticamente.
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Buttons */}
                        <View style={styles.cancelFormButtons}>
                            <TouchableOpacity
                                style={styles.cancelFormButtonSecondary}
                                onPress={() => setShowCancelModal(false)}
                            >
                                <Text style={styles.cancelFormButtonSecondaryText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelFormButtonPrimary}
                                onPress={confirmCancelOrder}
                            >
                                <Text style={styles.cancelFormButtonPrimaryText}>Solicitar Devolución</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal with Refund Details */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleSuccessModalClose}
            >
                <View style={styles.cancelModalOverlay}>
                    <View style={[styles.cancelModalContainer, { maxWidth: 340 }]}>
                        <View style={[styles.cancelModalIconBg, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                        </View>
                        <Text style={styles.cancelModalTitle}>¡Solicitud Enviada!</Text>
                        <Text style={[styles.cancelModalMessage, { marginBottom: 12 }]}>
                            Tu solicitud de devolución ha sido registrada exitosamente.
                        </Text>

                        {refundData && (
                            <View style={styles.refundDetailsBox}>
                                <View style={styles.refundRow}>
                                    <Text style={styles.refundLabel}>Total abonado:</Text>
                                    <Text style={styles.refundValue}>${formatNumber(refundData.total_abonado)}</Text>
                                </View>
                                <View style={styles.refundRow}>
                                    <Text style={styles.refundLabel}>Penalidad TDCM (35%):</Text>
                                    <Text style={[styles.refundValue, { color: '#F44336' }]}>-${formatNumber(refundData.penalidad_tdcm)}</Text>
                                </View>
                                {refundData.penalidad_tacu > 0 && (
                                    <View style={styles.refundRow}>
                                        <Text style={styles.refundLabel}>Penalidad TACU ({refundData.cuotas_atrasadas} cuotas):</Text>
                                        <Text style={[styles.refundValue, { color: '#F44336' }]}>-${formatNumber(refundData.penalidad_tacu)}</Text>
                                    </View>
                                )}
                                <View style={styles.refundDivider} />
                                <View style={styles.refundRow}>
                                    <Text style={[styles.refundLabel, { fontWeight: 'bold', color: '#333' }]}>Monto a devolver:</Text>
                                    <Text style={[styles.refundValue, { fontWeight: 'bold', color: '#4CAF50' }]}>${formatNumber(refundData.monto_a_devolver)}</Text>
                                </View>
                                <View style={styles.refundRow}>
                                    <Text style={styles.refundLabel}>En Bolívares:</Text>
                                    <Text style={[styles.refundValue, { color: '#4CAF50' }]}>Bs. {formatNumber(refundData.monto_a_devolver_bs)}</Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.successModalButton}
                            onPress={handleSuccessModalClose}
                        >
                            <Text style={styles.cancelModalButtonPrimaryText}>Aceptar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal
                visible={!!cancelError}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCancelError(null)}
            >
                <View style={styles.cancelModalOverlay}>
                    <View style={styles.cancelModalContainer}>
                        <View style={[styles.cancelModalIconBg, { backgroundColor: '#FFEBEE' }]}>
                            <Ionicons name="close-circle" size={40} color="#F44336" />
                        </View>
                        <Text style={styles.cancelModalTitle}>Error</Text>
                        <Text style={styles.cancelModalMessage}>
                            {cancelError}
                        </Text>
                        <TouchableOpacity
                            style={styles.successModalButton}
                            onPress={() => setCancelError(null)}
                        >
                            <Text style={styles.cancelModalButtonPrimaryText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 34,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#757575',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        margin: 15,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    orderDate: {
        fontSize: 13,
        color: '#757575',
    },
    statusDetails: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 15,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusLabel: {
        fontSize: 14,
        color: '#757575',
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    totalLabel: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 16,
    },
    totalValue: {
        fontWeight: 'bold',
        color: '#E91E63',
        fontSize: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 10,
    },
    section: {
        marginHorizontal: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    itemMainRow: {
        flexDirection: 'row',
    },
    itemImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    itemProvider: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 6,
    },
    storeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    storeName: {
        fontSize: 12,
        color: '#FF007F',
        marginBottom: 6,
        fontWeight: '500',
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemQuantity: {
        fontSize: 13,
        color: '#757575',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#E91E63',
    },
    itemStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginBottom: 4,
    },
    itemStatusText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '500',
    },
    trackingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trackingText: {
        fontSize: 11,
        color: '#757575',
        marginLeft: 4,
    },
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentDate: {
        fontSize: 13,
        color: '#757575',
    },
    paymentDetails: {},
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#757575',
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    rejectionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    rejectionText: {
        fontSize: 13,
        color: '#F44336',
        marginLeft: 8,
        flex: 1,
    },
    quotaCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    quotaCardHighlight: {
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    quotaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    quotaNumber: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    quotaStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    quotaStatusText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    quotaDetails: {},
    quotaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    quotaLabel: {
        fontSize: 13,
        color: '#757575',
    },
    quotaValue: {
        fontSize: 13,
        color: '#333',
    },
    payQuotaButtonContainer: {
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    payQuotaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF007F',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    payQuotaButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelOrderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#9E9E9E',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 20,
    },
    cancelOrderButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cancelModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    cancelModalIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cancelModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    cancelModalMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    cancelModalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelModalButtonSecondary: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelModalButtonSecondaryText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelModalButtonPrimary: {
        flex: 1,
        backgroundColor: '#FF007F',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelModalButtonPrimaryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    successModalButton: {
        width: '100%',
        backgroundColor: '#FF007F',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Cancel Form Modal Styles
    cancelFormModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    cancelFormModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingTop: 20,
    },
    cancelFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    cancelFormTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    cancelFormScrollView: {
        paddingHorizontal: 20,
    },
    cancelFormSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    cancelFormError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    cancelFormErrorText: {
        color: '#F44336',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
    cancelFormGroup: {
        marginBottom: 20,
    },
    cancelFormLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    cancelFormInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    cancelFormTextArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        height: 100,
    },
    cancelFormCharCount: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    bancoScrollView: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    bancoChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    bancoChipSelected: {
        backgroundColor: '#FFF0F5',
        borderColor: '#FF007F',
    },
    bancoChipText: {
        fontSize: 13,
        color: '#6B7280',
    },
    bancoChipTextSelected: {
        color: '#FF007F',
        fontWeight: '600',
    },
    cedulaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cedulaTipoContainer: {
        flexDirection: 'row',
        marginRight: 10,
    },
    cedulaTipoButton: {
        width: 40,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cedulaTipoButtonSelected: {
        backgroundColor: '#FF007F',
        borderColor: '#FF007F',
    },
    cedulaTipoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    cedulaTipoTextSelected: {
        color: '#FFFFFF',
    },
    cedulaInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF8E1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    warningText: {
        fontSize: 12,
        color: '#F57C00',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    cancelFormButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cancelFormButtonSecondary: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelFormButtonSecondaryText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelFormButtonPrimary: {
        flex: 1,
        backgroundColor: '#FF007F',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelFormButtonPrimaryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // Refund Details Box
    refundDetailsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
        width: '100%',
        marginBottom: 20,
    },
    refundRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    refundLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    refundValue: {
        fontSize: 13,
        color: '#1F2937',
    },
    refundDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    notesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    notesText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    bottomSpacing: {
        height: 30,
    },
    // Modal styles - Bottom Sheet
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 40,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 10,
    },
    currencyTabs: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    currencyTab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencyTabLeft: {
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderWidth: 1,
        borderRightWidth: 0,
        borderColor: '#E0E0E0',
    },
    currencyTabRight: {
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    currencyTabActive: {
        borderColor: '#FF007F',
        borderWidth: 2,
        borderRightWidth: 2,
    },
    currencyTabText: {
        fontSize: 14,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    currencyTabTextActive: {
        color: '#FF007F',
        fontWeight: '600',
    },
    amountCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 20,
        alignItems: 'center',
        marginBottom: 25,
    },
    amountLabel: {
        fontSize: 13,
        color: '#9E9E9E',
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    modalConfirmButton: {
        paddingVertical: 16,
        backgroundColor: '#FF007F',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
        zIndex: 1,
    },
    trackingIconButton: {
        padding: 8,
        marginLeft: 8,
    },
    trackingModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    trackingModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    trackingModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    trackingModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    trackingModalProduct: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    trackingModalImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    trackingModalProductName: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});

export default OrderDetailScreen;
