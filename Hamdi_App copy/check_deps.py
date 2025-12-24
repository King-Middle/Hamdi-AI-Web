try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = pwd_context.hash("test")
    print(f"Hashing success: {hash}")
except Exception as e:
    print(f"Hashing failed: {e}")

try:
    from jose import jwt
    token = jwt.encode({"test": "data"}, "secret", algorithm="HS256")
    print(f"JWT success: {token}")
except Exception as e:
    print(f"JWT failed: {e}")
