import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Trophy } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Top 10 users by total wins or bestScore. We'll use bestScore for single player logic, or wins for multi.
        // Assuming bestScore is stored as the highest match score + time bonus.
        const q = query(
            collection(db, 'users'),
            orderBy('totalScore', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const topPlayers = [];
            snapshot.forEach((doc) => {
                topPlayers.push({ id: doc.id, ...doc.data() });
            });
            setLeaders(topPlayers);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) return <div className="text-center p-4">Loading top players...</div>;

    return (
        <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 className="setup-title mb-4" style={{ justifyContent: 'center' }}>
                <Trophy color="#f59e0b" /> Global Leaderboard
            </h3>

            {leaders.length === 0 ? (
                <p className="text-center text-muted">No scores yet. Be the first!</p>
            ) : (
                <div className="leaderboard-list">
                    {leaders.map((player, index) => {
                        const isMe = currentUser && currentUser.uid === player.uid;
                        let rankColor = 'var(--text-main)';
                        if (index === 0) rankColor = '#f59e0b'; // Gold
                        else if (index === 1) rankColor = '#94a3b8'; // Silver
                        else if (index === 2) rankColor = '#b45309'; // Bronze

                        return (
                            <div key={player.id} className={`leaderboard-item ${isMe ? 'current-user' : ''}`}>
                                <div className="lb-rank" style={{ color: rankColor }}>
                                    #{index + 1}
                                </div>
                                <div className="lb-user-info">
                                    <Avatar user={{ photoURL: player.avatar, displayName: player.name, uid: player.uid }} size="32px" />
                                    <span style={{ fontWeight: '600' }}>{player.name} {isMe && '(You)'}</span>
                                </div>
                                <div className="lb-score">
                                    {player.totalScore || 0} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>pts</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
