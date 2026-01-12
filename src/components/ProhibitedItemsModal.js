import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

const ProhibitedItemsModal = ({ visible, prohibitedItems, onClose }) => {
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [appealReason, setAppealReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appealResult, setAppealResult] = useState(null);

    if (!visible || prohibitedItems.length === 0) return null;

    const handleAppealPress = (item) => {
        setSelectedItem(item);
        setAppealReason('');
        setAppealResult(null);
        setShowAppealModal(true);
    };

    const handleSubmitAppeal = async () => {
        if (!appealReason.trim()) return;

        setIsSubmitting(true);
        try {
            // Log all possible ID fields
            console.log('[Appeal] DEBUG - All item fields:', Object.keys(selectedItem));
            console.log('[Appeal] selectedItem.id:', selectedItem.id);
            console.log('[Appeal] selectedItem.sku:', selectedItem.sku);
            console.log('[Appeal] selectedItem.asin:', selectedItem.asin);

            // Simply use the first available ID - no filtering
            const productExternalId = selectedItem.id || selectedItem.sku || selectedItem.asin || null;

            const appealData = {
                producto_nombre: selectedItem.title,
                motivo_apelacion: appealReason.trim(),
                producto_id_externo: productExternalId,
                producto_url: selectedItem.url || null,
                producto_imagen: selectedItem.image || null,
                producto_precio: selectedItem.price ? parseFloat(selectedItem.price) : null,
                proveedor: selectedItem.provider?.toLowerCase() || null,
                categoria_detectada: selectedItem.category || null,
                keyword_detectado: selectedItem.keyword || null,
                cod_articulo: null
            };

            console.log('[Appeal] Final producto_id_externo:', productExternalId);

            const response = await api.createAppeal(appealData);

            if (response.success) {
                setAppealResult('success');
            } else if (response.code === 'ALREADY_EXISTS') {
                setAppealResult('duplicate');
            } else {
                setAppealResult('error');
            }
        } catch (error) {
            console.error('Appeal submission error:', error);
            setAppealResult('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeAppealModal = () => {
        setShowAppealModal(false);
        setSelectedItem(null);
        setAppealReason('');
        setAppealResult(null);
    };

    const renderAppealResult = () => {
        if (appealResult === 'success') {
            return (
                <View style={styles.resultContainer}>
                    <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                    <Text style={styles.resultTitle}>¡Apelación Enviada!</Text>
                    <Text style={styles.resultText}>
                        Tu apelación ha sido recibida. Nuestro equipo la revisará y te notificaremos el resultado.
                    </Text>
                    <TouchableOpacity style={styles.resultButton} onPress={closeAppealModal}>
                        <Text style={styles.resultButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (appealResult === 'duplicate') {
            return (
                <View style={styles.resultContainer}>
                    <Ionicons name="information-circle" size={60} color="#FF9800" />
                    <Text style={styles.resultTitle}>Apelación Existente</Text>
                    <Text style={styles.resultText}>
                        Ya existe una apelación pendiente para este producto. Te notificaremos cuando sea revisada.
                    </Text>
                    <TouchableOpacity style={styles.resultButton} onPress={closeAppealModal}>
                        <Text style={styles.resultButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (appealResult === 'error') {
            return (
                <View style={styles.resultContainer}>
                    <Ionicons name="close-circle" size={60} color="#F44336" />
                    <Text style={styles.resultTitle}>Error</Text>
                    <Text style={styles.resultText}>
                        No pudimos enviar tu apelación. Por favor intenta nuevamente.
                    </Text>
                    <TouchableOpacity style={styles.resultButton} onPress={() => setAppealResult(null)}>
                        <Text style={styles.resultButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    return (
        <>
            {/* Main Prohibited Items Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible && !showAppealModal}
                onRequestClose={onClose}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={styles.header}>
                            <Ionicons name="warning" size={32} color="#FFCC00" />
                            <Text style={styles.modalTitle}>Artículos Restringidos</Text>
                        </View>

                        <Text style={styles.modalText}>
                            Los siguientes artículos no pueden ser agregados a tu carrito debido a regulaciones de envío.
                        </Text>

                        <FlatList
                            data={prohibitedItems}
                            keyExtractor={(item, index) => index.toString()}
                            style={styles.list}
                            renderItem={({ item }) => (
                                <View style={styles.itemContainer}>
                                    {item.image && (
                                        <Image source={{ uri: item.image }} style={styles.itemImage} />
                                    )}
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                                        <TouchableOpacity
                                            style={styles.itemAppealButton}
                                            onPress={() => handleAppealPress(item)}
                                        >
                                            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#7B1FA2" />
                                            <Text style={styles.itemAppealText}>Apelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />

                        <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
                            <Text style={styles.textStyle}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Appeal Form Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showAppealModal}
                onRequestClose={closeAppealModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.centeredView}
                >
                    <View style={styles.appealModalView}>
                        {appealResult ? (
                            renderAppealResult()
                        ) : (
                            <>
                                <View style={styles.appealHeader}>
                                    <TouchableOpacity onPress={closeAppealModal} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                    <Text style={styles.appealTitle}>Apelar Producto</Text>
                                </View>

                                {selectedItem && (
                                    <View style={styles.selectedItemPreview}>
                                        {selectedItem.image && (
                                            <Image source={{ uri: selectedItem.image }} style={styles.previewImage} />
                                        )}
                                        <Text style={styles.previewTitle} numberOfLines={2}>
                                            {selectedItem.title}
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.appealLabel}>
                                    ¿Por qué crees que este producto debería ser permitido?
                                </Text>

                                <TextInput
                                    style={styles.appealInput}
                                    placeholder="Ej: Este producto es un juguete para niños, no un artículo prohibido..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                    value={appealReason}
                                    onChangeText={setAppealReason}
                                    textAlignVertical="top"
                                />

                                <Text style={styles.charCount}>
                                    {appealReason.length}/500 caracteres
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        (!appealReason.trim() || isSubmitting) && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleSubmitAppeal}
                                    disabled={!appealReason.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Enviar Apelación</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#333',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        color: '#666',
    },
    list: {
        width: '100%',
        marginBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 5,
        marginRight: 10,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    itemAppealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: '#F3E5F5',
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    itemAppealText: {
        fontSize: 12,
        color: '#7B1FA2',
        fontWeight: '600',
        marginLeft: 4,
    },
    button: {
        borderRadius: 10,
        padding: 14,
        elevation: 2,
        width: '100%',
    },
    buttonClose: {
        backgroundColor: '#FF007F',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    appealModalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    appealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        padding: 5,
    },
    appealTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginRight: 29,
    },
    selectedItemPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
    },
    previewImage: {
        width: 45,
        height: 45,
        borderRadius: 8,
        marginRight: 12,
    },
    previewTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    appealLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    appealInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        minHeight: 120,
        backgroundColor: '#fafafa',
        color: '#333',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 5,
        marginBottom: 15,
    },
    submitButton: {
        backgroundColor: '#7B1FA2',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 10,
    },
    resultText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    resultButton: {
        backgroundColor: '#FF007F',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    resultButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProhibitedItemsModal;
