import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import { Play, Users, User, LayoutGrid, Link as LinkIcon, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const Home = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('single');
    const [difficulty, setDifficulty] = useState('4x4');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);

    const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const startGame = async () => {
        if (mode === 'online') {
            setLoading(true);
            const rCode = generateRoomCode();
            try {
                // Create room
                await setDoc(doc(db, 'rooms', rCode), {
                    host: currentUser.uid,
                    hostName: currentUser.displayName || currentUser.firestoreData?.name || 'Guest',
                    difficulty,
                    status: 'waiting',
                    createdAt: new Date().toISOString()
                });
                navigate(`/game`, { state: { mode: 'online', difficulty, roomId: rCode, role: 'host' } });
            } catch (error) {
                console.error("Error creating room:", error);
                setLoading(false);
            }
        } else {
            navigate('/game', { state: { mode, difficulty } });
        }
    };

    const joinRoom = async () => {
        if (!roomCode) return;
        setLoading(true);
        const code = roomCode.toUpperCase();
        try {
            const roomSnap = await getDoc(doc(db, 'rooms', code));
            if (roomSnap.exists()) {
                const data = roomSnap.data();
                if (data.status === 'waiting') {
                    navigate(`/game`, { state: { mode: 'online', difficulty: data.difficulty, roomId: code, role: 'guest' } });
                } else {
                    alert("Game already started or finished.");
                }
            } else {
                alert("Room not found!");
            }
        } catch (error) {
            console.error("Error joining:", error);
        }
        setLoading(false);
    };

    return (
        <div className="page-container">
            <div className="home-header text-center">
                <h1 className="home-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    <span>Memory</span> Match
                </h1>
                <p className="home-subtitle">
                    Train your brain. Compete. Win.<br />
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                        Your Best Score: {currentUser?.firestoreData?.bestScore || 0}
                    </span>
                </p>
            </div>

            <div className="game-setup">
                <div className="glass-panel setup-section">
                    <h2 className="setup-title"><Play size={24} /> Game Setup</h2>

                    <div className="mb-4">
                        <h3 className="mb-2" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Select Mode</h3>
                        <div className="mode-selector" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div
                                className={`selector-item ${mode === 'single' ? 'active' : ''}`}
                                onClick={() => setMode('single')}
                            >
                                <User size={24} className="mb-2" />
                                <div className="selector-item-title">Single</div>
                                <div className="selector-item-desc">Beat your score.</div>
                            </div>
                            <div
                                className={`selector-item ${mode === 'multi' ? 'active' : ''}`}
                                onClick={() => setMode('multi')}
                            >
                                <Users size={24} className="mb-2" />
                                <div className="selector-item-title">Local</div>
                                <div className="selector-item-desc">2 Players Turn-based.</div>
                            </div>
                            <div
                                className={`selector-item ${mode === 'online' ? 'active' : ''}`}
                                onClick={() => setMode('online')}
                            >
                                <Users size={24} className="mb-2" color="#10b981" />
                                <div className="selector-item-title">Online</div>
                                <div className="selector-item-desc">Play with friends!</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="mb-2" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Difficulty</h3>
                        <div className="mode-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                            {['4x4', '6x6', '8x8'].map(diff => (
                                <div
                                    key={diff}
                                    className={`selector-item ${difficulty === diff ? 'active' : ''}`}
                                    onClick={() => setDifficulty(diff)}
                                    style={{ textAlign: 'center', padding: '15px 5px' }}
                                >
                                    <LayoutGrid size={20} className="mb-2" />
                                    <div className="selector-item-title">{diff}</div>
                                    <div className="selector-item-desc">{
                                        diff === '4x4' ? 'Easy' : diff === '6x6' ? 'Medium' : 'Hard'
                                    }</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
                        <button className="btn btn-primary" onClick={startGame} disabled={loading} style={{ flex: 1, padding: '16px', fontSize: '1.2rem' }}>
                            {mode === 'online' ? <><Plus /> Create Room</> : <><Play fill="currentColor" /> Play Now</>}
                        </button>
                    </div>
                </div>

                {mode === 'online' && (
                    <div className="glass-panel setup-section" style={{ gridColumn: '1 / -1' }}>
                        <h2 className="setup-title"><LinkIcon size={24} /> Join Room</h2>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Room Code (e.g. AB12CD)"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                style={{ flex: 1, textTransform: 'uppercase' }}
                            />
                            <button className="btn btn-primary" onClick={joinRoom} disabled={loading || !roomCode}>
                                Join Room
                            </button>
                        </div>
                    </div>
                )}

                <div className="leaderboard-section">
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
};

export default Home;
