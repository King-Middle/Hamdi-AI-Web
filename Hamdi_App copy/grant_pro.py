from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from datetime import datetime

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

email = "ardaunal1000@gmail.com"
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"Found user: {user.email}")
    print(f"Current status: {user.subscription_status}")
    
    # Grant unlimited pro
    user.subscription_status = "pro_yearly"
    user.subscription_id = "MANUAL_GRANT_UNLIMITED"
    # Set expiration to year 2099
    user.subscription_expires_at = datetime(2099, 12, 31, 23, 59, 59)
    
    db.commit()
    print(f"Updated status to: {user.subscription_status}")
    print(f"Expires at: {user.subscription_expires_at}")
else:
    print(f"User {email} not found in database. Please create the account first.")

db.close()
