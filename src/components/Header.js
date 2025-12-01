import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Header = ({ title, showBack = false }) => {
    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={['#FF007F', '#7B1FA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.leftContainer}>
                        {showBack ? (
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <Image
                                source={require('../../assets/mamasan-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                                tintColor="white" // Optional: make logo white if it's black
                            />
                        )}
                    </View>

                    <Text style={styles.title}>{title}</Text>

                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.profileIcon}>
                            <Ionicons name="person" size={20} color="#7B1FA2" />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    safeArea: {
        backgroundColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10, // Adjust based on status bar
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    logo: {
        width: 100,
        height: 40,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileIcon: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Header;
