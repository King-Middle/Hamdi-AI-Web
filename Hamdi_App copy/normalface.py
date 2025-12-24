import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
import bs4 as bs    
import pickle    
import requests    
import lxml
import TestFast_2_0 as test
import Classic_2_0 as classic
from dataclasses import dataclass

st.set_page_config(layout="wide")

# Sektör listeleri
HealthCare = []
Industrials = []
InformationTechnology = []
Utilities = []
Financials = []
ConsumerDiscretionary = []
RealEstate = []
ConsumerStaples = []
Energy = []
Materials = []


# Session state kontrolü
if 'page' not in st.session_state:
    st.session_state['page'] = 'home'
    st.session_state.OKToRerun = True

if "ForeverSymbol" not in st.session_state:
    st.session_state.ForeverSymbol = "ilk değer"
    st.session_state.ForeverSymbol_locked = True

Error = False

# Fonksiyonlar
def set_ForeverSymbol(value):
    if st.session_state.get("_ForeverSymbol_locked", False):
        return  # kilitliyse değiştirme
    st.session_state.ForeverSymbol = value

def BackToHome():
    st.session_state['page'] = 'home'


def ChangeSymbol(symbol):
    st.session_state['page'] = 'SpecialSymbol'
    set_ForeverSymbol(symbol)

def SearchSymbol():
    st.session_state['page'] = 'SpecialSymbol'
    set_ForeverSymbol(st.session_state.symbol)

    
def CreateButton(ButtonSymbol, place):
    place.write("")
    ModifiedButtonText = f"{ButtonSymbol}"
    place.button(ModifiedButtonText, on_click=ChangeSymbol, args=(ModifiedButtonText,), use_container_width=True)
    
    LittleGraphs(ButtonSymbol, place)


def SymbolPage(symbol):

    # Force rerun on first load to fix potential data fetching glitches
    if st.session_state.OKToRerun:
            st.session_state.OKToRerun = False
            st.rerun()

    st.title(symbol.upper())

    period = st.selectbox("Select Period", ["1d", "1mo", "3mo", "6mo", "1y", "5y"], key="selected_period")
    
    # Simplified interval selection logic based on user request
    period_to_interval = {
        "1d": "5m",
        "1mo": "1d",
        "3mo": "1d",
        "6mo": "1d",
        "1y": "1d",
        "5y": "1wk"
    }
    interval = period_to_interval.get(period, "1d")

    # Veri çekme
    df = yf.download(symbol, period=period, interval=interval, progress=False, auto_adjust=True)

    if df.empty:
        if ("." in symbol):
            symbol = symbol.replace(".","-")
            df = yf.download(symbol, period=period, interval=interval, progress=False, auto_adjust=True)
        else:
            st.warning("No data found. Please try a different symbol or period.")
            col1, col2 = st.columns([18, 1])
            col2.button("Back", on_click=BackToHome)
            return
        
    # Handle MultiIndex columns
    if isinstance(df.columns, pd.MultiIndex):
        try:
            df.columns = df.columns.droplevel(1) 
        except IndexError:
            pass

    # Ensure columns exist before accessing
    required_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
    available_cols = [c for c in required_cols if c in df.columns]
    
    if not available_cols:
        st.error(f"Expected columns {required_cols} not found. Columns are: {df.columns.tolist()}")
        return

    df = df[available_cols].astype(float)
    
    # Ensure index is datetime
    if not pd.api.types.is_datetime64_any_dtype(df.index):
        df.index = pd.to_datetime(df.index)

    # Plotly Candlestick
    fig = go.Figure()
    
    if all(col in df.columns for col in ['Open', 'High', 'Low', 'Close']):
        fig.add_trace(go.Candlestick(
            x=df.index,
            open=df['Open'],
            high=df['High'],
            low=df['Low'],
            close=df['Close'],
            name=symbol
        ))
    else:
        fig.add_trace(go.Scatter(x=df.index, y=df['Close'], mode='lines', name=symbol))


    fig.update_layout(
        title=f"{symbol} - {interval} Chart ({period})",
        xaxis_title="Time",
        yaxis_title="Price",
        template="plotly_dark",
        height=600,
        xaxis_rangeslider_visible=False 
    )

    st.plotly_chart(fig, use_container_width=True)

    st.session_state.selected_period = "1d"

    # --- Stock Details Section ---
    st.markdown("### Company Details")
    
    try:
        # We set OKToRerun to True here so next time we enter this page (e.g. via button click elsewhere), 
        # it triggers a refresh at the top of the function.
        st.session_state.OKToRerun = True

        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Display Description
        long_summary = info.get('longBusinessSummary', 'No description available.')
        st.info(long_summary)

        # Create 3 columns for metrics
        SPC = st.container()
        col1, col2, col3 = SPC.columns(3)

        with col1:
            st.metric("Sector:", info.get('sector', 'N/A'))
            st.divider()
            st.metric("Industry:", info.get('industry', 'N/A'))
            st.divider()
            st.metric("Market Cap:", f"{info.get('marketCap', 0):,}")
            st.divider()
            st.metric("Employees:", f"{info.get('fullTimeEmployees', 0):,}")
            st.divider()
            st.metric("Country:", info.get('country', 'N/A'))
            st.divider()

        with col2:
            st.metric("Previous Close:", info.get('previousClose', 'N/A'))
            st.divider()
            st.metric("Open:", info.get('open', 'N/A'))
            st.divider()
            st.metric("Day Low:", info.get('dayLow', 'N/A'))
            st.divider()
            st.metric("Day High:", info.get('dayHigh', 'N/A'))
            st.divider()
            st.metric("Volume:", f"{info.get('volume', 0):,}")
            st.divider()

        with col3:
            st.metric("52 Week High:", info.get('fiftyTwoWeekHigh', 'N/A'))
            st.divider()
            st.metric("52 Week Low:", info.get('fiftyTwoWeekLow', 'N/A'))
            st.divider()
            st.metric("Trailing PE:", info.get('trailingPE', 'N/A'))
            st.divider()
            st.metric("Forward PE:", info.get('forwardPE', 'N/A'))
            st.divider()
            st.metric("Dividend Yield:", f"{info.get('dividendYield', 0)*100:.2f}%" if info.get('dividendYield') else "N/A")
            st.divider()

    except Exception as e:
        st.error(f"Could not load company details: {e}")

    col1.markdown(f"<h1 style='color:cornflowerblue;'>Accuracy: {test.HamdiTest(symbol)}</h1>", unsafe_allow_html=True)
    
    # En sonda back butonu
    col1, col2 = st.columns([18, 1])
    col2.button("Back", on_click=lambda: (st.empty(), BackToHome()))


