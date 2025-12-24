import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, Users, Globe, ChevronDown, Star } from 'lucide-react';
import { getStockHistory, getStockInfo, getStockAccuracy, getStockPrediction, getStock5DayPrediction, addFavorite, removeFavorite, getFavorites } from '../api';
import Navbar from '../components/Navbar';

// Helper functions for favorites management - MOVED TO API
// const getFavorites = () => {
//     try {
//         const favorites = localStorage.getItem('favoriteStocks');
//         return favorites ? JSON.parse(favorites) : [];
//     } catch (e) {
//         console.error('Error reading favorites:', e);
//         return [];
//     }
// };

// const isFavorite = (symbol) => {
//     const favorites = getFavorites();
//     return favorites.includes(symbol);
// };

// const toggleFavorite = (symbol) => {
//     const favorites = getFavorites();
//     let newFavorites;

//     if (favorites.includes(symbol)) {
//         // Remove from favorites
//         newFavorites = favorites.filter(s => s !== symbol);
//     } else {
//         // Add to favorites
//         newFavorites = [...favorites, symbol];
//     }

//     localStorage.setItem('favoriteStocks', JSON.stringify(newFavorites));
//     return newFavorites.includes(symbol);
// };

const SymbolPage = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [info, setInfo] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [prediction5d, setPrediction5d] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('1d');
    const [isFavorited, setIsFavorited] = useState(false);
    const [interval, setInterval] = useState('5m');

    const [graphType, setGraphType] = useState('candlestick');
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 10;

    useEffect(() => {
        let isMounted = true;

        // Quick initial validation to fail fast for invalid stocks
        const quickValidation = async () => {
            if (!isMounted) return false;

            try {
                console.log(`Quick validation for ${symbol}...`);
                const histData = await getStockHistory(symbol, period, interval);

                // If we got valid data, stock exists
                if (histData && histData.length > 0) {
                    console.log(`Stock ${symbol} exists, proceeding with full load...`);
                    return true;
                }

                // No data means stock doesn't exist
                console.log(`Stock ${symbol} validation failed - no data`);
                return false;
            } catch (e) {
                console.error(`Quick validation failed for ${symbol}:`, e);
                return false;
            }
        };

        const fetchData = async (attempt = 0) => {
            if (!isMounted) return;

            setLoading(true);
            setError(null);

            // On first attempt, do quick validation
            if (attempt === 0) {
                const isValid = await quickValidation();
                if (!isValid) {
                    if (isMounted) {
                        setError('Stock not found or data unavailable');
                        setLoading(false);
                    }
                    return;
                }
            }

            try {
                console.log(`Fetching data for ${symbol}, attempt ${attempt + 1}`);
                const [histData, infoData] = await Promise.all([
                    getStockHistory(symbol, period, interval),
                    getStockInfo(symbol)
                ]);

                // Check if we got valid data
                if (!histData || histData.length === 0) {
                    throw new Error("No history data received");
                }

                // Check for critical info (Profile/Metrics)
                const hasInfo = infoData && Object.keys(infoData).length > 0 && (infoData.longBusinessSummary || infoData.sector);

                if (!hasInfo) {
                    // If we are not on the last attempt, treat missing info as a failure to trigger retry
                    if (attempt < maxRetries) {
                        throw new Error("Incomplete info data received");
                    }
                    console.warn("Max retries reached. Loading with partial data.");
                }

                if (isMounted) {
                    setHistory(histData);
                    setInfo(infoData || {}); // Ensure info is at least an empty object
                    setLoading(false);
                }
            } catch (e) {
                console.error(`Error fetching data (attempt ${attempt + 1}):`, e);

                if (attempt < maxRetries) {
                    console.log(`Retrying in 2 seconds...`);
                    setTimeout(() => {
                        if (isMounted) fetchData(attempt + 1);
                    }, 500);
                } else {
                    if (isMounted) {
                        setError('Stock not found or data unavailable');
                        setLoading(false);
                    }
                }
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [symbol, period, interval, retryCount]); // Added retryCount to dependency to allow manual retry

    // Check if stock is favorited on mount
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            try {
                const favorites = await getFavorites();
                setIsFavorited(favorites.includes(symbol));
            } catch (error) {
                console.error("Failed to check favorite status", error);
            }
        };
        checkFavoriteStatus();
    }, [symbol]);

    const handleToggleFavorite = async () => {
        try {
            if (isFavorited) {
                await removeFavorite(symbol);
                setIsFavorited(false);
            } else {
                await addFavorite(symbol);
                setIsFavorited(true);
            }
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            // Optionally add toast notification here
        }
    };


    // Fetch Prediction first, then Accuracy (Sequential to avoid resource contention)
    useEffect(() => {
        const fetchMetrics = async () => {
            // 1. Fetch Prediction (Fast)

            // 2. Fetch Accuracy (Slow)
            try {
                const accData = await getStockAccuracy(symbol);
                setAccuracy(accData.accuracy);
            } catch (e) {
                console.error("Error fetching accuracy", e);
            }

            try {
                const predData = await getStockPrediction(symbol);
                setPrediction(predData.prediction);
            } catch (e) {
                console.error("Error fetching prediction", e);
            }

            try {
                const pred5dData = await getStock5DayPrediction(symbol);
                setPrediction5d(pred5dData.prediction);
            } catch (e) {
                console.error("Error fetching 5-day prediction", e);
            }
        };

        fetchMetrics();
    }, [symbol]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        // Map period to interval similar to original app
        const p2i = {
            "1d": "5m",
            "1mo": "1d",
            "3mo": "1d",
            "6mo": "1d",
            "1y": "1d",
            "5y": "1wk"
        };
        setInterval(p2i[newPeriod] || "1d");
    };

    if (loading && !info) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 'calc(1.5rem * var(--font-size-multiplier))', color: 'var(--text-secondary)' }}>Loading the data of {symbol}...</div>
            </div>
        );
    }

    // Show error message if stock not found
    if (error) {
        return (
            <div style={{ minHeight: '100vh' }}>
                <Navbar />
                <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: 'calc(4rem * var(--font-size-multiplier))', marginBottom: '1rem' }}>📊</div>
                        <h1 style={{ fontSize: 'calc(2.5rem * var(--font-size-multiplier))', marginBottom: '1rem', color: 'var(--text-primary)' }}>Stock Not Found</h1>
                        <p style={{ fontSize: 'calc(1.2rem * var(--font-size-multiplier))', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            The stock symbol "<strong>{symbol}</strong>" could not be found on Yahoo Finance.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setRetryCount(prev => prev + 1)}
                                style={{ padding: '1rem 2rem', fontSize: 'calc(1.1rem * var(--font-size-multiplier))', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                🔄 Try Again
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate('/')}
                                style={{ padding: '1rem 2rem', fontSize: 'calc(1.1rem * var(--font-size-multiplier))', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <ArrowLeft size={20} /> Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getChartData = () => {
        if (graphType === 'line') {
            const startPrice = history.length > 0 ? history[0].Close : 0;
            const endPrice = history.length > 0 ? history[history.length - 1].Close : 0;
            const isDown = endPrice < startPrice;

            return [{
                x: history.map(d => d.Date),
                y: history.map(d => d.Close),
                type: 'scatter',
                mode: 'lines',
                line: { color: isDown ? '#ef4444' : '#10b981', width: 6 },
                name: 'Close Price'
            }];
        }
        return [{
            x: history.map(d => d.Date),
            close: history.map(d => d.Close),
            high: history.map(d => d.High),
            low: history.map(d => d.Low),
            open: history.map(d => d.Open),
            type: 'candlestick',
            xaxis: 'x',
            yaxis: 'y',
            increasing: { line: { color: '#10b981' } },
            decreasing: { line: { color: '#ef4444' } }
        }];
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Navbar />

            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: 'calc(3rem * var(--font-size-multiplier))', margin: '0 0 0.5rem 0' }}>{symbol}</h1>
                            <h2 style={{ fontSize: 'calc(1.5rem * var(--font-size-multiplier))', color: 'var(--text-secondary)', fontWeight: 'normal', margin: 0 }}>
                                {info?.longName || symbol}
                            </h2>
                        </div>
                        <button
                            onClick={handleToggleFavorite}
                            className="btn btn-outline"
                            style={{
                                padding: '0rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '3rem',
                                height: '3rem',
                                border: '2px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                backgroundColor: isFavorited ? 'rgba(255, 217, 0, 0)' : 'transparent',
                                marginBottom: '2rem',
                                marginLeft: '1rem'
                            }}
                            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Star
                                size={30}
                                fill={isFavorited ? '#FFD700' : 'none'}
                                stroke={isFavorited ? '#FFD700' : 'var(--text-secondary)'}
                                strokeWidth={0.5}
                                style={{ transition: 'all 0.3s ease' }}
                            />
                        </button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'calc(2.5rem * var(--font-size-multiplier))', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {history.length > 0 && `$${history[history.length - 1].Close.toFixed(2)}`}
                        </div>
                        <div style={{ fontSize: 'calc(1.2rem * var(--font-size-multiplier))', marginTop: '0.5rem', color: 'cornflowerblue' }}>
                            Accuracy Score: <strong>{accuracy !== null ? `${accuracy}%` : 'Analyzing...'}</strong>
                        </div>

                        {/*{prediction !== null && (
                            <div style={{ fontSize: 'calc(1.2rem * var(--font-size-multiplier))', marginTop: '0.5rem', color: 'cornflowerblue' }}>
                                Prediction: <strong>{prediction}%</strong>
                            </div>
                        )}*/}

                        {/* DEBUG VISUALIZATION */}
                        {/* 5-DAYS PREDICTION */}

                        <div style={{ border: '2px dashed #909090ff', padding: '10px', marginTop: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                            <div style={{ fontSize: 'calc(0.9rem * var(--font-size-multiplier))', color: '#a1a1a1ff', fontWeight: 'bold' }}>10-DAYS PREDICTION:</div>
                            {prediction === null ? (
                                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Analyzing...</div>
                            ) : (
                                <div style={{ fontSize: 'calc(4rem * var(--font-size-multiplier))', fontWeight: 'bold', color: prediction > 0 ? '#10b981' : '#ef4444', lineHeight: 1 }}>
                                    {typeof prediction === 'number' ? prediction.toFixed(2) + '%' : prediction}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {["1d", "1mo", "3mo", "6mo", "1y", "5y"].map(p => (
                                <button
                                    key={p}
                                    className={`btn ${period === p ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => handlePeriodChange(p)}
                                    style={{ padding: '0.5rem 1rem', fontSize: 'calc(0.9rem * var(--font-size-multiplier))' }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="btn btn-outline" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            <select
                                value={graphType}
                                onChange={(e) => setGraphType(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    padding: '0.5rem 2.5rem 0.5rem 1rem',
                                    fontSize: 'calc(0.9rem * var(--font-size-multiplier))',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                <option value="candlestick" style={{ backgroundColor: '#1f2937', color: 'white' }}>Candlestick</option>
                                <option value="line" style={{ backgroundColor: '#1f2937', color: 'white' }}>Line Graph</option>
                            </select>
                            <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div style={{ height: '500px' }}>
                        <Plot
                            data={getChartData()}
                            layout={{
                                dragmode: 'zoom',
                                margin: { r: 10, t: 25, b: 40, l: 60 },
                                showlegend: false,
                                xaxis: {
                                    autorange: true,
                                    title: 'Date',
                                    type: 'date',
                                    rangeslider: { visible: false }
                                },
                                yaxis: {
                                    autorange: true,
                                    type: 'linear'
                                },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                font: { color: '#a1a1a1' }
                            }}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            config={{ responsive: true }}
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {/* Company Info */}
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Company Profile</h3>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            {info?.longBusinessSummary || "No description available."}
                        </p>
                    </div>

                    {/* Metrics */}
                    <div className="card">
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Key Metrics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                            {/* General Information */}
                            <MetricItem label="Sector" value={info?.sector} icon={<Activity size={18} />} />
                            <MetricItem label="Industry" value={info?.industry} icon={<Activity size={18} />} />
                            <MetricItem label="Country" value={info?.country} icon={<Globe size={18} />} />
                            <MetricItem label="Employees" value={info?.fullTimeEmployees?.toLocaleString()} icon={<Users size={18} />} />

                            {/* Valuation Metrics */}
                            <MetricItem label="Market Cap" value={info?.marketCap ? `$${(info.marketCap / 1e9).toFixed(2)}B` : 'N/A'} icon={<DollarSign size={18} />} />
                            <MetricItem label="PE Ratio (TTM)" value={info?.trailingPE?.toFixed(2)} icon={<TrendingUp size={18} />} />
                            <MetricItem label="Forward P/E" value={info?.forwardPE?.toFixed(2)} icon={<TrendingUp size={18} />} />
                            <MetricItem label="PEG Ratio" value={info?.pegRatio?.toFixed(2)} icon={<TrendingUp size={18} />} />
                            <MetricItem label="Price to Book" value={info?.priceToBook?.toFixed(2)} icon={<TrendingUp size={18} />} />
                            <MetricItem label="Book Value" value={info?.bookValue?.toFixed(2)} icon={<DollarSign size={18} />} />

                            {/* Profitability */}
                            <MetricItem label="EPS (TTM)" value={info?.trailingEps?.toFixed(2)} icon={<DollarSign size={18} />} />
                            <MetricItem label="Profit Margin" value={info?.profitMargins ? `${(info.profitMargins * 100).toFixed(2)}%` : 'N/A'} icon={<TrendingUp size={18} />} />
                            <MetricItem label="Operating Margin" value={info?.operatingMargins ? `${(info.operatingMargins * 100).toFixed(2)}%` : 'N/A'} icon={<TrendingUp size={18} />} />
                            <MetricItem label="Return on Equity" value={info?.returnOnEquity ? `${(info.returnOnEquity * 100).toFixed(2)}%` : 'N/A'} icon={<TrendingUp size={18} />} />

                            {/* Revenue */}
                            <MetricItem label="Revenue (TTM)" value={info?.totalRevenue ? `$${(info.totalRevenue / 1e9).toFixed(2)}B` : 'N/A'} icon={<DollarSign size={18} />} />
                            <MetricItem label="Revenue Growth" value={info?.revenueGrowth ? `${(info.revenueGrowth * 100).toFixed(2)}%` : 'N/A'} icon={<TrendingUp size={18} />} />

                            {/* Trading Activity */}
                            <MetricItem label="Volume" value={info?.volume?.toLocaleString()} icon={<Activity size={18} />} />
                            <MetricItem label="Avg Volume" value={info?.averageVolume?.toLocaleString()} icon={<Activity size={18} />} />
                            <MetricItem label="Beta" value={info?.beta?.toFixed(2)} icon={<Activity size={18} />} />

                            {/* Price Ranges */}
                            <MetricItem label="52W High" value={info?.fiftyTwoWeekHigh?.toFixed(2)} icon={<TrendingUp size={18} />} />
                            <MetricItem label="52W Low" value={info?.fiftyTwoWeekLow?.toFixed(2)} icon={<TrendingDown size={18} />} />
                            <MetricItem label="50 Day Avg" value={info?.fiftyDayAverage?.toFixed(2)} icon={<Activity size={18} />} />
                            <MetricItem label="200 Day Avg" value={info?.twoHundredDayAverage?.toFixed(2)} icon={<Activity size={18} />} />

                            {/* Dividends & Debt */}
                            <MetricItem label="Dividend Yield" value={info?.dividendYield ? `${(info.dividendYield * 100).toFixed(2)}%` : 'N/A'} icon={<DollarSign size={18} />} />
                            <MetricItem label="Debt to Equity" value={info?.debtToEquity?.toFixed(2)} icon={<Activity size={18} />} />
                        </div>
                    </div>
                </div>

                {/* Back to Home button at bottom */}
                <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn btn-outline" onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: 'calc(1.1rem * var(--font-size-multiplier))' }}>
                        <ArrowLeft size={20} /> Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetricItem = ({ label, value, icon }) => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: 'calc(0.9rem * var(--font-size-multiplier))' }}>
            {icon} {label}
        </div>
        <div style={{ fontSize: 'calc(1.1rem * var(--font-size-multiplier))', fontWeight: '500' }}>{value || 'N/A'}</div>
    </div>
);

export default SymbolPage;
