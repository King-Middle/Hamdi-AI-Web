from yfinance import download
import pandas as pd
from datetime import date, timedelta, datetime
from tensorflow.keras.models import load_model # type: ignore
from sklearn.preprocessing import MinMaxScaler
import numpy as np
import joblib
import time
import warnings
import os
import tensorflow
import signal

tensorflow.get_logger().setLevel('ERROR')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
warnings.filterwarnings("ignore")

macro_symbols = {
    # --- Risk & Volatilite ---
    'VIX': '^VIX',             # Volatilite endeksi

    # --- Tahviller & Faiz ---
    'US10Y': '^TNX',           # ABD 10 yıllık tahvil faizi
    'US3M': '^IRX',            # ABD 3 aylık hazine bonosu
    'US30Y': '^TYX',           # ABD 30 yıllık tahvil faizi

    # --- Emtialar ---
    'XAUUSD': 'GC=F',          # Altın
    'XAGUSD': 'SI=F',          # Gümüş
    'WTI': 'USO',             # Ham Petrol (WTI)
    'Brent': 'BZ=F',           # Brent Petrol
    'NaturalGas': 'NG=F',      # Doğalgaz
    'Copper': 'HG=F',          # Bakır
    'Platinum': 'PL=F',        # Platin
    'Palladium': 'PA=F',       # Paladyum

    # --- ABD Endeksleri ---
    'SPX': '^GSPC',            # S&P 500
    'DJI': '^DJI',             # Dow Jones
    'IXIC': '^IXIC',           # Nasdaq
    'RUT': '^RUT',             # Russell 2000

    # --- Global Endeksler ---
    'FTSE': '^FTSE',           # İngiltere FTSE 100
    'Nikkei': '^N225',         # Japonya Nikkei 225
    'HangSeng': '^HSI',        # Hong Kong Hang Seng
    'EuroStoxx50': '^STOXX50E',# Euro Bölgesi STOXX50

    # --- Kripto ---
    'BTC': 'BTC-USD',          # Bitcoin
    'ETH': 'ETH-USD',          # Ethereum
    'SOL': 'SOL-USD',          # Solana
}


today = date.today()


if today == date.today():
  today_hour = datetime.now()

  if today_hour.hour < 3:
    today = today + timedelta(0)
  else:
    today = today + timedelta(1)

else:
  today = today + timedelta(1)


back_date = 180
start_date = today - timedelta(back_date)
end_date = today
guess_date = today + timedelta(9)



def Hamdi(sembol, subscription_status="free"):


  stock_symbol = sembol

  decimals = 0

  # 🔹 2. Hisse ve makro verileri çek
  stock_df = download(stock_symbol, start=start_date, end=end_date, interval='1d', auto_adjust=True, progress=False)
  price_on_date = float(stock_df["Close"].iloc[-1])

  for name, ticker in macro_symbols.items():
      temp = download(ticker, start=start_date, end=end_date, interval='1d', auto_adjust=True, progress=False)[['Close']]
      temp.rename(columns={'Close': name}, inplace=True)
      stock_df = stock_df.join(temp, how='inner')

  # 🔹 3. Eksik satırları temizle
  stock_df.dropna(inplace=True)

  # 🔹 4. Özellikleri seç
  features = ['Open', 'High', 'Low', 'Close', 'Volume'] + list(macro_symbols.keys())
  data = stock_df[features].copy()

  # 🔹 5. Normalizasyon

  scaler = MinMaxScaler()
  scaled_data = scaler.fit_transform(data)

  # 🔹 6. Inputu modele uygun hale getir
  X_input = scaled_data.reshape(1, scaled_data.shape[0], scaled_data.shape[1])  # (1, zaman, özellik)

  # 🔹 7. Modeli yükle ve tahmin yap - Pro kullanıcılar için gelişmiş model
  global _model_cache, _pro_model_cache
  
  # Pro plan kontrolü
  is_pro = subscription_status in ["pro_monthly", "pro_yearly"]
  
  if is_pro:
      # Pro model yükle
      if '_pro_model_cache' not in globals() or _pro_model_cache is None:
          model_path = os.path.join(os.path.dirname(__file__), "Hamdi_SeriÜretim_15_2.0.keras")
          _pro_model_cache = load_model(model_path)
      model = _pro_model_cache
  else:
      # Free model yükle
      if '_model_cache' not in globals() or _model_cache is None:
          model_path = os.path.join(os.path.dirname(__file__), "Hamdi_GOOGDENEME_Anaconda_2.0.keras")
          _model_cache = load_model(model_path)
      model = _model_cache

  prediction = model.predict(X_input, verbose=0)[0][0]

  predicted_price = price_on_date * (1 + prediction / 100)

  print(f"\n{sembol}: {price_on_date:,.{decimals}f} $".replace(",", "?").replace(".", ",").replace("?", "."))


  if prediction < -0.01:
    print(f"{sembol}: {guess_date} tahmini fiyat: \033[91m{prediction:.2f} % ▼\033[0m  -  {predicted_price:,.{decimals}f} $\n".replace(",", "?").replace(".", ",").replace("?", "."))
  elif prediction > 0.01:
    print(f"{sembol}: {guess_date} tahmini fiyat: \033[92m{prediction:.2f} % ▲\033[0m  -  {predicted_price:,.{decimals}f} $\n".replace(",", "?").replace(".", ",").replace("?", "."))
  else:
    print(f"{sembol}: {guess_date} tahmini fiyat: \033[89m0.00 % \033[0m  -  {predicted_price:,.{decimals}f} $\n".replace(",", "?").replace(".", ",").replace("?", "."))

  return prediction

#*******************************************************************************
