import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ScrollView,
    Platform,
    StatusBar,
    Modal,
    TextInput,
    ActivityIndicator,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { formatNumber } from '../utils/formatNumber';
import { ZOOM_OFFICES, searchOffices } from '../data/zoomOffices';
import { useFocusEffect } from '@react-navigation/native';

const CheckoutScreen = ({ navigation }) => {
    const { cartItems, subtotal, tax, shipping, handling, productFees, additionalFees, discount, total, saleId, refreshCartTotals } = useCart();

    // Calculate "Manejo y Envío" as sum of all shipping-related fees
    const handlingAndShipping = shipping + handling + productFees + additionalFees;

    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState('installments'); // 'installments' or 'cash'

    // Address State
    const [deliveryOption, setDeliveryOption] = useState('address'); // 'address' or 'zoom'
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [showAddressSelectionModal, setShowAddressSelectionModal] = useState(false);

    // Location Data State
    const [states, setStates] = useState([]);
    const [citiesByState, setCitiesByState] = useState({});
    const [availableCities, setAvailableCities] = useState([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // Selection Modals State
    const [showStateModal, setShowStateModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showPhonePrefixModal, setShowPhonePrefixModal] = useState(false);

    // Zoom Office State
    const [zoomOffices, setZoomOffices] = useState([]);
    const [selectedZoomOffice, setSelectedZoomOffice] = useState(null);
    const [isLoadingZoomOffices, setIsLoadingZoomOffices] = useState(false);
    const [showZoomOfficeModal, setShowZoomOfficeModal] = useState(false);

    // Phone Input State
    const [phonePrefix, setPhonePrefix] = useState('412');
    const [phoneDigits, setPhoneDigits] = useState('');

    // New Address Form State
    const [newAddress, setNewAddress] = useState({
        nombre_direccion: '',
        calle_avenida: '',
        numero_nombre_edificio: '',
        numero_apartamento: '',
        ciudad: '',
        estado: '',
        referencias: '',
        es_predeterminada: false
    });

    // Refresh data when screen is focused (including after coming back from UserDataModal)
    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
            fetchCities();
            // Load Zoom offices from local data
            setZoomOffices(ZOOM_OFFICES);
        }, [])
    );

    const openZoomOfficeSearch = () => {
        Linking.openURL('https://zoom.red/consulta-de-oficinas-personas/');
    };

    // State for office search
    const [officeSearchQuery, setOfficeSearchQuery] = useState('');
    const filteredZoomOffices = officeSearchQuery.length > 0
        ? searchOffices(officeSearchQuery)
        : zoomOffices;

    const fetchCities = async () => {
        setIsLoadingCities(true);
        try {
            const response = await api.getCities();
            if (response.success && response.data) {
                setStates(response.data.states || []);
                setCitiesByState(response.data.citiesByState || {});
            } else {
                // Only log error, don't show alert - cities may not be needed immediately
                console.warn('Failed to fetch cities:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.warn('Error fetching cities:', error);
        }
        setIsLoadingCities(false);
    };

    const handleStateSelect = (state) => {
        setNewAddress({ ...newAddress, estado: state, ciudad: '' });
        setAvailableCities(citiesByState[state] || []);
        setShowStateModal(false);
    };

    const handleCitySelect = (city) => {
        setNewAddress({ ...newAddress, ciudad: city.ciudad });
        setShowCityModal(false);
    };

    const fetchAddresses = async () => {
        setIsLoadingAddresses(true);
        const response = await api.getAddresses();
        if (response.success) {
            setAddresses(response.data.addresses);
            // Auto-select default
            const defaultAddr = response.data.addresses.find(a => a.es_predeterminada);
            if (defaultAddr) setSelectedAddress(defaultAddr.id_direccion);
            else if (response.data.addresses.length > 0) setSelectedAddress(response.data.addresses[0].id_direccion);
        } else {
            console.error('Failed to fetch addresses:', response.error);
        }
        setIsLoadingAddresses(false);
    };

    const handleAddAddress = async () => {
        // Basic validation
        if (!newAddress.nombre_direccion || !newAddress.calle_avenida || !newAddress.numero_nombre_edificio || !newAddress.ciudad || !newAddress.estado) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        // Phone validation
        if (!phoneDigits || phoneDigits.length !== 7) {
            Alert.alert('Error', 'El número de teléfono debe tener 7 dígitos');
            return;
        }

        const fullPhone = `0${phonePrefix}-${phoneDigits}`;
        const addressToSave = {
            nombre_direccion: newAddress.nombre_direccion,
            calle_avenida: newAddress.calle_avenida,
            numero_nombre_edificio: newAddress.numero_nombre_edificio,
            numero_apartamento: newAddress.numero_apartamento || '',
            ciudad: newAddress.ciudad,
            estado: newAddress.estado,
            codigo_postal: '',
            telefono_contacto: fullPhone,
            referencias: newAddress.referencias || '',
            es_predeterminada: newAddress.es_predeterminada || true
        };

        const response = await api.addUserAddress(addressToSave);
        if (response.success) {
            Alert.alert('¡Genial!', 'Dirección agregada correctamente');
            setShowAddAddressModal(false);
            fetchAddresses(); // Refresh addresses list
            refreshCartTotals(); // Refresh order summary with updated shipping info
            // Reset form
            setNewAddress({
                nombre_direccion: '',
                calle_avenida: '',
                numero_nombre_edificio: '',
                numero_apartamento: '',
                ciudad: '',
                estado: '',
                referencias: '',
                es_predeterminada: false
            });
            setPhoneDigits('');
            setPhonePrefix('412');
        } else {
            Alert.alert('¡Ups!', response.error || 'No se pudo agregar la dirección. Intenta de nuevo.');
        }
    };

    // Handle selecting an existing address - calls API to update active shipping address
    const handleSelectAddress = async (addr) => {
        setSelectedAddress(addr.id_direccion);
        setShowAddressSelectionModal(false);

        // Call API to set this address as the active shipping address
        try {
            const addressData = {
                nombre_direccion: addr.nombre_direccion,
                calle_avenida: addr.calle_avenida || '',
                numero_nombre_edificio: addr.numero_nombre_edificio || '',
                numero_apartamento: addr.numero_apartamento || '',
                ciudad: addr.ciudad || '',
                estado: addr.estado || '',
                codigo_postal: addr.codigo_postal || '',
                telefono_contacto: addr.telefono_contacto || '',
                referencias: addr.referencias || '',
                es_predeterminada: true
            };

            const response = await api.addUserAddress(addressData);
            if (response.success) {
                console.log('[Checkout] Address updated successfully');
                // Refresh cart totals to get updated shipping costs
                refreshCartTotals();
            } else {
                console.warn('[Checkout] Failed to update address:', response.error);
            }
        } catch (error) {
            console.error('[Checkout] Error updating address:', error);
        }
    };

    // Handle selecting a Zoom office - calls API to set Zoom office as shipping address
    const handleSelectZoomOffice = async (office) => {
        setSelectedZoomOffice(office);
        setOfficeSearchQuery('');
        setShowZoomOfficeModal(false);

        // Call API to set this Zoom office as the active shipping address
        try {
            const zoomAddressData = {
                nombre_direccion: `Oficina Zoom - ${office.nombre}`,
                calle_avenida: office.direccion,
                numero_nombre_edificio: office.nombre,
                numero_apartamento: '',
                ciudad: office.ciudad,
                estado: office.estado,
                codigo_postal: '',
                telefono_contacto: office.telefono || '',
                referencias: `Retiro en Oficina Zoom: ${office.nombre}`,
                es_predeterminada: true
            };

            const response = await api.addUserAddress(zoomAddressData);
            if (response.success) {
                console.log('[Checkout] Zoom office address saved successfully');
                // Refresh cart totals to get updated shipping costs
                refreshCartTotals();
            } else {
                console.warn('[Checkout] Failed to save Zoom office address:', response.error);
            }
        } catch (error) {
            console.error('[Checkout] Error saving Zoom office address:', error);
        }
    };

    // Handle switching between delivery options (address vs zoom)
    const handleDeliveryOptionChange = async (option) => {
        if (option === deliveryOption) return; // No change needed

        setDeliveryOption(option);

        // When switching to 'address', use the selected address data
        if (option === 'address' && selectedAddress) {
            const selectedAddr = addresses.find(a => a.id_direccion === selectedAddress);
            if (selectedAddr) {
                try {
                    const addressData = {
                        nombre_direccion: selectedAddr.nombre_direccion,
                        calle_avenida: selectedAddr.calle_avenida || '',
                        numero_nombre_edificio: selectedAddr.numero_nombre_edificio || '',
                        numero_apartamento: selectedAddr.numero_apartamento || '',
                        ciudad: selectedAddr.ciudad || '',
                        estado: selectedAddr.estado || '',
                        codigo_postal: selectedAddr.codigo_postal || '',
                        telefono_contacto: selectedAddr.telefono_contacto || '',
                        referencias: selectedAddr.referencias || '',
                        es_predeterminada: true
                    };

                    const response = await api.addUserAddress(addressData);
                    if (response.success) {
                        console.log('[Checkout] Switched to address delivery, API updated');
                        refreshCartTotals();
                    }
                } catch (error) {
                    console.error('[Checkout] Error switching to address:', error);
                }
            }
        }

        // When switching to 'zoom', use the selected Zoom office data
        if (option === 'zoom' && selectedZoomOffice) {
            try {
                const zoomAddressData = {
                    nombre_direccion: `Oficina Zoom - ${selectedZoomOffice.nombre}`,
                    calle_avenida: selectedZoomOffice.direccion,
                    numero_nombre_edificio: selectedZoomOffice.nombre,
                    numero_apartamento: '',
                    ciudad: selectedZoomOffice.ciudad,
                    estado: selectedZoomOffice.estado,
                    codigo_postal: '',
                    telefono_contacto: selectedZoomOffice.telefono || '',
                    referencias: `Retiro en Oficina Zoom: ${selectedZoomOffice.nombre}`,
                    es_predeterminada: true
                };

                const response = await api.addUserAddress(zoomAddressData);
                if (response.success) {
                    console.log('[Checkout] Switched to Zoom delivery, API updated');
                    refreshCartTotals();
                }
            } catch (error) {
                console.error('[Checkout] Error switching to Zoom:', error);
            }
        }
    };

    const [isCalculating, setIsCalculating] = useState(false);

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Error', 'Cart is empty');
            return;
        }

        // Validate Zoom office selection when Zoom delivery is selected
        if (deliveryOption === 'zoom' && !selectedZoomOffice) {
            Alert.alert('Oficina Zoom Requerida', 'Por favor selecciona una oficina Zoom para el retiro de tu pedido.');
            return;
        }

        setIsCalculating(true);

        try {
            // If Zoom delivery is selected, save the Zoom office as shipping address
            if (deliveryOption === 'zoom' && selectedZoomOffice) {
                console.log('[Checkout] Saving Zoom office as shipping address:', selectedZoomOffice.nombre);

                const zoomAddressData = {
                    nombre_direccion: `Oficina Zoom - ${selectedZoomOffice.nombre}`,
                    calle_avenida: selectedZoomOffice.direccion,
                    numero_nombre_edificio: selectedZoomOffice.nombre,
                    numero_apartamento: null,
                    ciudad: selectedZoomOffice.ciudad,
                    estado: selectedZoomOffice.estado,
                    codigo_postal: '',
                    telefono_contacto: selectedZoomOffice.telefono || '',
                    referencias: `Retiro en Oficina Zoom: ${selectedZoomOffice.nombre}`,
                    es_predeterminada: false
                };

                const addressResponse = await api.addUserAddress(zoomAddressData);

                if (!addressResponse.success) {
                    console.warn('[Checkout] Failed to save Zoom address:', addressResponse.error);
                    // Continue anyway, as the API might have other address data
                } else {
                    console.log('[Checkout] Zoom address saved successfully:', addressResponse.data);
                }
            }

            // First, refresh the cart to get the latest saleId and totals from the server
            console.log('[Checkout] Refreshing cart totals before proceeding...');
            const refreshResult = await refreshCartTotals();

            if (!refreshResult.success) {
                console.warn('[Checkout] Failed to refresh cart totals:', refreshResult.error);
                // Try to use existing saleId if refresh fails
            }

            // Use the saleId directly from the API response (fresh data)
            // Fall back to context saleId if refresh didn't return one
            const updatedSaleId = refreshResult.saleId || saleId;

            if (!updatedSaleId) {
                Alert.alert('Error', 'No se pudo obtener el ID de la venta. Por favor intenta de nuevo.');
                setIsCalculating(false);
                return;
            }

            console.log('[Checkout] Using saleId:', updatedSaleId, 'Total from refresh:', refreshResult.total);

            setIsCalculating(false);
            navigation.navigate('Payment', {
                paymentMethod,
                saleId: updatedSaleId
            });
        } catch (error) {
            console.error('[Checkout] Error:', error);
            setIsCalculating(false);
            Alert.alert('Error', 'Ocurrió un error. Por favor intenta de nuevo.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dirección de Envío</Text>
                <View style={{ width: 24 }} />
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                    <Ionicons name="cart-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyCartTitle}>Tu carrito está vacío</Text>
                    <Text style={styles.emptyCartMessage}>Debes agregar productos al carrito antes de continuar con el proceso de compra.</Text>
                    <TouchableOpacity
                        style={styles.goShoppingButton}
                        onPress={() => navigation.navigate('Main', { screen: 'CompraDonde' })}
                    >
                        <Text style={styles.goShoppingButtonText}>Ir a Comprar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.sectionTitle}>Dirección de Envío</Text>

                        {/* Delivery Options Tabs */}
                        <View style={styles.shippingTabs}>
                            <TouchableOpacity
                                style={[styles.tab, deliveryOption === 'address' && styles.activeTab]}
                                onPress={() => handleDeliveryOptionChange('address')}
                            >
                                <Text style={[styles.tabText, deliveryOption === 'address' && styles.activeTabText]}>
                                    Dirección Entrega
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, deliveryOption === 'zoom' && styles.activeTab]}
                                onPress={() => handleDeliveryOptionChange('zoom')}
                            >
                                <Text style={[styles.tabText, deliveryOption === 'zoom' && styles.activeTabText]}>
                                    Oficina Zoom
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Address List */}
                        {deliveryOption === 'address' && (
                            <View style={styles.addressContainer}>
                                {isLoadingAddresses ? (
                                    <ActivityIndicator size="small" color="#FF007F" />
                                ) : (
                                    <>
                                        {selectedAddress ? (
                                            (() => {
                                                const addr = addresses.find(a => a.id_direccion === selectedAddress);
                                                return addr ? (
                                                    <View style={[styles.addressCard, styles.selectedAddressCard]}>
                                                        <View style={styles.addressHeader}>
                                                            <Text style={styles.addressName}>{addr.nombre_direccion}</Text>
                                                            <Ionicons name="checkmark-circle" size={20} color="#FF007F" />
                                                        </View>
                                                        <Text style={styles.addressText}>{addr.direccion_completa}</Text>
                                                        <Text style={styles.addressPhone}>{addr.telefono_contacto}</Text>
                                                    </View>
                                                ) : null;
                                            })()
                                        ) : (
                                            <Text style={styles.noAddressText}>No hay dirección seleccionada</Text>
                                        )}

                                        <View style={styles.addressActions}>
                                            {addresses.length > 0 && (
                                                <TouchableOpacity
                                                    style={styles.changeAddressButton}
                                                    onPress={() => setShowAddressSelectionModal(true)}
                                                >
                                                    <Text style={styles.changeAddressText}>Cambiar Dirección</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                style={styles.addAddressButton}
                                                onPress={() => setShowAddAddressModal(true)}
                                            >
                                                <Ionicons name="add-circle-outline" size={20} color="#FF007F" />
                                                <Text style={styles.addAddressText}>Agregar Nueva Dirección</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        {/* Zoom Office Selection */}
                        {deliveryOption === 'zoom' && (
                            <View style={styles.zoomContainer}>
                                <Ionicons name="business-outline" size={40} color="#FF007F" />
                                <Text style={styles.zoomText}>Envío a Oficina Zoom</Text>

                                {/* Link to find nearest office */}
                                <TouchableOpacity
                                    style={styles.zoomLinkButton}
                                    onPress={openZoomOfficeSearch}
                                >
                                    <Ionicons name="map-outline" size={18} color="#007AFF" />
                                    <Text style={styles.zoomLinkText}>Buscar la oficina más cercana a ti</Text>
                                    <Ionicons name="open-outline" size={16} color="#007AFF" />
                                </TouchableOpacity>

                                {/* Selected office display */}
                                {selectedZoomOffice ? (
                                    <View style={styles.selectedZoomCard}>
                                        <View style={styles.zoomOfficeHeader}>
                                            <Ionicons name="location" size={20} color="#FF007F" />
                                            <Text style={styles.zoomOfficeName}>{selectedZoomOffice.nombre}</Text>
                                        </View>
                                        <Text style={styles.zoomOfficeAddress}>{selectedZoomOffice.direccion}</Text>
                                        <Text style={styles.zoomOfficeCity}>{selectedZoomOffice.ciudad}, {selectedZoomOffice.estado}</Text>
                                    </View>
                                ) : null}

                                {/* Button to select office */}
                                <TouchableOpacity
                                    style={styles.selectZoomButton}
                                    onPress={() => setShowZoomOfficeModal(true)}
                                >
                                    <Ionicons name="list-outline" size={20} color="white" />
                                    <Text style={styles.selectZoomButtonText}>
                                        {selectedZoomOffice ? 'Cambiar Oficina' : 'Seleccionar Oficina'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Shipping Type Selection */}
                        <Text style={styles.sectionTitle}>Tipo de Envío</Text>
                        <View style={styles.shippingTypeContainer}>
                            {/* Aéreo - Active */}
                            <TouchableOpacity
                                style={[styles.shippingTypeCard, styles.shippingTypeCardActive]}
                                activeOpacity={1}
                            >
                                <View style={styles.shippingTypeHeader}>
                                    <Ionicons name="airplane" size={24} color="#FF007F" />
                                    <View style={styles.shippingTypeInfo}>
                                        <Text style={styles.shippingTypeTitle}>Aéreo</Text>
                                        <Text style={styles.shippingTypeSubtitle}>Entrega más rápida</Text>
                                    </View>
                                    <Ionicons name="checkmark-circle" size={24} color="#FF007F" />
                                </View>
                            </TouchableOpacity>

                            {/* Marítimo - Disabled */}
                            <View style={[styles.shippingTypeCard, styles.shippingTypeCardDisabled]}>
                                <View style={styles.shippingTypeHeader}>
                                    <Ionicons name="boat" size={24} color="#999" />
                                    <View style={styles.shippingTypeInfo}>
                                        <Text style={[styles.shippingTypeTitle, styles.shippingTypeTitleDisabled]}>Marítimo</Text>
                                        <Text style={[styles.shippingTypeSubtitle, styles.shippingTypeSubtitleDisabled]}>Envío económico</Text>
                                    </View>
                                    <View style={styles.comingSoonBadge}>
                                        <Text style={styles.comingSoonText}>Próximamente</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Resumen del Pedido</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Subtotal ({cartItems.length} items)</Text>
                                <Text style={styles.costValue}>${formatNumber(subtotal)}</Text>
                            </View>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Impuestos</Text>
                                <Text style={styles.costValue}>${formatNumber(tax)}</Text>
                            </View>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Manejo y Envío</Text>
                                <Text style={styles.costValue}>${formatNumber(handlingAndShipping)}</Text>
                            </View>
                            {discount > 0 && (
                                <View style={styles.costRow}>
                                    <Text style={[styles.costLabel, styles.discountLabel]}>Descuento</Text>
                                    <Text style={[styles.costValue, styles.discountValue]}>-${formatNumber(discount)}</Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                            <View style={[styles.costRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${formatNumber(total)}</Text>
                            </View>

                            {/* Estimated Delivery Date */}
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
                        </View>

                        <Text style={styles.sectionTitle}>Modalidad de Pago</Text>
                        <View style={styles.shippingTabs}>
                            <TouchableOpacity
                                style={[styles.tab, paymentMethod === 'installments' && styles.activeTab]}
                                onPress={() => setPaymentMethod('installments')}
                            >
                                <Text style={[styles.tabText, paymentMethod === 'installments' && styles.activeTabText]}>
                                    Cuotas
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, paymentMethod === 'cash' && styles.activeTab]}
                                onPress={() => setPaymentMethod('cash')}
                            >
                                <Text style={[styles.tabText, paymentMethod === 'cash' && styles.activeTabText]}>
                                    Contado
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.placeOrderButton, isCalculating && styles.placeOrderButtonDisabled]}
                            onPress={handlePlaceOrder}
                            disabled={isCalculating}
                        >
                            {isCalculating ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.placeOrderText}>Calcula tus cuotas</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
            {/* Address Selection Modal */}
            <Modal
                visible={showAddressSelectionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddressSelectionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mis Direcciones</Text>
                            <TouchableOpacity onPress={() => setShowAddressSelectionModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            {addresses.map((addr) => (
                                <TouchableOpacity
                                    key={addr.id_direccion}
                                    style={[
                                        styles.addressCard,
                                        selectedAddress === addr.id_direccion && styles.selectedAddressCard
                                    ]}
                                    onPress={() => handleSelectAddress(addr)}
                                >
                                    <View style={styles.addressHeader}>
                                        <Text style={styles.addressName}>{addr.nombre_direccion}</Text>
                                        {selectedAddress === addr.id_direccion && (
                                            <Ionicons name="checkmark-circle" size={20} color="#FF007F" />
                                        )}
                                    </View>
                                    <Text style={styles.addressText}>{addr.direccion_completa}</Text>
                                    <Text style={styles.addressPhone}>{addr.telefono_contacto}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Address Modal */}
            <Modal
                visible={showAddAddressModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddAddressModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nueva Dirección</Text>
                            <TouchableOpacity onPress={() => setShowAddAddressModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <Text style={styles.label}>Nombre (ej: Casa, Oficina) *</Text>
                            <TextInput
                                style={styles.input}
                                value={newAddress.nombre_direccion}
                                onChangeText={(t) => setNewAddress({ ...newAddress, nombre_direccion: t })}
                                placeholder="Ej: Casa"
                            />

                            <Text style={styles.label}>Calle / Avenida *</Text>
                            <TextInput
                                style={styles.input}
                                value={newAddress.calle_avenida}
                                onChangeText={(t) => setNewAddress({ ...newAddress, calle_avenida: t })}
                                placeholder="Ej: Av. Principal"
                            />

                            <Text style={styles.label}>Edificio / Casa *</Text>
                            <TextInput
                                style={styles.input}
                                value={newAddress.numero_nombre_edificio}
                                onChangeText={(t) => setNewAddress({ ...newAddress, numero_nombre_edificio: t })}
                                placeholder="Ej: Torre A, Piso 2"
                            />

                            <Text style={styles.label}>Apartamento</Text>
                            <TextInput
                                style={styles.input}
                                value={newAddress.numero_apartamento}
                                onChangeText={(t) => setNewAddress({ ...newAddress, numero_apartamento: t })}
                                placeholder="Ej: 4B"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Estado *</Text>
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowStateModal(true)}
                                    >
                                        <Text style={newAddress.estado ? styles.selectButtonText : styles.placeholderText}>
                                            {newAddress.estado || 'Seleccionar'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Ciudad *</Text>
                                    <TouchableOpacity
                                        style={[styles.selectButton, !newAddress.estado && styles.disabledButton]}
                                        onPress={() => newAddress.estado && setShowCityModal(true)}
                                        disabled={!newAddress.estado}
                                    >
                                        <Text style={newAddress.ciudad ? styles.selectButtonText : styles.placeholderText}>
                                            {newAddress.ciudad || 'Seleccionar'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.label}>Teléfono</Text>
                            <View style={styles.phoneInputContainer}>
                                <View style={styles.countryCodeContainer}>
                                    <Text style={styles.countryCodeText}>+58</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.prefixButton}
                                    onPress={() => setShowPhonePrefixModal(true)}
                                >
                                    <Text style={styles.prefixButtonText}>{phonePrefix}</Text>
                                    <Ionicons name="chevron-down" size={16} color="#666" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={phoneDigits}
                                    onChangeText={(t) => setPhoneDigits(t.replace(/[^0-9]/g, '').slice(0, 7))}
                                    placeholder="1234567"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <Text style={styles.label}>Referencias</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={newAddress.referencias}
                                onChangeText={(t) => setNewAddress({ ...newAddress, referencias: t })}
                                placeholder="Punto de referencia cercano"
                                multiline
                                numberOfLines={3}
                            />

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setNewAddress({ ...newAddress, es_predeterminada: !newAddress.es_predeterminada })}
                            >
                                <Ionicons
                                    name={newAddress.es_predeterminada ? "checkbox" : "square-outline"}
                                    size={24}
                                    color="#FF007F"
                                />
                                <Text style={styles.checkboxLabel}>Establecer como predeterminada</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress}>
                                <Text style={styles.saveButtonText}>Guardar Dirección</Text>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Phone Prefix Selection Modal */}
            <Modal
                visible={showPhonePrefixModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPhonePrefixModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Prefijo</Text>
                            <TouchableOpacity onPress={() => setShowPhonePrefixModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.formContainer}>
                            {['412', '414', '424', '416', '426', '422'].map((prefix) => (
                                <TouchableOpacity
                                    key={prefix}
                                    style={styles.selectionItem}
                                    onPress={() => {
                                        setPhonePrefix(prefix);
                                        setShowPhonePrefixModal(false);
                                    }}
                                >
                                    <Text style={styles.selectionItemText}>{prefix}</Text>
                                    {phonePrefix === prefix && (
                                        <Ionicons name="checkmark" size={20} color="#FF007F" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* State Selection Modal */}
            <Modal
                visible={showStateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowStateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Estado</Text>
                            <TouchableOpacity onPress={() => setShowStateModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {isLoadingCities ? (
                            <ActivityIndicator size="large" color="#FF007F" />
                        ) : (
                            <ScrollView style={styles.formContainer}>
                                {states.map((state) => (
                                    <TouchableOpacity
                                        key={state}
                                        style={styles.selectionItem}
                                        onPress={() => handleStateSelect(state)}
                                    >
                                        <Text style={styles.selectionItemText}>{state}</Text>
                                        {newAddress.estado === state && (
                                            <Ionicons name="checkmark" size={20} color="#FF007F" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* City Selection Modal */}
            <Modal
                visible={showCityModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCityModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Ciudad</Text>
                            <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.formContainer}>
                            {availableCities.map((city) => (
                                <TouchableOpacity
                                    key={city.id}
                                    style={styles.selectionItem}
                                    onPress={() => handleCitySelect(city)}
                                >
                                    <Text style={styles.selectionItemText}>{city.ciudad}</Text>
                                    {newAddress.ciudad === city.ciudad && (
                                        <Ionicons name="checkmark" size={20} color="#FF007F" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Zoom Office Selection Modal */}
            <Modal
                visible={showZoomOfficeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowZoomOfficeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Oficina Zoom</Text>
                            <TouchableOpacity onPress={() => setShowZoomOfficeModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Link to find offices */}
                        <TouchableOpacity
                            style={styles.zoomModalLinkButton}
                            onPress={openZoomOfficeSearch}
                        >
                            <Ionicons name="globe-outline" size={18} color="#007AFF" />
                            <Text style={styles.zoomModalLinkText}>Ver mapa de oficinas Zoom</Text>
                            <Ionicons name="open-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>

                        {/* Search bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar por ciudad, estado u oficina..."
                                value={officeSearchQuery}
                                onChangeText={setOfficeSearchQuery}
                                placeholderTextColor="#999"
                            />
                            {officeSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setOfficeSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.officeCountText}>
                            {filteredZoomOffices.length} oficinas encontradas
                        </Text>

                        {filteredZoomOffices.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>No se encontraron oficinas</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.formContainer}>
                                {filteredZoomOffices.map((office) => (
                                    <TouchableOpacity
                                        key={office.id}
                                        style={[
                                            styles.zoomOfficeItem,
                                            selectedZoomOffice?.id === office.id && styles.selectedZoomOfficeItem
                                        ]}
                                        onPress={() => handleSelectZoomOffice(office)}
                                    >
                                        <View style={styles.zoomOfficeItemContent}>
                                            <Text style={styles.zoomOfficeItemName}>{office.nombre}</Text>
                                            <Text style={styles.zoomOfficeItemAddress}>{office.direccion}</Text>
                                            <Text style={styles.zoomOfficeItemCity}>{office.ciudad}, {office.estado}</Text>
                                        </View>
                                        {selectedZoomOffice?.id === office.id && (
                                            <Ionicons name="checkmark-circle" size={24} color="#FF007F" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
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
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyCartTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyCartMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    goShoppingButton: {
        backgroundColor: '#FF007F',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 12,
    },
    goShoppingButtonText: {
        color: 'white',
        fontSize: 16,
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
    discountLabel: {
        color: '#28a745',
    },
    discountValue: {
        color: '#28a745',
        fontWeight: '600',
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
    placeOrderButtonDisabled: {
        opacity: 0.7,
    },
    // Address Styles
    addressContainer: {
        marginBottom: 20,
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedAddressCard: {
        borderColor: '#FF007F',
        backgroundColor: '#FFF0F5',
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    addressName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    addressText: {
        color: '#666',
        fontSize: 14,
        marginBottom: 2,
    },
    addressPhone: {
        color: '#999',
        fontSize: 12,
    },
    addressActions: {
        marginTop: 10,
    },
    changeAddressButton: {
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        marginBottom: 10,
    },
    changeAddressText: {
        color: '#333',
        fontWeight: '600',
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF007F',
        borderStyle: 'dashed',
    },
    addAddressText: {
        color: '#FF007F',
        fontWeight: '600',
        marginLeft: 10,
    },
    // Zoom Styles
    zoomContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
    },
    zoomText: {
        marginTop: 10,
        marginBottom: 15,
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    zoomLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F0F8FF',
        borderRadius: 10,
        marginBottom: 15,
        width: '100%',
    },
    zoomLinkText: {
        flex: 1,
        marginLeft: 8,
        color: '#007AFF',
        fontSize: 14,
    },
    selectedZoomCard: {
        width: '100%',
        backgroundColor: '#FFF0F5',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FF007F',
    },
    zoomOfficeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    zoomOfficeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    zoomOfficeAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    zoomOfficeCity: {
        fontSize: 13,
        color: '#999',
    },
    selectZoomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF007F',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    selectZoomButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    zoomModalLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F0F8FF',
        borderRadius: 10,
        marginBottom: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
    },
    officeCountText: {
        fontSize: 13,
        color: '#999',
        marginBottom: 10,
        textAlign: 'center',
    },
    zoomModalLinkText: {
        flex: 1,
        marginLeft: 10,
        color: '#007AFF',
        fontSize: 15,
    },
    zoomOfficeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedZoomOfficeItem: {
        backgroundColor: '#FFF0F5',
        borderColor: '#FF007F',
    },
    zoomOfficeItemContent: {
        flex: 1,
    },
    zoomOfficeItemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    zoomOfficeItemAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    zoomOfficeItemCity: {
        fontSize: 13,
        color: '#999',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#999',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '90%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    formContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#FF007F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        height: 50,
    },
    disabledButton: {
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        fontSize: 16,
        color: '#999',
    },
    selectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectionItemText: {
        fontSize: 16,
        color: '#333',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    countryCodeContainer: {
        backgroundColor: '#eee',
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
        height: 50,
        justifyContent: 'center',
    },
    countryCodeText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    prefixButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        marginRight: 10,
        height: 50,
        width: 80,
    },
    prefixButtonText: {
        fontSize: 16,
        color: '#333',
    },
    phoneInput: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        height: 50,
    },
    // Shipping Type Styles
    shippingTypeContainer: {
        marginBottom: 20,
    },
    shippingTypeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#eee',
    },
    shippingTypeCardActive: {
        borderColor: '#FF007F',
        backgroundColor: '#FFF5F8',
    },
    shippingTypeCardDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ddd',
        opacity: 0.8,
    },
    shippingTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shippingTypeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    shippingTypeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    shippingTypeTitleDisabled: {
        color: '#999',
    },
    shippingTypeSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    shippingTypeSubtitleDisabled: {
        color: '#aaa',
    },
    comingSoonBadge: {
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    comingSoonText: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
    },
    deliveryEstimateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFF5F8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD6E7',
    },
    deliveryEstimateText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
    },
});

export default CheckoutScreen;
