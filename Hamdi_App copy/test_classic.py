import Classic_2_0 as classic
import sys

try:
    print("Testing Hamdi function...")
    symbol = "AAPL"
    prediction = classic.Hamdi(symbol)
    print(f"Prediction for {symbol}: {prediction}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
