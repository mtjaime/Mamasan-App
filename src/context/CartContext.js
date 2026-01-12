import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const { user } = useAuth();

    // API Cart Summary State
    const [cartSummary, setCartSummary] = useState({
        subtotal: 0,
        tax: 0,
        handling: 0,
        shipping: 0,
        productFees: 0,
        additionalFees: 0,
        discount: 0,
        total: 0,
        shippingType: 'aereo',
        addressId: null,
        saleId: null
    });

    const addToCart = (item) => {
        setCartItems((prevItems) => {
            // Check if item already exists
            const existingItem = prevItems.find((i) => i.id === item.id);
            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prevItems, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = async (id) => {
        try {
            // Optimistic update
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
            await api.removeFromMobileCart(id);
        } catch (error) {
            console.error('Error removing item:', error);
            fetchCart(); // Revert on error
        }
    };

    const updateQuantity = async (id, quantity) => {
        if (quantity < 1) return;
        try {
            // Optimistic update for immediate UI feedback
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === id ? { ...item, quantity: quantity } : item
                )
            );

            // Call API to update quantity on server
            console.log(`[CartContext] Updating quantity: id=${id}, quantity=${quantity}`);
            const response = await api.updateMobileCartQuantity(id, quantity);
            console.log(`[CartContext] Update response:`, response);

            if (!response.success) {
                console.error('[CartContext] API update failed, reverting...');
                fetchCart(); // Revert on error
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            fetchCart(); // Revert on error
        }
    };

    const clearCart = async () => {
        try {
            await api.clearCart();
            setCartItems([]);
            setCartSummary({
                subtotal: 0,
                tax: 0,
                handling: 0,
                shipping: 0,
                productFees: 0,
                additionalFees: 0,
                discount: 0,
                total: 0,
                shippingType: 'aereo',
                addressId: null,
                saleId: null
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    const mergeCart = (newItems) => {
        setCartItems((prevItems) => {
            const updatedItems = [...prevItems];

            newItems.forEach(newItem => {
                // Enforce types
                const itemPrice = parseFloat(newItem.price) || 0;
                const itemQuantity = parseInt(newItem.quantity, 10) || 1;

                // Try to find existing item by ID or Title+Price
                const existingIndex = updatedItems.findIndex(
                    item => item.id === newItem.id || ((item.title || '').trim() === (newItem.title || '').trim() && item.price === itemPrice)
                );

                if (existingIndex >= 0) {
                    // Update quantity
                    updatedItems[existingIndex] = {
                        ...updatedItems[existingIndex],
                        quantity: (parseInt(updatedItems[existingIndex].quantity, 10) || 0) + itemQuantity
                    };
                } else {
                    // Add new item with sanitized types
                    updatedItems.push({
                        ...newItem,
                        price: itemPrice,
                        quantity: itemQuantity
                    });
                }
            });

            return updatedItems;
        });
    };

    // Local subtotal calculation for display in CartScreen
    const localSubtotal = cartItems.reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0),
        0
    );

    // Always use local calculation for subtotal to reflect quantity changes immediately
    // API values are used for other fields (tax, shipping, etc.) which are calculated server-side
    const subtotal = localSubtotal;
    const tax = cartSummary.tax;
    const handling = cartSummary.handling;
    const shipping = cartSummary.shipping;
    const productFees = cartSummary.productFees;
    const additionalFees = cartSummary.additionalFees;
    const discount = cartSummary.discount;
    const total = cartSummary.total || subtotal;

    const fetchCart = async () => {
        try {
            console.log('CartContext: Fetching cart...');
            const response = await api.getCart();
            console.log('CartContext: Fetch response:', JSON.stringify(response, null, 2));

            if (response.success && response.data) {
                // Extract cart summary from API response
                const cartData = response.data.cart;
                if (cartData) {
                    setCartSummary({
                        subtotal: parseFloat(cartData.monto_articulos) || 0,
                        tax: parseFloat(cartData.monto_tax) || 0,
                        handling: parseFloat(cartData.monto_tarifa_manejo) || 0,
                        shipping: parseFloat(cartData.monto_shipping) || 0,
                        productFees: parseFloat(cartData.monto_tarifa_productos) || 0,
                        additionalFees: parseFloat(cartData.monto_tarifas_adicionales) || 0,
                        discount: parseFloat(cartData.monto_descuento) || 0,
                        total: parseFloat(cartData.monto_total_venta) || 0,
                        shippingType: cartData.tipo_shipping || 'aereo',
                        addressId: cartData.direccion_envio,
                        saleId: cartData.id_venta
                    });
                }

                const items = Array.isArray(response.data) ? response.data : (response.data.items || []);

                const sanitizedItems = items.map((newItem, index) => ({
                    ...newItem,
                    id: newItem.cod_articulo || newItem.id || `temp-${index}-${Date.now()}`,
                    title: newItem.descripcion || newItem.title || 'Unknown Item',
                    price: parseFloat(newItem.precio_venta || newItem.price) || 0,
                    image: newItem.imagen || newItem.image,
                    quantity: parseInt(newItem.cantidad || newItem.quantity, 10) || 1,
                    provider: newItem.tipo_producto || newItem.provider || 'Unknown Store',
                    sku: newItem.id_articulo || newItem.sku || 'N/A',
                    url: newItem.product_url || newItem.url,
                    // Add color, size, and talla mappings
                    color: newItem.color || '',
                    size: newItem.talla || newItem.size || '',
                    talla: newItem.talla || newItem.size || ''
                }));

                console.log('CartContext: Setting cart items:', sanitizedItems.length);
                setCartItems(sanitizedItems);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    // Function to refresh cart totals before checkout
    const refreshCartTotals = async () => {
        try {
            console.log('CartContext: Refreshing cart totals...');
            const response = await api.getCart();

            if (response.success && response.data && response.data.cart) {
                const cartData = response.data.cart;
                const newSummary = {
                    subtotal: parseFloat(cartData.monto_articulos) || 0,
                    tax: parseFloat(cartData.monto_tax) || 0,
                    handling: parseFloat(cartData.monto_tarifa_manejo) || 0,
                    shipping: parseFloat(cartData.monto_shipping) || 0,
                    productFees: parseFloat(cartData.monto_tarifa_productos) || 0,
                    additionalFees: parseFloat(cartData.monto_tarifas_adicionales) || 0,
                    discount: parseFloat(cartData.monto_descuento) || 0,
                    total: parseFloat(cartData.monto_total_venta) || 0,
                    shippingType: cartData.tipo_shipping || 'aereo',
                    addressId: cartData.direccion_envio,
                    saleId: cartData.id_venta
                };
                setCartSummary(newSummary);
                // Return the fresh saleId and total directly from API response
                return {
                    success: true,
                    saleId: cartData.id_venta,
                    total: parseFloat(cartData.monto_total_venta) || 0
                };
            }
            return { success: false, error: 'No cart data available' };
        } catch (error) {
            console.error('Error refreshing cart totals:', error);
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setCartItems([]); // Optional: clear cart on logout
            setCartSummary({
                subtotal: 0,
                tax: 0,
                handling: 0,
                shipping: 0,
                productFees: 0,
                additionalFees: 0,
                discount: 0,
                total: 0,
                shippingType: 'aereo',
                addressId: null,
                saleId: null
            });
        }
    }, [user]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                mergeCart,
                fetchCart,
                refreshCartTotals,
                subtotal,
                tax,
                handling,
                shipping,
                productFees,
                additionalFees,
                discount,
                total,
                saleId: cartSummary.saleId,
                cartSummary,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
