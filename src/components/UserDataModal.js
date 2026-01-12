import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import CustomAlert from './CustomAlert';

const UserDataModal = ({ visible, onClose, onComplete, missingFields = [], existingData = {} }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locations, setLocations] = useState([]);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);

    // Custom Alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const [formData, setFormData] = useState({
        nombre: existingData.nombre || '',
        apellido: existingData.apellido || '',
        cedula: existingData.cedula || '',
        telefono: existingData.telefono || '',
        calle_avenida: '',
        numero_nombre_edificio: '',
        numero_apartamento: '',
        ciudad: '',
        estado: '',
        codigo_postal: '',
        referencias: '',
        cedula_imagen_base64: '',
        cedula_imagen_ext: ''
    });

    const [cedulaImageUri, setCedulaImageUri] = useState(null);
    const [selectedState, setSelectedState] = useState(null);

    useEffect(() => {
        if (visible) {
            loadLocations();
            // Reset form with existing data
            setFormData({
                nombre: existingData.nombre || '',
                apellido: existingData.apellido || '',
                cedula: existingData.cedula || '',
                telefono: existingData.telefono || '',
                calle_avenida: '',
                numero_nombre_edificio: '',
                numero_apartamento: '',
                ciudad: '',
                estado: '',
                codigo_postal: '',
                referencias: '',
                cedula_imagen_base64: '',
                cedula_imagen_ext: ''
            });
            setCedulaImageUri(null);
            setSelectedState(null);
        }
    }, [visible, existingData]);

    const loadLocations = async () => {
        setIsLoading(true);
        try {
            const response = await api.getLocations();
            if (response.success && response.data?.estados) {
                setLocations(response.data.estados);
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir la foto de tu cédula.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 2],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setCedulaImageUri(asset.uri);

            const uriParts = asset.uri.split('.');
            const ext = uriParts[uriParts.length - 1].toLowerCase();
            const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';

            setFormData(prev => ({
                ...prev,
                cedula_imagen_base64: `data:image/${validExt};base64,${asset.base64}`,
                cedula_imagen_ext: validExt
            }));
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar la foto de tu cédula.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 2],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setCedulaImageUri(asset.uri);

            setFormData(prev => ({
                ...prev,
                cedula_imagen_base64: `data:image/jpeg;base64,${asset.base64}`,
                cedula_imagen_ext: 'jpg'
            }));
        }
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.nombre.trim()) errors.push('Nombre');
        if (!formData.apellido.trim()) errors.push('Apellido');
        if (!formData.cedula.trim() || !/^[0-9]+$/.test(formData.cedula)) errors.push('Cédula (solo números)');
        if (!formData.telefono.trim()) errors.push('Teléfono');
        if (!formData.calle_avenida.trim()) errors.push('Calle/Avenida');
        if (!formData.numero_nombre_edificio.trim()) errors.push('Número/Edificio');
        if (!formData.ciudad.trim()) errors.push('Ciudad');
        if (!formData.estado.trim()) errors.push('Estado');

        if (missingFields.includes('cedula_imagen') && !formData.cedula_imagen_base64) {
            errors.push('Foto de cédula');
        }

        if (errors.length > 0) {
            Alert.alert('Campos requeridos', `Por favor completa los siguientes campos:\n\n• ${errors.join('\n• ')}`);
            return false;
        }

        // Validate phone format
        const phoneRegex = /^(0412|0414|0416|0422|0424|0426)[0-9]{7}$/;
        const cleanPhone = formData.telefono.replace(/[-\s]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            Alert.alert('Teléfono inválido', 'El teléfono debe tener el formato: 0414-1234567');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await api.completeUserData({
                ...formData,
                telefono: formData.telefono.replace(/[-\s]/g, '').replace(/(\d{4})(\d{7})/, '$1-$2')
            });

            if (response.success) {
                setAlertConfig({
                    title: '¡Genial! 🎉',
                    message: 'Tus datos fueron guardados exitosamente. ¡Ya puedes continuar con tu compra!',
                    type: 'success',
                    buttons: [
                        { text: 'Continuar', style: 'default', onPress: () => { setAlertVisible(false); onComplete && onComplete(); } }
                    ]
                });
                setAlertVisible(true);
            } else {
                setAlertConfig({
                    title: '¡Ups!',
                    message: response.error || 'No pudimos guardar tus datos. Por favor, intenta de nuevo.',
                    type: 'warning',
                    buttons: [
                        { text: 'Entendido', style: 'default', onPress: () => setAlertVisible(false) }
                    ]
                });
                setAlertVisible(true);
            }
        } catch (error) {
            console.error('Error submitting user data:', error);
            setAlertConfig({
                title: '¡Ups!',
                message: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
                type: 'warning',
                buttons: [
                    { text: 'Entendido', style: 'default', onPress: () => setAlertVisible(false) }
                ]
            });
            setAlertVisible(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectState = (state) => {
        setSelectedState(state);
        setFormData(prev => ({ ...prev, estado: state.nombre, ciudad: '' }));
        setShowStateModal(false);
    };

    const selectCity = (city) => {
        setFormData(prev => ({ ...prev, ciudad: city.nombre }));
        setShowCityModal(false);
    };

    const availableCities = selectedState?.ciudades || [];

    if (isLoading) {
        return (
            <Modal visible={visible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF007F" />
                        <Text style={styles.loadingText}>Cargando...</Text>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Completa tus datos</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subtitle}>
                            Necesitamos algunos datos para procesar tu pedido
                        </Text>

                        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                            {/* Nombre */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu nombre"
                                    value={formData.nombre}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, nombre: text }))}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Apellido */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Apellido *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu apellido"
                                    value={formData.apellido}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, apellido: text }))}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Cedula */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cédula *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Solo números (ej: 12345678)"
                                    value={formData.cedula}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, cedula: text.replace(/\D/g, '') }))}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Teléfono */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Teléfono *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0414-1234567"
                                    value={formData.telefono}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, telefono: text }))}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Foto Cédula */}
                            {missingFields.includes('cedula_imagen') && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Foto de tu cédula *</Text>
                                    <Text style={styles.helperText}>Sube una foto clara de tu cédula de identidad</Text>

                                    {cedulaImageUri ? (
                                        <View style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: cedulaImageUri }} style={styles.imagePreview} />
                                            <TouchableOpacity
                                                style={styles.removeImageButton}
                                                onPress={() => {
                                                    setCedulaImageUri(null);
                                                    setFormData(prev => ({ ...prev, cedula_imagen_base64: '', cedula_imagen_ext: '' }));
                                                }}
                                            >
                                                <Ionicons name="close-circle" size={28} color="#FF007F" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.imageButtonsContainer}>
                                            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                                                <Ionicons name="camera" size={24} color="#FF007F" />
                                                <Text style={styles.imageButtonText}>Tomar foto</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                                                <Ionicons name="images" size={24} color="#FF007F" />
                                                <Text style={styles.imageButtonText}>Galería</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.sectionDivider}>
                                <Text style={styles.sectionTitle}>Dirección de envío</Text>
                            </View>

                            {/* Estado */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Estado *</Text>
                                <TouchableOpacity
                                    style={styles.selectButton}
                                    onPress={() => setShowStateModal(true)}
                                >
                                    <Text style={formData.estado ? styles.selectText : styles.selectPlaceholder}>
                                        {formData.estado || 'Selecciona tu estado'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Ciudad */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ciudad *</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, !formData.estado && styles.selectDisabled]}
                                    onPress={() => formData.estado && setShowCityModal(true)}
                                    disabled={!formData.estado}
                                >
                                    <Text style={formData.ciudad ? styles.selectText : styles.selectPlaceholder}>
                                        {formData.ciudad || 'Selecciona tu ciudad'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Calle/Avenida */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Calle / Avenida *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Av. Libertador"
                                    value={formData.calle_avenida}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, calle_avenida: text }))}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Edificio/Casa */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Edificio / Casa / Número *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Edificio Torre Central"
                                    value={formData.numero_nombre_edificio}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, numero_nombre_edificio: text }))}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Apartamento */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Apartamento / Piso (opcional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Piso 5, Apto 5B"
                                    value={formData.numero_apartamento}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, numero_apartamento: text }))}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Código Postal */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Código Postal (opcional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: 1010"
                                    value={formData.codigo_postal}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, codigo_postal: text }))}
                                    keyboardType="numeric"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Referencias */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Referencias (opcional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Ej: Frente al parque, portón azul"
                                    value={formData.referencias}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, referencias: text }))}
                                    multiline
                                    numberOfLines={3}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                    <Text style={styles.submitButtonText}>Guardar y continuar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* State Selection Modal */}
            <Modal visible={showStateModal} animationType="slide" transparent>
                <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Selecciona tu estado</Text>
                            <TouchableOpacity onPress={() => setShowStateModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {locations.map((state, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.pickerItem}
                                    onPress={() => selectState(state)}
                                >
                                    <Text style={styles.pickerItemText}>{state.nombre}</Text>
                                    {formData.estado === state.nombre && (
                                        <Ionicons name="checkmark" size={22} color="#FF007F" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* City Selection Modal */}
            <Modal visible={showCityModal} animationType="slide" transparent>
                <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Selecciona tu ciudad</Text>
                            <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {availableCities.map((city, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.pickerItem}
                                    onPress={() => selectCity(city)}
                                >
                                    <Text style={styles.pickerItemText}>{city.nombre}</Text>
                                    {formData.ciudad === city.nombre && (
                                        <Ionicons name="checkmark" size={22} color="#FF007F" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: '90%',
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    formContainer: {
        maxHeight: 400,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    selectButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectDisabled: {
        opacity: 0.5,
    },
    selectText: {
        fontSize: 16,
        color: '#333',
    },
    selectPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    sectionDivider: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF007F',
    },
    imageButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    imageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0F5',
        borderRadius: 10,
        padding: 15,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FF007F',
        borderStyle: 'dashed',
    },
    imageButtonText: {
        color: '#FF007F',
        fontWeight: '600',
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#fff',
        borderRadius: 14,
    },
    submitButton: {
        backgroundColor: '#FF007F',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 15,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    // Picker Modal Styles
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    pickerModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: '70%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
    },
    pickerItemSubtext: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
});

export default UserDataModal;
