import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    RefreshControl,
    Alert,
    Modal,
    ActivityIndicator
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { formatNumber } from '../utils/formatNumber';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user, signOut } = useAuth();
    const [homeData, setHomeData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Currency selection modal state for quota payment
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [modalCurrency, setModalCurrency] = useState('bs');
    const [modalAmountBs, setModalAmountBs] = useState(0);
    const [modalAmountUsd, setModalAmountUsd] = useState(0);
    const [loadingAmount, setLoadingAmount] = useState(false);

    // Chat modal state
    const [showChatModal, setShowChatModal] = useState(false);

    // Default data for guests or loading
    const defaultData = {
        name: 'Invitado',
        limit: 0,
        used: 0,
        level: 'Bronce'
    };

    const displayData = homeData || defaultData;

    // Helper to safely parse numbers
    const parseAmount = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    // Data mapping from API
    const userData = homeData?.user || {};
    const stats = homeData?.stats || {};
    const nextInstallment = stats?.proxima_cuota;
    const levelProgress = homeData?.progreso_nivel || {};

    // Name logic: API Name -> User metadata -> Email username -> Empty
    const displayName = userData.nombre ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        '';

    // Credit logic
    const limit = parseAmount(userData.limite_credito);
    const available = parseAmount(userData.monto_restante_credito);
    const used = limit - available;

    // Level logic
    const levelName = userData.nivel?.nombre || defaultData.level;
    const badgeUrl = userData.nivel?.badge_url;

    // Level progress logic
    const nextLevelName = levelProgress.siguiente_nivel?.nombre || null;
    const purchasesRequired = levelProgress.siguiente_nivel?.compras_requeridas || 0;
    const purchasesMade = levelProgress.compras_realizadas || 0;
    const purchasesRemaining = levelProgress.compras_faltantes || 0;
    const isMaxLevel = levelProgress.es_nivel_maximo || false;
    // Calculate progress percentage (0-100)
    const levelProgressPercent = purchasesRequired > 0
        ? Math.min(100, (purchasesMade / purchasesRequired) * 100)
        : 0;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Simple formatter: "15 Dic"
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    };

    const fetchHomeData = async () => {
        if (!user) {
            console.log('[HomeScreen] No user, skipping fetchHomeData');
            setHomeData(null);
            return;
        }

        try {
            console.log('[HomeScreen] Fetching home data...');
            const response = await api.getHomeData();

            // Check for token/auth errors - sign out silently
            if (response.code === 401 || response.message === 'Invalid JWT') {
                console.log('[HomeScreen] Token invalid, signing out...');
                await signOut();
                return;
            }

            // Handle different API response structures
            if (response.success && response.data) {
                console.log('[HomeScreen] Setting homeData from response.data');
                console.log('[HomeScreen] User data received:', JSON.stringify(response.data.user, null, 2));
                console.log('[HomeScreen] limite_credito:', response.data.user?.limite_credito);
                console.log('[HomeScreen] monto_restante_credito:', response.data.user?.monto_restante_credito);
                setHomeData(response.data);
            } else if (response.user) {
                console.log('[HomeScreen] Setting homeData from root response');
                console.log('[HomeScreen] User data (root):', JSON.stringify(response.user, null, 2));
                setHomeData(response);
            } else {
                console.log('[HomeScreen] No valid data in response:', JSON.stringify(response, null, 2));
            }
        } catch (error) {
            console.error('[HomeScreen] Error fetching home data:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHomeData();
        }, [user])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHomeData();
        setRefreshing(false);
    };


    // Lista de tiendas con URLs de logotipos reales
    const featuredStores = [
        { name: 'Amazon', logo: require('../../assets/amazon_logo.png'), url: 'https://www.amazon.com' },
        { name: 'Shein', logo: require('../../assets/shein_logo.png'), url: 'https://us.shein.com' },
        { name: 'Walmart', logo: require('../../assets/walmart_logo.png'), url: 'https://www.walmart.com' },
        { name: 'Temu', logo: require('../../assets/temu_logo.png'), url: 'https://www.temu.com' },
        // { name: 'Nike', logo: require('../../assets/nike_logo.png'), url: 'https://www.nike.com' }, // Temporarily hidden
    ];

    const onNavigateToStore = (store) => {
        if (store.url) {
            navigation.navigate('WebView', { url: store.url, name: store.name });
        } else {
            // Fallback for stores without URL (like Google example)
            navigation.navigate('Shop', { store: store.name });
        }
    };

    // Notifications state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showNotificationDetail, setShowNotificationDetail] = useState(false);

    // Fetch unread notifications count
    const fetchNotificationsCount = async () => {
        if (!user) return;
        try {
            const response = await api.getNotificationsCount();
            if (response.success && response.data?.count !== undefined) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('[HomeScreen] Error fetching notifications count:', error);
        }
    };

    // Fetch notifications list (only unread)
    const fetchNotifications = async () => {
        if (!user) return;
        setLoadingNotifications(true);
        try {
            // Only fetch unread notifications (leida: false)
            const response = await api.getNotifications(1, 20, false);
            if (response.success && response.data?.notificaciones) {
                // Sort by created_at descending (most recent first)
                const sorted = response.data.notificaciones.sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );
                setNotifications(sorted);
            }
        } catch (error) {
            console.error('[HomeScreen] Error fetching notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Show notification detail in modal
    const handleNotificationPress = (notification) => {
        setSelectedNotification(notification);
        setShowNotificationDetail(true);
    };

    // Close notification detail and mark as read
    const handleCloseNotificationDetail = async () => {
        if (selectedNotification && !selectedNotification.leida) {
            try {
                const response = await api.markNotificationRead(selectedNotification.id_notificacion);
                if (response.success) {
                    // Remove from list since we only show unread
                    setNotifications(prev =>
                        prev.filter(n => n.id_notificacion !== selectedNotification.id_notificacion)
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            } catch (error) {
                console.error('[HomeScreen] Error marking notification as read:', error);
            }
        }
        setShowNotificationDetail(false);
        setSelectedNotification(null);
    };

    // Navigate from notification (after closing detail)
    const handleNotificationNavigate = async () => {
        const notification = selectedNotification;
        await handleCloseNotificationDetail();

        if (notification?.link) {
            setShowNotifications(false);
            if (notification.link.includes('/orders/')) {
                const orderId = notification.link.split('/orders/')[1];
                navigation.navigate('OrderDetail', { orderId: parseInt(orderId) });
            }
        }
    };

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
        try {
            const response = await api.markAllNotificationsRead();
            if (response.success) {
                setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('[HomeScreen] Error marking all as read:', error);
        }
    };

    // Toggle notifications dropdown
    const handleNotificationToggle = () => {
        if (!showNotifications) {
            fetchNotifications();
        }
        setShowNotifications(!showNotifications);
    };

    // Format notification time
    const formatNotificationTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        return formatDate(dateString);
    };

    // Handle pay quota button press
    const handlePayQuota = async () => {
        if (!nextInstallment) return;

        // Show currency selection modal
        setModalCurrency('bs');
        const quotaAmountUsd = nextInstallment.monto || 0;
        setModalAmountUsd(quotaAmountUsd);
        setModalAmountBs(0);
        setShowCurrencyModal(true);
        setLoadingAmount(true);

        // Fetch the exchange rate
        try {
            console.log('[HomeScreen] Fetching exchange rate for quota:', nextInstallment.id_cuota);
            const response = await api.getExchangeRate();
            console.log('[HomeScreen] Exchange rate response:', JSON.stringify(response));

            if (response.success && response.data?.tipo_cambio?.tasa) {
                const tasa = response.data.tipo_cambio.tasa;
                const amountBs = quotaAmountUsd * tasa;
                console.log('[HomeScreen] Tasa:', tasa, '| Monto USD:', quotaAmountUsd, '| Monto BS:', amountBs);
                setModalAmountBs(amountBs);
            } else {
                // Fallback rate
                console.warn('[HomeScreen] API did not return valid rate:', response);
                const fallbackAmount = quotaAmountUsd * 50;
                setModalAmountBs(fallbackAmount);
            }
        } catch (err) {
            console.error('[HomeScreen] Error fetching exchange rate:', err);
            const fallbackAmount = quotaAmountUsd * 50;
            setModalAmountBs(fallbackAmount);
        } finally {
            setLoadingAmount(false);
        }
    };

    // Handle confirm payment from currency modal
    const handleConfirmPayment = () => {
        setShowCurrencyModal(false);
        if (nextInstallment) {
            navigation.navigate('PaymentConfirmation', {
                saleId: nextInstallment.id_venta,
                currency: modalCurrency,
                paymentAmount: modalCurrency === 'bs' ? modalAmountBs : modalAmountUsd,
                paymentAmountBs: modalAmountBs,
                paymentAmountUsd: modalAmountUsd,
                quotaId: nextInstallment.id_cuota,
                quotaNumber: nextInstallment.numero_cuota,
                isQuotaPayment: true
            });
        }
    };

    // Fetch notifications count on mount and focus
    useFocusEffect(
        useCallback(() => {
            fetchNotificationsCount();
        }, [user])
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

                {/* Header */}
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.welcomeText}>Bienvenida de nuevo,</Text>
                        <Text style={styles.userName}>Hola{displayName ? `, ${displayName}` : ''}</Text>
                    </View>
                    {/* Contenedor de íconos del header */}
                    <View style={styles.headerIconsContainer}>
                        {/* Botón de Chat */}
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => setShowChatModal(true)}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#7B1FA2" />
                        </TouchableOpacity>
                        {/* Botón de Notificaciones */}
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={handleNotificationToggle}
                        >
                            <Feather name="bell" size={22} color="#7B1FA2" />
                            {/* Badge con número de no leídas */}
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadgeNumber}>
                                    <Text style={styles.notificationBadgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <View style={styles.notificationDropdown}>
                        <View style={styles.notificationArrow} />
                        <View style={styles.notificationHeader}>
                            <Text style={styles.notificationTitle}>Notificaciones</Text>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={handleMarkAllAsRead}>
                                    <Text style={styles.markAllReadText}>Marcar todas</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {loadingNotifications ? (
                            <View style={styles.notificationLoading}>
                                <Text style={styles.notificationLoadingText}>Cargando...</Text>
                            </View>
                        ) : notifications.length === 0 ? (
                            <View style={styles.notificationEmpty}>
                                <Feather name="bell-off" size={24} color="#9CA3AF" />
                                <Text style={styles.notificationEmptyText}>No tienes notificaciones</Text>
                            </View>
                        ) : (
                            notifications.map((item) => (
                                <TouchableOpacity
                                    key={item.id_notificacion}
                                    style={[styles.notificationItem, !item.leida && styles.notificationUnread]}
                                    onPress={() => handleNotificationPress(item)}
                                >
                                    <View style={styles.notificationIconBg}>
                                        <Feather name="info" size={16} color="#7B1FA2" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.notificationItemTitle}>{item.titulo}</Text>
                                        <Text style={styles.notificationItemMessage} numberOfLines={1}>{item.mensaje}</Text>
                                        <Text style={styles.notificationItemTime}>{formatNotificationTime(item.created_at)}</Text>
                                    </View>
                                    {!item.leida && <View style={styles.notificationDot} />}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}

                {/* --- SECCIÓN PRINCIPAL: CARRUSEL DE OFERTAS --- */}
                <View style={styles.carouselContainer}>
                    <OffersCarousel />
                </View>

                {/* Tiendas Populares (SOLO ICONOS) */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Tiendas Populares</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesScroll}>
                        {featuredStores.map((store) => (
                            <TouchableOpacity
                                key={store.name}
                                onPress={() => onNavigateToStore(store)}
                                style={styles.storeButton}
                            >
                                {/* Contenedor del Logo REDONDO SIN TEXTO ABAJO */}
                                <View style={styles.storeLogoContainer}>
                                    <Image
                                        source={typeof store.logo === 'string' ? { uri: store.logo } : store.logo}
                                        style={[
                                            styles.storeLogo,
                                            store.name === 'Amazon' && { width: 65, height: 65, backgroundColor: 'white', borderRadius: 32.5 },
                                            store.name === 'Walmart' && { width: 65, height: 65, backgroundColor: 'white', borderRadius: 32.5 }
                                        ]}
                                        resizeMode="contain"
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => onNavigateToStore({ name: 'Google' })}
                            style={styles.storeButton}
                        >
                            <View style={[styles.storeLogoContainer, styles.moreStoreContainer]}>
                                <Feather name="search" size={24} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Estado Financiero (Saldos) */}
                <View style={styles.sectionContainer}>
                    <View style={styles.walletCard}>
                        {/* Decoración sutil */}
                        <View style={styles.walletDecoration} />

                        <View style={{ zIndex: 10 }}>
                            <View style={styles.walletHeader}>
                                <View style={styles.walletTitleContainer}>
                                    <View style={styles.walletIconBg}>
                                        <Feather name="credit-card" size={18} color="#7B1FA2" />
                                    </View>
                                    <Text style={styles.walletTitle}>Resumen</Text>
                                </View>
                                {/* Chip decorativo */}
                                <View style={styles.statusChip}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>AL DÍA</Text>
                                </View>
                            </View>

                            <View style={styles.balanceContainer}>
                                <View>
                                    <Text style={styles.balanceLabel}>DISPONIBLE</Text>
                                    <View style={styles.amountRow}>
                                        <Text style={styles.currencySymbol}>$</Text>
                                        <Text style={styles.amountMain}>{formatNumber(available, 0)}</Text>
                                    </View>
                                </View>

                                <View style={styles.debtContainer}>
                                    <Text style={styles.balanceLabel}>DEUDA</Text>
                                    <Text style={styles.debtAmount}>${formatNumber(used)}</Text>
                                </View>
                            </View>

                            {/* Barra visual de uso de crédito */}
                            <View>
                                <View style={styles.progressLabels}>
                                    <Text style={styles.progressLabel}>Consumo del límite</Text>
                                    <Text style={styles.progressLabel}>Total ${formatNumber(limit)}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={['#FF007F', '#ff5c8d']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${limit > 0 ? (used / limit) * 100 : 0}%` }]}
                                    />
                                </View>
                            </View>

                            {/* Próxima Cuota */}
                            {nextInstallment && (
                                <View style={styles.nextInstallmentContainer}>
                                    <View style={styles.nextInstallmentHeader}>
                                        <Feather name="calendar" size={14} color="#7B1FA2" />
                                        <Text style={styles.nextInstallmentLabel}>Próxima Cuota</Text>
                                    </View>
                                    <View style={styles.nextInstallmentRow}>
                                        <Text style={styles.nextInstallmentDate}>{formatDate(nextInstallment.fecha)}</Text>
                                        <Text style={styles.nextInstallmentAmount}>${formatNumber(nextInstallment.monto)}</Text>
                                    </View>
                                    {/* Pay Quota Button */}
                                    <TouchableOpacity
                                        style={styles.payQuotaButton}
                                        onPress={handlePayQuota}
                                    >
                                        <LinearGradient
                                            colors={['#FF007F', '#7B1FA2']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.payQuotaButtonGradient}
                                        >
                                            <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                                            <Text style={styles.payQuotaButtonText}>Pagar Cuota</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Tarjeta de Nivel */}
                <View style={[styles.sectionContainer, { marginBottom: 30 }]}>
                    <LinearGradient
                        colors={['#7B1FA2', '#9C27B0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.levelCard}
                    >
                        <View style={styles.levelDecoration} />
                        <View style={styles.levelContent}>
                            <View>
                                <Text style={styles.levelLabel}>TU NIVEL</Text>
                                <Text style={styles.levelValue}>{levelName}</Text>
                                <View style={styles.levelProgressBg}>
                                    <View style={[styles.levelProgressFill, { width: `${levelProgressPercent}%` }]} />
                                </View>
                                {isMaxLevel ? (
                                    <Text style={styles.levelNextText}>¡Nivel máximo alcanzado!</Text>
                                ) : nextLevelName ? (
                                    <Text style={styles.levelNextText}>
                                        {purchasesRemaining === 1
                                            ? `Falta 1 compra para subir al nivel ${nextLevelName}`
                                            : `Faltan ${purchasesRemaining} compras para subir al nivel ${nextLevelName}`
                                        }
                                    </Text>
                                ) : null}
                            </View>
                            <View style={styles.nextLevelBadge}>
                                {badgeUrl ? (
                                    <Image
                                        source={{ uri: badgeUrl }}
                                        style={{ width: 60, height: 60 }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Text style={{ fontSize: 40 }}>🥉</Text>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>

            </ScrollView>

            {/* Notification Detail Modal */}
            <Modal
                visible={showNotificationDetail}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseNotificationDetail}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.notificationDetailModal}>
                        {selectedNotification && (
                            <>
                                <View style={styles.notificationDetailHeader}>
                                    <View style={styles.notificationDetailIconBg}>
                                        <Feather name="bell" size={24} color="#7B1FA2" />
                                    </View>
                                    <Text style={styles.notificationDetailTitle}>
                                        {selectedNotification.titulo}
                                    </Text>
                                </View>
                                <Text style={styles.notificationDetailMessage}>
                                    {selectedNotification.mensaje}
                                </Text>
                                <Text style={styles.notificationDetailTime}>
                                    {formatNotificationTime(selectedNotification.created_at)}
                                </Text>
                                <View style={styles.notificationDetailButtons}>
                                    <TouchableOpacity
                                        style={styles.notificationDetailButtonSecondary}
                                        onPress={handleCloseNotificationDetail}
                                    >
                                        <Text style={styles.notificationDetailButtonSecondaryText}>Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Currency Selection Modal for Quota Payment */}
            <Modal
                visible={showCurrencyModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCurrencyModal(false)}
            >
                <TouchableOpacity
                    style={styles.currencyModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCurrencyModal(false)}
                >
                    <TouchableOpacity
                        style={styles.currencyModalContainer}
                        activeOpacity={1}
                        onPress={() => { }}
                    >
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.currencyModalCloseButton}
                            onPress={() => setShowCurrencyModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#757575" />
                        </TouchableOpacity>

                        {/* Moneda de Pago Section */}
                        <Text style={styles.currencyModalSectionTitle}>Moneda de Pago</Text>
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
                        <Text style={styles.currencyModalSectionTitle}>Monto a pagar</Text>
                        <View style={styles.currencyAmountCard}>
                            <Text style={styles.currencyAmountLabel}>
                                {modalCurrency === 'bs' ? 'Monto en Bolívares' : 'Monto en Dólares'}
                            </Text>
                            {loadingAmount ? (
                                <ActivityIndicator size="small" color="#FF007F" />
                            ) : (
                                <Text style={styles.currencyAmountValue}>
                                    {modalCurrency === 'bs'
                                        ? `Bs. ${formatNumber(modalAmountBs)}`
                                        : `$ ${formatNumber(modalAmountUsd)}`
                                    }
                                </Text>
                            )}
                        </View>

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={styles.currencyModalConfirmButton}
                            onPress={handleConfirmPayment}
                        >
                            <LinearGradient
                                colors={['#FF007F', '#7B1FA2']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.currencyModalConfirmGradient}
                            >
                                <Text style={styles.currencyModalConfirmText}>Continuar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Chat Modal */}
            <Modal
                visible={showChatModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowChatModal(false)}
            >
                <View style={styles.chatModalContainer}>
                    <View style={styles.chatModalHeader}>
                        <Text style={styles.chatModalTitle}>Chat de Soporte</Text>
                        <TouchableOpacity
                            style={styles.chatModalCloseButton}
                            onPress={() => setShowChatModal(false)}
                        >
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: 'https://app.chatgptbuilder.io/webchat/?p=1999899&id=zHyqxeLb76x5oATLCPwW' }}
                        style={styles.chatWebView}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />
                </View>
            </Modal>
        </View>
    );
};

// --- COMPONENTE DE CARRUSEL DE OFERTAS ---
const OffersCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            title: "Gift Card de $10",
            subtitle: "¡Descuento en tu primer envío!",
            footnote: "*Ciertas condiciones aplican",
            colors: ['#FF007F', '#FF5C8D'],
            iconName: 'gift', // Ionicons
            tag: "Bienvenida"
        }
    ];

    // Rotación automática
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const slide = slides[currentSlide];

    return (
        <View style={styles.carouselWrapper}>
            <LinearGradient
                colors={slide.colors}
                style={styles.slideGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Contenido del Slide */}
                <View style={styles.slideContent}>
                    <View style={styles.tagContainer}>
                        <Text style={styles.tagText}>{slide.tag}</Text>
                    </View>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                    {slide.footnote && (
                        <Text style={styles.slideFootnote}>{slide.footnote}</Text>
                    )}

                    <TouchableOpacity style={styles.slideButton}>
                        <Text style={styles.slideButtonText}>Ver detalles</Text>
                        <Ionicons name={slide.iconName} size={14} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Decoración de fondo */}
                <View style={styles.slideDecorationCircle} />
                <View style={styles.slideIconDecoration}>
                    <Ionicons name={slide.iconName} size={80} color="rgba(255,255,255,0.2)" />
                </View>
            </LinearGradient>

            {/* Indicadores de Puntos */}
            <View style={styles.indicatorsContainer}>
                {slides.map((_, idx) => (
                    <TouchableOpacity
                        key={idx}
                        onPress={() => setCurrentSlide(idx)}
                        style={[
                            styles.indicator,
                            idx === currentSlide ? styles.indicatorActive : styles.indicatorInactive
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
        paddingBottom: 100,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    welcomeText: {
        color: '#6B7280', // gray-500
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7B1FA2',
    },
    notificationButton: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        zIndex: 50, // Ensure it's above other elements
    },
    headerIconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconButton: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    chatModalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    chatModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    chatModalCloseButton: {
        padding: 4,
    },
    chatWebView: {
        flex: 1,
    },
    notificationDropdown: {
        position: 'absolute',
        top: 80,
        right: 20,
        width: 300,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 100,
    },
    notificationArrow: {
        position: 'absolute',
        top: -8,
        right: 14,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'white',
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1F2937',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    notificationUnread: {
        backgroundColor: '#FDF2F8', // pink-50
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    notificationIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3E8FF', // purple-100
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationItemTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 2,
    },
    notificationItemTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF007F',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 10,
        width: 8,
        height: 8,
        backgroundColor: '#FF007F',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'white',
    },
    notificationBadgeNumber: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 18,
        height: 18,
        backgroundColor: '#FF007F',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: 'white',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    markAllReadText: {
        fontSize: 12,
        color: '#7B1FA2',
        fontWeight: '600',
    },
    notificationItemMessage: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    notificationLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    notificationLoadingText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    notificationEmpty: {
        paddingVertical: 24,
        alignItems: 'center',
        gap: 8,
    },
    notificationEmptyText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    notificationDetailModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    notificationDetailHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    notificationDetailIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    notificationDetailTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    notificationDetailMessage: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 12,
    },
    notificationDetailTime: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 20,
    },
    notificationDetailButtons: {
        gap: 10,
    },
    notificationDetailButtonPrimary: {
        backgroundColor: '#7B1FA2',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    notificationDetailButtonPrimaryText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    notificationDetailButtonSecondary: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    notificationDetailButtonSecondaryText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    carouselContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    carouselWrapper: {
        width: '100%',
        height: 192, // h-48
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#7B1FA2',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },
    slideGradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    slideContent: {
        zIndex: 20,
    },
    tagContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        marginBottom: 8,
    },
    tagText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    slideTitle: {
        fontSize: 28, // text-3xl approx
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
        lineHeight: 32,
    },
    slideSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    slideFootnote: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontStyle: 'italic',
        marginTop: 4,
    },
    slideButton: {
        marginTop: 16,
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    slideButtonText: {
        color: '#111827', // gray-900
        fontSize: 12,
        fontWeight: 'bold',
    },
    slideDecorationCircle: {
        position: 'absolute',
        bottom: -32,
        right: -32,
        width: 160,
        height: 160,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 80,
    },
    slideIconDecoration: {
        position: 'absolute',
        top: 16,
        right: 16,
        transform: [{ rotate: '12deg' }, { scale: 1.5 }],
        opacity: 0.5,
    },
    indicatorsContainer: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        zIndex: 30,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    indicatorActive: {
        width: 24,
        backgroundColor: 'white',
    },
    indicatorInactive: {
        width: 8,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    sectionContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151', // gray-700
        marginBottom: 12,
    },
    storesScroll: {
        paddingBottom: 10,
        gap: 16,
    },
    storeButton: {
        alignItems: 'center',
        gap: 8,
    },
    storeLogoContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
        padding: 12,
    },
    storeLogo: {
        width: '100%',
        height: '100%',
    },
    moreStoreContainer: {
        backgroundColor: '#F9FAFB', // gray-50
        borderColor: '#E5E7EB', // gray-200
    },
    walletCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#7B1FA2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3E8FF', // purple-100
        position: 'relative',
        overflow: 'hidden',
    },
    walletDecoration: {
        position: 'absolute',
        top: -32,
        right: -32,
        width: 128,
        height: 128,
        backgroundColor: 'rgba(123, 31, 162, 0.05)',
        borderRadius: 64,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    walletTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    walletIconBg: {
        padding: 6,
        backgroundColor: 'rgba(123, 31, 162, 0.1)',
        borderRadius: 8,
    },
    walletTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7B1FA2',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5', // green-50
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1FAE5', // green-100
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981', // green-500
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#047857', // green-700
    },
    balanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    balanceLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF', // gray-400
        marginBottom: 4,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencySymbol: {
        fontSize: 24,
        color: '#9CA3AF',
        marginRight: 4,
    },
    amountMain: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1F2937', // gray-800
    },
    amountDecimal: {
        fontSize: 18,
        color: '#9CA3AF',
    },
    debtContainer: {
        alignItems: 'flex-end',
        paddingLeft: 16,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
    },
    debtAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
    },
    progressBarBg: {
        width: '100%',
        height: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    levelCard: {
        borderRadius: 24,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    levelDecoration: {
        position: 'absolute',
        top: -32,
        right: -32,
        width: 96,
        height: 96,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 48,
    },
    levelContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    levelLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    levelValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    levelProgressBg: {
        width: 120,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    levelProgressFill: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 3,
    },
    levelNextText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    nextLevelBadge: {
        alignItems: 'center',
    },
    nextLevelLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 2,
    },
    nextLevelValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    nextInstallmentContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    nextInstallmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    nextInstallmentLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7B1FA2',
    },
    nextInstallmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nextInstallmentDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    nextInstallmentAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    // Pay Quota Button Styles
    payQuotaButton: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    payQuotaButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 8,
    },
    payQuotaButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Currency Modal Styles
    currencyModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    currencyModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    currencyModalCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 4,
    },
    currencyModalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        marginTop: 8,
    },
    currencyTabs: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    currencyTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    currencyTabLeft: {
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        borderRightWidth: 0,
    },
    currencyTabRight: {
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    currencyTabActive: {
        backgroundColor: '#7B1FA2',
        borderColor: '#7B1FA2',
    },
    currencyTabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    currencyTabTextActive: {
        color: '#FFFFFF',
    },
    currencyAmountCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    currencyAmountLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    currencyAmountValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    currencyModalConfirmButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    currencyModalConfirmGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    currencyModalConfirmText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default HomeScreen;
