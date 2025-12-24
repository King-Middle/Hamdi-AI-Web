import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import requests
from io import StringIO
import os
from dotenv import load_dotenv

load_dotenv()

# Force TensorFlow to use CPU to avoid Metal/MPS crashes
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
try:
    import tensorflow as tf
    tf.config.set_visible_devices([], 'GPU')
except:
    pass

import TestFast_2_0 as test
import Classic_2_0 as classic
# import Classic_5days_0 as classic5d
import json
import numpy as np

import models
from database import engine
import auth
import payments

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS
# Enable CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(payments.router)

@app.get("/")
def read_root():
    return {"message": "Hamdi Backend API"}

def get_sp500_data():
    # Try multiple sources
    
    # Method 1: Try downloading from a reliable static source (GitHub)
    try:
        print("Trying GitHub S&P 500 list...")
        url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
        import pandas as pd
        df = pd.read_csv(url)
        
        if 'Symbol' in df.columns and 'Sector' in df.columns:
            result = []
            for _, row in df.iterrows():
                result.append({
                    "symbol": str(row['Symbol']).strip(),
                    "sector": str(row['Sector']).strip()
                })
            print(f"Successfully loaded {len(result)} companies from GitHub")
            return result
    except Exception as e:
        print(f"GitHub method failed: {e}")
    
    # Method 2: Try Wikipedia
    try:
        print("Trying Wikipedia...")
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Read all tables
        dfs = pd.read_html(StringIO(response.text))
        
        # Find table with Symbol and GICS Sector
        for df in dfs:
            # Check if columns contain the data we need
            col_str = str(df.columns).lower()
            
            if 'symbol' in col_str and 'sector' in col_str and len(df) > 100:
                # Find the actual column names
                symbol_col = None
                sector_col = None
                
                for col in df.columns:
                    col_name = str(col).lower()
                    if 'symbol' in col_name:
                        symbol_col = col
                    if 'sector' in col_name and 'gics' in col_name:
                        sector_col = col
                    elif 'sector' in col_name and sector_col is None:
                        sector_col = col
                
                if symbol_col and sector_col:
                    result = []
                    for _, row in df.iterrows():
                        try:
                            symbol = str(row[symbol_col]).strip()
                            sector = str(row[sector_col]).strip()
                            if symbol and symbol != 'nan' and sector and sector != 'nan':
                                result.append({
                                    "symbol": symbol,
                                    "sector": sector
                                })
                        except:
                            continue
                    
                    if len(result) > 100:
                        print(f"Successfully loaded {len(result)} companies from Wikipedia")
                        return result
    except Exception as e:
        print(f"Wikipedia method failed: {e}")
    
    # Method 3: Fallback to a hardcoded list of major stocks
    print("Using fallback stock list...")
    fallback_stocks = [
        {"symbol": "AAPL", "sector": "Information Technology"},
        {"symbol": "MSFT", "sector": "Information Technology"},
        {"symbol": "GOOGL", "sector": "Communication Services"},
        {"symbol": "AMZN", "sector": "Consumer Discretionary"},
        {"symbol": "NVDA", "sector": "Information Technology"},
        {"symbol": "META", "sector": "Communication Services"},
        {"symbol": "TSLA", "sector": "Consumer Discretionary"},
        {"symbol": "BRK.B", "sector": "Financials"},
        {"symbol": "JPM", "sector": "Financials"},
        {"symbol": "JNJ", "sector": "Health Care"},
        {"symbol": "V", "sector": "Financials"},
        {"symbol": "PG", "sector": "Consumer Staples"},
        {"symbol": "XOM", "sector": "Energy"},
        {"symbol": "UNH", "sector": "Health Care"},
        {"symbol": "HD", "sector": "Consumer Discretionary"},
        {"symbol": "MA", "sector": "Financials"},
        {"symbol": "CVX", "sector": "Energy"},
        {"symbol": "MRK", "sector": "Health Care"},
        {"symbol": "ABBV", "sector": "Health Care"},
        {"symbol": "PEP", "sector": "Consumer Staples"},
        {"symbol": "KO", "sector": "Consumer Staples"},
        {"symbol": "COST", "sector": "Consumer Staples"},
        {"symbol": "AVGO", "sector": "Information Technology"},
        {"symbol": "LLY", "sector": "Health Care"},
        {"symbol": "WMT", "sector": "Consumer Staples"},
        {"symbol": "MCD", "sector": "Consumer Discretionary"},
        {"symbol": "DIS", "sector": "Communication Services"},
        {"symbol": "BAC", "sector": "Financials"},
        {"symbol": "ABT", "sector": "Health Care"},
        {"symbol": "CSCO", "sector": "Information Technology"},
    ]
    return fallback_stocks

