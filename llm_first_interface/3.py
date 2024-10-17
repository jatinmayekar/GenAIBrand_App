import os
from pyairtable import Api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
EVENTS_TABLE_NAME = "Table_1"

# Connect to Airtable tables
api = Api(AIRTABLE_API_KEY)  # Instantiate Api with API key
events_table = api.table(BASE_ID, EVENTS_TABLE_NAME)  # Connect to the events table

print(events_table.all())

# def getEventsForDate(date):
#     try:
#         # Retrieve events from Airtable using the formula for the event date
#         events = events_table.all(formula=f"{{Event Date}} = '{date}'")
#         if events:
#             return [event['fields'] for event in events]
#         else:
#             return []
#     except Exception as e:
#         print(f"Error fetching events: {str(e)}")
#         return []
    
#print(getEventsForDate("2024-03-07"))
    

