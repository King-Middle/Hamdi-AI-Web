# Gumroad Setup Instructions

## 1. Create Products in Gumroad
1.  Go to your Gumroad Dashboard -> Products.
2.  Create a "Monthly Subscription" product.
    -   Copy the share link (e.g., `https://gumroad.com/l/yourmonthlysw`).
3.  Create a "Yearly Subscription" product.
    -   Copy the share link (e.g., `https://gumroad.com/l/youryearlysw`).

## 2. Update Frontend Code
1.  Open `/Users/ardaunal/Desktop/Hamdi_App/frontend/src/pages/PaymentPage.jsx`.
2.  Find the `handleCheckout` function (around line 14).
3.  Replace the placeholder URLs with your actual product links:
    ```javascript
    const GUMROAD_PRODUCT_MONTHLY = 'https://gumroad.com/l/YOUR_ACTUAL_MONTHLY_LINK';
    const GUMROAD_PRODUCT_YEARLY = 'https://gumroad.com/l/YOUR_ACTUAL_YEARLY_LINK';
    ```

## 3. Set Up Webhooks in Gumroad
1.  Go to **Settings -> Advanced -> Webhooks** in Gumroad.
2.  Add a new Webhook.
3.  **Payload URL**: You need a public URL for your backend.
    -   If you are testing locally, use a tool like `ngrok` to expose port 8000:
        ```bash
        ngrok http 8000
        ```
    -   The URL will be: `https://YOUR-NGROK-ID.ngrok.io/api/payments/webhooks/gumroad`
    -   **Important**: In production, use your actual domain (e.g., `https://api.yourdomain.com/api/payments/webhooks/gumroad`).
4.  **Events**: Gumroad sends webhooks for all events ("Ping"). You don't need to select specific events.

## 4. Environment Variables
Ensure your `.env` file has the `GUMROAD_API_KEY`.
```
GUMROAD_API_KEY=i9dJw3bM6-DdK6N_cZtaEpY6YLNIVdgjCaxYbamh5qM
```
