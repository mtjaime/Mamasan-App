import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, buttons = [], onClose, type = 'warning' }) => {
    if (!visible) return null;

    // Default button if none provided
    const actionButtons = buttons.length > 0 ? buttons : [
        { text: 'OK', onPress: onClose, style: 'default' }
    ];

    const getIconConfig = () => {
        switch (type) {
            case 'danger':
                return { name: "trash-outline", color: "#FF0000", style: styles.dangerIcon };
            case 'success':
                return { name: "checkmark-circle-outline", color: "#4CD964", style: styles.successIcon };
            case 'sad':
                return { name: "sad-outline", color: "#FF007F", style: styles.warningIcon };
            default:
                return { name: "alert-outline", color: "#FF007F", style: styles.warningIcon };
        }
    };

    const iconConfig = getIconConfig();

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    <View style={[styles.iconContainer, iconConfig.style]}>
                        <Ionicons
                            name={iconConfig.name}
                            size={32}
                            color={iconConfig.color}
                        />
                    </View>

                    {title && <Text style={styles.title}>{title}</Text>}
                    {message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.buttonContainer}>
                        {actionButtons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    btn.style === 'cancel' ? styles.cancelButton : (btn.style === 'destructive' ? styles.dangerButton : styles.defaultButton),
                                    actionButtons.length > 1 ? { flex: 1, marginHorizontal: 6 } : { paddingHorizontal: 40 }
                                ]}
                                onPress={() => {
                                    if (btn.onPress) btn.onPress();
                                    if (!btn.preventClose) onClose();
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    btn.style === 'cancel' ? styles.cancelButtonText : styles.defaultButtonText
                                ]}>
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    warningIcon: {
        backgroundColor: '#FFF0F5', // Light pink
    },
    dangerIcon: {
        backgroundColor: '#FFEBEE', // Light red
    },
    successIcon: {
        backgroundColor: '#E8F5E9', // Light green
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF007F', // Mamá SAN Pink
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginTop: 8,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    defaultButton: {
        backgroundColor: '#FF007F', // Mamá SAN Pink
        shadowColor: "#FF007F",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    dangerButton: {
        backgroundColor: '#FF3B30', // Red
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
    },
    defaultButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButtonText: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomAlert;
