import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HowItWorksScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cómo Funciona</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>✨ Cómo Funciona el Crédito Mamá SAN en la App 📲</Text>
                <Text style={styles.intro}>
                    ¡Tu tienda favorita, ahora en tu app! Comprar afuera y pagar en cuotas es más fácil que nunca. Solo sigue estos 4 pasos y nosotros nos encargamos de todo.
                </Text>

                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>🚀 ¡Crea tu Carrito Global!</Text>
                    <Text style={styles.paragraph}>
                        Navega en tu tienda internacional favorita (Amazon, Shein, Walmart, etc.) directamente dentro de nuestra App.
                    </Text>
                    <Text style={styles.paragraph}>
                        Selecciona los productos que deseas y agrégalos a tu carrito Mamá SAN. ¡Arma tu pedido soñado!
                    </Text>
                </View>

                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>💳 Simula y Paga tu Inicial</Text>
                    <Text style={styles.paragraph}>
                        Al terminar, ve al Checkout y carga tu dirección de entrega.
                    </Text>
                    <Text style={styles.paragraph}>
                        El sistema calculará automáticamente tu Cuota Inicial y te mostrará el plan de Cuotas de Pago. Para la mayoría de los niveles, son 4 cuotas semanales fijas.
                    </Text>
                    <Text style={styles.paragraph}>
                        Realiza el pago de tu Cuota Inicial a través de la opción que prefieras. ¡Con esto tu orden queda perfeccionada!
                    </Text>
                </View>

                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>📦 ¡Nosotros Compramos por Ti!</Text>
                    <Text style={styles.paragraph}>
                        Una vez pagada tu Cuota Inicial, Mamá SAN adelanta la compra del producto en la tienda internacional.
                    </Text>
                    <Text style={styles.paragraph}>
                        Nos encargamos de toda la logística, el envío y los trámites.
                    </Text>
                </View>

                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>🔎 Control Total desde "Pedidos" y Recibe tu Compra</Text>
                    <Text style={styles.paragraph}>
                        ¡Lo más importante! Desde la sección "Pedidos" en la App, podrás hacer un seguimiento completo de tu proceso:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Historial de Pagos y Saldo Pendiente.</Text>
                        <Text style={styles.bulletItem}>• Nivel de Crédito y Categoría.</Text>
                        <Text style={styles.bulletItem}>• Estatus de tu Envío (desde la compra hasta la llegada a Venezuela).</Text>
                    </View>
                    <Text style={styles.paragraph}>
                        Cumple con el pago de tus cuotas.
                    </Text>
                    <Text style={styles.paragraph}>
                        Cuando hayas pagado todas tus cuotas, recibirás tus productos en la dirección que nos indicaste.
                    </Text>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>🚚 Detalles de Envío</Text>
                    <Text style={styles.paragraph}>
                        Las entregas se hacen hasta tu puerta.
                    </Text>
                    <Text style={styles.paragraph}>
                        Para ciertas ciudades, si no tenemos cobertura directa, el pedido se enviará a la oficina de ZOOM más cercana a tu domicilio para que puedas retirarlo cómodamente.
                    </Text>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>💡 Métodos de Pago Disponibles</Text>
                    <Text style={styles.paragraph}>
                        Para tu comodidad, aceptamos distintos métodos de pago en Bolívares o USD:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Bolívares: Pago Móvil, Transferencia Bancaria (Banco Digital de los Trabajadores) y Cobra Fácil.</Text>
                        <Text style={styles.bulletItem}>• USD: Zelle, Cash y Binance (USDT).</Text>
                    </View>
                </View>
            </ScrollView>
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
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#FF007F',
    },
    intro: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        color: '#444',
        lineHeight: 24,
    },
    stepContainer: {
        marginBottom: 25,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
        color: '#555',
    },
    sectionContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    bulletList: {
        marginLeft: 10,
        marginBottom: 10,
    },
    bulletItem: {
        fontSize: 15,
        lineHeight: 24,
        color: '#555',
        marginBottom: 5,
    },
});

export default HowItWorksScreen;
