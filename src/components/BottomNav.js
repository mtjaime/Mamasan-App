import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const BottomNav = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    const currentRoute = state.routes[state.index];
    const activeRouteName = currentRoute.name;

    const navigateTo = (routeName) => {
        if (routeName === 'Profile') {
            navigation.navigate('Profile');
        } else {
            const event = navigation.emit({
                type: 'tabPress',
                target: state.routes.find(r => r.name === routeName)?.key,
                canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
                navigation.navigate(routeName);
            }
        }
    };

    const isActive = (routeName) => activeRouteName === routeName;

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {/* Botón Inicio */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigateTo('Home')}
            >
                <Feather
                    name="home"
                    size={24}
                    color={isActive('Home') ? '#FF007F' : '#9CA3AF'}
                />
                <Text style={[styles.tabText, isActive('Home') && styles.activeText]}>Inicio</Text>
            </TouchableOpacity>

            {/* Botón Tiendas */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigateTo('Shop')}
            >
                <Ionicons
                    name="storefront-outline"
                    size={24}
                    color={isActive('Shop') ? '#FF007F' : '#9CA3AF'}
                />
                <Text style={[styles.tabText, isActive('Shop') && styles.activeText]}>Tiendas</Text>
            </TouchableOpacity>

            {/* Botón Central Flotante (Carrito) */}
            <View style={styles.floatingContainer}>
                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => navigateTo('Cart')}
                    activeOpacity={0.9}
                >
                    <Feather name="shopping-cart" size={28} color="white" />
                </TouchableOpacity>
            </View>

            {/* Botón Pedidos */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigateTo('Orders')}
            >
                <Feather
                    name="package"
                    size={24}
                    color={isActive('Orders') ? '#FF007F' : '#9CA3AF'}
                />
                <Text style={[styles.tabText, isActive('Orders') && styles.activeText]}>Pedidos</Text>
            </TouchableOpacity>

            {/* Botón Perfil */}
            <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigateTo('Profile')}
            >
                <Feather
                    name="user"
                    size={24}
                    color={activeRouteName === 'Profile' ? '#FF007F' : '#9CA3AF'}
                />
                <Text style={[styles.tabText, activeRouteName === 'Profile' && styles.activeText]}>Perfil</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6', // gray-100
        paddingHorizontal: 20,
        paddingTop: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 5,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#9CA3AF', // gray-400
    },
    activeText: {
        color: '#FF007F',
    },
    floatingContainer: {
        position: 'relative',
        top: -25,
        alignItems: 'center',
    },
    floatingButton: {
        backgroundColor: '#7B1FA2',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7B1FA2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 4,
        borderColor: 'white',
    },
});

export default BottomNav;
