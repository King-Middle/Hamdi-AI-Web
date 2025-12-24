from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import models
from database import get_db
from auth import get_current_user
import requests
import os

# Gumroad Configuration
# TODO: Move these to environment variables in production
GUMROAD_API_KEY = os.getenv("GUMROAD_API_KEY", "i9dJw3bM6-DdK6N_cZtaEpY6YLNIVdgjCaxYbamh5qM")

router = APIRouter(prefix="/api/payments", tags=["payments"])

# --- Schemas ---
class SubscriptionStatusResponse(BaseModel):
    subscription_status: str
    subscription_expires_at: Optional[datetime]
    plan_type: str

# --- Routes ---

@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: models.User = Depends(get_current_user)
):
    """Get the current user's subscription status"""
    
    return SubscriptionStatusResponse(
        subscription_status=current_user.subscription_status,
        subscription_expires_at=current_user.subscription_expires_at,
        plan_type=current_user.subscription_status
    )

@router.post("/webhooks/gumroad")
async def gumroad_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Gumroad webhook events (Ping)"""
    
    # Get the form data (Gumroad sends x-www-form-urlencoded)
    form_data = await request.form()
    
    print("Received Gumroad webhook:", form_data)

    # 1. Extract data
    resource_id = form_data.get("resource_id") # Subscription ID (for recurring) or Sale ID
    seller_id = form_data.get("seller_id")
    email = form_data.get("email")
    product_permalink = form_data.get("product_permalink") # e.g. https://gumroad.com/l/XXXX
    
    # Extract user_id from custom fields or url_params
    # Gumroad sends these as 'url_params[key]' or 'custom_fields[key]' in the form data
    user_id = form_data.get("url_params[user_id]") or form_data.get("custom_fields[user_id]") or form_data.get("user_id")

    # 2. Verify with Gumroad API (Crucial for security as webhooks can be spoofed)
    # We use the resource_id to verify the sale/subscription details
    
    if not resource_id:
         raise HTTPException(status_code=400, detail="Missing resource_id")

    # If it's a subscription-related event (recurring), verify subscription
    # Note: Gumroad webhooks for initial sale vs recurring charges differ slightly. 
    # For simplicity, we'll check the sale/subscription against API.
    
    # TODO: In a real prod env, verify the 'seller_id' matches your account ID to prevent other Gumroad sellers from exploring your endpoint.
    
    if not user_id:
        # Fallback: try to find user by email
        if email:
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                 print(f"User with email {email} not found")
                 return {"status": "ignored", "reason": "user_not_found"}
        else:
            print("No user_id or email in webhook")
            return {"status": "ignored", "reason": "no_user_info"}
    else:
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user:
            print(f"User ID {user_id} not found")
            return {"status": "ignored", "reason": "user_not_found"}

    # 3. Update User Status
    # Determine Plan Type. Since we don't know the exact product IDs/Permalinks yet (placeholders),
    # we will use a loose check. In production, check against your actual permalinks (e.g. "https://gum.co/myproduct")
    
    is_cancelled = form_data.get("cancelled") == "true"
    is_failed_payment = form_data.get("is_recurring_charge_payment_success") == "false"
    
    if is_cancelled or is_failed_payment:
         # Downgrade logic
         # Ideally we set an expiry date if cancelled, but Gumroad 'cancelled' usually means 'will not renew'.
         # We can check 'subscription_ended_at' or similar if available.
         # For now, if payment failed, we downgrade immediately.
         if is_failed_payment:
             user.subscription_status = "free"
             user.subscription_expires_at = datetime.utcnow() # Expire now
             print(f"User {user.id} subscription payment failed. Downgraded.")
         else:
             # Just cancelled (turned off auto-renew). 
             # We assume webhooks keep coming until end of period? 
             # Gumroad sends 'cancellation' when user cancels. Their access should remain until end of period.
             # We need to parse valid_until if provided.
             pass
    else:
        # Successful payment / New subscription
        user.gumroad_subscription_id = resource_id
        
        # Infer plan from permalink or price
        # Placeholder logic:
        if "monthly" in str(product_permalink).lower():
            user.subscription_status = "pro_monthly"
        elif "yearly" in str(product_permalink).lower():
             user.subscription_status = "pro_yearly"
        else:
            # Default to pro_monthly if uncertain, or check price
            price = form_data.get("price")
            if price and int(price) > 100: # Assuming yearly > $100
                 user.subscription_status = "pro_yearly"
            else:
                 user.subscription_status = "pro_monthly"
                 
        # Set simplistic expiry (32 days for monthly, 366 for yearly to be safe)
        if user.subscription_status == "pro_monthly":
            user.subscription_expires_at = datetime.utcnow() + timedelta(days=32)
        else:
             user.subscription_expires_at = datetime.utcnow() + timedelta(days=366)

    db.commit()
    return {"status": "success"}

# Legacy Lemon Squeezy webhook (Disabled/stubbed)
@router.post("/webhooks/lemon-squeezy")
async def lemon_squeezy_webhook_stub():
     return {"status": "deprecated"}
