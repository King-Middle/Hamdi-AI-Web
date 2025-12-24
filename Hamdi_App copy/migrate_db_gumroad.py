
import sqlite3

def migrate():
    print("Starting database migration...")
    
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'gumroad_subscription_id' not in columns:
            print("Adding gumroad_subscription_id column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN gumroad_subscription_id TEXT")
            conn.commit()
            print("Migration successful: Added gumroad_subscription_id column.")
        else:
            print("Column gumroad_subscription_id already exists. Skipping.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
