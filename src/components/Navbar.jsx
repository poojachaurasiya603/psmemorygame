import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import Avatar from './Avatar';
import ProfileModal from './ProfileModal';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <>
            <nav className="navbar glass-panel" style={{ margin: '20px 20px 0', borderRadius: '16px' }}>
                <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <span>MemoryMatch</span>
                </div>

                {currentUser && (
                    <div className="nav-user">
                        <div className="avatar-container" onClick={() => setIsProfileOpen(true)} style={{ cursor: 'pointer' }} title="Edit Profile">
                            <span style={{ fontWeight: '600', display: window.innerWidth > 600 ? 'block' : 'none' }}>
                                {currentUser.firestoreData?.name || currentUser.displayName || 'Player'}
                            </span>
                            <Avatar user={currentUser} />
                        </div>
                        <button onClick={() => setIsProfileOpen(true)} className="btn" title="Settings" style={{ padding: '8px' }}>
                            <Settings size={18} />
                        </button>
                        <button onClick={handleLogout} className="btn" title="Logout" style={{ padding: '8px' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </nav>

            {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
        </>
    );
};

export default Navbar;
