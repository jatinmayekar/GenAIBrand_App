import streamlit as st
from datetime import datetime
from pyairtable import Api
import calendar
from dateutil.parser import parse as date_parse
import openai
from openai import OpenAI
import json
import tiktoken
import time
import uuid
from streamlit_mic_recorder import mic_recorder
import numpy as np
import io
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

st.title("LLM-First Calendar App")

# Airtable configuration
AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
EVENTS_TABLE_NAME = "CalendarEvents"

# Connect to Airtable tables
api = Api(AIRTABLE_API_KEY)  # Instantiate Api with API key
events_table = api.table(BASE_ID, EVENTS_TABLE_NAME)  # Connect to the events table

# Get current date
current_datetime = datetime.now()
CURRENT_DATE = current_datetime.strftime("%Y-%m-%d")

# Initialize session state for chat and events
SYSTEM_PROMPT = f"""Today's date is {CURRENT_DATE}. 
You are a smart, intuitive calendar app assistant with advanced AI capabilities. Help users manage events, check schedules, and navigate the calendar. Use these functions:

- addEvent: Add events to the calendar with AI-generated summaries and embeddings
- changeCalendarMonthYear: Change the displayed month/year
- getCurrentDateTime: Get current date and time
- getEventsForMonth: Retrieve all events for a specific month
- getEventsForDate: Retrieve all events for a specific date
- find_closest_event: Find the most relevant event based on user description (uses semantic search)
- updateEvent: Update an existing event in the calendar
- deleteEvent: Delete an event from the calendar

Steps:
1. Understand user intent
2. Clarify details if needed
3. Execute actions using appropriate functions (use multiple functions when necessary)
4. Provide clear feedback

When updating or deleting events:
1. Always use find_closest_event first to locate the event the user is referring to.
2. Present the details of the found event to the user and ask for confirmation.
3. For updates, use the updateEvent function, which will compare the original event with the user's input to determine necessary changes.
4. Only proceed with the update or delete action after receiving explicit confirmation from the user.

Examples:
1. User: "Set a meeting with John on May 15th at 2 PM. I'm nervous about this meeting."
   Action: Use addEvent
   Response: "I've scheduled a meeting with John for May 15th at 2 PM. I've noted in the AI summary that you're feeling nervous about this meeting. Is there anything else you'd like me to add or any way I can help you prepare?"

2. User: "What's my schedule for tomorrow?"
   Action 1: Use getCurrentDateTime to get today's date
   Action 2: Calculate tomorrow's date based on the result of getCurrentDateTime
   Action 3: Use getEventsForDate with the calculated tomorrow's date
   Response: "For tomorrow, [calculated date], you have: [Event 1] at [Time], [Event 2] at [Time]. Based on the AI summaries, it looks like you might need to prepare for [specific detail]. Can I help with anything else?"

3. User: "Show me next month's calendar."
   Action 1: Use getCurrentDateTime
   Action 2: Use changeCalendarMonthYear with the next month
   Response: "Displaying the calendar for [next month]. I see you have several important events coming up. Would you like me to highlight any specific types of events?"

4. User: "What events do I have this month?"
   Action 1: Use getCurrentDateTime
   Action 2: Use getEventsForMonth with the current month and year
   Response: "This month, you have [Event 1] on [Date] at [Time], [Event 2] on [Date] at [Time], ... The AI summaries suggest that [Event X] might require some extra preparation. Would you like more details on any of these events?"

5. User: "Find that important meeting I have coming up, I think it was with a client?"
   Action: Use find_closest_event with the user's description
   Response: "Based on your description, I believe you're referring to the meeting with [Client Name] scheduled for [Date] at [Time]. The AI summary notes that this is a high-priority client meeting to discuss [Topic]. Would you like me to provide more details or help you prepare?"

6. User: "Change my dentist appointment next week to Friday at 2 PM."
   Assistant: Let me find that appointment for you. [Uses find_closest_event]
   Assistant: I've found a dentist appointment scheduled for [original date and time]. Is this the appointment you'd like to change to Friday at 2 PM?
   User: "Yes, that's the one."
   Assistant: Great, I'll update that for you now. [Uses updateEvent function]
   Assistant: The appointment has been updated to Friday at 2 PM. The AI summary has been refreshed to reflect this change. Is there anything else you'd like me to do?

Notes:
- Always use multiple function calls for date-related queries: first getCurrentDateTime, then getEventsForDate or getEventsForMonth
- Calculate relative dates (like tomorrow) based on the result of getCurrentDateTime
- Provide clear, date-specific responses when listing events
- Utilize the AI-generated summaries to provide more context and helpful information about events
- When adding events, be sure to capture any emotional context or special notes from the user to include in the AI summary
- Use the find_closest_event function when users are unsure about exact event details
- For updates, the updateEvent function will intelligently compare the original event with the user's input to determine necessary changes
- After updates, mention that the AI summary has been refreshed to reflect the changes
- Offer proactive assistance based on the AI summaries of events (e.g., suggesting preparation for important meetings)
- Leverage the semantic search capabilities of find_closest_event to locate events even with vague user descriptions
"""

