from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr
import models
import random
import string
from database import get_db

import os

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_TO_A_SECURE_SECRET_KEY_IN_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    subscription_status: str
    subscription_expires_at: Optional[datetime]

    class Config:
        orm_mode = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

# --- Utils ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# --- Routes ---

@router.post("/send-verification-code")
def send_verification_code(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Check if email is already registered
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    print(f"DEBUG: Verification code is {code}")
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Delete any existing codes for this email
    db.query(models.PasswordReset).filter(models.PasswordReset.email == request.email).delete()
    
    # Save code to DB
    reset_entry = models.PasswordReset(
        email=request.email,
        code=code,
        expires_at=expires_at
    )
    db.add(reset_entry)
    db.commit()
    
    # Send email with code
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        sender_email = os.getenv("EMAIL_SENDER", "hamdi.ai.bot@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD")
        receiver_email = request.email

        message = MIMEMultipart("alternative")
        message["Subject"] = "Hamdi App - Email Verification Code"
        message["From"] = sender_email
        message["To"] = receiver_email

        text = f"""\
Hello,

Thank you for signing up for Hamdi App!
Your email verification code is: {code}

This code will expire in 15 minutes.
If you did not request this, please ignore this email.

Best regards,
The Hamdi Team"""

        html = f"""\
<html>
  <body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2563eb; text-align: center;">Welcome to Hamdi App!</h2>
      <p>Hello,</p>
      <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">{code}</span>
      </div>
      <p>This code will expire in 15 minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="text-align: center; color: #9ca3af; font-size: 12px;">Hamdi App Team</p>
    </div>
  </body>
</html>
"""

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        message.attach(part1)
        message.attach(part2)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
            
        print(f"Verification email sent to {request.email}")
        
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    
    return {"message": "Verification code sent to email"}

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, verification_code: str, db: Session = Depends(get_db)):
    # Check if email is already registered
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify the code
    reset_entry = db.query(models.PasswordReset).filter(
        models.PasswordReset.email == user.email,
        models.PasswordReset.code == verification_code
    ).first()
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    if reset_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    
    # Delete used verification code
    db.delete(reset_entry)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(response: Response, user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Set HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False # Set to True in production with HTTPS
    )
    return {"message": "Login successful"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}

@router.get("/me", response_model=UserResponse)
def get_current_user_endpoint(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(password_data: dict, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    # Verify current password
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    
    # Update with new password
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Don't reveal if user exists or not for security, but for this app we'll be helpful
        # In a real app, you might want to always return success or handle differently
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Save to DB
    # First delete any existing codes for this email
    db.query(models.PasswordReset).filter(models.PasswordReset.email == request.email).delete()
    
    reset_entry = models.PasswordReset(
        email=request.email,
        code=code,
        expires_at=expires_at
    )
    db.add(reset_entry)
    db.commit()
    
    # Send Email via SMTP
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        sender_email = os.getenv("EMAIL_SENDER", "hamdi.ai.bot@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD") # User to fill this in
        receiver_email = request.email

        message = MIMEMultipart("alternative")
        message["Subject"] = "Hamdi App - Password Reset Code"
        message["From"] = sender_email
        message["To"] = receiver_email

        text = f"""\
Hello,

You requested a password reset for your Hamdi App account.
Your verification code is: {code}

This code will expire in 15 minutes.
If you did not request this, please ignore this email.

Best regards,
The Hamdi Team"""

        html = f"""\
<html>
  <body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2563eb; text-align: center;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your Hamdi App account.</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">{code}</span>
      </div>
      <p>This code will expire in 15 minutes.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="text-align: center; color: #9ca3af; font-size: 12px;">Hamdi App Team</p>
    </div>
  </body>
</html>
"""

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        message.attach(part1)
        message.attach(part2)

        # Connect to Gmail SMTP server
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
            
        print(f"Email sent successfully to {request.email}")
        
    except Exception as e:
        print(f"Failed to send email: {e}")
        # In production, you might want to raise an error, but for now we'll log it
        # and maybe still return success if we want to hide that it failed (security)
        # or return error to help debug. Let's return error for now to help user.
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    
    return {"message": "Verification code sent to email"}

@router.post("/verify-code")
def verify_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    reset_entry = db.query(models.PasswordReset).filter(
        models.PasswordReset.email == request.email,
        models.PasswordReset.code == request.code
    ).first()
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    if reset_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")
        
    return {"message": "Code verified successfully"}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Verify code again
    reset_entry = db.query(models.PasswordReset).filter(
        models.PasswordReset.email == request.email,
        models.PasswordReset.code == request.code
    ).first()
    
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    if reset_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    # Update user password
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(request.new_password)
    
    # Delete used code
    db.delete(reset_entry)
    db.commit()
    
    return {"message": "Password reset successfully"}

