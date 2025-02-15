from flask import Blueprint, render_template, jsonify
from . import df

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('dashboard.html')

@main.route('/api/data')
def get_data():
    # Convert numeric columns before creating dictionary
    df['Total Sales'] = pd.to_numeric(df['Total Sales'])
    df['Units Sold'] = pd.to_numeric(df['Units Sold'])
    df['Operating Margin'] = pd.to_numeric(df['Operating Margin'].str.rstrip('%')) / 100

    data = {
        'sales': df.to_dict(orient='records'),
        'summary': {
            'total_sales': float(df['Total Sales'].sum()),
            'total_units': int(df['Units Sold'].sum()),
            'avg_margin': float(df['Operating Margin'].mean())
        }
    }
    return jsonify(data)

@main.route('/api/time-series')
def get_time_series():
    df['Total Sales'] = pd.to_numeric(df['Total Sales'])
    time_data = df.groupby(['year', 'month'])['Total Sales'].sum().reset_index()
    return jsonify(time_data.to_dict(orient='records'))