if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]}]

if "buttons" not in st.session_state:
    st.session_state.buttons = {}  # Track button state for each day

if "clientOpenAI" not in st.session_state:
    st.session_state.clientOpenAI = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

if not 'clientEmbeddingsOpenAI' in st.session_state:
    st.session_state.clientEmbeddingsOpenAI = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

if "modelName" not in st.session_state:
    st.session_state.modelName = "gpt-4-turbo"

# Initialize month and year in session state
if "calendar_month" not in st.session_state:
    st.session_state.calendar_month = datetime.now().month

if "calendar_year" not in st.session_state:
    st.session_state.calendar_year = datetime.now().year

if "selected_date" not in st.session_state:
    st.session_state.selected_date = None  # No date is selected by default

def whisper_stt(openai_api_key=None, start_prompt="Start recording", stop_prompt="Stop recording", just_once=False,
               use_container_width=False, language=None, callback=None, args=(), kwargs=None, key=None):
    if not 'openai_client' in st.session_state:
        st.session_state.openai_client = OpenAI(api_key=openai_api_key or os.getenv('OPENAI_API_KEY'))
    if not '_last_speech_to_text_transcript_id' in st.session_state:
        st.session_state._last_speech_to_text_transcript_id = 0
    if not '_last_speech_to_text_transcript' in st.session_state:
        st.session_state._last_speech_to_text_transcript = None
    if key and not key + '_output' in st.session_state:
        st.session_state[key + '_output'] = None
    audio = mic_recorder(start_prompt=start_prompt, stop_prompt=stop_prompt, just_once=just_once,
                         use_container_width=use_container_width,format="webm", key=key)
    new_output = False
    if audio is None:
        output = None
    else:
        id = audio['id']
        new_output = (id > st.session_state._last_speech_to_text_transcript_id)
        if new_output:
            output = None
            st.session_state._last_speech_to_text_transcript_id = id
            audio_bio = io.BytesIO(audio['bytes'])
            audio_bio.name = 'audio.webm'
            success = False
            err = 0
            while not success and err < 3:  # Retry up to 3 times in case of OpenAI server error.
                try:
                    transcript = st.session_state.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_bio,
                        language=language
                    )
                except Exception as e:
                    print(str(e))  # log the exception in the terminal
                    err += 1
                else:
                    success = True
                    output = transcript.text
                    st.session_state._last_speech_to_text_transcript = output
        elif not just_once:
            output = st.session_state._last_speech_to_text_transcript
        else:
            output = None

    if key:
        st.session_state[key + '_output'] = output
    if new_output and callback:
        callback(*args, **(kwargs or {}))
    return output

# Create a placeholder for the calendar
calendar_placeholder = st.empty()

calendar_update = False

def getCurrentDateTime():
    now = datetime.now()
    return {
        "date": now.strftime("%Y-%m-%d"),
        "month": now.month,
        "year": now.year,
        "time": now.strftime("%H:%M:%S")
    }

# New function to change the calendar month and year
def changeCalendarMonthYear(month, year):
    st.session_state.calendar_month = month
    st.session_state.calendar_year = year
    #display_calendar()  # Refresh the calendar with the new month and year
    st.rerun()
    return True

