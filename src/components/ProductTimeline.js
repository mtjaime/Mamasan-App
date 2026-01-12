import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tracking states in order
const TRACKING_STATES = [
    { key: 'ordered', label: 'Ordenado', icon: 'cart' },
    { key: 'purchased', label: 'Comprado', icon: 'bag-check' },
    { key: 'in_transit_usa', label: 'En tránsito USA', icon: 'airplane' },
    { key: 'warehouse', label: 'En almacén', icon: 'cube' },
    { key: 'shipping_vzla', label: 'Envío a Venezuela', icon: 'boat' },
    { key: 'delivered', label: 'Entregado', icon: 'checkmark-circle' },
];

// Map estado_compra to tracking step index
const getTrackingStep = (estado) => {
    const statusLower = estado?.toLowerCase() || '';

    if (statusLower.includes('entregado') || statusLower.includes('completado')) {
        return 5; // delivered
    } else if (statusLower.includes('envío venezuela') || statusLower.includes('en camino')) {
        return 4; // shipping_vzla
    } else if (statusLower.includes('almacén') || statusLower.includes('warehouse')) {
        return 3; // warehouse
    } else if (statusLower.includes('tránsito') || statusLower.includes('transit')) {
        return 2; // in_transit_usa
    } else if (statusLower.includes('comprado') || statusLower.includes('purchased')) {
        return 1; // purchased
    } else if (statusLower.includes('ordenado') || statusLower.includes('orden confirmada') || statusLower.includes('validacion')) {
        return 0; // ordered
    }
    return 0; // default to ordered
};

const ProductTimeline = ({ estado, compact = false }) => {
    const currentStep = getTrackingStep(estado);

    if (compact) {
        // Compact inline version
        return (
            <View style={styles.compactContainer}>
                {TRACKING_STATES.map((state, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <React.Fragment key={state.key}>
                            <View style={[
                                styles.compactDot,
                                isCompleted && styles.compactDotActive,
                                isCurrent && styles.compactDotCurrent
                            ]} />
                            {index < TRACKING_STATES.length - 1 && (
                                <View style={[
                                    styles.compactLine,
                                    index < currentStep && styles.compactLineActive
                                ]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        );
    }

    // Full version with labels
    return (
        <View style={styles.container}>
            <View style={styles.stepsContainer}>
                {TRACKING_STATES.map((state, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <View key={state.key} style={styles.stepWrapper}>
                            {/* Vertical connector line */}
                            {index > 0 && (
                                <View style={[
                                    styles.connectorLine,
                                    index <= currentStep && styles.connectorLineActive
                                ]} />
                            )}

                            {/* Step */}
                            <View style={styles.stepRow}>
                                <View style={[
                                    styles.stepCircle,
                                    isCompleted && styles.stepCircleCompleted,
                                    isCurrent && styles.stepCircleCurrent
                                ]}>
                                    <Ionicons
                                        name={isCompleted ? state.icon : `${state.icon}-outline`}
                                        size={16}
                                        color={isCompleted ? '#FFFFFF' : '#BDBDBD'}
                                    />
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[
                                        styles.stepLabel,
                                        isCompleted && styles.stepLabelCompleted,
                                        isCurrent && styles.stepLabelCurrent
                                    ]}>
                                        {state.label}
                                    </Text>
                                    {isCurrent && (
                                        <Text style={styles.currentBadge}>Actual</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Compact styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingVertical: 4,
    },
    compactDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    compactDotActive: {
        backgroundColor: '#4CAF50',
    },
    compactDotCurrent: {
        backgroundColor: '#FF007F',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    compactLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E0E0E0',
    },
    compactLineActive: {
        backgroundColor: '#4CAF50',
    },

    // Full version styles
    container: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    stepsContainer: {
        position: 'relative',
    },
    stepWrapper: {
        position: 'relative',
    },
    connectorLine: {
        position: 'absolute',
        left: 15,
        top: -16,
        width: 2,
        height: 16,
        backgroundColor: '#E0E0E0',
    },
    connectorLineActive: {
        backgroundColor: '#4CAF50',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleCompleted: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    stepCircleCurrent: {
        backgroundColor: '#FF007F',
        borderColor: '#FF007F',
        transform: [{ scale: 1.1 }],
    },
    stepContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    stepLabel: {
        fontSize: 14,
        color: '#9E9E9E',
    },
    stepLabelCompleted: {
        color: '#333',
    },
    stepLabelCurrent: {
        color: '#FF007F',
        fontWeight: '600',
    },
    currentBadge: {
        marginLeft: 8,
        fontSize: 10,
        color: '#FFFFFF',
        backgroundColor: '#FF007F',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
});

export default ProductTimeline;
