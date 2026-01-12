import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Linking,
    Platform,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import CustomAlert from '../components/CustomAlert';
import UserDataModal from '../components/UserDataModal';
import { formatNumber } from '../utils/formatNumber';
import { api } from '../services/api';

const CartScreen = ({ navigation }) => {
    const { cartItems, removeFromCart, updateQuantity, subtotal, clearCart, fetchCart, refreshCartTotals } = useCart();
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

    // User Data Modal State
    const [showUserDataModal, setShowUserDataModal] = useState(false);
    const [missingFields, setMissingFields] = useState([]);
    const [existingUserData, setExistingUserData] = useState({});

    const handleContinueToCheckout = async () => {
        if (cartItems.length === 0) {
            setAlertConfig({
                title: "Carrito Vacío",
                message: "Debes agregar productos al carrito antes de continuar con el proceso de compra.",
                type: 'sad',
                buttons: [
                    { text: "Entendido", style: "default", onPress: () => setAlertVisible(false) }
                ]
            });
            setAlertVisible(true);
            return;
        }

        setIsLoadingCheckout(true);
        try {
            // First, check if user data is complete
            const checkResponse = await api.checkUserData();

            if (checkResponse.success && checkResponse.data) {
                if (!checkResponse.data.is_complete) {
                    // User data is incomplete - show the modal
                    setMissingFields(checkResponse.data.missing_fields || []);
                    setExistingUserData(checkResponse.data.user_data || {});
                    setShowUserDataModal(true);
                    setIsLoadingCheckout(false);
                    return;
                }
            }

            // User data is complete - proceed to checkout
            await refreshCartTotals();
            navigation.navigate('Checkout');
        } catch (error) {
            console.error('Error checking user data:', error);
            // Navigate anyway even if check fails
            await refreshCartTotals();
            navigation.navigate('Checkout');
        } finally {
            setIsLoadingCheckout(false);
        }
    };

    const handleUserDataComplete = async () => {
        setShowUserDataModal(false);
        setIsLoadingCheckout(true);
        try {
            await refreshCartTotals();
            navigation.navigate('Checkout');
        } catch (error) {
            console.error('Error after user data complete:', error);
            navigation.navigate('Checkout');
        } finally {
            setIsLoadingCheckout(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const handleClearCart = () => {
        setAlertConfig({
            title: "Vaciar Carrito",
            message: "¿Estás Segur@ de que quieres eliminar todos los productos?",
            type: 'danger', // Uses trash icon
            buttons: [
                { text: "Cancelar", style: "cancel", onPress: () => setAlertVisible(false) },
                { text: "Vaciar", style: "default", onPress: () => { clearCart(); setAlertVisible(false); } } // Uses Pink button
            ]
        });
        setAlertVisible(true);
    };

    const openProductLink = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.cartItem}>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeFromCart(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>

            <Image
                source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                style={styles.itemImage}
            />

            <View style={styles.itemDetails}>
                <Text style={styles.providerText}>
                    {item.provider || 'Unknown Store'}
                </Text>

                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={styles.detailsContainer}>
                    {item.size ? <Text style={styles.detailText}>Talla: {item.size}</Text> : null}
                    {item.color ? <Text style={styles.detailText}>Color: {item.color}</Text> : null}
                    {item.sku && item.sku !== 'N/A' ? <Text style={styles.detailText}>Código: {item.sku}</Text> : null}
                </View>

                <Text style={styles.itemPrice}>${formatNumber(item.price)}</Text>

                <View style={styles.actionsContainer}>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                            <Text style={styles.qtyButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                            <Text style={styles.qtyButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>


                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Carrito</Text>
                {cartItems.length > 0 ? (
                    <TouchableOpacity onPress={handleClearCart}>
                        <Ionicons name="trash-bin-outline" size={24} color="#FF007F" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id ? item.id.toString() : `item-${index}`}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Tu carrito está vacío.</Text>
                }
            />

            <View style={styles.footer}>
                {/* <Text style={styles.sectionTitle}>Resumen del Pedido</Text> */}

                <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Subtotal</Text>
                    <Text style={styles.costValue}>${formatNumber(subtotal)}</Text>
                </View>

                {/* Estimated Delivery Date */}
                {cartItems.length > 0 && (
                    <View style={styles.deliveryEstimateContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.deliveryEstimateText}>
                            Entrega estimada: {(() => {
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
                )}

                <View style={styles.divider} />

                <TouchableOpacity
                    style={[styles.placeOrderButton, isLoadingCheckout && styles.disabledButton]}
                    onPress={handleContinueToCheckout}
                    disabled={isLoadingCheckout}
                >
                    {isLoadingCheckout ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.placeOrderText}>Continuar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* User Data Modal */}
            <UserDataModal
                visible={showUserDataModal}
                onClose={() => setShowUserDataModal(false)}
                onComplete={handleUserDataComplete}
                missingFields={missingFields}
                existingData={existingUserData}
            />

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
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
        color: '#333',
    },
    listContent: {
        padding: 20,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        alignItems: 'center',
    },
    deleteButton: {
        padding: 5,
        marginRight: 10,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 5,
        marginRight: 15,
    },
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    detailsContainer: {
        marginTop: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    itemOptions: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        alignSelf: 'flex-end',
    },
    qtyButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    qtyButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    qtyText: {
        paddingHorizontal: 10,
        color: '#333',
    },
    providerText: {
        fontSize: 12,
        color: '#FF007F',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    skuText: {
        fontSize: 10,
        color: '#999',
        marginBottom: 5,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    linkButtonText: {
        color: '#FF007F',
        fontSize: 12,
        textDecorationLine: 'underline',
        marginRight: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    shippingTabs: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#FF007F', // Fucsia
    },
    tabText: {
        color: '#999',
    },
    activeTabText: {
        color: '#FF007F', // Fucsia
        fontWeight: 'bold',
    },
    locationButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    placeOrderButton: {
        backgroundColor: '#FF007F', // Fucsia
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    placeOrderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
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
        marginTop: 10,
        marginBottom: 15,
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
    deliveryEstimateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    deliveryEstimateText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
    },
});

export default CartScreen;
