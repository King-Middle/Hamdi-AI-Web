import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { getSP500, getStockHistory, getFavorites } from '../api';
import StockCard from '../components/StockCard';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// Helper functions for favorites management - MOVED TO API
// const getFavorites = ...
// const isFavorite = ...


const SECTORS = [
    "All Sectors", "Health Care", "Industrials", "Information Technology",
    "Utilities", "Financials", "Consumer Discretionary", "Real Estate",
    "Consumer Staples", "Energy", "Materials", "Communication Services"
];

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sector, setSector] = useState(localStorage.getItem('home_sector') || 'All Sectors');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(localStorage.getItem('home_favoritesFilter') || 'All Stocks');
    const [favorites, setFavorites] = useState([]); // State for backend favorites
    const [sort, setSort] = useState(localStorage.getItem('home_sortBy') || 'Alphabetical');

    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem('home_sector', sector);
    }, [sector]);

    useEffect(() => {
        localStorage.setItem('home_favoritesFilter', showFavoritesOnly);
    }, [showFavoritesOnly]);

    useEffect(() => {
        localStorage.setItem('home_sortBy', sort);
    }, [sort]);
    const [visibleCount, setVisibleCount] = useState(20);
    const [stockPrices, setStockPrices] = useState({});
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [searchedStock, setSearchedStock] = useState(null); // Store the searched stock if valid
    const [searchValidating, setSearchValidating] = useState(false); // Track if we're validating a search
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    // Show welcome modal only on first login for free users
    // Show welcome modal only on first login for free users
    useEffect(() => {
        if (user?.subscription_status === 'free') {
            const hasSeenWelcome = sessionStorage.getItem('hasSeenProModalSession');
            if (!hasSeenWelcome) {
                // Small delay to let page load
                setTimeout(() => {
                    setShowWelcomeModal(true);
                    sessionStorage.setItem('hasSeenProModalSession', 'true');
                }, 1000);
            }
        }
    }, [user]);

    // Handle search submission (Enter key)
    const handleSearch = (e) => {
        if (e.key === 'Enter' && search.trim()) {
            // Navigate to symbol page with the searched symbol
            navigate(`/symbol/${search.trim().toUpperCase()}`);
        }
    };

    // Validate and fetch searched stock when user types
    useEffect(() => {
        if (!search || search.trim().length < 1) {
            setSearchedStock(null);
            setSearchValidating(false);
            return;
        }

        const searchUpper = search.trim().toUpperCase();

        // Check if it's already in our S&P 500 list
        const existsInList = stocks.some(s => s.symbol.toUpperCase() === searchUpper);
        if (existsInList) {
            setSearchedStock(null);
            setSearchValidating(false);
            return;
        }

        // Set validating to true while we wait
        setSearchValidating(true);

        // Debounce the validation
        const timeoutId = setTimeout(async () => {
            try {
                // Try to fetch stock history to validate the symbol exists
                const history = await getStockHistory(searchUpper, '1d', '5m');

                // If we got valid data, add it as a searched stock
                if (history && history.length > 0) {
                    console.log(`Found valid stock: ${searchUpper}`);
                    setSearchedStock({
                        symbol: searchUpper,
                        sector: 'Other'
                    });
                } else {
                    console.log(`No data for stock: ${searchUpper}`);
                    setSearchedStock(null);
                }
            } catch (error) {
                // Symbol doesn't exist or error occurred
                console.log(`Error validating stock ${searchUpper}:`, error);
                setSearchedStock(null);
            } finally {
                setSearchValidating(false);
            }
        }, 600); // 600ms debounce

        return () => clearTimeout(timeoutId);
    }, [search, stocks]);

    // Fetch favorites when "Favorites Only" is selected
    useEffect(() => {
        const fetchFavorites = async () => {
            if (showFavoritesOnly === 'Favorites Only') {
                try {
                    const favs = await getFavorites();
                    setFavorites(favs);
                } catch (error) {
                    console.error("Error fetching favorites:", error);
                }
            }
        };
        fetchFavorites();
    }, [showFavoritesOnly]);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const data = await getSP500();
                console.log('Fetched stocks:', data?.length, 'stocks');
                setStocks(data);
            } catch (e) {
                console.error("Failed to fetch stocks", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStocks();
    }, []);

    const filteredStocks = useMemo(() => {
        let result = stocks;

        // Filter by Sector
        if (sector !== 'All Sectors') {
            result = result.filter(s => s.sector === sector);
        }

        // Filter by Favorites
        if (showFavoritesOnly === 'Favorites Only') {
            result = result.filter(s => favorites.includes(s.symbol));
        }

        // Filter by Search (only for S&P 500 stocks)
        if (search) {
            result = result.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()));
        }

        // Sort
        if (sort === 'Alphabetical') {
            result = [...result].sort((a, b) => a.symbol.localeCompare(b.symbol));
        } else if (sort === 'Day Change (%)') {
            result = [...result].sort((a, b) => {
                const changeA = stockPrices[a.symbol]?.change || 0;
                const changeB = stockPrices[b.symbol]?.change || 0;
                return changeB - changeA;
            });
        } else if (sort === 'Volume') {
            result = [...result].sort((a, b) => {
                const volA = stockPrices[a.symbol]?.volume || 0;
                const volB = stockPrices[b.symbol]?.volume || 0;
                return volB - volA;
            });
        } else if (sort === '52-Week Change %') {
            result = [...result].sort((a, b) => {
                const changeA = stockPrices[a.symbol]?.yearChange || 0;
                const changeB = stockPrices[b.symbol]?.yearChange || 0;
                return changeB - changeA;
            });
        }

        // Add searched stock at the beginning if it exists and is valid
        if (searchedStock && !result.some(s => s.symbol === searchedStock.symbol)) {
            result = [searchedStock, ...result];
        }

        console.log('Filtered stocks:', result?.length, 'stocks');
        return result;
    }, [stocks, sector, search, sort, stockPrices, searchedStock, showFavoritesOnly, favorites]);

    const visibleStocks = filteredStocks.slice(0, visibleCount);
    console.log('Visible stocks:', visibleStocks?.length, 'stocks', 'visibleCount:', visibleCount);

    // Fetch price data for ALL filtered stocks when price-based sort is selected
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setLoadingPrices(true);
                const priceData = {};

                // Fetch in batches to avoid overwhelming the API
                const batchSize = 10;
                const stocksToFetch = filteredStocks;

                for (let i = 0; i < stocksToFetch.length; i += batchSize) {
                    const batch = stocksToFetch.slice(i, i + batchSize);

                    await Promise.all(
                        batch.map(async (stock) => {
                            try {
                                let history;
                                let data = {};

                                if (sort === '52-Week Change %') {
                                    // Fetch 1 year of data for 52-week change
                                    history = await getStockHistory(stock.symbol, '1y', '1wk');
                                    if (history && history.length > 0) {
                                        const currentPrice = history[history.length - 1].Close;
                                        const startPrice = history[0].Close;
                                        const change = ((currentPrice - startPrice) / startPrice) * 100;
                                        data.yearChange = change;
                                    }
                                } else {
                                    // Default fetch for Price/Volume/Day Change (using 1d)
                                    history = await getStockHistory(stock.symbol, '1d', '5m');
                                    if (history && history.length > 0) {
                                        const currentPrice = history[history.length - 1].Close;
                                        const startPrice = history[0].Close;
                                        const change = ((currentPrice - startPrice) / startPrice) * 100;

                                        // Calculate volume (sum of 5m intervals)
                                        const volume = history.reduce((acc, curr) => acc + (curr.Volume || 0), 0);

                                        data.price = currentPrice;
                                        data.change = change;
                                        data.volume = volume;
                                    }
                                }

                                priceData[stock.symbol] = {
                                    ...(stockPrices[stock.symbol] || {}), // Preserve existing data
                                    ...data
                                };

                            } catch (err) {
                                console.error(`Error fetching data for ${stock.symbol}:`, err);
                            }
                        })
                    );

                    // Update progress incrementally
                    setStockPrices(prev => ({ ...prev, ...priceData }));
                }
            } catch (error) {
                console.error('Error in fetchPrices:', error);
            } finally {
                setLoadingPrices(false);
            }
        };

        if (sort !== 'Alphabetical' && filteredStocks.length > 0) {
            // Only fetch if we don't already have the data
            const missingData = filteredStocks.some(stock => !stockPrices[stock.symbol]);
            if (missingData) {
                fetchPrices();
            }
        } else {
            // Reset loading state if alphabetical sort is selected
            setLoadingPrices(false);
        }
    }, [sort, filteredStocks.length, sector, search]);

    // Infinite scroll: Load more when user scrolls to bottom
    useEffect(() => {
        const handleScroll = () => {
            // Check if user is near bottom of page (within 500px)
            const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500;

            if (scrolledToBottom && visibleCount < filteredStocks.length && !loadingPrices) {
                setVisibleCount(prev => prev + 20);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visibleCount, filteredStocks.length, loadingPrices]);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <Navbar />

            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: 'calc(3rem * var(--font-size-multiplier))', fontWeight: '800', marginBottom: '1rem', color: 'var(--heading-color)' }}>
                        Welcome to HAMDI
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'calc(1.2rem * var(--font-size-multiplier))' }}>
                        Highly Analytical Market Data Intelligence
                    </p>
                </div>

                {/* Search Box */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="btn btn-outline" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        <Search style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 1 }} size={20} />
                        <input
                            type="text"
                            placeholder="Search Symbol"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                            style={{
                                paddingLeft: '3rem',
                                fontSize: 'calc(1.1rem * var(--font-size-multiplier))',
                                backgroundColor: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'inherit',
                                width: '100%',
                                padding: '0.5rem 1rem 0.5rem 3rem'
                            }}
                        />
                    </div>
                    {search && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(128, 128, 128, 0.1)',
                            border: '1px solid rgba(128, 128, 128, 0.3)',
                            borderRadius: '0.5rem',
                            color: 'var(--accent-color)',
                            fontSize: 'calc(0.9rem * var(--font-size-multiplier))',
                            textAlign: 'center'
                        }}>
                            All stocks are not shown on the home page. Please enter your stock symbol and press <strong>ENTER</strong>.
                        </div>
                    )}
                </div>

                {/* Filters Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Filter size={18} style={{ color: 'var(--accent-color)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.9rem * var(--font-size-multiplier))', fontWeight: '600' }}>FILTERS</span>
                        </div>

                        <div style={{ flex: 1, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Sector
                                </label>
                                <div className="btn btn-outline" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                    <select
                                        value={sector}
                                        onChange={(e) => setSector(e.target.value)}
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
                                        {SECTORS.map(s => <option key={s} value={s} style={{ backgroundColor: '#1f2937', color: 'white' }}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Favorites
                                </label>
                                <div className="btn btn-outline" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                    <select
                                        value={showFavoritesOnly}
                                        onChange={(e) => setShowFavoritesOnly(e.target.value)}
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
                                        <option value="All Stocks" style={{ backgroundColor: '#1f2937', color: 'white' }}>All Stocks</option>
                                        <option value="Favorites Only" style={{ backgroundColor: '#1f2937', color: 'white' }}> Favorites</option>
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: '180px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 'calc(0.85rem * var(--font-size-multiplier))', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Sort By
                                </label>
                                <div className="btn btn-outline" style={{ position: 'relative', padding: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
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
                                        <option value="Alphabetical" style={{ backgroundColor: '#1f2937', color: 'white' }}>Alphabetical</option>
                                        <option value="Day Change (%)" style={{ backgroundColor: '#1f2937', color: 'white' }}>Day Change (%)</option>
                                        <option value="Volume" style={{ backgroundColor: '#1f2937', color: 'white' }}>Volume</option>
                                        <option value="52-Week Change %" style={{ backgroundColor: '#1f2937', color: 'white' }}>52-Week Change %</option>
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* S&P 500 Text - only show when not searching */}
                {!search && (
                    <div style={{
                        textAlign: 'center',
                        margin: '1.5rem 0',
                        fontSize: 'calc(2rem * var(--font-size-multiplier))',
                        fontWeight: '700',
                        color: 'var(--accent-color)'
                    }}>
                        S&P 500
                    </div>
                )}

                {loadingPrices && (
                    <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ color: 'var(--accent-color)', fontSize: 'calc(1.1rem * var(--font-size-multiplier))', marginBottom: '0.5rem' }}>
                            Loading price data for sorting...
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.9rem * var(--font-size-multiplier))' }}>
                            Fetching data for {filteredStocks.length} stocks
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>Loading market data...</div>
                ) : (
                    <>
                        {/* Show loading when searching and no results */}
                        {search && visibleStocks.length === 0 && searchValidating && (
                            <div style={{ textAlign: 'center', padding: '4rem' }}>
                                <div style={{ color: 'var(--accent-color)', fontSize: 'calc(1.2rem * var(--font-size-multiplier))' }}>
                                    Loading...
                                </div>
                            </div>
                        )}

                        {/* Show empty state when Favorites Only is selected but no favorites exist */}
                        {showFavoritesOnly === 'Favorites Only' && visibleStocks.length === 0 && !searchValidating && (
                            <div className="card" style={{ textAlign: 'center', padding: '4rem', marginTop: '2rem' }}>
                                <div style={{ fontSize: 'calc(4rem * var(--font-size-multiplier))', marginBottom: '1rem' }}>⭐</div>
                                <h2 style={{ fontSize: 'calc(2rem * var(--font-size-multiplier))', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                    No Favorites Yet
                                </h2>
                                <p style={{ fontSize: 'calc(1.2rem * var(--font-size-multiplier))', color: 'var(--text-secondary)' }}>
                                    Click on a stock and press the star icon to add it to your favorites!
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {visibleStocks.map(stock => (
                                <StockCard key={stock.symbol} symbol={stock.symbol} />
                            ))}
                        </div>

                        {visibleCount < filteredStocks.length && (
                            <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 'calc(0.9rem * var(--font-size-multiplier))' }}>
                                    Loading more stocks...
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Welcome Modal */}
            {showWelcomeModal && (
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
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => setShowWelcomeModal(false)}>
                    <div className="card" style={{
                        maxWidth: '600px',
                        padding: '2.5rem',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 style={{
                                fontSize: 'calc(2.5rem * var(--font-size-multiplier))',
                                fontWeight: '800',
                                marginBottom: '1rem',
                                background: 'linear-gradient(135deg, var(--accent-color), #9333ea)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                Welcome to HAMDI!
                            </h2>
                            <p style={{
                                fontSize: 'calc(1.1rem * var(--font-size-multiplier))',
                                color: 'var(--text-secondary)',
                                marginBottom: '2rem'
                            }}>
                                Start your journey with AI-powered stock market analysis
                            </p>
                        </div>

                        <div className="card" style={{
                            padding: '1.5rem',
                            backgroundColor: 'rgba(124, 58, 237, 0.05)',
                            border: '1px solid var(--accent-color)',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{
                                fontSize: 'calc(1.3rem * var(--font-size-multiplier))',
                                marginBottom: '1rem',
                                color: 'var(--accent-color)',
                                fontWeight: '700'
                            }}>
                                ⚡ Unlock Pro Features
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                                <li style={{ marginBottom: '0.5rem' }}>Advanced AI prediction model</li>
                                <li style={{ marginBottom: '0.5rem' }}>Higher accuracy forecasts</li>
                                <li style={{ marginBottom: '0.5rem' }}>10-day prediction horizon</li>
                                <li style={{ marginBottom: '0.5rem' }}>Priority data processing</li>
                            </ul>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowWelcomeModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '1rem'
                                }}
                            >
                                Maybe Later
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowWelcomeModal(false);
                                    navigate('/payment');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, var(--accent-color), #9333ea)',
                                    fontWeight: '600'
                                }}
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Home;
