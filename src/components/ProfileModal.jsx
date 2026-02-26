import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { X, Check } from 'lucide-react';
import Avatar from './Avatar';

// Import our local avatars.
// Vite allows glob imports or direct imports. Since we have 10, let's just create an array of paths.
const avatarImages = Array.from({ length: 10 }, (_, i) => `/avtars/avtar${i + 1}.jpeg`);

const ProfileModal = ({ onClose }) => {
    const { currentUser } = useAuth();
    const [name, setName] = useState(currentUser?.firestoreData?.name || currentUser?.displayName || '');
    const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.firestoreData?.avatar || null);
    const [loading, setLoading] = useState(false);

    // We update AuthContext state somewhat indirectly or force reload, 
    // but the onAuthStateChanged in AuthContext listens to auth, not necessarily all firestore changes automatically.
    // Wait, let's see how we can update.

    const handleSave = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                name: name,
                avatar: selectedAvatar
            });
        } catch (error) {
            console.error("Error updating profile", error);
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ maxWidth: '500px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h2 className="modal-title" style={{ fontSize: '2rem' }}>Edit Profile</h2>

                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Display Name</label>
                    <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%' }}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your cool name"
                    />
                </div>

                <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '12px' }}>Choose Avatar</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>

                        {/* Option to remove custom avatar / use logic initials */}
                        <div
                            style={{
                                cursor: 'pointer',
                                border: !selectedAvatar ? '3px solid var(--primary)' : '3px solid transparent',
                                borderRadius: '50%',
                                padding: '2px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onClick={() => setSelectedAvatar(null)}
                        >
                            <Avatar user={{ uid: currentUser.uid, firestoreData: { name } }} size="50px" />
                        </div>

                        {avatarImages.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`Avatar ${index + 1}`}
                                style={{
                                    width: '54px',
                                    height: '54px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: selectedAvatar === src ? '3px solid var(--primary)' : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                    opacity: selectedAvatar === src ? 1 : 0.7
                                }}
                                onClick={() => setSelectedAvatar(src)}
                                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                                onMouseOut={(e) => e.currentTarget.style.opacity = selectedAvatar === src ? 1 : 0.7}
                            />
                        ))}
                    </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                </button>
            </div>
        </div>
    );
};

export default ProfileModal;
