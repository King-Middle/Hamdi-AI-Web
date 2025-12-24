import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    withCredentials: true // Enable sending cookies
});

export const getSP500 = async () => {
    const response = await api.get('/sp500');
    return response.data;
};

export const getStockHistory = async (symbol, period = '1mo', interval = '1d') => {
    const response = await api.get(`/stock/${symbol}/history`, {
        params: { period, interval }
    });
    return response.data;
};

export const getStockInfo = async (symbol) => {
    const response = await api.get(`/stock/${symbol}/info`);
    return response.data;
};

export const getStockAccuracy = async (symbol) => {
    const response = await api.get(`/stock/${symbol}/accuracy`);
    return response.data;
};

export const getStockPrediction = async (symbol) => {
    const response = await api.get(`/stock/${symbol}/prediction`);
    return response.data;
};



export const getStock5DayPrediction = async (symbol) => {
    try {
        const response = await api.get(`/stock/${symbol}/prediction5d`);
        return response.data;
    } catch (error) {
        console.error("Error fetching 5-day prediction:", error);
        throw error;
    }
};

export const getFavorites = async () => {
    try {
        const response = await api.get('/favorites');
        return response.data; // Returns list of symbols ["AAPL", "GOOGL"]
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};

export const addFavorite = async (symbol) => {
    try {
        const response = await api.post(`/favorites/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error adding favorite:", error);
        throw error;
    }
};

export const removeFavorite = async (symbol) => {
    try {
        const response = await api.delete(`/favorites/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error removing favorite:", error);
        throw error;
    }
};

// Payment functions
export const createCheckout = async (planType) => {
    try {
        const response = await api.post('/payments/create-checkout', {
            plan_type: planType
        });
        return response.data;
    } catch (error) {
        console.error("Error creating checkout:", error);
        throw error;
    }
};

export const getSubscriptionStatus = async () => {
    try {
        const response = await api.get('/payments/subscription-status');
        return response.data;
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        throw error;
    }
};

export default api;
