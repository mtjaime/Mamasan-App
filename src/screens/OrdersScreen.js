import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OrdersScreen = () => {
    // Datos simulados de la orden con estructura financiera
    const orderDetails = {
        id: "MS-8823",
        product: "Zapatos Nike Air Force 1",
        store: "Amazon",
        totalPrice: 120.00,
        paidAmount: 68.00, // Inicial + 1 cuota
        remainingAmount: 52.00,
        status: "in_transit", // pending, processing, in_transit, delivered
        installments: [
            { id: 1, name: "Pago Inicial", amount: 48.00, dueDate: "25 Nov", status: "paid" },
            { id: 2, name: "Cuota 1", amount: 20.00, dueDate: "10 Dic", status: "paid" },
            { id: 3, name: "Cuota 2", amount: 18.00, dueDate: "25 Dic", status: "pending" }, // Próxima
            { id: 4, name: "Cuota 3", amount: 18.00, dueDate: "10 Ene", status: "locked" },
            { id: 5, name: "Cuota 4", amount: 16.00, dueDate: "25 Ene", status: "locked" },
        ],
        trackingSteps: [
            { title: 'Pago Inicial', date: '25 Nov', completed: true },
            { title: 'Comprado', date: '26 Nov', completed: true },
            { title: 'Miami', date: '28 Nov', completed: true },
            { title: 'En tránsito', date: 'Est: 05 Dic', completed: false, current: true },
            { title: 'Entregado', date: '---', completed: false },
        ]
    };

    const [expandedOrder, setExpandedOrder] = useState(true);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedOrder(!expandedOrder);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Mis Pedidos 📦</Text>
                    <Text style={styles.pageSubtitle}>Rastrea tus compras y pagos</Text>
                </View>

                {/* Tarjeta de Orden Detallada */}
                <View style={styles.card}>
                    {/* Cabecera de la Orden */}
                    <TouchableOpacity
                        style={[styles.cardHeader, expandedOrder && styles.cardHeaderBorder]}
                        onPress={toggleExpand}
                        activeOpacity={0.7}
                    >
                        <View style={styles.headerLeft}>
                            <View style={styles.iconBox}>
                                <Text style={{ fontSize: 24 }}>👟</Text>
                            </View>
                            <View>
                                <Text style={styles.orderId}>Orden #{orderDetails.id}</Text>
                                <Text style={styles.orderDetailText}>{orderDetails.store} • {orderDetails.product}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>En Tránsito</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.remainingLabel}>Restante</Text>
                            <Text style={styles.remainingAmount}>${orderDetails.remainingAmount.toFixed(2)}</Text>
                            <Feather
                                name="chevron-down"
                                size={16}
                                color="#9CA3AF"
                                style={[styles.chevron, expandedOrder && styles.chevronRotated]}
                            />
                        </View>
                    </TouchableOpacity>

                    {expandedOrder && (
                        <View style={styles.expandedContent}>

                            {/* 1. SECCIÓN DE TRACKING (Línea de tiempo horizontal compacta) */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>RASTREO DE ENVÍO</Text>
                                <View style={styles.timelineContainer}>
                                    {/* Línea conectora de fondo */}
                                    <View style={styles.timelineLine} />

                                    {orderDetails.trackingSteps.map((step, idx) => (
                                        <View key={idx} style={styles.timelineStep}>
                                            <View style={[
                                                styles.timelineDot,
                                                step.completed ? styles.dotCompleted :
                                                    step.current ? styles.dotCurrent : styles.dotPending
                                            ]}>
                                                {step.completed && <View style={styles.dotInnerCompleted} />}
                                                {step.current && <View style={styles.dotInnerCurrent} />}
                                            </View>
                                            <Text style={[
                                                styles.stepTitle,
                                                step.current ? styles.textCurrent : styles.textGray
                                            ]}>
                                                {step.title}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.infoBox}>
                                    <Feather name="clock" size={14} color="#3B82F6" style={{ marginTop: 2 }} />
                                    <Text style={styles.infoBoxText}>
                                        Tu paquete llegó a Miami el 28 Nov. Próxima actualización estimada: 05 Dic (Aduana Vzla).
                                    </Text>
                                </View>
                            </View>

                            {/* 2. SECCIÓN FINANCIERA (Cuotas) */}
                            <View style={styles.financeCard}>
                                <View style={styles.financeHeader}>
                                    <Text style={styles.financeTitle}>PLAN DE PAGOS</Text>
                                    <Text style={styles.financeSubtitle}>
                                        Pagado: <Text style={styles.textGreen}>${orderDetails.paidAmount}</Text> / ${orderDetails.totalPrice}
                                    </Text>
                                </View>

                                <View style={styles.installmentsList}>
                                    {orderDetails.installments.map((inst) => (
                                        <View key={inst.id} style={styles.installmentRow}>
                                            <View style={styles.installmentLeft}>
                                                {/* Icono de Estado de Cuota */}
                                                {inst.status === 'paid' ? (
                                                    <Feather name="check-circle" size={16} color="#22C55E" />
                                                ) : inst.status === 'pending' ? (
                                                    <View style={styles.pendingCircle}>
                                                        <View style={styles.pendingDot} />
                                                    </View>
                                                ) : (
                                                    <View style={styles.lockedCircle} />
                                                )}

                                                <View style={{ marginLeft: 12 }}>
                                                    <Text style={[
                                                        styles.installmentName,
                                                        inst.status === 'paid' && styles.textStrikethrough
                                                    ]}>
                                                        {inst.name}
                                                    </Text>
                                                    <Text style={styles.installmentDate}>{inst.dueDate}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.installmentRight}>
                                                <Text style={[
                                                    styles.installmentAmount,
                                                    inst.status === 'paid' ? styles.textGray : styles.textDark
                                                ]}>
                                                    ${inst.amount.toFixed(2)}
                                                </Text>
                                                {inst.status === 'pending' && (
                                                    <View style={styles.payBadge}>
                                                        <Text style={styles.payBadgeText}>Pagar</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Botón de Pagar Cuota Pendiente */}
                                <TouchableOpacity style={styles.payButton}>
                                    <Text style={styles.payButtonText}>Pagar Cuota Pendiente ($18.00)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                {/* Orden Antigua (Ejemplo colapsado) */}
                <TouchableOpacity style={[styles.card, styles.pastOrderCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconBox}>
                                <Text style={{ fontSize: 20 }}>👕</Text>
                            </View>
                            <View>
                                <Text style={styles.orderId}>Orden #MS-1029</Text>
                                <View style={styles.deliveredBadge}>
                                    <Text style={styles.deliveredText}>Entregado</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.pastOrderDate}>Hace 2 meses</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // gray-50
    },
    scrollContent: {
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    header: {
        paddingTop: 24,
        paddingBottom: 16,
        paddingHorizontal: 8,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7B1FA2',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#6B7280', // gray-500
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
    },
    cardHeaderBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerLeft: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#F3F4F6', // gray-100
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937', // gray-800
    },
    orderDetailText: {
        fontSize: 12,
        color: '#6B7280', // gray-500
        marginBottom: 4,
    },
    statusBadge: {
        backgroundColor: '#DBEAFE', // blue-100
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        color: '#1D4ED8', // blue-700
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    remainingLabel: {
        fontSize: 12,
        color: '#9CA3AF', // gray-400
    },
    remainingAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    chevron: {
        marginTop: 4,
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }],
    },
    expandedContent: {
        padding: 16,
        gap: 24,
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF', // gray-400
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    timelineContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    timelineLine: {
        position: 'absolute',
        top: 7, // Center of 16px dot
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: '#E5E7EB', // gray-200
        zIndex: -1,
    },
    timelineStep: {
        alignItems: 'center',
        width: '20%',
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: 4,
    },
    dotCompleted: {
        borderColor: '#22C55E', // green-500
    },
    dotCurrent: {
        borderColor: '#FF007F',
    },
    dotPending: {
        borderColor: '#D1D5DB', // gray-300
    },
    dotInnerCompleted: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
    },
    dotInnerCurrent: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF007F',
    },
    stepTitle: {
        fontSize: 9,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 12,
    },
    textCurrent: {
        color: '#FF007F',
    },
    textGray: {
        color: '#9CA3AF',
    },
    infoBox: {
        backgroundColor: '#EFF6FF', // blue-50
        padding: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    infoBoxText: {
        fontSize: 10,
        color: '#1D4ED8', // blue-700
        flex: 1,
    },
    financeCard: {
        backgroundColor: '#F9FAFB', // gray-50
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    financeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    financeTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151', // gray-700
        textTransform: 'uppercase',
    },
    financeSubtitle: {
        fontSize: 10,
        color: '#6B7280', // gray-500
    },
    textGreen: {
        color: '#16A34A', // green-600
        fontWeight: 'bold',
    },
    installmentsList: {
        gap: 12,
    },
    installmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    installmentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pendingCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FF007F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF007F',
    },
    lockedCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB', // gray-300
    },
    installmentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151', // gray-700
    },
    textStrikethrough: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    installmentDate: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    installmentRight: {
        alignItems: 'flex-end',
    },
    installmentAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    textDark: {
        color: '#1F2937',
    },
    payBadge: {
        backgroundColor: '#FCE7F3', // pink-50
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    payBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    payButton: {
        backgroundColor: '#7B1FA2',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    payButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pastOrderCard: {
        opacity: 0.6,
    },
    deliveredBadge: {
        backgroundColor: '#DCFCE7', // green-100
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    deliveredText: {
        color: '#15803D', // green-700
        fontSize: 10,
        fontWeight: 'bold',
    },
    pastOrderDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
});

export default OrdersScreen;
