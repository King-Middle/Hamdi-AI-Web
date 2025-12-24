import os


# Global cache for model to prevent reloading
_model_cache = None
_pro_model_cache = None


def HamdiTest(Symbol, subscription_status="free"):
   # Lazy imports to speed up initial module import
   from yfinance import download
   import pandas as pd
   from datetime import date, timedelta, datetime
   from tensorflow.keras.models import load_model # type: ignore
   from sklearn.preprocessing import MinMaxScaler
   import numpy as np
   import warnings
   import tensorflow
   from tqdm import tqdm


   # Suppress warnings
   tensorflow.get_logger().setLevel('ERROR')
   os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
   warnings.filterwarnings("ignore")


   ChooseTheSymbolForOnce = Symbol.upper()
   TestScore = 0
   Test_Memory = []
   Test_Memory_Percentage = []


   # Helper function to get cached model - Pro kullanıcılar için gelişmiş model
   global _model_cache, _pro_model_cache
   
   # Pro plan kontrolü
   is_pro = subscription_status in ["pro_monthly", "pro_yearly"]
   
   if is_pro:
       # Pro model yükle
       if _pro_model_cache is None:
           model_path = os.path.join(os.path.dirname(__file__), "Hamdi_SeriÜretim_15_2.0.keras")
           _pro_model_cache = load_model(model_path)
       model = _pro_model_cache
   else:
       # Free model yükle
       if _model_cache is None:
           model_path = '/Users/ardaunal/Desktop/Hamdi/Hamdi_Anaconda/Hamdi_GOOGDENEME_Anaconda_2.0.keras'
           # Fallback to local path if absolute path fails
           if not os.path.exists(model_path):
                model_path = os.path.join(os.path.dirname(__file__), "Hamdi_GOOGDENEME_Anaconda_2.0.keras")
           _model_cache = load_model(model_path)
       model = _model_cache


   # 1. Fetch Stock Data
   start_date = date(2024, 5, 15)
   end_date = date.today()
  
   stock_df = download(Symbol, start=start_date, end=end_date, interval='1d', auto_adjust=True, progress=False, timeout=30)
  
   if isinstance(stock_df.columns, pd.MultiIndex):
       stock_df.columns = stock_df.columns.droplevel(1)
      
   if stock_df.empty:
       return 0


   price_on_date = float(stock_df["Close"].iloc[-1])


   # 2. Fetch Macro Data (Batch Download)
   macro_symbols = {
       'VIX': '^VIX', 'US10Y': '^TNX', 'US3M': '^IRX', 'US30Y': '^TYX',
       'XAUUSD': 'GC=F', 'XAGUSD': 'SI=F', 'WTI': 'USO', 'Brent': 'BZ=F',
       'NaturalGas': 'NG=F', 'Copper': 'HG=F', 'Platinum': 'PL=F', 'Palladium': 'PA=F',
       'SPX': '^GSPC', 'DJI': '^DJI', 'IXIC': '^IXIC', 'RUT': '^RUT',
       'FTSE': '^FTSE', 'Nikkei': '^N225', 'HangSeng': '^HSI', 'EuroStoxx50': '^STOXX50E',
       'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'SOL': 'SOL-USD',
   }
  
   macro_tickers = list(macro_symbols.values())
   macro_data = download(macro_tickers, start=start_date, end=end_date, interval='1d', auto_adjust=True, progress=False, timeout=30)
  
   # Handle Macro Data Structure
   if isinstance(macro_data.columns, pd.MultiIndex):
       try:
           closes = macro_data['Close']
       except KeyError:
           closes = macro_data.xs('Close', level=0, axis=1)
   else:
       closes = macro_data['Close'] if 'Close' in macro_data.columns else macro_data


   ticker_to_name = {v: k for k, v in macro_symbols.items()}
   closes = closes.rename(columns=ticker_to_name)
  
   # Join Data
   stock_df = stock_df.join(closes, how='inner')
   stock_df.dropna(inplace=True)


   # Prepare Real Prices for Comparison
   TheRealPricesForATime = download(ChooseTheSymbolForOnce, start=date(2025, 1, 1), end=end_date, interval='1d', timeout=30)['Close']
   TheRealPricesForATime = TheRealPricesForATime.asfreq('D').fillna(method='ffill')
   JustThePrices = [round(x) for x in TheRealPricesForATime.squeeze().tolist()]


   # Progress Bar
   pbar = tqdm(total=27, bar_format="{bar}/{elapsed}")
   TheAmountDone = 0
  
   def Update(Amount):
       pbar.n = Amount
       pbar.refresh()


   # Inner Prediction Function
   def Hamdi(sembol, todaydate):
       nonlocal TheAmountDone
       today = todaydate
      
       if today == date.today():
            today_hour = datetime.now()
            today = today + timedelta(0 if today_hour.hour < 3 else 1)
       else:
            today = today + timedelta(1)


       back_date = 180
       start_d = today - timedelta(back_date)
       end_d = today
      
       # Slice data for this specific date
       stock_dfSpecial = stock_df.loc[start_d:end_d].copy()
      
       features = ['Open', 'High', 'Low', 'Close', 'Volume'] + list(macro_symbols.keys())
       # Ensure all features exist
       missing_cols = [col for col in features if col not in stock_dfSpecial.columns]
       if missing_cols:
            # Handle missing columns if necessary, or skip
            pass
           
       data = stock_dfSpecial[features].copy()
      
       scaler = MinMaxScaler()
       scaled_data = scaler.fit_transform(data)
      
       X_input = scaled_data.reshape(1, scaled_data.shape[0], scaled_data.shape[1])
      
       prediction = model.predict(X_input, verbose=0)[0][0]
       predicted_price = price_on_date * (1 + prediction / 100)
      
       Test_Memory.append(predicted_price)
       Test_Memory_Percentage.append(prediction)
      
       TheAmountDone += 1
       Update(TheAmountDone)


   # Run Predictions Loop
   for i in range(1, end_date.month):
       for a in range(1, 22, 10):
           try:
               Hamdi(ChooseTheSymbolForOnce, date(2025, i, a))
      
               TheOneToLookAt = (3 * (i - 1) + (a//10) + 1) * 10 # Gerçek verinin kaçıncı karakterine bakılacak = i + a + (10 gün sonrasından başlanıyor)


               try:
                   TheResultMinus1 = ((JustThePrices[TheOneToLookAt-7] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult0 = ((JustThePrices[TheOneToLookAt-6] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult1 = ((JustThePrices[TheOneToLookAt-5] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult2 = ((JustThePrices[TheOneToLookAt-4] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult3 = ((JustThePrices[TheOneToLookAt-3] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult4 = ((JustThePrices[TheOneToLookAt-2] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult5 = ((JustThePrices[TheOneToLookAt-1] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult6 = ((JustThePrices[TheOneToLookAt] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma   Normal değer
                   TheResult7 = ((JustThePrices[TheOneToLookAt+1] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult8 = ((JustThePrices[TheOneToLookAt+2] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResult9 = ((JustThePrices[TheOneToLookAt+3] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResultA = ((JustThePrices[TheOneToLookAt+4] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResultB = ((JustThePrices[TheOneToLookAt+5] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResultC = ((JustThePrices[TheOneToLookAt+6] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
                   TheResultD = ((JustThePrices[TheOneToLookAt+7] / JustThePrices[TheOneToLookAt -10]) - 1) * 100  # Değişimi bulma
               except:
                   False


               AddingScore = 0


               PlusMinusFiveDaysList = [TheResult1, TheResult2, TheResult3, TheResult4, TheResult5, TheResult6, TheResult7, TheResult8, TheResult9, TheResultA, TheResultB]   # ± 5 gün hesaplama ve doğru güne bakma


               PlusMinusFiveDaysListOtherVersion = [TheResultMinus1,TheResult0, TheResult1, TheResult2, TheResult3, TheResult4, TheResult5, TheResult6, TheResult7, TheResult8, TheResult9, TheResultA, TheResultB, TheResultC, TheResultD] # Ekstra liste 1 gün önce ve sonrayı bulabilmek için


               ClosestDay = min(PlusMinusFiveDaysList, key=lambda x: abs(x - Test_Memory_Percentage[-1]))   # Sıradaki 5 gün içerisinden en mantıklı olanı bulma fonksiyonu


               indexOfClosestDay = PlusMinusFiveDaysList.index(ClosestDay)


               indexOfClosestDayOtherVersion = indexOfClosestDay + 2


               TheResult = np.mean([ClosestDay, TheResult6, ClosestDay, ClosestDay])   # Ana sonucu en yakın güne eşitleme


               # Günlük sapmalara ekstra puan vermesini önlemek


               DeletingScore = 0


               if (indexOfClosestDay != 0 and indexOfClosestDay != 10):
                   FindingDeletingScoreWay1 = (abs(PlusMinusFiveDaysList[indexOfClosestDay] - PlusMinusFiveDaysList[indexOfClosestDay - 1]) - 2) * 0.05
                   FindingDeletingScoreWay2 = (abs(PlusMinusFiveDaysList[indexOfClosestDay] - PlusMinusFiveDaysList[indexOfClosestDay + 1]) - 2) * 0.05
                   DeletingScore = min(FindingDeletingScoreWay1, FindingDeletingScoreWay2, 0.25)               


               elif  (indexOfClosestDay == 0):
                   DeletingScore = (abs(PlusMinusFiveDaysList[indexOfClosestDay] - PlusMinusFiveDaysList[indexOfClosestDay + 1]) - 3) * 0.025
                   DeletingScore = min(DeletingScore, 0.25)


               else:
                   DeletingScore = (abs(PlusMinusFiveDaysList[indexOfClosestDay] - PlusMinusFiveDaysList[indexOfClosestDay - 1]) - 3) * 0.025
                   DeletingScore = min(DeletingScore, 0.25)
              
               if (DeletingScore < 0):
                   DeletingScore = 0




               # Puan hesaplama


               if (TheResult > 0 and Test_Memory_Percentage[-1] > 0) or (TheResult < 0 and Test_Memory_Percentage[-1] < 0):
                   if (TheResult / Test_Memory_Percentage[-1] < 2 and TheResult / Test_Memory_Percentage[-1] > 1/2):
                       AddingScore = 1
                   elif (TheResult / Test_Memory_Percentage[-1] < 4 and TheResult / Test_Memory_Percentage[-1] > 1/4):
                       if (abs(TheResult) > abs(Test_Memory_Percentage[-1])):
                           AddingScore = 4 - (TheResult / Test_Memory_Percentage[-1])
                       else:
                           AddingScore = 4 - (Test_Memory_Percentage[-1] / TheResult)
                       AddingScore *= 1/2




               elif (abs((TheResult) - (Test_Memory_Percentage[-1])) < 1):
                   AddingScore = 1
              
               elif (abs((TheResult) - (Test_Memory_Percentage[-1])) < 3):
                   AddingScore = 3 - (abs(abs(TheResult) - abs(Test_Memory_Percentage[-1])))
                   AddingScore *= 1/2
                  
               else:
                   AddingScore = 0


               if not((ClosestDay >= 0) == (PlusMinusFiveDaysListOtherVersion[indexOfClosestDayOtherVersion-1] >= 0) and (ClosestDay >= 0) == (PlusMinusFiveDaysListOtherVersion[indexOfClosestDayOtherVersion-2] >= 0) or (ClosestDay >= 0) == (PlusMinusFiveDaysListOtherVersion[indexOfClosestDayOtherVersion+1] >= 0) and (ClosestDay >= 0) == (PlusMinusFiveDaysListOtherVersion[indexOfClosestDayOtherVersion+2] >= 0)):
                   AddingScore -= abs(abs(np.mean([PlusMinusFiveDaysListOtherVersion[indexOfClosestDayOtherVersion-1], PlusMinusFiveDaysListOtherVersion[indexOfClosestDayOtherVersion+1]])) - abs(ClosestDay)) * 0.1




               if (AddingScore > 0.5):
                   AddingScore -= DeletingScore
              
               AddingScore = max([AddingScore, 0])
               TestScore += AddingScore


           except Exception as e:
               print(f"Error in loop: {e}")
               continue


   if len(Test_Memory) > 0:
       TestScore = int(TestScore / len(Test_Memory) * 100)
   else:
       TestScore = 0


   print(TestScore)


   return TestScore

