import requests
import pandas as pd

url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    print("Fetching Wikipedia page...")
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    # Use match parameter to find table with "Symbol" in first row
    print("Looking for S&P 500 constituents table...")
    dfs = pd.read_html(response.text, match='Symbol')
    
    print(f"Found {len(dfs)} tables matching 'Symbol'")
    
    for i, df in enumerate(dfs):
        print(f"\n=== Table {i} ===")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        # Check if it has Symbol and Sector columns
        has_symbol = any('symbol' in str(col).lower() for col in df.columns)
        has_sector = any('sector' in str(col).lower() for col in df.columns)
        
        if has_symbol and has_sector and df.shape[0] > 100:
            print(f"\n*** This is the S&P 500 table! ***")
            print(f"First 3 rows:")
            print(df.head(3))
            
            # Show how to access it
            symbol_col = [col for col in df.columns if 'symbol' in str(col).lower()][0]
            sector_col = [col for col in df.columns if 'sector' in str(col).lower()][0]
            print(f"\nSymbol column: '{symbol_col}'")
            print(f"Sector column: '{sector_col}'")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