@app.get("/api/sp500")
def sp500():
    data = get_sp500_data()
    return data

@app.get("/api/stock/{symbol}/history")
def stock_history(symbol: str, period: str = "1mo", interval: str = "1d"):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            # Try replacing dot with dash
            if "." in symbol:
                symbol = symbol.replace(".", "-")
                ticker = yf.Ticker(symbol)
                df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found")
            
        # Reset index to make Date a column
        df = df.reset_index()
        
        # Standardize Date column name (yfinance uses 'Datetime' for intraday)
        if 'Datetime' in df.columns:
            df = df.rename(columns={'Datetime': 'Date'})
        
        # Convert to list of dicts for JSON response
        # Handle datetime serialization
        df['Date'] = df['Date'].astype(str)
        
        # Select relevant columns
        cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        data = df[cols].to_dict(orient='records')
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/info")
def stock_info(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{symbol}/accuracy")
def stock_accuracy(symbol: str, current_user: models.User = Depends(get_current_user)):
    try:
        # Call the HamdiTest function with subscription status
        # Note: This might be slow, so in a real app we'd use background tasks
        score = test.HamdiTest(symbol, subscription_status=current_user.subscription_status)
        return {"accuracy": score}
    except Exception as e:
        print(f"Error calculating accuracy: {e}")
        return {"accuracy": "N/A"}

@app.get("/api/stock/{symbol}/prediction")
def stock_prediction(symbol: str, current_user: models.User = Depends(get_current_user)):
    try:
        # Call the Hamdi function from Classic_2_0 with subscription status
        prediction = classic.Hamdi(symbol, subscription_status=current_user.subscription_status)
        # Convert numpy float to python float for JSON serialization
        print("\n\n\n\n\n",prediction)
        return {"prediction": float(prediction)}
    except Exception as e:
        print(f"Error calculating prediction: {e}")
        return {"prediction": "N/A"}

@app.get("/api/stock/{symbol}/prediction5d")
def stock_prediction_5d(symbol: str):
    return {"prediction": "N/A - Module Missing"}
    # try:
    #     # Call the Hamdi function from Classic_5days_0
    #     prediction = classic5d.Hamdi(symbol)
    #     # Ensure it's formatted to 2 decimal places
    #     print(f"\n5-day prediction for {symbol}: {prediction}")
    #     return {"prediction": float(prediction)}
    # except Exception as e:
    #     print(f"Error calculating 5-day prediction: {e}")
    #     return {"prediction": "N/A"}

@app.get("/api/favorites")
def get_favorites(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all favorites for the current user"""
    favorites = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id).all()
    # Return just the list of symbols
    return [fav.symbol for fav in favorites]

@app.post("/api/favorites/{symbol}")
def add_favorite(symbol: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add a stock to favorites"""
    symbol = symbol.upper()
    
    # Check if already exists
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.symbol == symbol
    ).first()
    
    if existing:
        return {"message": "Already favorited", "symbol": symbol}
    
    # Add new favorite
    new_fav = models.Favorite(user_id=current_user.id, symbol=symbol)
    db.add(new_fav)
    db.commit()
    
    return {"message": "Added to favorites", "symbol": symbol}

@app.delete("/api/favorites/{symbol}")
def remove_favorite(symbol: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a stock from favorites"""
    symbol = symbol.upper()
    
    fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.symbol == symbol
    ).first()
    
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(fav)
    db.commit()
    
    return {"message": "Removed from favorites", "symbol": symbol}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
