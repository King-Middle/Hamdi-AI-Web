import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Key, Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess('');
        setIsLoading(true);

        try {
            if (resetStep === 1) {
                // Request Code
                await api.post('/auth/forgot-password', { email: resetEmail });
                setResetStep(2);
                setResetSuccess('Verification code sent to your email');
            } else if (resetStep === 2) {
                // Verify Code
                await api.post('/auth/verify-code', { email: resetEmail, code: resetCode });
                setResetStep(3);
                setResetSuccess('Code verified. Please set a new password.');
            } else if (resetStep === 3) {
                // Reset Password
                if (newPassword !== confirmPassword) {
                    setResetError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                await api.post('/auth/reset-password', {
                    email: resetEmail,
                    code: resetCode,
                    new_password: newPassword
                });
                setResetSuccess('Password reset successfully! You can now login.');
                setTimeout(() => {
                    setShowForgotModal(false);
                    setResetStep(1);
                    setResetEmail('');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setResetSuccess('');
                }, 2000);
            }
        } catch (err) {
            setResetError(err.response?.data?.detail || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const closeResetModal = () => {
        setShowForgotModal(false);
        setResetStep(1);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetError('');
        setResetSuccess('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            background: 'linear-gradient(135deg, #28598dff 0%, #2f7f78ff 50%, #2c8a53ff 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative circles */}
            <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
                top: '-300px',
                right: '-300px',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
                bottom: '-250px',
                left: '-250px',
                pointerEvents: 'none'
            }} />

            {/* Random Symbols & Tickers - Spread Out */}
            {/* Top Left Quadrant */}
            <div style={{ position: 'absolute', top: '8%', left: '5%', fontSize: '28px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>NVDA ↑</div>
            <div style={{ position: 'absolute', top: '15%', left: '15%', fontSize: '22px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>+3.8%</div>
            <div style={{ position: 'absolute', top: '25%', left: '8%', fontSize: '20px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>0xB3F</div>
            <div style={{ position: 'absolute', top: '35%', left: '18%', fontSize: '24px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>SOL</div>

            {/* Top Right Quadrant */}
            <div style={{ position: 'absolute', top: '10%', right: '8%', fontSize: '24px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>META</div>
            <div style={{ position: 'absolute', bottom: '42%', left: '18%', fontSize: '33px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>GOOG</div>
            <div style={{ position: 'absolute', bottom: '45%', right: '23%', fontSize: '31px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>AAPL</div>
            <div style={{ position: 'absolute', top: '20%', right: '18%', fontSize: '22px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>-0.9%</div>
            <div style={{ position: 'absolute', top: '30%', right: '5%', fontSize: '18px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>10011</div>
            <div style={{ position: 'absolute', top: '40%', right: '12%', fontSize: '18px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>11101</div>

            {/* Bottom Left Quadrant */}
            <div style={{ position: 'absolute', bottom: '35%', left: '5%', fontSize: '18px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>01110</div>
            <div style={{ position: 'absolute', bottom: '25%', left: '12%', fontSize: '26px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>QQQ</div>
            <div style={{ position: 'absolute', bottom: '15%', left: '6%', fontSize: '26px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>AMZN ↓</div>
            <div style={{ position: 'absolute', bottom: '8%', left: '20%', fontSize: '20px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>RUT</div>

            {/* Bottom Right Quadrant */}
            <div style={{ position: 'absolute', bottom: '38%', right: '8%', fontSize: '24px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>AMD ↑</div>
            <div style={{ position: 'absolute', bottom: '28%', right: '18%', fontSize: '20px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>0xC4A</div>
            <div style={{ position: 'absolute', bottom: '20%', right: '6%', fontSize: '28px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>NFLX</div>
            <div style={{ position: 'absolute', bottom: '8%', right: '15%', fontSize: '24px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none', fontFamily: 'monospace' }}>TSLA</div>

            {/* Math & Tech Symbols */}
            <div style={{ position: 'absolute', top: '70%', left: '18%', fontSize: '36px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>∫</div>
            <div style={{ position: 'absolute', top: '30%', right: '28%', fontSize: '32px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>Ω</div>
            <div style={{ position: 'absolute', bottom: '22%', left: '28%', fontSize: '32px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>∇</div>
            <div style={{ position: 'absolute', top: '55%', right: '5%', fontSize: '36px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>μ</div>
            <div style={{ position: 'absolute', top: '25%', left: '25%', fontSize: '40px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>∞</div>
            <div style={{ position: 'absolute', bottom: '55%', left: '3%', fontSize: '32px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>√</div>
            <div style={{ position: 'absolute', top: '5%', left: '45%', fontSize: '32px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>π</div>
            <div style={{ position: 'absolute', bottom: '7.5%', left: '53%', fontSize: '32px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>$$$</div>
            <div style={{ position: 'absolute', top: '5%', left: '60%', fontSize: '80px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>∝</div>
            <div style={{ position: 'absolute', bottom: '4%', left: '35%', fontSize: '40px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>⋈</div>
            <div style={{ position: 'absolute', top: '10%', left: '29%', fontSize: '50px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>➚</div>
            <div style={{ position: 'absolute', top: '4%', left: '75%', fontSize: '44px', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>➘</div>
            <div style={{ position: 'absolute', bottom: '15%', left: '67%', fontSize: '25px', fontWeight: '600', color: 'rgba(144, 238, 144, 0.1)', pointerEvents: 'none' }}>S&P 500</div>



            <svg style={{ position: 'absolute', top: '20%', left: '0', width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.2 }}>
                <circle cx="10%" cy="80%" r="2" fill="#90EE90" />
                <circle cx="90%" cy="20%" r="2" fill="#90EE90" />
                <rect x="85%" y="85%" width="10" height="10" stroke="#90EE90" fill="none" />
                <rect x="15%" y="15%" width="10" height="10" stroke="#90EE90" fill="none" />
            </svg>

            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', zIndex: 1 }}>
                {/* Logo and Branding */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                    }}>
                        <img
                            src="/logo.png"
                            alt="HAMDI Logo"
                            style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'contain'
                            }}
                        />
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            margin: 0,
                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            HAMDI
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                        Welcome back to your stock portfolio!
                    </p>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '600' }}>Sign In</h2>
                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                        />
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
                        <button
                            type="button"
                            onClick={() => setShowForgotModal(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                        Sign In
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Create Account</Link>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={closeResetModal}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Reset Password</h2>

                        {resetError && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{resetError}</div>}
                        {resetSuccess && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.25rem' }}>{resetSuccess}</div>}

                        <form onSubmit={handleForgotPassword}>
                            {resetStep === 1 && (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                        Enter your email address and we'll send you a verification code.
                                    </p>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                required
                                                placeholder="Enter your email"
                                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isLoading}>
                                        {isLoading ? 'Sending...' : <>Send Code <ArrowRight size={18} /></>}
                                    </button>
                                </>
                            )}

                            {resetStep === 2 && (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                        Enter the 6-digit code sent to <strong>{resetEmail}</strong>
                                    </p>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Verification Code</label>
                                        <div style={{ position: 'relative' }}>
                                            <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="text"
                                                value={resetCode}
                                                onChange={(e) => setResetCode(e.target.value)}
                                                required
                                                placeholder="000000"
                                                maxLength={6}
                                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', letterSpacing: '0.25rem', fontFamily: 'monospace' }}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isLoading}>
                                        {isLoading ? 'Verifying...' : <>Verify Code <ArrowRight size={18} /></>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setResetStep(1)}
                                        style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    >
                                        Back to Email
                                    </button>
                                </>
                            )}

                            {resetStep === 3 && (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                        Create a new password for your account.
                                    </p>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                placeholder="New password"
                                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="Confirm new password"
                                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isLoading}>
                                        {isLoading ? 'Resetting...' : <>Reset Password <CheckCircle size={18} /></>}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