def get_embedding(text, model="text-embedding-3-small"):
    text = text.replace("\n", " ")
    return st.session_state.clientEmbeddingsOpenAI.embeddings.create(input=[text], model=model).data[0].embedding

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def generate_ai_summary(date, time, description, recurring="False", recurringfreqinterval="None", recurringfreqenddate="None"):
    full_event_details = f"""
    Date: {date}
    Time: {time}
    Description: {description}
    Recurring: {recurring}
    Recurring Interval: {recurringfreqinterval}
    Recurring End Date: {recurringfreqenddate}
    """
    
    response = st.session_state.clientEmbeddingsOpenAI.chat.completions.create(
        model=st.session_state.modelName,
        messages=[
            {"role": "system", "content": """You are a helpful assistant that creates concise yet comprehensive summaries of calendar events. 
            Include all relevant details. 
            Keep the summary under 50 words."""},
            {"role": "user", "content": f"Please provide a brief summary of this calendar event: {full_event_details}"}
        ]
    )
    return response.choices[0].message.content

def addEvent(date, time, description, recurring="False", recurringfreqinterval="None", recurringfreqenddate="None"):
    ai_summary="ai summary here"
    try:
        # Generate AI summary
        ai_summary = generate_ai_summary(date, time, description, recurring, recurringfreqinterval, recurringfreqenddate)
        
        # Generate embedding for the AI summary
        embedding = get_embedding(ai_summary)

        # Insert event into Airtable
        events_table.create({
            "Event Date": date,
            "Event Time": time,
            "Description": description,
            "Recurring": recurring,
            "Recurring Interval": recurringfreqinterval,
            "Recurring End Date": recurringfreqenddate,
            "AI Summary": ai_summary,
            "Embedding": json.dumps(embedding)  # Store embedding as JSON string
        })

        # Update the button display for that date
        if date in st.session_state.buttons:
            events = events_table.all(formula=f"{{Event Date}} = '{date}'")
            st.session_state.buttons[date] = f"{date[-2:]} • {len(st.session_state.events[date])} events"

        st.success(f"Event '{description}' added successfully on {date} at {time}")
        return True
    except Exception as e:
        st.error(f"Error adding event: {str(e)}")
        return False

def find_closest_event(user_input, date=None):
    user_embedding = get_embedding(user_input)
    
    # Fetch events (potentially filtered by date)
    if date:
        events = events_table.all(formula=f"{{Event Date}} = '{date}'")
    else:
        events = events_table.all()
    
    closest_event = None
    highest_similarity = -1

    for event in events:
        event_embedding = json.loads(event['fields'].get('Embedding', '[]'))
        if event_embedding:
            similarity = cosine_similarity(user_embedding, event_embedding)
            if similarity > highest_similarity:
                highest_similarity = similarity
                closest_event = event

    return closest_event if highest_similarity > 0.5 else None  # Threshold can be adjusted

def updateEvent(event_id, user_input):
    try:
        # Fetch the original event
        event = events_table.get(event_id)
        if not event:
            return False, "Event not found"

        og_event = event['fields'].get('AI Summary', '')

        if not 'clientUpdateOpenAI' in st.session_state:
            st.session_state.clientUpdateOpenAI = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
        # Use AI to compare original event with user input and determine updates
        response = st.session_state.clientUpdateOpenAI.chat.completions.create(
            model=st.session_state.modelName,
            messages=[
                {"role": "system", "content": """Compare the original event with the user input. 
                Determine which parameters need updating and their new values: date, time, description, recurring, recurringfreqinterval, recurringfreqenddate. 
                Output only the changes in JSON format. Exclude unchanged fields."""},
                {"role": "user", "content": f"Original event: {og_event}\nUser input: {user_input}"}
            ]
        )

        new_event = json.loads(response.choices[0].message.content)

        # Mapping between AI output fields and Airtable fields
        field_mapping = {
            'date': 'Event Date',
            'time': 'Event Time',
            'description': 'Description',
            'recurring': 'Recurring',
            'recurringfreqinterval': 'Recurring Interval',
            'recurringfreqenddate': 'Recurring End Date'
        }

        # Update the event fields
        update_fields = {field_mapping[k]: v for k, v in new_event.items() if k in field_mapping}

        # If any fields were updated, generate a new AI summary and embedding
        if update_fields:
            event_fields = event['fields']
            full_date = update_fields.get('Event Date', event_fields.get('Event Date', ''))
            full_time = update_fields.get('Event Time', event_fields.get('Event Time', ''))
            full_description = update_fields.get('Description', event_fields.get('Description', ''))
            full_recurring = update_fields.get('Recurring', event_fields.get('Recurring', 'False'))
            full_recurring_interval = update_fields.get('Recurring Interval', event_fields.get('Recurring Interval', 'None'))
            full_recurring_end_date = update_fields.get('Recurring End Date', event_fields.get('Recurring End Date', 'None'))

            ai_summary = generate_ai_summary(full_date, full_time, full_description, full_recurring, full_recurring_interval, full_recurring_end_date)
            update_fields['AI Summary'] = ai_summary
            update_fields['Embedding'] = json.dumps(get_embedding(ai_summary))

            # Update the event in Airtable
            events_table.update(event_id, update_fields)
            return True, f"Event updated successfully. Changes: {', '.join(update_fields.keys())}"
        else:
            return False, "No changes were needed based on the user input."

    except json.JSONDecodeError:
        return False, "Error parsing AI response"
    except Exception as e:
        return False, f"Error updating event: {str(e)}"

