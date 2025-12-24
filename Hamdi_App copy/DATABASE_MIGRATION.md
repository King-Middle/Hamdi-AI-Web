# Update Database Schema

To add subscription fields to the database, you need to recreate the database tables. 

## Option 1: Recreate Database (Easiest - Deletes All Data)

```bash
cd /Users/ardaunal/Desktop/Hamdi_App
rm sql_app.db
python3 create_tables.py
```

## Option 2: Manual SQLite Migration (Preserves Data)

```bash
cd /Users/ardaunal/Desktop/Hamdi_App
sqlite3 sql_app.db
```

Then run these SQL commands:

```sql
-- Add columns to users table
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME;
ALTER TABLE users ADD COLUMN lemon_squeezy_customer_id TEXT;

-- Verify changes
.schema users

-- Exit
.quit
```

## After Database Update

Restart the backend server to apply changes.

## Next Steps - Lemon Squeezy Configuration

1. Log in to your Lemon Squeezy dashboard
2. Create a "HAMDI Pro" product
3. Add two subscription variants:
   - Monthly: $20/month
   - Yearly: $200/year
4. Note the Store ID and Variant IDs
5. Update the following in `/Users/ardaunal/Desktop/Hamdi_App/payments.py`:
   - `LEMON_SQUEEZY_STORE_ID`
   - `LEMON_SQUEEZY_VARIANT_ID_MONTHLY`
   - `LEMON_SQUEEZY_VARIANT_ID_YEARLY`
6. Configure webhook endpoint in Lemon Squeezy:
   - URL: `https://your-domain.com/api/payments/webhooks/lemon-squeezy`
   - Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
