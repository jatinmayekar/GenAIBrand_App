import requests
import json

def fetch_expocad_data():
    # Base URL for the ExpoCAD API
    base_url = "https://swe.expocad.com/api"
    
    # Common headers to mimic browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://swe.expocad.com/Events/we24cf/index.html'
    }
    
    try:
        # Try to fetch exhibitor data
        response = requests.get(f"{base_url}/exhibitors", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error fetching data: {str(e)}")
        return None

if __name__ == "__main__":
    print("Attempting to fetch ExpoCAD data...")
    data = fetch_expocad_data()
    if data:
        print("\nFirst few exhibitors:")
        for exhibitor in data[:5]:
            print(exhibitor)