def deleteEvent(event_id):
    try:
        # Fetch the event to get its date (for updating the button display)
        event = events_table.get(event_id)
        if not event:
            return False, "Event not found"

        date = event['fields'].get('Event Date')

        # Delete the event from Airtable
        events_table.delete(event_id)

        # Update the button display for that date
        if date and date in st.session_state.buttons:
            events = getEventsForDate(date)
            if events:
                st.session_state.buttons[date] = f"{date[-2:]} • {len(events)} events"
            else:
                st.session_state.buttons[date] = date[-2:]

        return True, "Event deleted successfully"
    except Exception as e:
        return False, f"Error deleting event: {str(e)}"

def getEventsForDate(date):
    events = events_table.all(formula=f"{{Event Date}} = '{date}'")
    return [event['fields'] for event in events]

def getEventsForMonth(year, month):
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{calendar.monthrange(year, month)[1]:02d}"
    events = events_table.all(formula=f"AND({{Event Date}} >= '{start_date}', {{Event Date}} <= '{end_date}')")
    
    # Group events by date
    events_by_date = {}
    for event in events:
        date = event['fields']['Event Date']
        if date not in events_by_date:
            events_by_date[date] = []
        events_by_date[date].append(event['fields'])
    
    return events_by_date

def create_unique_key(base_key):
    return f"{base_key}_{uuid.uuid4().hex}"

def display_calendar():
    month = st.session_state.calendar_month
    year = st.session_state.calendar_year

    # Fetch events for the entire month
    month_events = getEventsForMonth(year, month)

    cal = calendar.monthcalendar(year, month)
    calendar.setfirstweekday(firstweekday=6)
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    st.subheader(f"📅 {datetime(year, month, 1).strftime('%B %Y')}")
    
    # Get today's date
    today = datetime.now().date()
    
    # Display day headers
    cols = st.columns(7)
    for idx, day in enumerate(days):
        cols[idx].write(f"**{day}**")

    # Display calendar days
    for week in cal:
        cols = st.columns(7)
        for idx, day in enumerate(week):
            if day != 0:
                date_str = f"{year}-{month:02d}-{day:02d}"
                event_count = len(month_events.get(date_str, []))
                
                # Use a unique key for each button
                button_key = f"btn_{date_str}"
                unique_key = create_unique_key(button_key)
                
                # Check if this is today's date or the selected date
                is_today = datetime(year, month, day).date() == today
                is_selected = date_str == st.session_state.selected_date
                
                # Prepare display text
                if is_today:
                    display_text = f"📅 {day}" if event_count == 0 else f"📅 {day} • {event_count}"
                else:
                    display_text = f"{day}" if event_count == 0 else f"{day} • {event_count}"
                
                # Apply different styles based on whether it's selected or not
                button_type = "primary" if is_selected else "secondary"
                
                if cols[idx].button(display_text, key=unique_key, help=f"Select {date_str}", on_click=lambda d=date_str: setattr(st.session_state, 'selected_date', d), type=button_type):
                    pass  # The on_click handler will update the state

display_calendar()

# Sidebar to display events of the selected date
with st.sidebar:
    if st.session_state.selected_date:
        st.sidebar.header(f"Events for {st.session_state.selected_date}")
        events_for_day = events_table.all(formula=f"{{Event Date}} = '{st.session_state.selected_date}'")
        if events_for_day:
            for event in events_for_day:
                fields = event['fields']
                st.sidebar.write(f"- {fields.get('Event Time', 'No Time')}: {fields.get('Description', 'No Description')}")
        else:
            st.sidebar.write("No events for this date")
    else:
        st.sidebar.write("Select a date to view events")

