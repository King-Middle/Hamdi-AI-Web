import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleHomeClick = (e) => {
        // If already on home page, scroll to top
        if (location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Otherwise, let the Link component handle navigation
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav style={{
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 0',
            backgroundColor: 'var(--navbar-bg)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" onClick={handleHomeClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'calc(2rem)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    <img src="/logo.png" alt="HAMDI Logo" style={{ height: '45px', width: 'auto' }} />
                    HAMDI
                </Link>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/" onClick={handleHomeClick} className="btn btn-outline" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Home size={22} />
                        Home
                    </Link>

                    <Link to="/settings" className="btn btn-outline" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={22} />
                        Settings
                    </Link>

                    {user && (
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="btn btn-outline"
                                style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'calc(1.1rem * var(--font-size-multiplier))', padding: '0.75rem 1.25rem' }}
                            >
                                <User size={22} />
                                User
                            </button>

                            {showDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    backgroundColor: '#1f2937',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem',
                                    minWidth: '220px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    zIndex: 101
                                }}>
                                    <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                                        <div style={{ fontSize: 'calc(1.1rem * var(--font-size-multiplier))', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                                            {user.email.split('@')[0]}
                                        </div>
                                        <div style={{ fontSize: 'calc(0.85rem * var(--font-size-multiplier))', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem' }}>
                                            {user.email}
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: 'calc(0.75rem * var(--font-size-multiplier))',
                                            fontWeight: '600',
                                            background: user?.subscription_status === 'free'
                                                ? 'rgba(156, 163, 175, 0.2)'
                                                : 'linear-gradient(135deg, var(--accent-color), #9333ea)',
                                            color: user?.subscription_status === 'free' ? '#9ca3af' : 'white'
                                        }}>
                                            {user?.subscription_status === 'free' && '🎯 Free Plan'}
                                            {user?.subscription_status === 'pro_monthly' && '⚡ Pro Monthly'}
                                            {user?.subscription_status === 'pro_yearly' && '👑 Pro Yearly'}
                                        </div>
                                    </div>
                                    {user?.subscription_status === 'free' && (
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                navigate('/payment');
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                width: '100%',
                                                padding: '0.5rem 1rem',
                                                textAlign: 'left',
                                                background: 'linear-gradient(135deg, var(--accent-color), #9333ea)',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: 'calc(0.9rem * var(--font-size-multiplier))',
                                                borderRadius: '0.25rem',
                                                fontWeight: '600',
                                                marginBottom: '0.5rem'
                                            }}
                                            onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                            onMouseOut={(e) => e.target.style.opacity = '1'}
                                        >
                                            ⚡ Upgrade to Pro
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: 'calc(0.9rem * var(--font-size-multiplier))',
                                            borderRadius: '0.25rem'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
