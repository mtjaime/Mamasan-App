import React, { useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ToastAndroid,
    Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getScraperForUrl } from '../utils/scrapers';
import { useCart } from '../context/CartContext';
import CustomAlert from '../components/CustomAlert';

const WebViewScreen = ({ route, navigation }) => {
    const { url, name } = route.params;
    const [currentUrl, setCurrentUrl] = useState(url);
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const { mergeCart } = useCart();
    const [isLoadingExtraction, setIsLoadingExtraction] = useState(false);
    const [debugLogs, setDebugLogs] = useState([]);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: () => { },
        onCancel: () => { },
        showCancel: false,
        icon: 'checkmark-circle'
    });

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        setDebugLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 5));
    };

    const handleMessage = (event) => {
        console.log('WebView Message Raw:', event.nativeEvent.data);
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'LOG') {
                addLog(`WebView Log: ${data.message}`);
                if (data.message.includes('Handshake')) return;
            }

            // If we get any message (except handshake), stop loading
            setIsLoadingExtraction(false);

            if (data.type === 'CART_EXTRACTED') {
                addLog(`Success: ${data.payload.length} items`);
                const totalQty = data.payload.reduce((sum, item) => sum + (item.quantity || 1), 0);
                mergeCart(data.payload);

                setAlertConfig({
                    title: '¡Éxito!',
                    message: `Se extrajeron ${totalQty} productos.`,
                    confirmText: 'Ver Carrito',
                    cancelText: 'Cerrar',
                    onConfirm: () => {
                        setAlertVisible(false);
                        navigation.navigate('Main', { screen: 'Cart' });
                    },
                    onCancel: () => setAlertVisible(false),
                    showCancel: true,
                    icon: 'cart'
                });
                setAlertVisible(true);
            } else if (data.type === 'ERROR') {
                addLog(`Error: ${data.message}`);
                setAlertConfig({
                    title: 'Error',
                    message: data.message,
                    confirmText: 'OK',
                    showCancel: false,
                    onConfirm: () => setAlertVisible(false),
                    icon: 'alert-circle'
                });
                setAlertVisible(true);
            }
        } catch (error) {
            addLog(`Parse Error: ${error.message}`);
            setIsLoadingExtraction(false);
        }
    };

    const handleCheckOut = () => {
        addLog(`CheckOut Pressed: ${currentUrl.substring(0, 15)}...`);
        setIsLoadingExtraction(true);

        if (webViewRef.current) {
            const scraperScript = getScraperForUrl(currentUrl);
            addLog('Injecting Scraper (Single Step)...');

            // Wrap in try-catch and immediate execution
            const injection = `
                (function() {
                    try {
                        alert('Injection Started');
                        ${scraperScript}
                    } catch(e) {
                        alert('Injection Error: ' + e.toString());
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: 'Injection Crash: ' + e.toString()}));
                    }
                })();
                true;
            `;

            webViewRef.current.injectJavaScript(injection);

            // Safety Timeout
            setTimeout(() => {
                setIsLoadingExtraction((prev) => {
                    if (prev) {
                        addLog('Timeout: No response in 8s');
                        Alert.alert('Timeout', 'El script no respondió. ¿Viste la alerta "Injection Started"?');
                        return false;
                    }
                    return prev;
                });
            }, 8000);
        } else {
            addLog('Error: WebView ref null');
            setIsLoadingExtraction(false);
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

            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    style={styles.webview}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={['*']}
                    mixedContentMode="always"
                    onMessage={handleMessage}
                    onNavigationStateChange={(navState) => {
                        setCanGoBack(navState.canGoBack);
                        setCanGoForward(navState.canGoForward);
                        if (navState.url) {
                            setCurrentUrl(navState.url);
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
                        <Text style={styles.loadingText}>Extrayendo...</Text>
                    </View>
                )}

                {/* Debug Console Overlay */}
                <View style={styles.debugConsole}>
                    {debugLogs.map((log, i) => (
                        <Text key={i} style={styles.debugText}>{log}</Text>
                    ))}
                </View>
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

                <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
                    <Text style={styles.checkOutText}>Check Out</Text>
                </TouchableOpacity>
            </View>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.showCancel ? alertConfig.onCancel : undefined}
                icon={alertConfig.icon}
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
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
});

export default WebViewScreen;
