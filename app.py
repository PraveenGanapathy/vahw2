from flask import Flask, render_template, jsonify
import pandas as pd
import sqlite3
from pathlib import Path
import requests

app = Flask(__name__, 
    template_folder='app/templates',
    static_folder='app/static')

def init_db():
    """Initialize SQLite database from Excel file"""
    db_path = Path('data/sales.db')
    if db_path.exists():
        return
    
    # Load Excel data
    df = pd.read_excel('data/adidas_sales.xlsx')
    df.columns = df.iloc[3]
    df = df.iloc[4:].reset_index(drop=True)
    
    # Clean numeric columns
    numeric_columns = ['Total Sales', 'Units Sold', 'Operating Profit', 'Price per Unit']
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col].astype(str).str.replace('$', '').str.replace(',', ''))
    
    # Create SQLite database
    with sqlite3.connect(db_path) as conn:
        df.to_sql('sales', conn, if_exists='replace', index=False)
        
        # Create indices for faster queries
        cursor = conn.cursor()
        cursor.execute('CREATE INDEX idx_region ON sales(Region)')
        cursor.execute('CREATE INDEX idx_product ON sales(Product)')
        cursor.execute('CREATE INDEX idx_retailer ON sales(Retailer)')
        cursor.execute('CREATE INDEX idx_state ON sales(State)')

def get_db():
    """Get database connection"""
    return sqlite3.connect('data/sales.db')

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/us-states')
def get_us_states():
    try:
        # Example using the US Census Bureau API
        url = "https://api.census.gov/data/2018/pep/components?get=GEONAME,BIRTHS,DEATHS&for=state:*"
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        data = response.json()
        return jsonify(data)
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data')
def get_data():
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # Get retailer counts
            cursor.execute("""
                SELECT Retailer, COUNT(*) as count 
                FROM sales 
                GROUP BY Retailer
            """)
            retailer_counts = dict(cursor.fetchall())

            # Get average metrics for each retailer
            cursor.execute("""
                SELECT 
                    Retailer,
                    SUM("Units Sold") as total_units_sold,
                    SUM("Total Sales") as total_sales,
                    SUM("Operating Profit") as total_operating_profit
                FROM sales
                GROUP BY Retailer
            """)
            metrics_data = cursor.fetchall()

            # Function to cap outliers
            def cap_outliers(data, cap_value=1000000):
                return {k: min(v, cap_value) for k, v in data.items()}

            # Get product sales
            cursor.execute("""
                SELECT Product, SUM("Total Sales") as total 
                FROM sales 
                GROUP BY Product
            """)
            product_sales = dict(cursor.fetchall())

            # Get regional sales
            cursor.execute("""
                SELECT Region, SUM("Total Sales") as total 
                FROM sales 
                GROUP BY Region
            """)
            region_data = dict(cursor.fetchall())

            # Get state sales
            cursor.execute("""
                SELECT State, SUM("Total Sales") as total 
                FROM sales 
                GROUP BY State
            """)
            state_data = dict(cursor.fetchall())

        return jsonify({
            'retailer_counts': retailer_counts,
            'metrics': {
                'Units Sold': {row[0]: row[1] for row in metrics_data},
                'Operating Profit': {row[0]: row[3] for row in metrics_data},
                'Total Sales': {row[0]: row[2] for row in metrics_data}
            },
            'product_sales': product_sales,
            'region_data': region_data,
            'state_data': state_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()  # Initialize database on startup
    app.run(debug=True)
