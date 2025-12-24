# Lemon Squeezy 404 Error - Configuration Guide

## The Problem

You're seeing this error:
```
Failed to create checkout session: 404 Client Error: Not Found for url: https://api.lemonsqueezy.com/v1/checkouts
```

## Root Cause

The error occurs because **placeholder values** are still in the `payments.py` file. Lemon Squeezy can't find products that match these placeholder IDs.

## What Needs to Be Updated

In `payments.py` (lines 17-19), you'll see:

```python
LEMON_SQUEEZY_STORE_ID = "YOUR_STORE_ID"  # ← PLACEHOLDER
LEMON_SQUEEZY_VARIANT_ID_MONTHLY = "YOUR_MONTHLY_VARIANT_ID"  # ← PLACEHOLDER  
LEMON_SQUEEZY_VARIANT_ID_YEARLY = "YOUR_YEARLY_VARIANT_ID"  # ← PLACEHOLDER
```

These need to be replaced with **real IDs** from your Lemon Squeezy dashboard.

---

## Step-by-Step Fix

### 1. Log into Lemon Squeezy Dashboard

Go to https://app.lemonsqueezy.com and log in.

### 2. Find Your Store ID

1. Click on **Settings** in the sidebar
2. Click on **Stores**
3. Your Store ID will be displayed (it's a number, e.g., `12345`)

### 3. Create Products & Variants

1. Go to **Products** → **Add Product**
2. Create a product called "HAMDI Pro" (or any name you prefer)
3. Set it as a **Subscription** product
4. Add two pricing variants:
   - **Monthly**: $20/month
   - **Yearly**: $200/year

### 4. Get Variant IDs

1. Go to **Products** and click on your "HAMDI Pro" product
2. Click on each variant (Monthly/Yearly)
3. The URL will contain the variant ID, like:
   ```
   https://app.lemonsqueezy.com/products/123456/variants/789012
                                                              ^^^^^^
                                                         This is the Variant ID
   ```
4. Copy both variant IDs (Monthly and Yearly)

### 5. Update payments.py

Replace the placeholder values in `/Users/ardaunal/Desktop/Hamdi_App/payments.py`:

```python
LEMON_SQUEEZY_STORE_ID = "12345"  # Your Store ID
LEMON_SQUEEZY_VARIANT_ID_MONTHLY = "789012"  # Your Monthly Variant ID
LEMON_SQUEEZY_VARIANT_ID_YEARLY = "789013"  # Your Yearly Variant ID
```

### 6. Restart the Backend

After updating the file, restart your backend server:

```bash
# Kill the current backend
pkill -f "python.*backend_server.py"

# Start it again
python3 backend_server.py
```

---

## Alternative: Test Without Real Products

If you just want to test the UI without actual payments, you can **temporarily disable** the checkout by modifying the `handleCheckout` function in `PaymentPage.jsx` to show an alert instead:

```jsx
const handleCheckout = async (planType) => {
    alert('Lemon Squeezy checkout would open here! Configure Store ID and Variant IDs in payments.py');
};
```

---

## After Configuration

Once you've updated the IDs:

1. ✅ The 404 error will be gone
2. ✅ Clicking "Upgrade Now" will redirect to Lemon Squeezy checkout
3. ✅ You can process real payments (or test payments if in test mode)
4. ✅ Webhooks will update user subscription status automatically

---

## Need Help?

Check Lemon Squeezy documentation:
- https://docs.lemonsqueezy.com/api
- https://docs.lemonsqueezy.com/guides/developer-guide/getting-started

**Note**: Make sure your Lemon Squeezy account is activated and products are published!
