try:
    import models
    from database import engine
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
except Exception as e:
    print(f"Error creating tables: {e}")
