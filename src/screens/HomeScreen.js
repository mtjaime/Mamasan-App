import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    // Mock user data
    const user = {
        name: 'Maria',
        limit: 500,
        used: 150,
        level: 'Bronce'
    };

    const progress = 66; // Progreso al siguiente nivel

    // Lista de tiendas con URLs de logotipos reales
    const featuredStores = [
        { name: 'Amazon', logo: require('../../assets/amazon_logo.png') },
        { name: 'Shein', logo: require('../../assets/shein_logo.png') },
        { name: 'Walmart', logo: 'https://logo.clearbit.com/walmart.com' },
        { name: 'Temu', logo: 'https://logo.clearbit.com/temu.com' },
        { name: 'Nike', logo: require('../../assets/nike_logo.png') },
        { name: 'Adidas', logo: 'https://logo.clearbit.com/adidas.com' },
    ];

    const onNavigateToStore = (storeName) => {
        // Simple navigation logic based on store name
        // In a real app, you might pass specific URLs or IDs
        navigation.navigate('Shop', { store: storeName });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.welcomeText}>Bienvenida de nuevo,</Text>
                        <Text style={styles.userName}>Hola, {user.name}</Text>
                    </View>
                    {/* Botón de Notificaciones */}
                    <TouchableOpacity style={styles.notificationButton}>
                        <Feather name="bell" size={22} color="#7B1FA2" />
                        {/* Indicador de notificación (punto rojo) */}
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                </View>

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
                                onPress={() => onNavigateToStore(store.name)}
                                style={styles.storeButton}
                            >
                                {/* Contenedor del Logo REDONDO SIN TEXTO ABAJO */}
                                <View style={styles.storeLogoContainer}>
                                    <Image
                                        source={typeof store.logo === 'string' ? { uri: store.logo } : store.logo}
                                        style={[
                                            styles.storeLogo,
                                            store.name === 'Amazon' && { width: 65, height: 65, backgroundColor: 'white', borderRadius: 32.5 }
                                        ]}
                                        resizeMode="contain"
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => onNavigateToStore('Google')}
                            style={styles.storeButton}
                        >
                            <View style={[styles.storeLogoContainer, styles.moreStoreContainer]}>
                                <Feather name="external-link" size={24} color="#9CA3AF" />
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
                                    <Text style={styles.walletTitle}>Tu Billetera</Text>
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
                                        <Text style={styles.amountMain}>{user.limit - user.used}</Text>
                                        <Text style={styles.amountDecimal}>.00</Text>
                                    </View>
                                </View>

                                <View style={styles.debtContainer}>
                                    <Text style={styles.balanceLabel}>DEUDA</Text>
                                    <Text style={styles.debtAmount}>${user.used}</Text>
                                </View>
                            </View>

                            {/* Barra visual de uso de crédito */}
                            <View>
                                <View style={styles.progressLabels}>
                                    <Text style={styles.progressLabel}>Consumo del límite</Text>
                                    <Text style={styles.progressLabel}>Total ${user.limit}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={['#FF007F', '#ff5c8d']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${(user.used / user.limit) * 100}%` }]}
                                    />
                                </View>
                            </View>
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
                                <Text style={styles.levelValue}>{user.level} 🥉</Text>
                                <View style={styles.levelProgressBg}>
                                    <View style={[styles.levelProgressFill, { width: `${progress}%` }]} />
                                </View>
                                <Text style={styles.levelNextText}>Faltan 2 compras para Plata</Text>
                            </View>
                            <View style={styles.nextLevelBadge}>
                                <Text style={styles.nextLevelLabel}>Siguiente</Text>
                                <Text style={styles.nextLevelValue}>Plata</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

            </ScrollView>
        </View>
    );
};

// --- COMPONENTE DE CARRUSEL DE OFERTAS ---
const OffersCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            title: "40% OFF en Envíos",
            subtitle: "Solo para las 10 primeras personas 🏃‍♀️",
            colors: ['#2E0249', '#5a189a'],
            iconName: 'flash', // Ionicons
            tag: "Flash Sale"
        },
        {
            id: 2,
            title: "Gift Card de $25",
            subtitle: "¡Gratis con tu primera compra!",
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
        paddingTop: Platform.OS === 'android' ? 40 : 20,
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
        width: 128,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    levelProgressFill: {
        height: '100%',
        backgroundColor: '#FF007F',
        borderRadius: 3,
    },
    levelNextText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    nextLevelBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextLevelLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    nextLevelValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default HomeScreen;
