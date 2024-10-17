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

# Initialize session state for chat and events
SYSTEM_PROMPT = """You are a smart, intuitive calendar app assistant. Help users manage events, check schedules, and navigate the calendar. Use these functions:

- addEvent: Add events to the calendar
- changeCalendarMonthYear: Change the displayed month/year
- getCurrentDateTime: Get current date and time
- getEventsForMonth: Retrieve all events for a specific month
- getEventsForDate: Retrieve all events for a specific date

Steps:
1. Understand user intent
2. Clarify details if needed
3. Execute actions using appropriate functions (use multiple functions when necessary)
4. Provide clear feedback

Examples:
1. User: "Set a meeting with John on May 15th at 2 PM."
   Action: Use addEvent
   Response: "Meeting with John scheduled for May 15th at 2 PM. Anything else?"

2. User: "What's my schedule for tomorrow?"
   Action 1: Use getCurrentDateTime to get today's date
   Action 2: Calculate tomorrow's date based on the result of getCurrentDateTime
   Action 3: Use getEventsForDate with the calculated tomorrow's date
   Response: "For tomorrow, [calculated date], you have: [Event 1] at [Time], [Event 2] at [Time]."

3. User: "Show me next month's calendar."
   Action 1: Use getCurrentDateTime
   Action 2: Use changeCalendarMonthYear with the next month
   Response: "Displaying the calendar for [next month]. Let me know if you need any other views."

4. User: "What events do I have this month?"
   Action 1: Use getCurrentDateTime
   Action 2: Use getEventsForMonth with the current month and year
   Response: "This month, you have [Event 1] on [Date] at [Time], [Event 2] on [Date] at [Time], ..."

Notes:
- Always use multiple function calls for date-related queries: first getCurrentDateTime, then getEventsForDate or getEventsForMonth
- Calculate relative dates (like tomorrow) based on the result of getCurrentDateTime
- Provide clear, date-specific responses when listing events
"""

if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]}]

# Remove this line as events will be stored in Airtable
# if "events" not in st.session_state:
#     st.session_state.events = {}

if "buttons" not in st.session_state:
    st.session_state.buttons = {}  # Track button state for each day

if "client" not in st.session_state:
    st.session_state.clientOpenAI = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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

def addEvent(date, time, description, recurring="False", recurringfreqinterval="None", recurringfreqenddate="None"):
    ai_summary="ai summary here"
    try:
        # Insert event into Airtable
        events_table.create({
            "Event Date": date,
            "Event Time": time,
            "Description": description,
            "Recurring": recurring,
            "Recurring Interval": recurringfreqinterval,
            "Recurring End Date": recurringfreqenddate,
            "AI Summary": ai_summary
        })

        # Update the button display for that date
        if date in st.session_state.buttons:
            st.session_state.buttons[date] = f"{date[-2:]} • {len(st.session_state.events[date])} events"

        st.success(f"Event '{description}' added successfully on {date} at {time}")
        #display_calendar()  # Refresh the calendar
        #st.rerun()
        return True
    except Exception as e:
        st.error(f"Error adding event: {str(e)}")
        return False

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
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    st.subheader(f"📅 {datetime(year, month, 1).strftime('%B %Y')}")
    
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
                display_text = f"{day}" if event_count == 0 else f"{day} • {event_count}"
                
                # Use a unique key for each button
                button_key = f"btn_{date_str}"
                unique_key = create_unique_key(button_key)
                
                if cols[idx].button(display_text, key=unique_key, help=f"Select {date_str}", on_click=lambda d=date_str: setattr(st.session_state, 'selected_date', d)):
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
            "description": "Add an event with all details including AI summary and recurring options.",
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
    # Create a thread for this conversation
    thread = st.session_state.clientOpenAI.beta.threads.create()

    # Add the user's message to the thread
    st.session_state.clientOpenAI.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=prompt
    )

    # Run the assistant
    run = st.session_state.clientOpenAI.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant.id
    )

    # Poll for the run to complete
    while run.status not in ["completed", "failed"]:
        time.sleep(1)  # Wait for a second before checking again
        run = st.session_state.clientOpenAI.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)

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
                elif function_name == "changeCalendarMonthYear":
                    result = changeCalendarMonthYear(function_args["month"], function_args["year"])
                elif function_name == "getEventsForMonth":
                    result = getEventsForMonth(function_args["year"], function_args["month"])

                tool_outputs.append({
                    "tool_call_id": tool_call.id,
                    "output": json.dumps(result)
                })

            # Submit all tool outputs
            run = st.session_state.clientOpenAI.beta.threads.runs.submit_tool_outputs(
                thread_id=thread.id,
                run_id=run.id,
                tool_outputs=tool_outputs
            )

    # Retrieve and return the assistant's response
    messages = st.session_state.clientOpenAI.beta.threads.messages.list(thread_id=thread.id)
    return messages.data[0].content[0].text.value

