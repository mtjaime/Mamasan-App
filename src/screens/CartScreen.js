import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
    const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart();

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
                    {item.provider || 'Unknown Store'} {item.sku && item.sku !== 'N/A' ? `• SKU: ${item.sku}` : ''}
                </Text>

                <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                {item.options ? (
                    <Text style={styles.itemOptions}>
                        {item.options}
                    </Text>
                ) : null}

                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>

                <View style={styles.actionsContainer}>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                            <Text>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                            <Text>+</Text>
                        </TouchableOpacity>
                    </View>

                    {item.url && (
                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => openProductLink(item.url)}
                        >
                            <Text style={styles.linkButtonText}>Ver Artículo</Text>
                            <Ionicons name="open-outline" size={14} color="#FF007F" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cart</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Your cart is empty.</Text>
                }
            />

            <View style={styles.footer}>
                <Text style={styles.sectionTitle}>Resumen del Pedido</Text>

                <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Subtotal</Text>
                    <Text style={styles.costValue}>${subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.placeOrderButton}
                    onPress={() => navigation.navigate('Checkout')}
                >
                    <Text style={styles.placeOrderText}>Proceder al Pago</Text>
                </TouchableOpacity>
            </View>
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
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
    qtyText: {
        paddingHorizontal: 10,
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
});

export default CartScreen;
