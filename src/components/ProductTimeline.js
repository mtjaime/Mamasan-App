import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tracking states in order based on estatus_shipping equivalences
// Note: "Extraviado" is only shown if the product is actually lost
const TRACKING_STATES = [
    { key: 'ordenado', label: 'Ordenado', icon: 'cart', apiValues: ['sin asignar'] },
    { key: 'comprado', label: 'Comprado', icon: 'bag-check', apiValues: ['estado inicial'] },
    { key: 'enviado_proveedor', label: 'Enviado Proveedor', icon: 'airplane', apiValues: ['enviado proveedor'] },
    { key: 'recibido_miami', label: 'Recibido Miami', icon: 'business', apiValues: ['recibido miami'] },
    { key: 'en_transito_ccs', label: 'En tránsito CCS', icon: 'boat', apiValues: ['en tránsito ccs'] },
    { key: 'recibido_ccs', label: 'Recibido Ccs', icon: 'cube', apiValues: ['recibido ccs'] },
    { key: 'por_entregar', label: 'Por entregar', icon: 'bicycle', apiValues: ['entregar ccs', 'entregar int.'] },
    { key: 'entregado', label: 'Entregado', icon: 'checkmark-circle', apiValues: ['entregado'] },
];

// Special state for lost items
const EXTRAVIADO_STATE = { key: 'extraviado', label: 'Extraviado', icon: 'alert-circle', apiValues: ['extraviado ve', 'extraviado us'] };

// Map estatus_shipping to tracking step index
const getTrackingStep = (estatusShipping) => {
    const statusLower = (estatusShipping || '').toLowerCase().trim();

    // Check for extraviado first
    if (EXTRAVIADO_STATE.apiValues.some(v => statusLower.includes(v.toLowerCase()))) {
        return { step: -1, isExtraviado: true }; // Special case for lost items
    }

    // Find matching step
    for (let i = TRACKING_STATES.length - 1; i >= 0; i--) {
        if (TRACKING_STATES[i].apiValues.some(v => statusLower.includes(v.toLowerCase()))) {
            return { step: i, isExtraviado: false };
        }
    }

    // Default to first step if no match
    return { step: 0, isExtraviado: false };
};

const ProductTimeline = ({ estatusShipping, compact = false }) => {
    const { step: currentStep, isExtraviado } = getTrackingStep(estatusShipping);

    if (compact) {
        // Compact inline version
        const states = isExtraviado ? [...TRACKING_STATES, EXTRAVIADO_STATE] : TRACKING_STATES;
        const displayStep = isExtraviado ? states.length - 1 : currentStep;

        return (
            <View style={styles.compactContainer}>
                {states.map((state, index) => {
                    const isCompleted = index <= displayStep;
                    const isCurrent = index === displayStep;
                    const isLost = state.key === 'extraviado';

                    return (
                        <React.Fragment key={state.key}>
                            <View style={[
                                styles.compactDot,
                                isCompleted && !isLost && styles.compactDotActive,
                                isCurrent && !isLost && styles.compactDotCurrent,
                                isLost && styles.compactDotLost
                            ]} />
                            {index < states.length - 1 && (
                                <View style={[
                                    styles.compactLine,
                                    index < displayStep && styles.compactLineActive
                                ]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        );
    }

    // Full version with labels
    const states = isExtraviado ? [...TRACKING_STATES, EXTRAVIADO_STATE] : TRACKING_STATES;
    const displayStep = isExtraviado ? states.length - 1 : currentStep;

    return (
        <View style={styles.container}>
            <View style={styles.stepsContainer}>
                {states.map((state, index) => {
                    const isCompleted = index <= displayStep;
                    const isCurrent = index === displayStep;
                    const isLost = state.key === 'extraviado';

                    return (
                        <View key={state.key} style={styles.stepWrapper}>
                            {/* Vertical connector line */}
                            {index > 0 && (
                                <View style={[
                                    styles.connectorLine,
                                    index <= displayStep && !isLost && styles.connectorLineActive,
                                    isLost && styles.connectorLineLost
                                ]} />
                            )}

                            {/* Step */}
                            <View style={styles.stepRow}>
                                <View style={[
                                    styles.stepCircle,
                                    isCompleted && !isLost && styles.stepCircleCompleted,
                                    isCurrent && !isLost && styles.stepCircleCurrent,
                                    isLost && styles.stepCircleLost
                                ]}>
                                    <Ionicons
                                        name={isCompleted ? state.icon : `${state.icon}-outline`}
                                        size={16}
                                        color={isCompleted || isLost ? '#FFFFFF' : '#BDBDBD'}
                                    />
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={[
                                        styles.stepLabel,
                                        isCompleted && !isLost && styles.stepLabelCompleted,
                                        isCurrent && !isLost && styles.stepLabelCurrent,
                                        isLost && styles.stepLabelLost
                                    ]}>
                                        {state.label}
                                    </Text>
                                    {isCurrent && (
                                        <Text style={[
                                            styles.currentBadge,
                                            isLost && styles.currentBadgeLost
                                        ]}>Actual</Text>
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
    compactDotLost: {
        backgroundColor: '#F44336',
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
    connectorLineLost: {
        backgroundColor: '#F44336',
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
    stepCircleLost: {
        backgroundColor: '#F44336',
        borderColor: '#F44336',
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
    stepLabelLost: {
        color: '#F44336',
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
    currentBadgeLost: {
        backgroundColor: '#F44336',
    },
});

export default ProductTimeline;
