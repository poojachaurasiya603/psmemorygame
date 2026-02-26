import React from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { RotateCcw, Home } from 'lucide-react';

const ScoreBoard = ({ score1, score2, turn, mode, playTime, onRestart, onHome }) => {
    const { currentUser } = useAuth();

    // Format playTime to MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="scoreboard glass-panel">
            {/* Player 1 Details */}
            <div className={`score-panel ${turn === 1 ? 'active-turn' : ''}`}>
                <Avatar user={currentUser} size="40px" />
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Player 1</div>
                    <div className="score-value">{score1}</div>
                </div>
            </div>

            {/* Timer & Controls */}
            <div className="text-center" style={{ flex: 1, padding: '0 20px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px', color: 'var(--primary)', marginBottom: '10px' }}>
                    {formatTime(playTime)}
                </div>
                <div className="game-controls" style={{ justifyContent: 'center' }}>
                    <button onClick={onRestart} className="btn" title="Restart">
                        <RotateCcw size={16} /> <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>Restart</span>
                    </button>
                    <button onClick={onHome} className="btn btn-primary" title="Menu">
                        <Home size={16} />
                    </button>
                </div>
            </div>

            {/* Player 2 Details (or Best Score if single player) */}
            {mode === 'multi' ? (
                <div className={`score-panel ${turn === 2 ? 'active-turn' : ''}`}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Player 2</div>
                        <div className="score-value" style={{ color: 'var(--primary)' }}>{score2}</div>
                    </div>
                    <Avatar user={{ uid: 'p2', displayName: 'P2' }} size="40px" />
                </div>
            ) : (
                <div className="score-panel">
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Best Score</div>
                        <div className="score-value" style={{ color: 'var(--primary)' }}>{currentUser?.firestoreData?.bestScore || 0}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoreBoard;