# Chatbot interaction
def OLDgetOpenAiResponse(prompt):
    response = st.session_state.clientOpenAI.chat.completions.create(
        messages=st.session_state.messages,
        model=st.session_state.modelName,
        max_tokens=MAX_OUTPUT_TOKENS,
        tools=TOOLS,
    )
    print("Initial Response:", response)    

    while response.choices[0].finish_reason == "tool_calls":
        tool_call = response.choices[0].message.tool_calls[0]
        functionName = tool_call.function.name
        functionArguments = json.loads(tool_call.function.arguments)
        
        if functionName == 'addEvent':
            # Extract arguments with defaults
            date = functionArguments.get("date")
            time = functionArguments.get("time")
            description = functionArguments.get("description")
            recurring = functionArguments.get("recurringfreq", "False")
            recurringfreqinterval = functionArguments.get("recurringfreqinterval")
            recurringfreqenddate = functionArguments.get("recurringfreqenddate")
            #ai_summary = functionArguments.get("ai_summary")

            functionResult = addEvent(date, time, description, recurring, recurringfreqinterval, recurringfreqenddate)
            calendar_update = functionResult
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "date": date,
                    "time": time,
                    "description": description,
                    "functionCallResult": functionResult
                }),
                "tool_call_id": tool_call.id
            }
        elif functionName == 'changeCalendarMonthYear':
            month = functionArguments["month"]
            year = functionArguments["year"]
            functionResult = changeCalendarMonthYear(month, year)
            calendar_update = functionResult
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "month": month,
                    "year": year,
                    "functionCallResult": functionResult
                }),
                "tool_call_id": tool_call.id
            }
        elif functionName == 'getCurrentDateTime':
            current_info = getCurrentDateTime()
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps(current_info),
                "tool_call_id": tool_call.id
            }
        elif functionName == 'getEventsForMonth':
            year = functionArguments["year"]
            month = functionArguments["month"]
            events = getEventsForMonth(year, month)
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "year": year,
                    "month": month,
                    "events": events
                }),
                "tool_call_id": tool_call.id
            }
        elif functionName == 'getEventsForDate':
            date = functionArguments["date"]
            events = getEventsForDate(date) 
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "date": date,
                    "events": events
                }),
                "tool_call_id": tool_call.id
            }
        else:
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "functionCallResult": "tool name not registered in tool list for a corresponding function call"
                }),
                "tool_call_id": tool_call.id
            }

        messageHistory = st.session_state.messages + [
            response.choices[0].message,
            function_call_result_message
        ]
        print("\n Message history: ", messageHistory)

        completion_payload = {
            "model": st.session_state.modelName,
            "messages": messageHistory
        }

        response = st.session_state.clientOpenAI.chat.completions.create(
            model=completion_payload["model"],
            messages=completion_payload["messages"]
        )
        print("\n Response "+ functionName + " : ", response)
    
    return response

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

# Chat input for interacting with the calendar

    # Display chat history
    # for message in st.session_state.messages[1:]:
    #     with st.chat_message(name=message["role"]):
    #         st.write(message["content"])

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
            