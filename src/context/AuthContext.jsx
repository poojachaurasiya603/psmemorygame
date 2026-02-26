import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to save user to Firestore
    const saveUserToFirestore = async (user, additionalData = {}) => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            try {
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName || additionalData.name || 'Anonymous',
                    email: user.email,
                    avatar: user.photoURL || null,
                    bestScore: 0,
                    totalScore: 0,
                    totalGames: 0,
                    wins: 0,
                    createdAt: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error creating user doc:', error);
            }
        }
    };

    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user, { name });
        return userCredential;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        await saveUserToFirestore(userCredential.user);
        return userCredential;
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        let firestoreUnsubscribe;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);

                // Real-time listener for current user document
                firestoreUnsubscribe = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCurrentUser({ ...user, firestoreData: docSnap.data() });
                    } else {
                        setCurrentUser(user);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("AuthContext Snapshot Error:", error);
                    setCurrentUser(user);
                    setLoading(false);
                });

            } else {
                if (firestoreUnsubscribe) firestoreUnsubscribe();
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (firestoreUnsubscribe) firestoreUnsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
