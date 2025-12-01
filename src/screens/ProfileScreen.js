import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    SafeAreaView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleSwitch = () => setIsDarkMode((previousState) => !previousState);

    const renderMenuItem = (icon, title, hasArrow = true) => (
        <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon} size={24} color="#666" style={styles.menuIcon} />
                <Text style={styles.menuText}>{title}</Text>
            </View>
            {hasArrow && <Ionicons name="chevron-forward" size={24} color="#ccc" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileHeader}>
                    <Image
                        source={require('../../assets/mamasan-logo.png')}
                        style={styles.profileLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.profileName}>MAMA SAN</Text>
                    <Text style={styles.profileEmail}>info@mamasan.com</Text>
                </View>

                <Text style={styles.sectionTitle}>Support</Text>
                {renderMenuItem('settings-outline', 'How it works')}
                {renderMenuItem('people-outline', 'Affiliates and Referrals')}
                {renderMenuItem('help-circle-outline', 'FAQs')}

                <Text style={styles.sectionTitle}>About MAMA SAN</Text>
                {renderMenuItem('information-circle-outline', 'About Us')}
                {renderMenuItem('document-text-outline', 'Terms & Conditions')}
                {renderMenuItem('people-outline', 'Contact')}
                {renderMenuItem('newspaper-outline', 'Visit our Blog')}

                <View style={styles.darkModeContainer}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="sunny-outline" size={24} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Enable Dark Mode</Text>
                    </View>
                    <Switch
                        trackColor={{ false: '#767577', true: '#FF007F' }}
                        thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitch}
                        value={isDarkMode}
                    />
                </View>

                <TouchableOpacity style={styles.loginButton}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileLogo: {
        width: 150,
        height: 100,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileEmail: {
        color: '#666',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 15,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        marginRight: 15,
    },
    menuText: {
        fontSize: 16,
    },
    darkModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    loginButton: {
        backgroundColor: '#FF007F', // Fucsia
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