def LittleGraphs(symbol, LittlePlace):
    # Refactored for speed: Fetch minimal data (Close only if possible) and use a simple line chart
    period = "1d"
    interval = "5m"

    # Fetch data
    df = yf.download(symbol, period=period, interval=interval, progress=False, auto_adjust=True)

    if df.empty:
        if "." in symbol:
            symbol = symbol.replace(".", "-")
            df = yf.download(symbol, period=period, interval=interval, progress=False, auto_adjust=True)
        
        if df.empty:
            LittlePlace.warning("No data")
            return

    # Flatten MultiIndex if present
    if isinstance(df.columns, pd.MultiIndex):
        try:
            df.columns = df.columns.droplevel(1)
        except IndexError:
            pass

    # We only need 'Close' for a simple fast line graph
    if 'Close' not in df.columns:
        LittlePlace.error("No Close data")
        return

    # Determine color based on price movement
    first_price = df['Close'].iloc[0]
    last_price = df['Close'].iloc[-1]
    line_color = "green" if last_price >= first_price else "red"

    # Use a simple line chart instead of a heavy candlestick
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df.index, 
        y=df['Close'], 
        mode='lines', 
        name=symbol,
        line=dict(width=2, color=line_color)
    ))

    # Minimal layout configuration for speed
    fig.update_layout(
        template="plotly_dark",
        height=300, # Smaller height since it's just a preview
        margin=dict(l=10, r=10, t=30, b=10), # Tight margins
        xaxis=dict(showgrid=True, showticklabels=True), # Show grid and labels
        yaxis=dict(showgrid=True, showticklabels=True, side="left"), # Show grid and prices on left
        showlegend=False,
        shapes=[
            dict(
                type="rect",
                xref="paper", yref="paper",
                x0=0, y0=0,
                x1=1, y1=1,
                line=dict(
                    color="white",
                    width=1,
                ),
                fillcolor="rgba(0,0,0,0)",
            )
        ]
    )

    # Static plotting might be faster if interactivity isn't needed, 
    # but sticking to plotly_chart for consistency, just lighter config.
    LittlePlace.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False, 'staticPlot': True})



