import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { getStockHistory } from '../api';

const StockCard = ({ symbol }) => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                // Fetch minimal data for sparkline
                const history = await getStockHistory(symbol, '1d', '5m');
                if (isMounted) {
                    setData(history);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [symbol]);

    const handleClick = () => {
        navigate(`/symbol/${symbol}`);
    };

    if (error) return null; // Hide card if error

    const isPositive = data && data.length > 0 && data[data.length - 1].Close >= data[0].Close;
    const color = isPositive ? '#10b981' : '#ef4444';

    return (
        <div className="card" onClick={handleClick} style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: 'calc(1.25rem * var(--font-size-multiplier))' }}>{symbol}</h3>
                {data && (
                    <span style={{ color, fontWeight: 'bold' }}>
                        ${data[data.length - 1].Close.toFixed(2)}
                    </span>
                )}
            </div>

            <div style={{ height: '120px', width: '100%' }}>
                {loading ? (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                ) : (
                    <Plot
                        data={[
                            {
                                x: data.map(d => d.Date),
                                y: data.map(d => d.Close),
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: color, width: 2.5 },
                            },
                        ]}
                        layout={{
                            width: undefined,
                            height: 120,
                            margin: { l: 0, r: 0, t: 5, b: 5 },
                            xaxis: { visible: false, fixedrange: true },
                            yaxis: { visible: false, fixedrange: true, autorange: true },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            showlegend: false,
                            autosize: true
                        }}
                        config={{ displayModeBar: false, staticPlot: true, responsive: true }}
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
            </div>
        </div>
    );
};

export default StockCard;
