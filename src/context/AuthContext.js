import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user data on app start
        const checkSession = async () => {
            try {
                console.log('AuthContext: Checking session...');
                const userData = await AsyncStorage.getItem('userData');
                const token = await AsyncStorage.getItem('userToken');

                console.log('AuthContext: Token exists:', !!token);
                console.log('AuthContext: UserData exists:', !!userData);

                if (userData && token) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        console.log('AuthContext: Restoring session for:', parsedUser?.email);
                        setUser(parsedUser);
                    } catch (parseError) {
                        console.error('AuthContext: Error parsing userData, clearing session');
                        await AsyncStorage.removeItem('userData');
                        await AsyncStorage.removeItem('userToken');
                    }
                } else if (token && !userData) {
                    // Token exists but no user data - corrupted state, clear everything
                    console.log('AuthContext: Corrupted state (token without userData), clearing...');
                    await AsyncStorage.removeItem('userToken');
                } else if (!token && userData) {
                    // User data exists but no token - corrupted state, clear everything
                    console.log('AuthContext: Corrupted state (userData without token), clearing...');
                    await AsyncStorage.removeItem('userData');
                } else {
                    console.log('AuthContext: No session found');
                }
            } catch (error) {
                console.error('AuthContext: Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signIn = async (email, password) => {
        console.log('AuthContext: Attempting login for', email);
        const response = await api.login(email, password);
        console.log('AuthContext: Login response success:', response.success);

        if (response.success) {
            console.log('AuthContext: Setting user:', response.data?.user?.email);
            setUser(response.data.user);
            return response.data;
        } else {
            console.error('AuthContext: Login failed:', response.error);
            throw new Error(response.error || 'Login failed');
        }
    };

    const signUp = async (email, password) => {
        const response = await api.signup(email, password);
        if (response.success) {
            // Note: Signup might not automatically log in depending on API logic, 
            // but usually returns user data. Adjust if needed.
            if (response.data?.user) {
                setUser(response.data.user);
            }
            return response.data;
        } else {
            throw new Error(response.error || 'Signup failed');
        }
    };

    const googleSignIn = async (idToken) => {
        console.log('AuthContext: Attempting Google Login');
        const response = await api.googleLogin(idToken);
        if (response.success) {
            console.log('AuthContext: Google Login success', response.data?.user?.email);

            // After successful Google login, fetch full user data from /mobile-home
            // This ensures we have the same data as regular login users (credit, level, etc.)
            try {
                console.log('AuthContext: Fetching full user data from mobile-home...');
                const homeData = await api.getHomeData();
                if (homeData.success && homeData.data?.user) {
                    console.log('AuthContext: Got full user data, updating user state');
                    // Merge the home data user with the auth response user
                    const fullUserData = {
                        ...response.data.user,
                        ...homeData.data.user,
                    };
                    setUser(fullUserData);
                    // Update stored userData with the full data
                    await AsyncStorage.setItem('userData', JSON.stringify(fullUserData));
                    return { ...response.data, user: fullUserData };
                } else {
                    console.log('AuthContext: Could not fetch home data, using auth response user');
                    setUser(response.data.user);
                    return response.data;
                }
            } catch (homeError) {
                console.error('AuthContext: Error fetching home data:', homeError);
                setUser(response.data.user);
                return response.data;
            }
        } else {
            console.error('AuthContext: Google Login failed:', response.error);
            throw new Error(response.error || 'Google Login failed');
        }
    };

    const appleSignIn = async (identityToken) => {
        console.log('AuthContext: Attempting Apple Login');
        const response = await api.appleLogin(identityToken);
        if (response.success) {
            console.log('AuthContext: Apple Login success', response.data?.user?.email);

            // After successful Apple login, fetch full user data from /mobile-home
            try {
                console.log('AuthContext: Fetching full user data from mobile-home...');
                const homeData = await api.getHomeData();
                if (homeData.success && homeData.data?.user) {
                    console.log('AuthContext: Got full user data, updating user state');
                    const fullUserData = {
                        ...response.data.user,
                        ...homeData.data.user,
                    };
                    setUser(fullUserData);
                    await AsyncStorage.setItem('userData', JSON.stringify(fullUserData));
                    return { ...response.data, user: fullUserData };
                } else {
                    console.log('AuthContext: Could not fetch home data, using auth response user');
                    setUser(response.data.user);
                    return response.data;
                }
            } catch (homeError) {
                console.error('AuthContext: Error fetching home data:', homeError);
                setUser(response.data.user);
                return response.data;
            }
        } else {
            console.error('AuthContext: Apple Login failed:', response.error);
            throw new Error(response.error || 'Apple Login failed');
        }
    };

    const signOut = async () => {
        await api.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        googleSignIn,
        appleSignIn,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
