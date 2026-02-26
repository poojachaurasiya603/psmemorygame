import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Chrome } from 'lucide-react';

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, loginWithGoogle } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
        } catch (err) {
            setError(err.message || 'Failed to authenticate');
        }

        setLoading(false);
    };

    const handleGoogle = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
        } catch (err) {
            setError(err.message || 'Google sign-in failed');
        }
        setLoading(false);
    };

    return (
        <div className="auth-box glass-panel">
            <h2 className="mb-2" style={{ fontSize: '2rem', fontWeight: 800 }}>
                {isLogin ? 'Welcome Back!' : 'Join the Game'}
            </h2>
            <p className="text-muted mb-6">
                {isLogin ? 'Login to continue your streak' : 'Register to get on the leaderboard'}
            </p>

            {error && <div className="mb-4" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                {!isLogin && (
                    <div className="input-group">
                        <label className="input-label">Display Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="form-input"
                                style={{ width: '100%', paddingLeft: '40px' }}
                                placeholder="AwesomePlayer"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="email"
                            className="form-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            placeholder="player@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#94a3b8' }} />
                        <input
                            type="password"
                            className="form-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button disabled={loading} type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '14px' }}>
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Reflect my skills')}
                </button>
            </form>

            <div className="divider">or</div>

            <button disabled={loading} onClick={handleGoogle} className="btn" style={{ width: '100%', padding: '14px' }}>
                <Chrome size={18} /> Continue with Google
            </button>

            <div className="toggle-auth">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Sign up here' : 'Login here'}
                </span>
            </div>
        </div>
    );
};

export default AuthForm;
