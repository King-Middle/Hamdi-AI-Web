import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Palette, Database, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import api from '../api';

const SettingsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Use theme context instead of local state
    const { darkMode, setDarkMode, autoRefresh, setAutoRefresh, fontSize, setFontSize } = useTheme();

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Terms of use modal state
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.detail || 'Failed to change password');
        }
    };

    const SettingCard = ({ icon: Icon, title, description, children }) => (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)'
                }}>
                    <Icon size={24} color="var(--accent-color)" />
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 'calc(1.1rem * var(--font-size-multiplier))', marginBottom: '0.5rem' }}>{title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.9rem * var(--font-size-multiplier))', marginBottom: '1rem' }}>
                        {description}
                    </p>
                    {children}
                </div>
            </div>
        </div>
    );

    const Toggle = ({ enabled, onChange }) => (
        <button
            onClick={() => onChange(!enabled)}
            style={{
                position: 'relative',
                width: '3rem',
                height: '1.75rem',
                borderRadius: '9999px',
                backgroundColor: enabled ? 'var(--accent-color)' : '#374151',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                padding: 0
            }}
        >
            <div style={{
                position: 'absolute',
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '50%',
                backgroundColor: 'white',
                top: '0.25rem',
                left: enabled ? '1.5rem' : '0.25rem',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </button>
    );

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Navbar />

            <div className="container" style={{ marginTop: '2rem', maxWidth: '800px' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: 'calc(2.5rem * var(--font-size-multiplier))', fontWeight: '800', marginBottom: '0.5rem' }}>
                        Settings
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'calc(1.1rem * var(--font-size-multiplier))' }}>
                        Manage your account preferences and application settings
                    </p>
                </div>

                {/* Account Information */}
                <SettingCard
                    icon={User}
                    title="Account Information"
                    description="View your account details"
                >
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))' }}>Email</span>
                            <div style={{ fontSize: 'calc(1rem * var(--font-size-multiplier))', marginTop: '0.25rem' }}>{user?.email || 'Not logged in'}</div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))' }}>Member Since</span>
                            <div style={{ fontSize: 'calc(1rem * var(--font-size-multiplier))', marginTop: '0.25rem' }}>
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* Subscription */}
                <SettingCard
                    icon={User}
                    title="Subscription"
                    description="Manage your subscription plan"
                >
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))' }}>Current Plan</span>
                            <div style={{
                                fontSize: 'calc(1.3rem * var(--font-size-multiplier))',
                                fontWeight: '700',
                                marginTop: '0.25rem',
                                color: user?.subscription_status === 'free' ? 'var(--text-secondary)' : 'var(--accent-color)'
                            }}>
                                {user?.subscription_status === 'free' && '🎯 Free Plan'}
                                {user?.subscription_status === 'pro_monthly' && '⚡ Pro Monthly'}
                                {user?.subscription_status === 'pro_yearly' && '👑 Pro Yearly'}
                            </div>
                        </div>
                        {user?.subscription_expires_at && (
                            <div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))' }}>Renews On</span>
                                <div style={{ fontSize: 'calc(1rem * var(--font-size-multiplier))', marginTop: '0.25rem' }}>
                                    {new Date(user.subscription_expires_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--accent-color), #9333ea)'
                        }}
                        onClick={() => navigate('/payment')}
                    >
                        {user?.subscription_status === 'free' ? 'Upgrade to Pro' : 'Manage Subscription'}
                    </button>
                </SettingCard>

                {/* Appearance */}
                <SettingCard
                    icon={Palette}
                    title="Appearance"
                    description="Customize the look and feel of the application"
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </div>
                            <div style={{ fontSize: 'calc(0.85rem * var(--font-size-multiplier))', color: 'var(--text-secondary)' }}>
                                {darkMode ? 'Dark theme is active' : 'Light theme is active'}
                            </div>
                        </div>
                        <Toggle enabled={darkMode} onChange={setDarkMode} />
                    </div>

                    <div>
                        <div style={{ fontWeight: '500', marginBottom: '0.75rem' }}>Font Size</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['small', 'medium', 'large'].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setFontSize(size)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: `2px solid ${fontSize === size ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                        backgroundColor: fontSize === size ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                        color: fontSize === size ? 'var(--accent-color)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: fontSize === size ? '600' : '500',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </SettingCard>

                {/* Data & Privacy */}
                <SettingCard
                    icon={Database}
                    title="Data & Privacy"
                    description="Control your data refresh preferences"
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Auto-Refresh Data</div>
                            <div style={{ fontSize: 'calc(0.85rem * var(--font-size-multiplier))', color: 'var(--text-secondary)' }}>
                                Automatically update stock prices periodically
                            </div>
                        </div>
                        <Toggle enabled={autoRefresh} onChange={setAutoRefresh} />
                    </div>
                </SettingCard>


                {/* Legal */}
                <SettingCard
                    icon={FileText}
                    title="Legal"
                    description="View terms of use and risk disclosure"
                >
                    <button
                        className="btn btn-outline"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            justifyContent: 'center'
                        }}
                        onClick={() => setShowTermsModal(true)}
                    >
                        View Terms of Use
                    </button>
                </SettingCard>

                {/* Security */}
                <SettingCard
                    icon={Lock}
                    title="Security"
                    description="Manage your password and security preferences"
                >
                    <button
                        className="btn btn-outline"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            justifyContent: 'center'
                        }}
                        onClick={() => setShowPasswordModal(true)}
                    >
                        Change Password
                    </button>
                </SettingCard>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowPasswordModal(false)}>
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2rem',
                        margin: '1rem'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Change Password</h2>

                        {passwordError && (
                            <div style={{
                                color: '#ef4444',
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '0.5rem'
                            }}>
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div style={{
                                color: '#10b981',
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '0.5rem'
                            }}>
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ flex: 1, padding: '0.75rem' }}
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.75rem' }}
                                >
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Terms of Use Modal */}
            {showTermsModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowTermsModal(false)}>
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        padding: '2rem',
                        margin: '1rem',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: 'calc(1.8rem * var(--font-size-multiplier))' }}>Terms of Use</h2>

                        <div
                            className="terms-scrollable"
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                marginBottom: '1.5rem',
                                paddingRight: '1rem'
                            }}
                        >
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6',
                                fontSize: 'calc(0.95rem * var(--font-size-multiplier))',
                                color: 'var(--text-secondary)'
                            }}>
                                {`TERMS OF USE AND RISK DISCLOSURE AGREEMENT

