import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ScoreBoard from '../components/ScoreBoard';
import GameBoard from '../components/GameBoard';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import confetti from 'canvas-confetti';
import { Copy } from 'lucide-react';

const EMOJIS = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🪲', '🦋', '🐢', '🐍', '🐙', '🦑', '🐠', '🐳'
];

const Game = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const mode = location.state?.mode || 'single';
    const difficulty = location.state?.difficulty || '4x4';
    const roomId = location.state?.roomId;
    const role = location.state?.role; // 'host' or 'guest'

    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [wrongCards, setWrongCards] = useState([]);

    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [turn, setTurn] = useState(1);
    const [playTime, setPlayTime] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedGameTime, setSelectedGameTime] = useState(0); // For timing online games if needed

    // Online State
    const [onlineStatus, setOnlineStatus] = useState('waiting');
    const [guestName, setGuestName] = useState('Player 2');
    const [hostName, setHostName] = useState('Player 1');
    const [replayCountdown, setReplayCountdown] = useState(90);

    // Online Listener
    useEffect(() => {
        if (mode !== 'online' || !roomId) return;

        const roomRef = doc(db, 'rooms', roomId);
        const unsub = onSnapshot(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setOnlineStatus(data.status);

                if (data.hostName) setHostName(data.hostName);
                if (data.guestName) setGuestName(data.guestName);

                if (data.cards) setCards(data.cards);
                if (data.status === 'playing' && isGameOver) {
                    setIsGameOver(false);
                    setPlayTime(0);
                    setReplayCountdown(90);
                }

                if (data.flippedCards) setFlippedCards(data.flippedCards);
                if (data.matchedCards) setMatchedCards(data.matchedCards);
                if (data.wrongCards) setWrongCards(data.wrongCards);

                if (data.score1 !== undefined) setScore1(data.score1);
                if (data.score2 !== undefined) setScore2(data.score2);
                if (data.turn !== undefined) setTurn(data.turn);

                if (data.status === 'playing' && !isGameOver) {
                    setIsProcessing(data.isProcessing || false);
                }

                if (data.status === 'finished' && !isGameOver) {
                    handleWinOnline(data);
                }

                // If I am guest and just joined, notify the host
                if (role === 'guest' && data.status === 'waiting' && !data.guest) {
                    updateDoc(roomRef, {
                        guest: currentUser.uid,
                        guestName: currentUser.firestoreData?.name || currentUser.displayName || 'Guest',
                        status: 'playing' // Host will see this and shuffle cards
                    });
                }

                // If I am host and guest just joined
                if (role === 'host' && data.status === 'playing' && !data.cards) {
                    // Time to shuffle and write state
                    hostInitGame();
                }

            } else {
                alert("Room was closed.");
                navigate('/');
            }
        });

        return () => unsub();
    }, [mode, roomId, isGameOver]);

    const handleExitRoom = async () => {
        if (mode === 'online' && role === 'host' && roomId) {
            try {
                await updateDoc(doc(db, 'rooms', roomId), { status: 'closed' });
            } catch (e) {
                console.error(e);
            }
        }
        navigate('/');
    };

    // Guest replay waiting timer
    useEffect(() => {
        let timer;
        if (mode === 'online' && isGameOver && onlineStatus === 'finished') {
            timer = setInterval(() => {
                setReplayCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleExitRoom();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setReplayCountdown(90);
        }
        return () => clearInterval(timer);
    }, [mode, isGameOver, onlineStatus]);

    const hostInitGame = () => {
        let pairCount = 8;
        if (difficulty === '6x6') pairCount = 18;
        if (difficulty === '8x8') pairCount = 32;

        const selectedEmojis = EMOJIS.slice(0, pairCount);
        const gameCards = [...selectedEmojis, ...selectedEmojis]
            .sort(() => Math.random() - 0.5)
            .map((item, index) => ({
                id: index,
                icon: item,
            }));

        // Setup the room state for the first time or restart
        updateDoc(doc(db, 'rooms', roomId), {
            cards: gameCards,
            flippedCards: [],
            matchedCards: [],
            wrongCards: [],
            score1: 0,
            score2: 0,
            turn: 1,
            isProcessing: false,
            status: 'playing'
        });
    };

    // Offline Initialize
    const initGame = () => {
        if (mode === 'online') return; // Handled by network

        let pairCount = 8;
        if (difficulty === '6x6') pairCount = 18;
        if (difficulty === '8x8') pairCount = 32;

        const selectedEmojis = EMOJIS.slice(0, pairCount);
        const gameCards = [...selectedEmojis, ...selectedEmojis]
            .sort(() => Math.random() - 0.5)
            .map((item, index) => ({
                id: index,
                icon: item,
            }));

        setCards(gameCards);
        setFlippedCards([]);
        setMatchedCards([]);
        setWrongCards([]);
        setScore1(0);
        setScore2(0);
        setTurn(1);
        setIsGameOver(false);
        setPlayTime(0);
        setIsProcessing(false);
    };

    // Auto-init offline games
    useEffect(() => {
        if (mode !== 'online') {
            initGame();
        }
    }, [difficulty, mode]);

    // Timer (only for single/local modes currently or handled locally for online)
    useEffect(() => {
        let timer;
        if (!isGameOver && (mode !== 'online' || onlineStatus === 'playing')) {
            timer = setInterval(() => {
                setPlayTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isGameOver, onlineStatus, mode]);


    const handleCardClick = (card) => {
        if (isProcessing) return;
        if (flippedCards.length === 2) return;
        if (flippedCards.some(f => f.id === card.id)) return;
        if (matchedCards.includes(card.id)) return;

        // Online mode protections
        if (mode === 'online') {
            const myTurnIndex = role === 'host' ? 1 : 2;
            if (turn !== myTurnIndex) return; // Not my turn!
        }

        const newFlipped = [...flippedCards, card];

        if (mode === 'online') {
            updateDoc(doc(db, 'rooms', roomId), {
                flippedCards: newFlipped,
                isProcessing: newFlipped.length === 2
            });
        } else {
            setFlippedCards(newFlipped);
            if (newFlipped.length === 2) {
                setIsProcessing(true);
            }
        }

        if (newFlipped.length === 2) {
            checkMatch(newFlipped);
        }
    };

    const checkMatch = async (flipped) => {
        const [card1, card2] = flipped;
        const isMatch = card1.icon === card2.icon;

        if (mode === 'online') {
            // Online match logic handled by whoever flipped the card
            const roomRef = doc(db, 'rooms', roomId);
            if (isMatch) {
                const newMatched = [...matchedCards, card1.id, card2.id];
                const newScore1 = turn === 1 ? score1 + 10 : score1;
                const newScore2 = turn === 2 ? score2 + 10 : score2;

                await updateDoc(roomRef, {
                    matchedCards: newMatched,
                    score1: newScore1,
                    score2: newScore2,
                    flippedCards: [],
                    isProcessing: false
                });

                if (newMatched.length === cards.length) {
                    await updateDoc(roomRef, { status: 'finished' });
                }
            } else {
                await updateDoc(roomRef, { wrongCards: [card1.id, card2.id] });
                // Delay 
                setTimeout(async () => {
                    await updateDoc(roomRef, {
                        flippedCards: [],
                        wrongCards: [],
                        turn: turn === 1 ? 2 : 1,
                        isProcessing: false
                    });
                }, 800);
            }
            return;
        }

        // Offline logic
        if (isMatch) {
            setMatchedCards(prev => [...prev, card1.id, card2.id]);
            if (turn === 1) setScore1(prev => prev + 10);
            else setScore2(prev => prev + 10);
            setFlippedCards([]);
            setIsProcessing(false);

            if (matchedCards.length + 2 === cards.length) {
                handleWinOffline();
            }
        } else {
            setWrongCards([card1.id, card2.id]);
            setTimeout(() => {
                setFlippedCards([]);
                setWrongCards([]);
                if (mode === 'multi') {
                    setTurn(prev => prev === 1 ? 2 : 1);
                }
                setIsProcessing(false);
            }, 800);
        }
    };

    const handleWinOffline = async () => {
        setIsGameOver(true);
        fireConfetti();
        if (!currentUser) return;

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const isWinner = mode === 'single' || (mode === 'multi' && score1 >= score2);
            const finalScore = mode === 'single' ? score1 + Math.max(0, (cards.length * 10) - playTime) : score1;

            if (mode === 'single') {
                const currentBest = currentUser.firestoreData?.bestScore || 0;
                await updateDoc(userRef, {
                    totalGames: increment(1),
                    wins: increment(1),
                    bestScore: Math.max(currentBest, finalScore),
                    totalScore: increment(finalScore)
                });
            } else {
                await updateDoc(userRef, {
                    totalGames: increment(1),
                    wins: isWinner ? increment(1) : increment(0),
                    totalScore: increment(isWinner ? score1 : 0)
                });
            }
        } catch (error) {
            console.error('Failed to update stats', error);
        }
    };

    const handleWinOnline = async (data) => {
        setIsGameOver(true);
        setSelectedGameTime(playTime);
        fireConfetti();
        if (!currentUser) return;

        try {
            const myScore = role === 'host' ? data.score1 : data.score2;
            const opScore = role === 'host' ? data.score2 : data.score1;
            const isWinner = myScore > opScore;

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                totalGames: increment(1),
                wins: isWinner ? increment(1) : increment(0),
                totalScore: increment(myScore)
            });
        } catch (e) {
            console.error("Online stats update failed", e);
        }
    };

    const fireConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b']
        });
    };

    const handleRestart = () => {
        if (mode === 'online') {
            if (role === 'host') {
                hostInitGame();
                setIsGameOver(false);
            }
        } else {
            initGame();
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomId);
        alert("Room Code copied to clipboard!");
    };


    if (mode === 'online' && onlineStatus === 'waiting') {
        return (
            <div className="page-container text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '100%' }}>
                    <div className="spinner mb-6" style={{ margin: '0 auto' }}></div>
                    <h2 className="mb-4">Waiting for opponent...</h2>
                    <p className="text-muted mb-4">Share this room code with a friend:</p>
                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '3px' }}>{roomId}</span>
                        <button className="btn" onClick={handleCopyCode} style={{ padding: '8px' }} title="Copy Code">
                            <Copy size={18} />
                        </button>
                    </div>

                    <button className="btn" onClick={handleExitRoom} style={{ background: 'var(--card-wrong)', color: 'white', border: 'none', width: '100%', padding: '12px', fontSize: '1.1rem' }}>
                        Cancel & Exit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container game-container">
            {/* Display names properly based on mode */}
            <div className="scoreboard glass-panel">
                <div className={`score-panel ${turn === 1 ? 'active-turn' : ''}`}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {mode === 'online' ? hostName : 'Player 1'} {mode === 'online' && role === 'host' ? '(You)' : ''}
                        </div>
                        <div className="score-value">{score1}</div>
                    </div>
                </div>

                <div className="text-center" style={{ flex: 1, padding: '0 20px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px', color: 'var(--primary)', marginBottom: '10px' }}>
                        {Math.floor(playTime / 60)}:{(playTime % 60).toString().padStart(2, '0')}
                    </div>
                    {mode === 'online' ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room: {roomId}</div>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {mode === 'single' ? `Best: ${currentUser?.firestoreData?.bestScore || 0}` : ''}
                        </div>
                    )}
                </div>

                {(mode === 'multi' || mode === 'online') && (
                    <div className={`score-panel ${turn === 2 ? 'active-turn' : ''}`}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {mode === 'online' ? guestName : 'Player 2'} {mode === 'online' && role === 'guest' ? '(You)' : ''}
                            </div>
                            <div className="score-value" style={{ color: 'var(--primary)' }}>{score2}</div>
                        </div>
                    </div>
                )}
            </div>

            <GameBoard
                cards={cards}
                onCardClick={handleCardClick}
                flippedCards={flippedCards}
                matchedCards={matchedCards}
                wrongCards={wrongCards}
                difficulty={difficulty}
            />

            {/* Winner Modal */}
            {isGameOver && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">
                            {mode === 'single' ? 'You Won!' : (score1 > score2 ? `${mode === 'online' ? hostName : 'Player 1'} Wins!` : score2 > score1 ? `${mode === 'online' ? guestName : 'Player 2'} Wins!` : 'It\'s a Tie!')}
                        </h2>
                        <div className="modal-score">
                            {mode === 'single' ? `Final Score: ${score1 + Math.max(0, (cards.length * 10) - playTime)}` : `Score: ${score1} - ${score2}`}
                        </div>

                        <p className="text-muted mb-6">
                            Time taken: {Math.floor((selectedGameTime || playTime) / 60)}m {(selectedGameTime || playTime) % 60}s
                        </p>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexDirection: 'column' }}>
                            {(!mode.includes('online') || role === 'host') && (
                                <button className="btn btn-primary btn-3d" onClick={handleRestart} style={{ padding: '15px', fontSize: '1.2rem' }}>Play Again</button>
                            )}

                            {mode === 'online' && role === 'guest' && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary)' }}>Waiting for Host to replay...</p>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Auto-leaving in {replayCountdown}s</p>
                                </div>
                            )}

                            <button className="btn btn-3d" onClick={handleExitRoom} style={{ padding: '15px', fontSize: '1.1rem' }}>{mode.includes('online') ? 'Leave Room' : 'Main Menu'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