def get_sp500():
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        from io import StringIO
        # Use match param to find the specific table containing 'Symbol' or 'Ticker symbol'
        payload = pd.read_html(StringIO(response.text), match="Symbol")
        
        if not payload:
             payload = pd.read_html(StringIO(response.text), match="Ticker symbol")
             
        df = payload[0]
        
        if 'Symbol' in df.columns:
            tickers = df['Symbol'].tolist()
        elif 'Ticker symbol' in df.columns:
            tickers = df['Ticker symbol'].tolist()
        else:
            st.error("Error: Could not find 'Symbol' or 'Ticker symbol' column in S&P 500 data. Available columns: " + str(df.columns.tolist()))
            return []
        
        return tickers
        
    except Exception as e:
        st.error(f"Error fetching S&P 500 list: {e}")
        return []


def get_sp500_sectors():
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        from io import StringIO
        # Use match param to find the specific table containing 'Sector' or 'GICS Sector'
        payload = pd.read_html(StringIO(response.text), match="Sector", flavor='lxml')
        
        if not payload:
            payload = pd.read_html(StringIO(response.text), match="GICS Sector", flavor='lxml')
            
        df = payload[0]
        
        if 'Sector' in df.columns:
            sectors = df['Sector'].tolist()
        elif 'GICS Sector' in df.columns:
            sectors = df['GICS Sector'].tolist()
        else:
            st.error("Error: Could not find 'Sector' or 'GICS Sector' column in S&P 500 data. Available columns: " + str(df.columns.tolist()))
            return []
        
        return sectors
        
    except Exception as e:
        print(f"Error fetching S&P 500 sectors: {e}")
        return []


# Sayfa kontrolü
if st.session_state['page'] == 'SpecialSymbol':
    SymbolPage(st.session_state.ForeverSymbol)

if st.session_state['page'] == 'home':
    col1, col2, col3 = st.columns([1.01, 0.835, 0.99])
    col2.title("Welcome to HAMDI")
    st.text_input("Symbol", key="symbol", on_change=SearchSymbol)
    st.button("Search", on_click=SearchSymbol)
    st.write("")
    st.header("S&P 500:")

    col1, col2, col3 = st.columns([1, 1.5, 5])

    SortingMethod = col1.selectbox("Sort:", ["Alphabetical", "Price", "Change", "Volume"])
    CompanySector = col2.selectbox("Sector:", sorted(["All Sectors", "Health Care", "Industrials", 
    "Information Technology", "Utilities", "Financials", "Consumer Discretionary", 
    "Real Estate", "Consumer Staples", "Energy", "Materials"]))

    col1, col2, col3 = st.columns(3)

    # List of S&P 500 tickers

    # Fetch data once
    sp500_tickers = get_sp500()
    sp500_sectors = get_sp500_sectors()

    # Initialize lists
    HealthCare = []
    Industrials = []
    InformationTechnology = []
    Utilities = []
    Financials = []
    ConsumerDiscretionary = []
    RealEstate = []
    ConsumerStaples = []
    Energy = []
    Materials = []
    CommunicationServices = []

    # Map sectors to lists for O(1) lookup and appending
    sector_map = {
        "Health Care": HealthCare,
        "Industrials": Industrials,
        "Information Technology": InformationTechnology,
        "Utilities": Utilities,
        "Financials": Financials,
        "Consumer Discretionary": ConsumerDiscretionary,
        "Real Estate": RealEstate,
        "Consumer Staples": ConsumerStaples,
        "Energy": Energy,
        "Materials": Materials,
        "Communication Services": CommunicationServices
    }

    # Iterate once
    for ticker, sector in zip(sp500_tickers, sp500_sectors):
        if sector in sector_map:
            sector_map[sector].append(ticker)

    if CompanySector == "All Sectors":
        tickers_list = get_sp500()
    elif CompanySector == "Health Care":
        tickers_list = HealthCare
    elif CompanySector == "Industrials":
        tickers_list = Industrials
    elif CompanySector == "Information Technology":
        tickers_list = InformationTechnology
    elif CompanySector == "Utilities":
        tickers_list = Utilities
    elif CompanySector == "Financials":
        tickers_list = Financials
    elif CompanySector == "Consumer Discretionary":
        tickers_list = ConsumerDiscretionary
    elif CompanySector == "Real Estate":
        tickers_list = RealEstate
    elif CompanySector == "Consumer Staples":
        tickers_list = ConsumerStaples
    elif CompanySector == "Energy":
        tickers_list = Energy
    elif CompanySector == "Materials":
        tickers_list = Materials

    if (SortingMethod == "Alphabetical"):
        tickers_list = sorted(tickers_list)
    
    columns = [col1, col2, col3]
    for i, symbol in enumerate(tickers_list):
        # Ensure symbol is a string
        CreateButton(str(symbol), columns[i % 3])