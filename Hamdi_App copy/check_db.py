from sqlalchemy import create_engine, inspect
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables: {tables}")

if 'users' in tables:
    columns = [c['name'] for c in inspector.get_columns('users')]
    print(f"User columns: {columns}")
