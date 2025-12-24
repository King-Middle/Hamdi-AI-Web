import TestFast_2_0 as test
import os

# Force CPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

try:
    print("Testing HamdiTest function...")
    symbol = "AAPL"
    score = test.HamdiTest(symbol)
    print(f"Accuracy Score for {symbol}: {score}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
