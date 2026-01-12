import React, { useRef, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ToastAndroid,
    Platform,
    BackHandler,
    StatusBar,
    Animated,
    Easing,
    Dimensions,
    Modal,
    Image,
    Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getScraperForUrl, isCartPage, getCartUrl } from '../utils/scrapers';
import { useCart } from '../context/CartContext';
import CustomAlert from '../components/CustomAlert';
import { analyzeProducts } from '../services/ProductAnalysisService';
import ProhibitedItemsModal from '../components/ProhibitedItemsModal';
import { api } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MarqueeBanner = () => {
    const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

    useEffect(() => {
        const startAnimation = () => {
            translateX.setValue(SCREEN_WIDTH);
            Animated.loop(
                Animated.timing(translateX, {
                    toValue: -SCREEN_WIDTH * 1.5, // Scroll completely off screen
                    duration: 15000, // Slower speed
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        startAnimation();
    }, []);

    return (
        <View style={styles.marqueeContainer}>
            <Animated.Text style={[styles.marqueeText, { transform: [{ translateX }] }]}>
                Recuerda que debes presionar el botón <Text style={{ color: '#FF007F', fontWeight: '900' }}>Agregar al Carrito</Text> de Mamá SAN
            </Animated.Text>
        </View>
    );
};

const WebViewScreen = ({ route, navigation }) => {
    const { url, name } = route.params;
    const [currentUrl, setCurrentUrl] = useState(url);
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const { mergeCart, clearCart, cartItems, fetchCart } = useCart();
    const [isLoadingExtraction, setIsLoadingExtraction] = useState(false);
    const [isNavigatingToCart, setIsNavigatingToCart] = useState(false);
    const [debugLogs, setDebugLogs] = useState([]);
    const [showTutorial, setShowTutorial] = useState(false);

    // Shein Popup State
    const [showSheinPopup, setShowSheinPopup] = useState(false);
    const [hasShownSheinPopup, setHasShownSheinPopup] = useState(false);

    // Amazon Popup State (show first 3 times)
    const [showAmazonPopup, setShowAmazonPopup] = useState(false);
    const [hasCheckedAmazonPopup, setHasCheckedAmazonPopup] = useState(false);

    useEffect(() => {
        const checkTutorial = async () => {
            try {
                const countStr = await AsyncStorage.getItem('webview_tutorial_count');
                const count = parseInt(countStr || '0', 10);
                if (count < 4) {
                    setShowTutorial(true);
                    await AsyncStorage.setItem('webview_tutorial_count', (count + 1).toString());
                }
            } catch (e) {
                console.error('Tutorial check error', e);
            }
        };
        checkTutorial();
    }, []);

    const closeTutorial = () => setShowTutorial(false);

    // Check and show Amazon popup for first 3 visits
    const checkAndShowAmazonPopup = async () => {
        if (hasCheckedAmazonPopup) return;
        setHasCheckedAmazonPopup(true);

        try {
            const countStr = await AsyncStorage.getItem('amazon_zipcode_popup_count');
            const count = parseInt(countStr || '0', 10);
            if (count < 3) {
                setShowAmazonPopup(true);
                await AsyncStorage.setItem('amazon_zipcode_popup_count', (count + 1).toString());
            }
        } catch (e) {
            console.error('Amazon popup check error', e);
        }
    };


    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: []
    });

    // Prohibited Items State
    const [prohibitedItems, setProhibitedItems] = useState([]);
    const [showProhibitedModal, setShowProhibitedModal] = useState(false);

    // Pending success alert (to show after prohibited modal closes)
    const [pendingSuccessAlert, setPendingSuccessAlert] = useState(null);

    // Helper to close alert
    const closeAlert = () => setAlertVisible(false);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 5));
    };

    // Android Hardware Back Button Handler
    useEffect(() => {
        const onBackPress = () => {
            if (webViewRef.current && canGoBack) {
                webViewRef.current.goBack();
                return true; // Prevent default behavior (exit app)
            }
            return false; // Default behavior (exit screen/app)
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            onBackPress
        );

        return () => backHandler.remove();
    }, [canGoBack]);

    const handleMessage = (event) => {
        console.log('WebView Message Raw:', event.nativeEvent.data);
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'LOG') {
                addLog(`WebView Log: ${data.message}`);
                if (data.message.includes('Handshake')) return;
            }

            // DEBUG: Log raw scraper data to Metro console
            if (data.type === 'DEBUG') {
                console.log('===== SCRAPER DEBUG =====');
                console.log(data.message);
                console.log('=========================');
                return;
            }

            // Loading will be dismissed when popup is shown, not immediately
            setIsNavigatingToCart(false); // Reset nav flag

            if (data.type === 'CART_EXTRACTED') {
                addLog(`Success: ${data.payload.length} items`);
                const newItems = data.payload;

                // Validate Items - handle both old format (price, quantity) and new format (product_price, cantidad)
                const validItems = newItems.filter(item => {
                    const p = parseFloat(item.price || item.product_price);
                    const q = parseInt(item.quantity || item.cantidad, 10);
                    const hasTitle = !!(item.title || item.product_name);
                    return hasTitle && !isNaN(p) && p > 0 && !isNaN(q) && q > 0;
                });

                if (validItems.length < newItems.length) {
                    addLog(`Warning: ${newItems.length - validItems.length} items had invalid price/qty`);
                }

                const totalQty = validItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);

                if (newItems.length === 0) {
                    setIsLoadingExtraction(false);
                    setAlertConfig({
                        title: 'No se detectaron productos',
                        message: 'No pudimos leer los productos de tu carrito. Asegúrate de estar en la página del carrito y que los productos sean visibles.',
                        buttons: [{ text: 'OK', onPress: closeAlert }]
                    });
                    setAlertVisible(true);
                    return;
                }

                if (validItems.length === 0) {
                    setIsLoadingExtraction(false);
                    setAlertConfig({
                        title: 'Error de Datos',
                        message: 'Se encontraron productos pero sin precio válido. Intenta recargar la página.',
                        buttons: [{ text: 'OK', onPress: closeAlert }]
                    });
                    setAlertVisible(true);
                    return;
                }

                const processMerge = async (shouldClear) => {
                    // Analyze Products via API
                    const allowed = [];
                    const prohibited = [];

                    // Show a toast or log that we are verifying items
                    addLog('Verificando productos prohibidos...');

                    for (const item of validItems) {
                        try {
                            const itemTitle = item.title || item.product_name;
                            const itemPrice = item.price || item.product_price;
                            const itemUrl = item.url || item.product_url;
                            const checkResult = await api.checkProhibitedProduct(
                                itemTitle,
                                item.description || '',
                                { price: itemPrice, url: itemUrl, provider: item.provider }
                            );

                            if (checkResult.isProhibited) {
                                console.log('[WebView] Item marked as prohibited:', JSON.stringify(item, null, 2));
                                prohibited.push({
                                    ...item,
                                    sku: item.sku || item.asin || item.id || null,
                                    asin: item.sku || item.asin || null,
                                    reason: checkResult.reason || 'Producto prohibido por regulaciones.',
                                    category: checkResult.category || null,
                                    keyword: checkResult.keyword || null
                                });
                            } else if (checkResult.error) {
                                // API returned an error (e.g. validation)
                                addLog(`API Check Error: ${checkResult.error}`);
                                // Treat as allowed for now but warn? Or maybe block if we want strictness?
                                // Let's block it if it's an error to be safe, or at least alert.
                                // Actually, if "productName is required" and we sent it, something is wrong.
                                // Let's treat as allowed to avoid blocking valid items due to glitches, but log it.
                                allowed.push({
                                    ...item,
                                    weight: 1.0,
                                    volume: 0.01
                                });
                            } else {
                                // Allowed
                                allowed.push({
                                    ...item,
                                    weight: 1.0,
                                    volume: 0.01
                                });
                            }
                        } catch (e) {
                            console.error("Error checking product:", e);
                            // If check fails, we treat it as allowed but log it. 
                            // Ideally, we should maybe warn the user, but for now let's keep it allowed 
                            // to avoid blocking users due to API errors.
                            // However, let's log it visibly.
                            addLog(`Check Error: ${e.message}`);
                            allowed.push({
                                ...item,
                                weight: 1.0,
                                volume: 0.01
                            });
                        }
                    }

                    // Process allowed items first (add to cart)
                    let successCount = 0;
                    let failCount = 0;

                    if (allowed.length > 0) {
                        // API Integration: Add items one by one
                        for (const item of allowed) {
                            try {
                                const quantity = parseInt(item.quantity || item.cantidad, 10) || 1;
                                const itemTitle = item.title || item.product_name;
                                const itemPrice = item.price || item.product_price;
                                const itemImage = item.image || item.product_image;
                                const itemUrl = item.url || item.product_url;

                                // Construct product object for API
                                const productObj = {
                                    product_name: itemTitle,
                                    product_price: itemPrice,
                                    product_image: itemImage,
                                    product_url: itemUrl || url,
                                    source: item.provider ? item.provider.toLowerCase() : 'external',
                                    asin: item.asin || (item.sku !== 'N/A' ? item.sku : item.id),
                                    color: item.color || '',
                                    talla: item.talla || item.size || ''
                                };

                                addLog(`Sending: ${(itemTitle || 'Unknown').substring(0, 20)}...`);
                                console.log(`[WebView] Sending payload:`, JSON.stringify(productObj, null, 2));
                                const response = await api.addToMobileCart(productObj, quantity);

                                if (response.success) {
                                    addLog(`API Success!`, 'success');
                                    successCount++;
                                } else {
                                    const errorMsg = response.error?.message || JSON.stringify(response.error) || 'Unknown error';
                                    addLog(`API Error: ${errorMsg}`, 'error');
                                    console.error(`Failed to add item: ${itemTitle || item.title || 'Unknown'}`, response.error);
                                    failCount++;
                                }
                            } catch (err) {
                                const errStr = err.message || JSON.stringify(err);
                                addLog(`Try/Catch Error: ${errStr}`, 'error');
                                console.error(`Error adding item: ${itemTitle || item.title || 'Unknown'}`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
                                failCount++;
                            }
                        }

                        // Refresh cart context
                        if (fetchCart) {
                            addLog('Refreshing Cart...');
                            await fetchCart();
                        }
                    }

                    // Prepare success alert config
                    const successAlertConfig = {
                        title: successCount > 0 ? '¡Listo!' : 'Hubo un problema',
                        message: successCount > 0
                            ? `Hemos agregado ${successCount} producto(s) a tu carrito de Mamá SAN correctamente.`
                            : 'No pudimos agregar los productos. Por favor intenta de nuevo.',
                        type: successCount > 0 ? 'success' : 'danger',
                        buttons: [
                            {
                                text: 'Seguir Comprando',
                                style: 'cancel',
                                onPress: () => closeAlert()
                            },
                            {
                                text: 'Ir al Carrito',
                                style: 'default',
                                onPress: () => {
                                    closeAlert();
                                    navigation.navigate('Main', { screen: 'Cart' });
                                }
                            }
                        ]
                    };

                    // Flow: If prohibited items exist, show them FIRST
                    if (prohibited.length > 0) {
                        setProhibitedItems(prohibited);
                        // If we also added items, save the success alert for later
                        if (allowed.length > 0) {
                            setPendingSuccessAlert(successAlertConfig);
                        }
                        setIsLoadingExtraction(false); // Dismiss loading before showing popup
                        setShowProhibitedModal(true);
                    } else if (allowed.length > 0) {
                        // No prohibited items, show success alert directly
                        setIsLoadingExtraction(false); // Dismiss loading before showing popup
                        setAlertConfig(successAlertConfig);
                        setAlertVisible(true);
                    } else {
                        // No items at all
                        setIsLoadingExtraction(false);
                    }
                };

                // Always add items to cart (merge mode)
                processMerge(false);
            } else if (data.type === 'ERROR') {
                addLog(`Error: ${data.message}`);
                setIsLoadingExtraction(false);
                setAlertConfig({
                    title: 'Aviso',
                    message: data.message,
                    type: 'sad',
                    buttons: [{ text: 'OK', onPress: closeAlert }]
                });
                setAlertVisible(true);
            }
        } catch (error) {
            addLog(`Parse Error: ${error.message}`);
            setIsLoadingExtraction(false);
        }
    };

    const runExtraction = () => {
        if (webViewRef.current) {
            const scraperScript = getScraperForUrl(currentUrl);
            addLog('Injecting Scraper...');

            const injection = `
                (function() {
                    try {
                        ${scraperScript}
                    } catch(e) {
                        console.error('Injection Error:', e);
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: 'Injection Crash: ' + e.toString()}));
                    }
                })();
                true;
            `;
            webViewRef.current.injectJavaScript(injection);

            // Safety Timeout - increased to 15s for slower connections/pages
            setTimeout(() => {
                setIsLoadingExtraction((prev) => {
                    if (prev) {
                        addLog('Timeout: No response in 15s');
                        return false;
                    }
                    return prev;
                });
            }, 15000);
        }
    };

    const handleCheckOut = () => {
        addLog(`CheckOut Pressed: ${currentUrl.substring(0, 15)}...`);
        setIsLoadingExtraction(true);

        if (isCartPage(currentUrl)) {
            addLog('On Cart Page. Extracting...');
            runExtraction();
        } else {
            const cartUrl = getCartUrl(currentUrl);
            if (cartUrl) {
                addLog(`Redirecting to Cart: ${cartUrl}`);
                setIsNavigatingToCart(true);
                // Navigate
                const redirectScript = `window.location.href = '${cartUrl}'; true;`;
                webViewRef.current.injectJavaScript(redirectScript);
            } else {
                addLog('Unknown Store Cart URL. Trying extraction anyway...');
                runExtraction();
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{name}</Text>
                <View style={{ width: 24 }} />
            </View>

            <MarqueeBanner />

            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    style={styles.webview}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={['*']}
                    mixedContentMode="always"
                    injectedJavaScript={`
                        (function() {
                            // Override window.open to navigate in same window
                            window.open = function(url, target, features) {
                                if (url && url.startsWith('http')) {
                                    window.location.href = url;
                                }
                                return null;
                            };
                            
                            // Convert target="_blank" links to normal navigation
                            document.addEventListener('click', function(e) {
                                var target = e.target;
                                while (target && target.tagName !== 'A') {
                                    target = target.parentElement;
                                }
                                if (target && target.tagName === 'A') {
                                    var href = target.getAttribute('href');
                                    var linkTarget = target.getAttribute('target');
                                    if (linkTarget === '_blank' && href && href.startsWith('http')) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = href;
                                    }
                                }
                            }, true);
                        })();
                        true;
                    `}
                    injectedJavaScriptBeforeContentLoaded={`
                        window.open = function(url) {
                            if (url && url.startsWith('http')) {
                                window.location.href = url;
                            }
                            return null;
                        };
                        true;
                    `}
                    setSupportMultipleWindows={false}
                    nestedScrollEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    onOpenWindow={(syntheticEvent) => {
                        // Capture links trying to open new windows and navigate within WebView
                        const { nativeEvent } = syntheticEvent;
                        if (nativeEvent.targetUrl && webViewRef.current) {
                            console.log('[WebView] Intercepted new window:', nativeEvent.targetUrl);
                            webViewRef.current.injectJavaScript(`window.location.href = '${nativeEvent.targetUrl}'; true;`);
                        }
                    }}
                    onMessage={handleMessage}
                    onShouldStartLoadWithRequest={(request) => {
                        const requestUrl = request.url;

                        // Allow http, https, about, data, and blob schemes (normal web navigation)
                        if (requestUrl.startsWith('http://') ||
                            requestUrl.startsWith('https://') ||
                            requestUrl.startsWith('about:') ||
                            requestUrl.startsWith('data:') ||
                            requestUrl.startsWith('blob:')) {
                            return true;
                        }

                        // Block app-specific schemes that would crash the WebView
                        if (requestUrl.startsWith('intent://') ||
                            requestUrl.startsWith('aliexpress://') ||
                            requestUrl.startsWith('market://') ||
                            requestUrl.startsWith('tel:') ||
                            requestUrl.startsWith('mailto:') ||
                            requestUrl.startsWith('whatsapp:') ||
                            requestUrl.startsWith('fb:') ||
                            requestUrl.startsWith('twitter:')) {
                            console.log('[WebView] Blocking special scheme:', requestUrl.substring(0, 30));
                            return false; // Don't load in WebView, don't open externally
                        }

                        // Allow any other scheme by default to avoid breaking navigation
                        console.log('[WebView] Allowing unknown scheme:', requestUrl.substring(0, 50));
                        return true;
                    }}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error:', nativeEvent);
                        // Don't show error for scheme issues - the page will continue to work
                    }}
                    onNavigationStateChange={(navState) => {
                        setCanGoBack(navState.canGoBack);
                        setCanGoForward(navState.canGoForward);
                        if (navState.url) {
                            setCurrentUrl(navState.url);
                            // Check for Amazon
                            if (navState.url.includes('amazon.com')) {
                                checkAndShowAmazonPopup();
                            }
                            // Check for Shein
                            if (navState.url.includes('shein') && !hasShownSheinPopup) {
                                setShowSheinPopup(true);
                                setHasShownSheinPopup(true);
                            }
                        }
                    }}
                    onLoadEnd={() => {
                        if (isNavigatingToCart) {
                            addLog('Navigated to Cart. Starting Extraction...');
                            setIsNavigatingToCart(false);
                            // Delay to ensure DOM and JS data is fully ready (increased for TEMU)
                            setTimeout(() => {
                                runExtraction();
                            }, 3000);
                        }
                    }}
                    startInLoadingState
                    renderLoading={() => (
                        <ActivityIndicator
                            style={StyleSheet.absoluteFill}
                            size="large"
                            color="#FF007F"
                        />
                    )}
                />
                {isLoadingExtraction && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Agregando productos al carrito...</Text>
                    </View>
                )}
            </View>

            <View style={styles.bottomBar}>
                <View style={styles.navButtons}>
                    <TouchableOpacity
                        disabled={!canGoBack}
                        onPress={() => webViewRef.current.goBack()}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={30}
                            color={canGoBack ? 'black' : '#ccc'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled={!canGoForward}
                        onPress={() => webViewRef.current.goForward()}
                        style={{ marginLeft: 20 }}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={30}
                            color={canGoForward ? 'black' : '#ccc'}
                        />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={require('../../assets/mamasan-logo.png')}
                        style={{ width: 40, height: 40, marginRight: 10 }}
                        resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
                        <Text style={styles.checkOutText}>Agregar al Carrito</Text>
                    </TouchableOpacity>
                </View>
            </View >

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={closeAlert}
            />

            <ProhibitedItemsModal
                visible={showProhibitedModal}
                prohibitedItems={prohibitedItems}
                onClose={() => {
                    setShowProhibitedModal(false);
                    // Show pending success alert after closing prohibited modal
                    if (pendingSuccessAlert) {
                        setAlertConfig(pendingSuccessAlert);
                        setPendingSuccessAlert(null);
                        setTimeout(() => setAlertVisible(true), 300); // Small delay for smooth transition
                    }
                }}
            />

            {/* Shein Instruction Popup */}
            <Modal
                transparent={true}
                visible={showSheinPopup}
                animationType="fade"
                onRequestClose={() => setShowSheinPopup(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="information-circle" size={50} color="#FF007F" />
                        <Text style={styles.modalTitle}>¡Atención!</Text>
                        <Text style={styles.modalText}>
                            Recuerda marcar con un check ☑️ los productos que quieres comprar en el carrito de Shein antes de agregarlos.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowSheinPopup(false)}
                        >
                            <Text style={styles.modalButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Amazon Zipcode Instruction Popup */}
            <Modal
                transparent={true}
                visible={showAmazonPopup}
                animationType="fade"
                onRequestClose={() => setShowAmazonPopup(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="cart" size={50} color="#FF007F" />
                        <Text style={styles.modalTitle}>🛒 ¿Cómo comprar?</Text>

                        <View style={{ width: '100%', marginTop: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <View style={{ backgroundColor: '#FF007F', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>1</Text>
                                </View>
                                <Text style={[styles.modalText, { flex: 1, marginBottom: 0, textAlign: 'left' }]}>
                                    Navega por Amazon y agrega los productos que deseas a <Text style={{ fontWeight: 'bold' }}>tu carrito de Amazon</Text>.
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <View style={{ backgroundColor: '#FF007F', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>2</Text>
                                </View>
                                <Text style={[styles.modalText, { flex: 1, marginBottom: 0, textAlign: 'left' }]}>
                                    Luego presiona el botón <Text style={{ fontWeight: 'bold', color: '#FF007F' }}>"Agregar al Carrito"</Text> de Mamá SAN para importarlos.
                                </Text>
                            </View>
                        </View>

                        <View style={{ backgroundColor: '#FFF0F5', padding: 12, borderRadius: 10, marginTop: 10, width: '100%' }}>
                            <Text style={[styles.modalText, { marginBottom: 5, fontSize: 13 }]}>
                                📍 <Text style={{ fontWeight: 'bold' }}>Importante:</Text> Usa el código postal:
                            </Text>
                            <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#FF007F', textAlign: 'center' }}>33126</Text>
                            <Text style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>(Miami, Florida - USA)</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowAmazonPopup(false)}
                        >
                            <Text style={styles.modalButtonText}>¡Entendido!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Store Tutorial Popup */}
            <Modal
                transparent={true}
                visible={showTutorial}
                animationType="fade"
                onRequestClose={closeTutorial}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 340 }]}>
                        <Ionicons name="cart" size={50} color="#FF007F" />
                        <Text style={styles.modalTitle}>¡De la tienda a tu casa!</Text>
                        <Text style={[styles.modalText, { fontSize: 14, color: '#888', marginBottom: 15 }]}>Guía rápida de compra</Text>

                        <View style={{ width: '100%', alignItems: 'flex-start' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>1️⃣</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>Busca tus productos en la tienda</Text>
                                    <Text style={{ fontSize: 12, color: '#666' }}>Navega normalmente y encuentra lo que quieres</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>2️⃣</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>Agrégalos al carrito de la tienda</Text>
                                    <Text style={{ fontSize: 12, color: '#666' }}>Usa el botón "Add to Cart" o "Agregar al carrito"</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>3️⃣</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>Revisa tu carrito antes de extraer</Text>
                                    <Text style={{ fontSize: 12, color: '#666' }}>Asegúrate de que los productos estén visibles y no estén agrupados u ocultos</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>4️⃣</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>Presiona <Text style={{ color: '#FF007F' }}>"Agregar al Carrito"</Text> de Mamá SAN</Text>
                                    <Text style={{ fontSize: 12, color: '#666' }}>¡Y listo! Nosotros nos encargamos del resto 🎉</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalButton, { marginTop: 15 }]}
                            onPress={closeTutorial}
                        >
                            <Text style={styles.modalButtonText}>¡Entendido!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
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
        padding: 15,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    marqueeContainer: {
        backgroundColor: '#fff',
        paddingVertical: 8,
        overflow: 'hidden',
        width: '100%',
    },
    marqueeText: {
        color: '#7B1FA2',
        fontWeight: 'bold',
        fontSize: 14,
        width: SCREEN_WIDTH * 2, // Ensure enough width for text
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
        width: '85%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#333',
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
        lineHeight: 22,
    },
    modalButton: {
        backgroundColor: '#FF007F',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    webview: {
        flex: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    navButtons: {
        flexDirection: 'row',
    },
    checkOutButton: {
        backgroundColor: '#FF007F', // Fucsia
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    checkOutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    debugConsole: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        maxHeight: 150,
    },
    debugText: {
        color: '#00FF00',
        fontFamily: 'monospace',
        fontSize: 10,
        marginBottom: 2,
    },
    tutorialOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 200,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingBottom: 80,
        paddingRight: 20,
    },
    tutorialContent: {
        alignItems: 'center',
        maxWidth: 200,
    },
    tutorialText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    tutorialButton: {
        marginTop: 10,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tutorialButtonText: {
        color: '#FF007F',
        fontWeight: 'bold',
    },
});

export default WebViewScreen;
