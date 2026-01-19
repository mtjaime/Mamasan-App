import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://pdjxswivcgiwzrfexiiw.supabase.co/functions/v1';

export const api = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', email, password }),
            });
            const data = await response.json();
            console.log('API Login Response:', JSON.stringify(data, null, 2));
            if (data.success && data.data?.session?.access_token) {
                console.log('API: Saving token to AsyncStorage');
                await AsyncStorage.setItem('userToken', data.data.session.access_token);
                await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
            } else {
                console.log('API: Login success but no token found in response');
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Register push notification token with backend
    registerPushToken: async (pushToken, userId, deviceName = null) => {
        try {
            console.log(`[API] Registering push token for user ${userId}`);
            const token = await AsyncStorage.getItem('userToken');
            const platform = require('react-native').Platform.OS;

            const response = await fetch(`${API_URL}/mobile-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'register_device',
                    token: pushToken,
                    platform: platform,
                    device_name: deviceName || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`
                }),
            });
            const data = await response.json();
            console.log('[API] Register Push Token Response:', data);
            return data;
        } catch (error) {
            console.error('Register Push Token error:', error);
            return { success: false, error: error.message };
        }
    },

    signup: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'signup', email, password }),
            });
            return await response.json();
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    },

    verifyEmail: async (email, code) => {
        try {
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify_email', email, code }),
            });
            return await response.json();
        } catch (error) {
            console.error('Verify Email error:', error);
            return { success: false, error: error.message };
        }
    },

    resendVerification: async (email) => {
        try {
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resend_verification', email }),
            });
            return await response.json();
        } catch (error) {
            console.error('Resend Verification error:', error);
            return { success: false, error: error.message };
        }
    },

    requestPasswordReset: async (email) => {
        try {
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanhzd2l2Y2dpd3pyZmV4aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzY5MzMsImV4cCI6MjA3MzYxMjkzM30.R4KTYo5wJpfMV33UbiHXvlv1rGWQLyZFq1F3UbRQxvg'
                },
                body: JSON.stringify({
                    action: 'request_password_reset',
                    email
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Request Password Reset error:', error);
            return { success: false, error: error.message };
        }
    },

    verifyResetCode: async (email, code, newPassword) => {
        try {
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanhzd2l2Y2dpd3pyZmV4aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzY5MzMsImV4cCI6MjA3MzYxMjkzM30.R4KTYo5wJpfMV33UbiHXvlv1rGWQLyZFq1F3UbRQxvg'
                },
                body: JSON.stringify({
                    action: 'verify_reset_code',
                    email,
                    code,
                    new_password: newPassword
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Verify Reset Code error:', error);
            return { success: false, error: error.message };
        }
    },

    getHomeData: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.log('[API] getHomeData: No token found');
                throw new Error('No token found');
            }

            console.log('[API] getHomeData: Fetching data with token...');
            const response = await fetch(`${API_URL}/mobile-home`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanhzd2l2Y2dpd3pyZmV4aWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzY5MzMsImV4cCI6MjA3MzYxMjkzM30.R4KTYo5wJpfMV33UbiHXvlv1rGWQLyZFq1F3UbRQxvg'
                },
            });
            const data = await response.json();
            console.log('[API] getHomeData response:', JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            console.error('[API] getHomeData error:', error);
            return { success: false, error: error.message };
        }
    },

    getCart: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'get' }),
            });
            return await response.json();
        } catch (error) {
            console.error('Get Cart error:', error);
            return { success: false, error: error.message };
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
    clearCart: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'clear' }),
            });
            return await response.json();
        } catch (error) {
            console.error('Clear Cart error:', error);
            return { success: false, error: error.message };
        }
    },
    addToMobileCart: async (product, quantity = 1) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log(`[API] Adding to cart: ${product.product_name}, Qty=${quantity}`);

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'add',
                    product: product,
                    cantidad: quantity
                }),
            });

            const text = await response.text();
            console.log(`[API] Response (${response.status}):`, text);

            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: false, error: `Server returned ${response.status}: ${text}` };
            }
        } catch (error) {
            console.error('Add to Mobile Cart error:', error);
            return { success: false, error: error.message };
        }
    },
    removeFromMobileCart: async (itemId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'remove',
                    cod_articulo: itemId
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Remove from Cart error:', error);
            return { success: false, error: error.message };
        }
    },
    updateMobileCartQuantity: async (itemId, quantity) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'update',
                    cod_articulo: itemId,
                    cantidad: quantity
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Update Cart Quantity error:', error);
            return { success: false, error: error.message };
        }
    },
    getAddresses: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'addresses'
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Get Addresses error:', error);
            return { success: false, error: error.message };
        }
    },
    getCities: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'cities'
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Get Cities error:', error);
            return { success: false, error: error.message };
        }
    },

    checkProhibitedProduct: async (productName, description = '', attributes = {}) => {
        try {
            console.log(`[API] Checking prohibited status for: ${productName}`);
            const response = await fetch(`${API_URL}/check-prohibited-products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productName,
                    descripcion: description,
                    atributos: attributes
                }),
            });
            const data = await response.json();
            console.log(`[API] Check Prohibited Response:`, data);
            return data;
        } catch (error) {
            console.error('Check Prohibited Product error:', error);
            // Default to allowed if check fails, but log error
            return { isProhibited: false, error: error.message };
        }
    },

    googleLogin: async (idToken) => {
        try {
            console.log('[API] Attempting Google Login with token...');
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'google_signin', id_token: idToken }),
            });
            const data = await response.json();
            console.log('API Google Login Response:', JSON.stringify(data, null, 2));

            if (data.success && data.data?.session?.access_token) {
                console.log('API: Saving Google session token');
                await AsyncStorage.setItem('userToken', data.data.session.access_token);
                await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
            }

            return data;
        } catch (error) {
            console.error('Google Login error:', error);
            return { success: false, error: error.message };
        }
    },

    appleLogin: async (identityToken) => {
        try {
            console.log('[API] Attempting Apple Login with token...');
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apple_signin', identity_token: identityToken }),
            });
            const data = await response.json();
            console.log('API Apple Login Response:', JSON.stringify(data, null, 2));

            if (data.success && data.data?.session?.access_token) {
                console.log('API: Saving Apple session token');
                await AsyncStorage.setItem('userToken', data.data.session.access_token);
                await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
            }

            return data;
        } catch (error) {
            console.error('Apple Login error:', error);
            return { success: false, error: error.message };
        }
    },

    deleteAccount: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Requesting account deletion...');
            const response = await fetch(`${API_URL}/mobile-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'delete_account' }),
            });
            const data = await response.json();
            console.log('API Delete Account Response:', JSON.stringify(data, null, 2));

            if (data.success) {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
            }

            return data;
        } catch (error) {
            console.error('Delete Account error:', error);
            return { success: false, error: error.message };
        }
    },

    addAddress: async (addressData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'add_address',
                    ...addressData
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('Add Address error:', error);
            return { success: false, error: error.message };
        }
    },

    createAppeal: async (appealData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Creating appeal for:', appealData.producto_nombre);
            console.log('[API] Full appealData received:', JSON.stringify(appealData, null, 2));

            const requestBody = {
                action: 'create',
                producto_nombre: appealData.producto_nombre,
                motivo_apelacion: appealData.motivo_apelacion,
                producto_id_externo: appealData.producto_id_externo || null,
                producto_url: appealData.producto_url || null,
                producto_imagen: appealData.producto_imagen || null,
                producto_precio: appealData.producto_precio || null,
                proveedor: appealData.proveedor || null,
                categoria_detectada: appealData.categoria_detectada || null,
                keyword_detectado: appealData.keyword_detectado || null,
                cod_articulo: appealData.cod_articulo || null
            };

            console.log('[API] Request body to send:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${API_URL}/mobile-appeal-prohibited-product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log('[API] Appeal Response:', data);
            return data;
        } catch (error) {
            console.error('Create Appeal error:', error);
            return { success: false, error: error.message };
        }
    },

    calculatePurchaseConditions: async (idVenta, contado = false) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Calculating purchase conditions for venta:', idVenta, 'contado:', contado);
            const response = await fetch(`${API_URL}/mobile-calculate-purchase-conditions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_venta: idVenta,
                    contado: contado
                }),
            });

            const data = await response.json();
            console.log('[API] Calculate Purchase Conditions Response:', data);
            return data;
        } catch (error) {
            console.error('Calculate Purchase Conditions error:', error);
            return { success: false, error: error.message };
        }
    },

    getInitialAmount: async (idVenta, moneda = 'USD') => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Getting initial amount for venta:', idVenta, 'moneda:', moneda);
            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'initial-amount',
                    id_venta: idVenta,
                    moneda: moneda
                }),
            });

            const data = await response.json();
            console.log('[API] Get Initial Amount Response:', data);
            return data;
        } catch (error) {
            console.error('Get Initial Amount error:', error);
            return { success: false, error: error.message };
        }
    },

    getQuotaAmount: async (idCuota, moneda = 'BS') => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Getting quota amount for cuota:', idCuota, 'moneda:', moneda);
            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'quota-amount',
                    id_cuota: idCuota,
                    moneda: moneda
                }),
            });

            const data = await response.json();
            console.log('[API] Get Quota Amount Response:', data);
            return data;
        } catch (error) {
            console.error('Get Quota Amount error:', error);
            return { success: false, error: error.message };
        }
    },

    getExchangeRate: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Getting exchange rate (Binance + TOFF)');
            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'rates'
                }),
            });

            const data = await response.json();
            console.log('[API] Get Exchange Rate Response:', data);
            return data;
        } catch (error) {
            console.error('Get Exchange Rate error:', error);
            return { success: false, error: error.message };
        }
    },

    getPaymentMethods: async (moneda = null) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const body = { action: 'methods' };
            if (moneda) {
                body.moneda = moneda;
            }

            console.log('[API] Getting payment methods for moneda:', moneda);
            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            console.log('[API] Get Payment Methods Response:', data);
            return data;
        } catch (error) {
            console.error('Get Payment Methods error:', error);
            return { success: false, error: error.message };
        }
    },

    submitInitialPayment: async (paymentData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Submitting initial payment:', paymentData);
            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'initial',
                    id_venta: paymentData.id_venta,
                    monto: paymentData.monto,
                    monto_bs: paymentData.monto_bs || null,
                    monto_transferido: paymentData.monto_transferido,
                    moneda: paymentData.moneda,
                    metodo_pago: paymentData.metodo_pago,
                    banco: paymentData.banco || null,
                    referencia: paymentData.referencia || null,
                    comprobante_base64: paymentData.comprobante_base64 || null
                }),
            });

            const data = await response.json();
            console.log('[API] Submit Initial Payment Response:', data);
            return data;
        } catch (error) {
            console.error('Submit Initial Payment error:', error);
            return { success: false, error: error.message };
        }
    },

    submitQuotaPayment: async (paymentData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Submitting quota payment:', paymentData);
            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'quota',
                    id_cuota: paymentData.id_cuota,
                    monto: paymentData.monto,
                    monto_bs: paymentData.monto_bs,
                    metodo_pago: paymentData.metodo_pago,
                    banco: paymentData.banco,
                    referencia: paymentData.referencia,
                    comprobante_base64: paymentData.comprobante_base64 || null
                }),
            });

            const data = await response.json();
            console.log('[API] Submit Quota Payment Response:', data);
            return data;
        } catch (error) {
            console.error('Submit Quota Payment error:', error);
            return { success: false, error: error.message };
        }
    },

    uploadPaymentReceipt: async (imageUri, saleId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Uploading payment receipt for sale:', saleId);

            // Create FormData for multipart upload
            const formData = new FormData();

            // Extract file extension and generate unique filename
            const uriParts = imageUri.split('.');
            const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
            const fileName = `comprobante_${saleId}_${Date.now()}.${fileExtension}`;

            // Append the image file
            formData.append('file', {
                uri: imageUri,
                type: `image/${fileExtension}`,
                name: fileName,
            });
            formData.append('action', 'upload-receipt');
            formData.append('id_venta', saleId.toString());
            formData.append('filename', fileName);

            const response = await fetch(`${API_URL}/mobile-payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Note: Don't set Content-Type for FormData, let it be set automatically
                },
                body: formData,
            });

            const data = await response.json();
            console.log('[API] Upload Receipt Response:', data);
            return data;
        } catch (error) {
            console.error('Upload Payment Receipt error:', error);
            return { success: false, error: error.message };
        }
    },

    getOrders: async (page = 1, limit = 20, estado = null) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const body = {
                action: 'list',
                page,
                limit
            };
            if (estado) {
                body.estado = estado;
            }

            console.log('[API] Getting orders, page:', page, 'limit:', limit, 'estado:', estado);
            const response = await fetch(`${API_URL}/mobile-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            console.log('[API] Get Orders Response:', data);
            return data;
        } catch (error) {
            console.error('Get Orders error:', error);
            return { success: false, error: error.message };
        }
    },

    getOrderDetail: async (idVenta) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Getting order detail for:', idVenta);
            const response = await fetch(`${API_URL}/mobile-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'detail',
                    id_venta: idVenta
                }),
            });

            const data = await response.json();
            console.log('[API] Get Order Detail Response:', data);
            return data;
        } catch (error) {
            console.error('Get Order Detail error:', error);
            return { success: false, error: error.message };
        }
    },

    cancelOrder: async (idVenta, cancelData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Requesting order cancellation:', idVenta, cancelData);
            const response = await fetch(`${API_URL}/mobile-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'cancel',
                    id_venta: idVenta,
                    motivo_solicitud: cancelData.motivo_solicitud,
                    telefono_pago_movil: cancelData.telefono_pago_movil,
                    banco_pago_movil: cancelData.banco_pago_movil,
                    cedula_titular_pago_movil: cancelData.cedula_titular_pago_movil
                }),
            });

            const data = await response.json();
            console.log('[API] Cancel Order Response:', data);
            return data;
        } catch (error) {
            console.error('Cancel Order error:', error);
            return { success: false, error: error.message };
        }
    },

    // Notifications API
    getNotificationsCount: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Getting notifications count');
            const response = await fetch(`${API_URL}/mobile-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'count' }),
            });

            const data = await response.json();
            console.log('[API] Notifications Count Response:', data);
            return data;
        } catch (error) {
            console.error('Get Notifications Count error:', error);
            return { success: false, error: error.message };
        }
    },

    getNotifications: async (page = 1, limit = 20, leida = null) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            const body = { action: 'list', page, limit };
            if (leida !== null) {
                body.leida = leida;
            }

            console.log('[API] Getting notifications, page:', page, 'limit:', limit, 'leida:', leida);
            const response = await fetch(`${API_URL}/mobile-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            console.log('[API] Get Notifications Response:', data);
            return data;
        } catch (error) {
            console.error('Get Notifications error:', error);
            return { success: false, error: error.message };
        }
    },

    markNotificationRead: async (idNotificacion) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Marking notification as read:', idNotificacion);
            const response = await fetch(`${API_URL}/mobile-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'read', id_notificacion: idNotificacion }),
            });

            const data = await response.json();
            console.log('[API] Mark Notification Read Response:', data);
            return data;
        } catch (error) {
            console.error('Mark Notification Read error:', error);
            return { success: false, error: error.message };
        }
    },

    markAllNotificationsRead: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Marking all notifications as read');
            const response = await fetch(`${API_URL}/mobile-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'read_all' }),
            });

            const data = await response.json();
            console.log('[API] Mark All Notifications Read Response:', data);
            return data;
        } catch (error) {
            console.error('Mark All Notifications Read error:', error);
            return { success: false, error: error.message };
        }
    },

    // Zoom Offices API
    getZoomOffices: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Getting Zoom offices');
            const response = await fetch(`${API_URL}/mobile-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'zoom_offices'
                }),
            });

            const data = await response.json();
            console.log('[API] Get Zoom Offices Response:', data);
            return data;
        } catch (error) {
            console.error('Get Zoom Offices error:', error);
            return { success: false, error: error.message };
        }
    },

    // User Data API - Check if user data is complete
    checkUserData: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Checking user data completeness');
            const response = await fetch(`${API_URL}/mobile-user-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'check' }),
            });

            const data = await response.json();
            console.log('[API] Check User Data Response:', data);
            return data;
        } catch (error) {
            console.error('Check User Data error:', error);
            return { success: false, error: error.message };
        }
    },

    // User Data API - Get available locations (states/cities)
    getLocations: async () => {
        try {
            console.log('[API] Getting available locations');
            const response = await fetch(`${API_URL}/mobile-user-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'locations' }),
            });

            const data = await response.json();
            console.log('[API] Get Locations Response:', data);
            return data;
        } catch (error) {
            console.error('Get Locations error:', error);
            return { success: false, error: error.message };
        }
    },

    // User Data API - Complete user profile with all data
    completeUserData: async (userData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Submitting complete user data');
            const response = await fetch(`${API_URL}/mobile-user-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'complete',
                    nombre: userData.nombre,
                    apellido: userData.apellido,
                    cedula: userData.cedula,
                    telefono: userData.telefono,
                    calle_avenida: userData.calle_avenida,
                    numero_nombre_edificio: userData.numero_nombre_edificio,
                    numero_apartamento: userData.numero_apartamento || '',
                    ciudad: userData.ciudad,
                    estado: userData.estado,
                    codigo_postal: userData.codigo_postal || '',
                    referencias: userData.referencias || '',
                    cedula_imagen_base64: userData.cedula_imagen_base64,
                    cedula_imagen_ext: userData.cedula_imagen_ext
                }),
            });

            const data = await response.json();
            console.log('[API] Complete User Data Response:', data);
            return data;
        } catch (error) {
            console.error('Complete User Data error:', error);
            return { success: false, error: error.message };
        }
    },

    // User Data API - Add new address
    addUserAddress: async (addressData) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) throw new Error('No token found');

            console.log('[API] Adding user address');
            const response = await fetch(`${API_URL}/mobile-user-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'address',
                    nombre_direccion: addressData.nombre_direccion || 'Dirección principal',
                    calle_avenida: addressData.calle_avenida,
                    numero_nombre_edificio: addressData.numero_nombre_edificio,
                    numero_apartamento: addressData.numero_apartamento || '',
                    ciudad: addressData.ciudad,
                    estado: addressData.estado,
                    codigo_postal: addressData.codigo_postal || '',
                    telefono_contacto: addressData.telefono_contacto || '',
                    referencias: addressData.referencias || '',
                    es_predeterminada: addressData.es_predeterminada !== false
                }),
            });

            const data = await response.json();
            console.log('[API] Add User Address Response:', data);
            return data;
        } catch (error) {
            console.error('Add User Address error:', error);
            return { success: false, error: error.message };
        }
    }
};
