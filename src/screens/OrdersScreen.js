import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const ESTADOS_FILTER = [
    { key: null, label: 'Todos' },
    { key: 'validacion', label: 'En revisión' },
    { key: 'en proceso', label: 'Por entregar' },
    { key: 'completado', label: 'Entregados' },
    { key: 'cancelada', label: 'Cancelados' },
];

const FECHA_FILTER = [
    { key: 'today', label: 'Hoy', days: 0 },
    { key: '7', label: 'Esta Semana', days: 7 },
    { key: '30', label: 'Este Mes', days: 30 },
    { key: '90', label: 'Últimos 3 Meses', days: 90 },
    { key: 'custom', label: 'Personalizado', days: null },
];

const OrdersScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [selectedDateFilter, setSelectedDateFilter] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [meta, setMeta] = useState(null);

    const fetchOrders = async (pageNum = 1, estado = selectedFilter, dateFilter = selectedDateFilter, isRefresh = false) => {
        try {
            if (pageNum === 1) {
                if (!isRefresh) setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await api.getOrders(pageNum, 20, estado);

            if (response.success) {
                let newOrders = response.data?.orders || [];

                // Filter by date if dateFilter is set
                if (dateFilter && dateFilter !== null) {
                    if (dateFilter === 'custom' && customStartDate && customEndDate) {
                        // Custom date range
                        const startDate = new Date(customStartDate);
                        startDate.setHours(0, 0, 0, 0);
                        const endDate = new Date(customEndDate);
                        endDate.setHours(23, 59, 59, 999);
                        newOrders = newOrders.filter(order => {
                            const orderDate = new Date(order.fecha_creacion);
                            return orderDate >= startDate && orderDate <= endDate;
                        });
                    } else if (dateFilter === 'today') {
                        // Today filter
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        newOrders = newOrders.filter(order => {
                            const orderDate = new Date(order.fecha_creacion);
                            return orderDate >= today && orderDate < tomorrow;
                        });
                    } else {
                        const filterDays = FECHA_FILTER.find(f => f.key === dateFilter)?.days;
                        if (filterDays && filterDays > 0) {
                            const cutoffDate = new Date();
                            cutoffDate.setDate(cutoffDate.getDate() - filterDays);
                            cutoffDate.setHours(0, 0, 0, 0);
                            newOrders = newOrders.filter(order => {
                                const orderDate = new Date(order.fecha_creacion);
                                return orderDate >= cutoffDate;
                            });
                        }
                    }
                }

                // Sort by id_venta descending (highest order number first)
                newOrders = newOrders.sort((a, b) => b.id_venta - a.id_venta);

                if (pageNum === 1) {
                    setOrders(newOrders);
                } else {
                    setOrders(prev => [...prev, ...newOrders]);
                }

                setMeta(response.meta);
                setHasMore(pageNum < (response.meta?.totalPages || 1));
                setPage(pageNum);
            } else {
                console.error('Error fetching orders:', response.error);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders(1, selectedFilter, selectedDateFilter, false);
        }, [selectedFilter, selectedDateFilter])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(1, selectedFilter, selectedDateFilter, true);
    };

    const loadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            fetchOrders(page + 1, selectedFilter, selectedDateFilter, false);
        }
    };

    const onFilterChange = (filter) => {
        setSelectedFilter(filter);
        setPage(1);
        setOrders([]);
        setLoading(true);
    };

    const onDateFilterChange = (filter) => {
        setSelectedDateFilter(filter);
        setPage(1);
        setOrders([]);
        setLoading(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get gradient colors for status
    const getStatusGradient = (status) => {
        switch (status?.toLowerCase()) {
            case 'entregado':
            case 'completado':
                return ['#4CAF50', '#66BB6A']; // Green gradient
            case 'orden confirmada':
            case 'en proceso':
            case 'por entregar':
                return ['#FF007F', '#FF5C8D']; // Fucsia gradient
            case 'pago en revisión':
            case 'verificación adicional':
            case 'validacion':
            case 'validacion_secundaria':
                return ['#7B1FA2', '#9C27B0']; // Purple gradient
            case 'pago rechazado':
            case 'cancelada':
            case 'cancelada por mora':
            case 'rechazado':
            case 'cancelado por mora':
                return ['#9E9E9E', '#BDBDBD']; // Gray gradient for canceled
            default:
                return ['#9E9E9E', '#BDBDBD']; // Gray gradient
        }
    };

    const navigateToDetail = (orderId) => {
        navigation.navigate('OrderDetail', { orderId });
    };

    // Transform status display text
    const getDisplayStatus = (status) => {
        if (status?.toLowerCase() === 'orden confirmada') {
            return 'Por entregar';
        }
        return status;
    };

    const renderFilterItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.filterChip,
                selectedFilter === item.key && styles.filterChipActive
            ]}
            onPress={() => onFilterChange(item.key)}
        >
            <Text style={[
                styles.filterChipText,
                selectedFilter === item.key && styles.filterChipTextActive
            ]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigateToDetail(item.id_venta)}
            activeOpacity={0.7}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Orden #{item.id_venta}</Text>
                <LinearGradient
                    colors={getStatusGradient(item.estado_display)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.statusBadge}
                >
                    <Text style={styles.statusText}>{getDisplayStatus(item.estado_display)}</Text>
                </LinearGradient>
            </View>
            <View style={styles.orderDetails}>
                <View style={styles.orderInfoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#757575" />
                    <Text style={styles.orderInfoText}>{formatDate(item.fecha_creacion)}</Text>
                </View>
                <Text style={styles.orderTotal}>${formatCurrency(item.monto_total_venta)}</Text>
            </View>
            <View style={styles.orderFooter}>
                <View style={styles.orderInfoRow}>
                    <Ionicons name="cube-outline" size={14} color="#757575" />
                    <Text style={styles.orderInfoText}>{item.numero_articulos} artículo(s)</Text>
                </View>
                {item.numero_cuotas > 0 && (
                    <View style={styles.orderInfoRow}>
                        <Ionicons name="card-outline" size={14} color="#757575" />
                        <Text style={styles.orderInfoText}>{item.numero_cuotas} cuotas</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>
                {selectedFilter ? 'No hay pedidos con este filtro' : 'No tienes pedidos aún'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {selectedFilter
                    ? 'Intenta con otro filtro o visualiza todos los pedidos'
                    : 'Cuando realices una compra, tus pedidos aparecerán aquí'
                }
            </Text>
            {!selectedFilter && (
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => navigation.navigate('Shop')}
                >
                    <Text style={styles.shopButtonText}>Ir a comprar</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#E91E63" />
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mis Pedidos</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.loadingText}>Cargando pedidos...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Mis Pedidos</Text>
                    {meta?.total > 0 && (
                        <Text style={styles.totalCount}>{meta.total} pedido(s)</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => setShowDateModal(true)}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={24}
                        color={selectedDateFilter ? '#FF007F' : '#757575'}
                    />
                    {selectedDateFilter && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>
                                {FECHA_FILTER.find(f => f.key === selectedDateFilter)?.label}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Status Filter Chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={ESTADOS_FILTER}
                    renderItem={renderFilterItem}
                    keyExtractor={(item) => item.key || 'all'}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id_venta?.toString()}
                contentContainerStyle={orders.length === 0 ? styles.emptyListContainer : styles.listContainer}
                ListEmptyComponent={renderEmptyList}
                ListFooterComponent={renderFooter}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#E91E63']}
                        tintColor="#E91E63"
                    />
                }
            />

            {/* Date Filter Modal */}
            <Modal
                visible={showDateModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDateModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDateModal(false)}
                >
                    <View style={styles.dateModalContainer} onStartShouldSetResponder={() => true}>
                        {/* Header with close button */}
                        <View style={styles.dateModalHeader}>
                            <View style={styles.dateModalBrandRow}>
                                <Ionicons name="cart" size={24} color="#FF007F" />
                                <Text style={styles.dateModalBrand}>Mamá SAN</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.dateModalCloseButton}
                                onPress={() => setShowDateModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#757575" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.dateModalTitle}>Filtra por Fecha</Text>

                        {/* Filter Options as Pills */}
                        <View style={styles.filterPillsContainer}>
                            {FECHA_FILTER.map((item) => (
                                <TouchableOpacity
                                    key={item.key || 'date-all'}
                                    style={[
                                        styles.filterPill,
                                        selectedDateFilter === item.key && styles.filterPillActive
                                    ]}
                                    onPress={() => {
                                        if (item.key === 'custom') {
                                            if (!customStartDate) {
                                                const start = new Date();
                                                start.setDate(start.getDate() - 30);
                                                setCustomStartDate(start);
                                            }
                                            if (!customEndDate) {
                                                setCustomEndDate(new Date());
                                            }
                                            setSelectedDateFilter('custom');
                                        } else {
                                            // Apply filter immediately and close modal
                                            setSelectedDateFilter(item.key);
                                            onDateFilterChange(item.key);
                                            setShowDateModal(false);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.filterPillText,
                                        selectedDateFilter === item.key && styles.filterPillTextActive
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {selectedDateFilter === item.key && (
                                        <View style={styles.filterPillCheck}>
                                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom date range */}
                        {selectedDateFilter === 'custom' && (
                            <View style={styles.customDateSection}>
                                <View style={styles.customDateRow}>
                                    <TouchableOpacity
                                        style={styles.customDatePicker}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <Text style={styles.customDateLabel}>Desde</Text>
                                        <Text style={styles.customDateValue}>
                                            {customStartDate ? customStartDate.toLocaleDateString('es-VE') : 'Seleccionar'}
                                        </Text>
                                    </TouchableOpacity>

                                    <Ionicons name="arrow-forward" size={20} color="#FF007F" />

                                    <TouchableOpacity
                                        style={styles.customDatePicker}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <Text style={styles.customDateLabel}>Hasta</Text>
                                        <Text style={styles.customDateValue}>
                                            {customEndDate ? customEndDate.toLocaleDateString('es-VE') : 'Seleccionar'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Action Buttons - Only show when custom is selected */}
                        {selectedDateFilter === 'custom' && (
                            <View style={styles.dateModalActions}>
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => {
                                        setSelectedDateFilter(null);
                                        setCustomStartDate(null);
                                        setCustomEndDate(null);
                                        onDateFilterChange(null);
                                        setShowDateModal(false);
                                    }}
                                >
                                    <Ionicons name="close" size={18} color="#666" />
                                    <Text style={styles.clearButtonText}>Limpiar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.applyFilterButton}
                                    onPress={() => {
                                        if (customStartDate && customEndDate) {
                                            fetchOrders(1, selectedFilter, 'custom', false);
                                        }
                                        setShowDateModal(false);
                                    }}
                                >
                                    <Text style={styles.applyFilterButtonText}>Aplicar Filtro</Text>
                                    <Ionicons name="heart" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={customStartDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                        setShowStartPicker(false);
                        if (date) setCustomStartDate(date);
                    }}
                    maximumDate={customEndDate || new Date()}
                    accentColor="#FF007F"
                    themeVariant="light"
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={customEndDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                        setShowEndPicker(false);
                        if (date) setCustomEndDate(date);
                    }}
                    minimumDate={customStartDate}
                    maximumDate={new Date()}
                    accentColor="#FF007F"
                    themeVariant="light"
                />
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerLeft: {
        flex: 1,
    },
    totalCount: {
        fontSize: 14,
        color: '#757575',
    },
    calendarButton: {
        padding: 8,
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FF007F',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    filterBadgeText: {
        fontSize: 8,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContainer: {
        backgroundColor: '#FFF5F8',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
        width: '90%',
        maxWidth: 360,
    },
    dateModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateModalBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateModalCloseButton: {
        padding: 4,
    },
    dateModalBrand: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF007F',
        marginLeft: 8,
    },
    dateModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    filterPillsContainer: {
        marginBottom: 16,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFE4EC',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    filterPillActive: {
        backgroundColor: '#FF007F',
    },
    filterPillText: {
        fontSize: 15,
        color: '#C41E5A',
        fontWeight: '500',
    },
    filterPillTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    filterPillCheck: {
        marginLeft: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customDateSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    customDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    customDatePicker: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    customDateLabel: {
        fontSize: 11,
        color: '#9E9E9E',
        marginBottom: 4,
    },
    customDateValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    dateModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    clearButtonText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    applyFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF007F',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    applyFilterButtonText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 8,
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterList: {
        paddingHorizontal: 15,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
    },
    filterChipActive: {
        backgroundColor: '#E91E63',
    },
    filterChipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    dateFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#F8F9FA',
    },
    dateFilterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dateFilterChipActive: {
        backgroundColor: '#FF007F',
        borderColor: '#FF007F',
    },
    dateFilterChipText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    dateFilterChipTextActive: {
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#757575',
    },
    listContainer: {
        padding: 15,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    orderInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderInfoText: {
        fontSize: 13,
        color: '#757575',
        marginLeft: 5,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E91E63',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        lineHeight: 20,
    },
    shopButton: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 25,
    },
    shopButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default OrdersScreen;
