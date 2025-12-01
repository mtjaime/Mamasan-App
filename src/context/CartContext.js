import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

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

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const updateQuantity = (id, quantity) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const mergeCart = (newItems) => {
        // Logic to merge items from WebView (e.g. Amazon)
        // This is a simple merge, could be more complex based on requirements
        setCartItems((prevItems) => [...prevItems, ...newItems]);
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // Constants for calculation (can be moved to config later)
    const TAX_RATE = 0.07; // 7%
    const SHIPPING_BASE = 10; // $10 base
    const SHIPPING_PER_ITEM = 2; // $2 per item

    const tax = subtotal * TAX_RATE;
    const shipping = cartItems.length > 0 ? SHIPPING_BASE + (cartItems.reduce((acc, item) => acc + item.quantity, 0) * SHIPPING_PER_ITEM) : 0;

    const total = subtotal + tax + shipping;

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                mergeCart,
                subtotal,
                tax,
                shipping,
                total,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
