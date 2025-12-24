import yfinance as yf
import pandas as pd

symbol = "AAPL"
period = "1d"
interval = "5m"

ticker = yf.Ticker(symbol)
df = ticker.history(period=period, interval=interval)

print("Columns before reset_index:", df.columns)
print("Index name:", df.index.name)

df = df.reset_index()
print("Columns after reset_index:", df.columns)
