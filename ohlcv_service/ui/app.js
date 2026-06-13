const API_BASE = "http://127.0.0.1:8001/ohlcv";
const INSTRUMENT = 738561;

let chart = null;
let candleSeries = null;
let volumeSeries = null;

function initChart() {
    const chartContainer = document.getElementById('chart');
    
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth || 800,
        height: 400,
        layout: {
            background: { type: 'solid', color: '#0b0e14' },
            textColor: '#94a3b8',
        },
        grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
    });

    volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    });
    
    // Resize handler
    new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainer) { return; }
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(chartContainer);
}

async function loadData(resolution) {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    
    try {
        const from = "2026-06-09T00:00:00Z";
        const to = "2026-06-10T00:00:00Z";
        const url = `${API_BASE}/${resolution}?instrument_token=${INSTRUMENT}&from=${from}&to=${to}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        
        // Format for lightweight-charts
        const candleData = data.map(d => {
            let bucketStr = d.bucket;
            if (!bucketStr.includes('T')) bucketStr += 'T00:00:00Z';
            else if (!bucketStr.endsWith('Z')) bucketStr += 'Z';
            const timeSeconds = Math.floor(new Date(bucketStr).getTime() / 1000);
            return {
                time: timeSeconds,
                open: parseFloat(d.open),
                high: parseFloat(d.high),
                low: parseFloat(d.low),
                close: parseFloat(d.close)
            };
        });
        
        const volData = data.map(d => {
            let bucketStr = d.bucket;
            if (!bucketStr.includes('T')) bucketStr += 'T00:00:00Z';
            else if (!bucketStr.endsWith('Z')) bucketStr += 'Z';
            const timeSeconds = Math.floor(new Date(bucketStr).getTime() / 1000);
            return {
                time: timeSeconds,
                value: parseInt(d.volume),
                color: parseFloat(d.close) >= parseFloat(d.open) ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
            };
        });
        
        candleSeries.setData(candleData);
        volumeSeries.setData(volData);
        
        if (data.length > 5) {
            chart.timeScale().fitContent();
        } else {
            // Prevent single candles from becoming giant
            chart.timeScale().applyOptions({ barSpacing: 100 });
        }
        
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Could not load data from API. Is the server running?");
    } finally {
        loader.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        initChart();
        loadData('daily'); // Load daily by default
        
        // Bind buttons
        document.getElementById('btn-daily').addEventListener('click', (e) => {
            document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadData('daily');
        });
        
        document.getElementById('btn-1min').addEventListener('click', (e) => {
            document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadData('1min');
        });
    } catch (error) {
        console.error(error);
        const loader = document.getElementById('loader');
        loader.innerHTML = `<p style="color:red">Initialization Error: ${error.message}</p>`;
    }
});
