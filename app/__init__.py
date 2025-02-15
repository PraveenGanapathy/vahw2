from flask import Flask
import pandas as pd

def create_app():
    app = Flask(__name__)
    
    # Load and preprocess data
    df = pd.read_excel('data/adidas_sales.xlsx', skiprows=3)
    df.columns = df.iloc[0]
    df = df.iloc[1:].reset_index(drop=True)
    
    # Register blueprints
    from .routes import main
    app.register_blueprint(main)
    
    return app
