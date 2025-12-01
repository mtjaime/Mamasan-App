import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

const CheckoutScreen = ({ navigation }) => {
    const { cartItems, subtotal, tax, shipping, total } = useCart();
    const [shippingMethod, setShippingMethod] = useState('pickup'); // 'pickup' or 'delivery'

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) {
            Alert.alert('Error', 'Cart is empty');
            return;
        }
        // TODO: Integrate with Supabase to create order
        Alert.alert('Order Placed!', `Total: $${total.toFixed(2)}\nMethod: ${shippingMethod}`);
        navigation.navigate('Main', { screen: 'Orders' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Resumen del Pedido</Text>

                <View style={styles.summaryCard}>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Subtotal ({cartItems.length} items)</Text>
                        <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Impuestos (7%)</Text>
                        <Text style={styles.costValue}>${tax.toFixed(2)}</Text>
                    </View>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Manejo y Envío</Text>
                        <Text style={styles.costValue}>${shipping.toFixed(2)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={[styles.costRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Método de Entrega</Text>
                <View style={styles.shippingTabs}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            shippingMethod === 'pickup' && styles.activeTab,
                        ]}
                        onPress={() => setShippingMethod('pickup')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                shippingMethod === 'pickup' && styles.activeTabText,
                            ]}
                        >
                            Retiro
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            shippingMethod === 'delivery' && styles.activeTab,
                        ]}
                        onPress={() => setShippingMethod('delivery')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                shippingMethod === 'delivery' && styles.activeTabText,
                            ]}
                        >
                            Delivery
                        </Text>
                    </TouchableOpacity>
                </View>

                {shippingMethod === 'pickup' ? (
                    <View style={styles.methodDetails}>
                        <Text style={styles.methodTitle}>Punto de Retiro</Text>
                        <TouchableOpacity style={styles.locationButton}>
                            <Ionicons name="location-outline" size={20} color="#333" />
                            <Text style={styles.locationText}>Seleccionar ubicación...</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.methodDetails}>
                        <Text style={styles.methodTitle}>Dirección de Envío</Text>
                        <TouchableOpacity style={styles.locationButton}>
                            <Ionicons name="home-outline" size={20} color="#333" />
                            <Text style={styles.locationText}>Agregar dirección...</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
                    <Text style={styles.placeOrderText}>Realizar Pedido</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
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
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    totalRow: {
        marginTop: 5,
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    shippingTabs: {
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
    },
    methodTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    locationText: {
        flex: 1,
        marginLeft: 10,
        color: '#666',
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
});

export default CheckoutScreen;