Last Updated: December 2025

1. GENERAL DISCLAIMER: NO FINANCIAL ADVICE The content, signals, predictions, and analytics provided by this Artificial Intelligence Financial Bot (hereinafter referred to as "the Service") are strictly for informational, educational, and research purposes only. Nothing contained in this Service constitutes, or is intended to constitute, financial, legal, tax, or investment advice. The Service does not offer a recommendation or solicitation to buy, sell, or hold any cryptocurrency, stock, derivative, or other financial instrument. You should not treat any opinion expressed by the AI as a specific inducement to make a particular investment or follow a particular strategy.

2. AI MODEL SPECIFICATIONS AND LIMITATIONS The predictions generated by this Service are based on complex algorithmic analysis and machine learning models. Users must be aware of the specific operational parameters:

Prediction Horizon: The model forecasts market movements over a target period of 10 days.

Variability Window: Due to market volatility, these predictions are subject to a standard time deviation of plus or minus 5 days (± 5 days).

Historical Data & Accuracy: Any accuracy rates, success metrics, or performance statistics displayed within the Service are derived from historical backtesting and simulation data collected from January 1, 2025, to the present.

No Guarantee of Future Performance: While the historical data from the testing period (since 01/01/2025) provides a reference for the model's capabilities, past performance is not indicative of future results. Financial markets are dynamic, and patterns observed in the past may not repeat.

3. HIGH-RISK WARNING Trading in financial markets involves a high degree of risk and is not suitable for every investor. The high degree of leverage that is often associated with trading can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. You could sustain a loss of some or all of your initial investment. Therefore, you should not invest money that you cannot afford to lose. You are strongly encouraged to conduct your own due diligence and consult with a certified financial advisor before making any investment decisions.

4. LIMITATION OF LIABILITY By accessing and using this Service, you acknowledge and agree that:

The developers, creators, and providers of this AI bot assume no responsibility or liability for any errors, omissions, or inaccuracies in the data or predictions provided.

You are solely responsible for your own trading actions and decisions.

The Service is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied.

Under no circumstances shall the developers be liable for any direct, indirect, incidental, special, or consequential damages (including, without limitation, damages for loss of data or profit) arising out of the use or the inability to use the Service.

5. ACKNOWLEDGEMENT By continuing to use this AI Financial Bot, you explicitly confirm that you have read, understood, and agreed to be bound by these Terms of Use and Risk Disclosure. You accept full responsibility for your financial decisions and release the providers from any liability regarding your trading activities.`}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.75rem' }}
                            onClick={() => setShowTermsModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Back to Home Button */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-outline"
                    style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}
                >
                    <ArrowLeft size={21} />
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
