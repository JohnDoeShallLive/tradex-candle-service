const API_BASE_URL = 'http://localhost:8000';

export const fetchCandles = async (instrumentToken, from, to, resolution) => {
  try {
    const url = new URL(`${API_BASE_URL}/ohlcv/${resolution}`);
    url.searchParams.append('instrument_token', instrumentToken);
    url.searchParams.append('start_time', from);
    url.searchParams.append('end_time', to);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch candles", error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.error("Health check failed", error);
    throw error;
  }
};
