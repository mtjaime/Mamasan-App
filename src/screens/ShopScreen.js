import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STORES = [
    { id: '1', name: 'Amazon', url: 'https://www.amazon.com/?language=es_US', logo: require('../../assets/amazon_logo.png'), color: '#FF9900' },
    { id: '2', name: 'AliExpress', url: 'https://www.aliexpress.us', logo: 'https://logo.clearbit.com/aliexpress.com', color: '#FF4747' },
    { id: '3', name: 'Newegg', url: 'https://www.newegg.com', logo: 'https://logo.clearbit.com/newegg.com', color: '#FFA300' },
    { id: '4', name: 'Nike USA', url: 'https://www.nike.com/us/es/', logo: require('../../assets/nike_logo.png'), color: '#000' },
    { id: '5', name: 'TEMU USA', url: 'https://www.temu.com/us', logo: 'https://logo.clearbit.com/temu.com', color: '#FB7701' },
    { id: '6', name: 'SHEIN USA', url: 'https://us.shein.com', logo: require('../../assets/shein_logo.png'), color: '#000' },
    { id: '7', name: 'Walmart', url: 'https://www.walmart.com', logo: 'https://logo.clearbit.com/walmart.com', color: '#0071DC' },
    // Add more stores as needed
];

const ShopScreen = ({ navigation }) => {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.storeCard}
            onPress={() => navigation.navigate('WebView', { url: item.url, name: item.name })}
        >
            <View style={[
                styles.iconCircle,
                { backgroundColor: 'white' }
            ]}>
                <Image
                    source={typeof item.logo === 'string' ? { uri: item.logo } : item.logo}
                    style={[
                        styles.storeLogo,
                        item.name === 'Amazon' && { width: 65, height: 65, backgroundColor: 'white', borderRadius: 32.5 }
                    ]}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.storeName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stores</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <TextInput style={styles.searchInput} placeholder="Search stores" />
                <Ionicons name="search" size={24} color="#666" style={styles.searchIcon} />
            </View>

            <FlatList
                data={STORES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.grid}
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
        padding: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 20,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 15,
    },
    searchIcon: {
        marginLeft: 10,
    },
    grid: {
        paddingHorizontal: 10,
    },
    storeCard: {
        flex: 1,
        alignItems: 'center',
        marginBottom: 30,
        marginHorizontal: 5,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 10,
    },
    storeName: {
        fontSize: 14,
        textAlign: 'center',
    },
    storeLogo: {
        width: 50,
        height: 50,
    },
});

export default ShopScreen;