# Define a max token limit
MAX_TOKENS = 128000  # GPT-4o supports 128k tokens - context window
MAX_OUTPUT_TOKENS = 4096  # Reserve tokens for the response - output tokens or completion tokens
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "addEvent",
            "description": "Add an event/reminder/recurring event/appointment or anything the user wants to add to remember with all details",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "The date of the event (YYYY-MM-DD)"},
                    "time": {"type": "string", "description": "The time of the event (HH:MM)"},
                    "description": {"type": "string", "description": "Event description"},
                    "recurring": {"type": "string", "description": "Is the event recurring?", "default": "False"},
                    "recurringfreqinterval": {"type": "string", "description": "Interval for recurrence", "default": "None"},
                    "recurringfreqenddate": {"type": "string", "description": "End date for recurrence", "default": "None"},
        },  
                "required": ["date", "time", "description", "recurring", "recurringfreqinterval", "recurringfreqenddate"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_closest_event",
            "description": "Find the closest matching event based on user input and optionally a specific date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_input": {"type": "string", "description": "User's description or query about the event"},
                    "date": {"type": "string", "description": "Optional date to filter events (YYYY-MM-DD)"},
                },
                "required": ["user_input"]
            }
        }
    },
        {
        "type": "function",
        "function": {
            "name": "updateEvent",
            "description": "Update an existing event in the calendar",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_input": {"type": "string", "description": "User's description of the changes to be made"}
                },
                "required": ["user_input"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "deleteEvent",
            "description": "Delete an event from the calendar",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "ID of the event to delete"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "changeCalendarMonthYear",
            "description": "Change the displayed calendar month and year.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {"type": "integer", "description": "The new month number (1-12)"},
                    "year": {"type": "integer", "description": "The new year"},
                },
                "required": ["month", "year"],
            },
        }
    },
    {
    "type": "function",
    "function": {
        "name": "getCurrentDateTime",
        "description": "Get the current date, month, year, and time.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
            }
        }
    },
    {
    "type": "function",
    "function": {
        "name": "getEventsForDate",
        "description": "Retrieve all events for a specific date.",
        "parameters": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "The date for which to retrieve events (YYYY-MM-DD)"},
            },
            "required": ["date"]
            }
        }
    },
    {
    "type": "function",
    "function": {
        "name": "getEventsForMonth",
        "description": "Retrieve all events for a specific month.",
        "parameters": {
            "type": "object",
            "properties": {
                "year": {"type": "integer", "description": "The year for which to retrieve events"},
                "month": {"type": "integer", "description": "The month number (1-12) for which to retrieve events"},
            },
            "required": ["year", "month"]
            }
        }
    },
]

# Define a function to count tokens for conversation history
def num_tokens_from_messages(messages, model="gpt-4o"):
    encoding = tiktoken.encoding_for_model(model)
    num_tokens = 0
    for message in messages:
        num_tokens += 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":  # if there's a name, the role is omitted
                num_tokens += -1  # role is always required and always 1 token
    num_tokens += 2  # every reply is primed with <im_start>assistant
    return num_tokens

# Ensure conversation history stays within the token limit
def ensure_token_limit(messages, model="gpt-4o"):
    token_count = num_tokens_from_messages(messages, model)
    while token_count > MAX_TOKENS - MAX_OUTPUT_TOKENS:
        messages.pop(0)  # Remove the oldest message
        token_count = num_tokens_from_messages(messages, model)
    return messages

assistant = st.session_state.clientOpenAI.beta.assistants.create(
        instructions=SYSTEM_PROMPT,
        model=st.session_state.modelName,
        tools=TOOLS,
)

