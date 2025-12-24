import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Zap, Crown, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';

const PaymentPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState({ monthly: false, yearly: false });
    const [error, setError] = useState('');

    const handleCheckout = (planType) => {
        // Gumroad product links
        const GUMROAD_PRODUCT_MONTHLY = 'https://hamdiai.gumroad.com/l/monthly';
        const GUMROAD_PRODUCT_YEARLY = 'https://hamdiai.gumroad.com/l/yearly';

        const productUrl = planType === 'monthly' ? GUMROAD_PRODUCT_MONTHLY : GUMROAD_PRODUCT_YEARLY;

        // Append user data for webhook tracking
        // Gumroad supports adding custom fields via URL params: ?email=...&user_id=...
        const checkoutUrl = `${productUrl}?email=${encodeURIComponent(user.email)}&user_id=${user.id}`;

        // Open Gumroad overlay
        // If the Gumroad script is loaded, this might open in an overlay automatically if configured on the link
        // Otherwise we can just redirect or open a new tab.
        // For better UX with Gumroad Overlay, usually a simple <a> tag with class "gumroad-button" works, 
        // but we can also window.open if we want to enforce a new tab or just redirect.
        // Gumroad's overlay script intercepts clicks to anchors with gumroad links.
        // Since we are creating the URL dynamically, we might need to trigger it manually or just redirect.

        // Simple redirect approach which works with or without overlay script (Overlay script intercepts if present)
        window.location.href = checkoutUrl;
    };

    // Inject Gumroad script
    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://gumroad.com/js/gumroad.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const PricingCard = ({ title, price, period, planType, features, isPopular, icon: Icon }) => (
        <div style={{
            position: 'relative',
            backgroundColor: isPopular ? 'rgba(124, 58, 237, 0.05)' : 'var(--card-bg)',
            border: isPopular ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
        }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.3)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {isPopular && (
                <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '1rem',
                    fontSize: 'calc(0.85rem * var(--font-size-multiplier))',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Star size={14} fill="white" />
                    Best Value
                </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '1rem',
                    borderRadius: '1rem',
                    backgroundColor: isPopular ? 'var(--accent-color)' : 'rgba(124, 58, 237, 0.1)',
                    marginBottom: '1rem'
                }}>
                    <Icon size={32} color={isPopular ? 'white' : 'var(--accent-color)'} />
                </div>
                <h3 style={{
                    fontSize: 'calc(1.5rem * var(--font-size-multiplier))',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                }}>
                    {title}
                </h3>
                <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{
                        fontSize: 'calc(3rem * var(--font-size-multiplier))',
                        fontWeight: '800',
                        color: 'var(--accent-color)'
                    }}>
                        ${price}
                    </span>
                    <span style={{
                        fontSize: 'calc(1.1rem * var(--font-size-multiplier))',
                        color: 'var(--text-secondary)'
                    }}>
                        /{period}
                    </span>
                </div>
                {planType === 'yearly' && (
                    <div style={{
                        fontSize: 'calc(0.9rem * var(--font-size-multiplier))',
                        color: '#10b981',
                        fontWeight: '600'
                    }}>
                        Save $40 per year!
                    </div>
                )}
            </div>

            <ul style={{ flex: 1, marginBottom: '1.5rem', listStyle: 'none', padding: 0 }}>
                {features.map((feature, index) => (
                    <li key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                        fontSize: 'calc(0.95rem * var(--font-size-multiplier))',
                        color: 'var(--text-secondary)'
                    }}>
                        <Check size={20} color="var(--accent-color)" style={{ flexShrink: 0 }} />
                        {feature}
                    </li>
                ))}
            </ul>

            {user?.subscription_status !== 'free' ? (
                <div style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: 'calc(1.1rem * var(--font-size-multiplier))',
                    fontWeight: '600',
                    color: 'var(--accent-color)',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--accent-color)'
                }}>
                    Already using the Pro Version
                </div>
            ) : (
                <button
                    className="btn btn-primary"
                    onClick={() => handleCheckout(planType)}
                    disabled={loading[planType]}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: 'calc(1.1rem * var(--font-size-multiplier))',
                        fontWeight: '600',
                        background: isPopular
                            ? 'linear-gradient(135deg, var(--accent-color), #9333ea)'
                            : 'var(--accent-color)',
                        opacity: loading[planType] ? 0.6 : 1
                    }}
                >
                    {loading[planType] ? 'Loading...' : 'Upgrade Now'}
                </button>
            )}
        </div>
    );

    const features = [
        'Advanced AI prediction model',
        '10% more accurate forecasts',
        'More detailed analyzing AI',
        'Priority data processing',
    ];

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Navbar />

            <div className="container" style={{ marginTop: '2rem', maxWidth: '1200px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h1 style={{
                        fontSize: 'calc(3rem * var(--font-size-multiplier))',
                        fontWeight: '800',
                        marginBottom: '1rem',
                        color: 'var(--heading-color)'
                    }}>
                        Upgrade to HAMDI Pro
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'calc(1.2rem * var(--font-size-multiplier))',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Unlock the full power of AI-driven market analysis and predictions
                    </p>
                </div>

                {/* Current Plan Status */}
                {user && (
                    <div className="card" style={{
                        marginBottom: '3rem',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: 'calc(0.9rem * var(--font-size-multiplier))',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem'
                        }}>
                            Current Plan
                        </div>
                        <div style={{
                            fontSize: 'calc(1.5rem * var(--font-size-multiplier))',
                            fontWeight: '700',
                            color: 'var(--accent-color)'
                        }}>
                            {user.subscription_status === 'free' && 'Free Plan'}
                            {user.subscription_status === 'pro_monthly' && 'Pro Monthly'}
                            {user.subscription_status === 'pro_yearly' && 'Pro Yearly'}
                        </div>
                        {user.subscription_expires_at && (
                            <div style={{
                                fontSize: 'calc(0.85rem * var(--font-size-multiplier))',
                                color: 'var(--text-secondary)',
                                marginTop: '0.5rem'
                            }}>
                                Renews on {new Date(user.subscription_expires_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="card" style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* Pricing Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '2rem',
                    marginBottom: '3rem'
                }}>
                    <PricingCard
                        title="Pro Monthly"
                        price="20"
                        period="month"
                        planType="monthly"
                        features={features}
                        icon={Zap}
                        isPopular={false}
                    />
                    <PricingCard
                        title="Pro Yearly"
                        price="200"
                        period="year"
                        planType="yearly"
                        features={features}
                        icon={Crown}
                        isPopular={true}
                    />
                </div>

                {/* Back Button */}
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-outline"
                        style={{
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: 'calc(1.1rem * var(--font-size-multiplier))'
                        }}
                    >
                        <ArrowLeft size={21} />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
