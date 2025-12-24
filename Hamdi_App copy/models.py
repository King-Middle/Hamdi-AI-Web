from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Subscription fields
    subscription_status = Column(String, default="free")  # "free", "pro_monthly", "pro_yearly"
    subscription_id = Column(String, nullable=True)  # Lemon Squeezy subscription ID (Legacy)
    gumroad_subscription_id = Column(String, nullable=True) # Gumroad subscription ID
    subscription_expires_at = Column(DateTime, nullable=True)
    lemon_squeezy_customer_id = Column(String, nullable=True) # Legacy
    
    favorites = relationship("Favorite", back_populates="user")

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")

class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
