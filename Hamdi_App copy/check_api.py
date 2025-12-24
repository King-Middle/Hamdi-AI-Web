import requests

try:
    response = requests.get("http://localhost:8000/auth/me")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 404:
        print("Auth route NOT found. Backend needs restart.")
    elif response.status_code == 401:
        print("Auth route found (Unauthorized as expected).")
    else:
        print(f"Unexpected status: {response.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
