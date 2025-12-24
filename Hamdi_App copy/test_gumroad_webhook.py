
import requests
import json

def test_gumroad_webhook():
    url = "http://localhost:8000/api/payments/webhooks/gumroad"
    
    # Mock Payload simulating a Gumroad Ping
    # Note: In real life this is x-www-form-urlencoded
    payload = {
        "resource_id": "sub_12345",
        "seller_id": "user_xyz",
        "email": "test@example.com",
        "url_params[user_id]": "1", # Gumroad sends custom params like this
        "product_permalink": "https://gumroad.com/l/placeholder_monthly",
        "price": "2000",
        "currency": "usd",
        "test": "true" 
    }
    
    print(f"Sending webhook to {url}...")
    try:
        response = requests.post(url, data=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Webhook handled correctly.")
        else:
            print("FAILURE: Webhook returned error.")
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend. Is it running on port 8000?")

if __name__ == "__main__":
    test_gumroad_webhook()