def getOpenAiResponse(prompt):
    try:
        # Create a thread for this conversation if it doesn't exist
        if 'thread_id' not in st.session_state:
            thread = st.session_state.clientOpenAI.beta.threads.create()
            st.session_state.thread_id = thread.id

        # Add the user's message to the thread
        st.session_state.clientOpenAI.beta.threads.messages.create(
            thread_id=st.session_state.thread_id,
            role="user",
            content=prompt
        )

        # Run the assistant
        run = st.session_state.clientOpenAI.beta.threads.runs.create(
            thread_id=st.session_state.thread_id,
            assistant_id=assistant.id
        )

        # Poll for the run to complete
        while run.status not in ["completed", "failed"]:
            time.sleep(1)  # Wait for a second before checking again
            run = st.session_state.clientOpenAI.beta.threads.runs.retrieve(thread_id=st.session_state.thread_id, run_id=run.id)

            if run.status == "requires_action":
                tool_outputs = []
                for tool_call in run.required_action.submit_tool_outputs.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    if function_name == "getCurrentDateTime":
                        result = getCurrentDateTime()
                    elif function_name == "getEventsForDate":
                        result = getEventsForDate(function_args["date"])
                    elif function_name == "addEvent":
                        result = addEvent(**function_args)
                    elif function_name == "find_closest_event":
                        result = find_closest_event(**function_args)
                        if result:
                            st.session_state.temp_event_id = result['id']
                            output = {
                                "event_found": True,
                                "event_details": result['fields']
                            }
                        else:
                            output = {"event_found": False}
                    elif function_name == "changeCalendarMonthYear":
                        result = changeCalendarMonthYear(function_args["month"], function_args["year"])
                    elif function_name == "getEventsForMonth":
                        result = getEventsForMonth(function_args["year"], function_args["month"])
                    elif function_name == "updateEvent":
                        if 'temp_event_id' in st.session_state:
                            result, message = updateEvent(st.session_state.temp_event_id, **function_args)
                            del st.session_state.temp_event_id
                            output = {"result": result, "message": message}
                        else:
                            output = {"result": False, "message": "No event selected for update"}
                    elif function_name == "deleteEvent":
                        if 'temp_event_id' in st.session_state:
                            result, message = deleteEvent(st.session_state.temp_event_id)
                            del st.session_state.temp_event_id
                            output = {"result": result, "message": message}
                        else:
                            output = {"result": False, "message": "No event selected for deletion"}
                    else:
                        # Handle other function calls as before
                        pass

                    tool_outputs.append({
                        "tool_call_id": tool_call.id,
                        "output": json.dumps(result)
                    })

                # Submit all tool outputs
                run = st.session_state.clientOpenAI.beta.threads.runs.submit_tool_outputs(
                    thread_id=st.session_state.thread_id,
                    run_id=run.id,
                    tool_outputs=tool_outputs
                )

        # Retrieve and return the assistant's response
        messages = st.session_state.clientOpenAI.beta.threads.messages.list(thread_id=st.session_state.thread_id)
        return messages.data[0].content[0].text.value
    except openai.APIError as e:
        print(f"OpenAI API returned an API Error: {e}")
        st.error(f"OpenAI API returned an API Error: {e}")
        return "I'm sorry, but I encountered an error. Please try again later."
    except openai.APIConnectionError as e:
        print(f"Failed to connect to OpenAI API: {e}")
        st.error(f"Failed to connect to OpenAI API: {e}")
        return "I'm having trouble connecting to my brain. Please check your internet connection and try again."
    except openai.RateLimitError as e:
        print(f"OpenAI API request exceeded rate limit: {e}")
        st.error(f"OpenAI API request exceeded rate limit: {e}")
        return "I'm a bit overwhelmed right now. Please try again in a moment."
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        st.error(f"An unexpected error occurred: {e}")
        return "Something unexpected happened. Please try again."

last_user_index = None
for i, message in enumerate(reversed(st.session_state.messages)):
    if message["role"] == "user":
        last_user_index = len(st.session_state.messages) - 1 - i
        break

if last_user_index is not None:
    # Display the last user message
    with st.chat_message(name="user"):
        st.write(st.session_state.messages[last_user_index]["content"])
    
    # Display the assistant's response (if it exists)
    if last_user_index + 1 < len(st.session_state.messages):
        with st.chat_message(name="assistant"):
            st.write(st.session_state.messages[last_user_index + 1]["content"])
# Function to handle user input (text or speech)
def handle_user_input():
    text_input = st.chat_input("Type your query here...")
    #speech_input = whisper_stt(openai_api_key=os.getenv('OPENAI_API_KEY'), language='en')

    if text_input:
        return text_input
    # elif speech_input:
    #     return speech_input
    else:
        return None

# Main loop for chat interface
user_input = handle_user_input()
if user_input:
    with st.chat_message(name="user"):
        st.write(user_input)
        st.session_state.messages.append({"role": "user", "content": user_input})
    
    with st.chat_message(name="assistant"):
        assistant_response = getOpenAiResponse(user_input)
        st.write(assistant_response)
        st.session_state.messages.append({"role": "assistant", "content": assistant_response})
        st.rerun()
            





