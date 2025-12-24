import requests

url = "http://localhost:8000/api/auth/register"
data = {
    "email": "test@example.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
