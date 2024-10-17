import streamlit as st
from datetime import datetime
from pyairtable import Api
import calendar
from dateutil.parser import parse as date_parse
import openai
from openai import OpenAI
import json
import tiktoken
import uuid
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
SYSTEM_PROMPT = "You are a calendar app assistant. Assist users in setting events, checking their schedule, planning their year, setting long and short-term reminders, and changing their calendar view (such as specific months and dates). All interactions with the calendar app will be through you, with no other menu or button interfaces available. You have access to multiple functions to help carry out the users actions.\n\n# Steps\n\n1. **Understand User Intent**: Identify the user's request or query regarding their calendar.\n2. **Confirm Details**: Clarify any ambiguous details by asking specific questions.\n3. **Action Execution**: Implement the action needed, such as setting an event or changing the calendar display.\n4. **Provide Feedback**: Inform the user about the action taken and confirm if further assistance is needed.\n\n# Output Format\n\nProvide responses in a clear, concise sentence or paragraph format. Ensure all user interactions and confirmations are easily understandable. - **Graphical Output Priority**: When showing a calendar using the changeCalendarMonthYear function, the graphic will update so must **not** show a text-based version of the calendar - only confirm the change.\n\n# Examples\n\n**Example 1:**\n- **User Input**: \"Set a meeting with [Name] on [Date] at [Time].\"\n- **Output**: \"Scheduled a meeting with [Name] on [Date] at [Time]. Do you need any other assistance?\"\n\n**Example 2:**\n- **User Input**: \"What does my schedule look like for [Date]?\"\n- **Output**: \"On [Date], you have [Event 1] at [Time], [Event 2] at [Time]. Would you like to view another date?\"\n\n**Example 3:**\n- **User Input**: \"Remind me of [Event] in [Timeframe].\"\n- **Output**: \"A reminder for [Event] has been set for [Timeframe]. Is there anything else I can do for you?\"\n\n# Functions\n- **addEventToCalendar**: Add an event to the calendar for the specified date\n- **changeCalendarMonthYear**: Change the displayed calendar month and year.\n\n# Notes\n\n- Always ensure clarity in all calendar actions and confirmations.\n- For complex queries, break down the task into manageable parts to ensure accuracy.\n- Accommodate edge cases such as recurring events or time zone differences by confirming specifics with the user."

if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]}]

# Remove this line as events will be stored in Airtable
# if "events" not in st.session_state:
#     st.session_state.events = {}

if "buttons" not in st.session_state:
    st.session_state.buttons = {}  # Track button state for each day

if "client" not in st.session_state:
    st.session_state.clientOpenAI = OpenAI(api_key=os.getenv('OPEN_AI_APIKEY'))

if "modelName" not in st.session_state:
    st.session_state.modelName = "gpt-4o"

# Initialize month and year in session state
if "calendar_month" not in st.session_state:
    st.session_state.calendar_month = datetime.now().month

if "calendar_year" not in st.session_state:
    st.session_state.calendar_year = datetime.now().year

if "selected_date" not in st.session_state:
    st.session_state.selected_date = None  # No date is selected by default

# Create a placeholder for the calendar
calendar_placeholder = st.empty()

# Function to get events for a specific month
def get_events_for_month(year, month):
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{calendar.monthrange(year, month)[1]:02d}"
    events = events_table.all(formula=f"AND({{Event Date}} >= '{start_date}', {{Event Date}} <= '{end_date}')")
    return {event['fields']['Event Date']: event['fields'] for event in events}

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
        st.rerun()
        return True
    except Exception as e:
        st.error(f"Error adding event: {str(e)}")
        return False

def get_events_for_month(year, month):
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
    month_events = get_events_for_month(year, month)

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
                "additionalProperties": False,
            },
        }
    }
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

# Chatbot interaction
def getOpenAiResponse(prompt):
    response = st.session_state.clientOpenAI.chat.completions.create(
        messages=st.session_state.messages,
        model=st.session_state.modelName,
        max_tokens=MAX_OUTPUT_TOKENS,
        tools=TOOLS,
    )
    print(response)
    
    if response.choices[0].finish_reason == "tool_calls":
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

            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "month": month,
                    "year": year,
                    "functionCallResult": functionResult
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
    return response

# Display chat history
for message in st.session_state.messages[1:]:
    with st.chat_message(name=message["role"]):
        st.write(message["content"])

# last_user_index = None
# for i, message in enumerate(reversed(st.session_state.messages)):
#     if message["role"] == "user":
#         last_user_index = len(st.session_state.messages) - 1 - i
#         break

# if last_user_index is not None:
#     # Display the last user message
#     with st.chat_message(name="user"):
#         st.write(st.session_state.messages[last_user_index]["content"])
    
#     # Display the assistant's response (if it exists)
#     if last_user_index + 1 < len(st.session_state.messages):
#         with st.chat_message(name="assistant"):
#             st.write(st.session_state.messages[last_user_index + 1]["content"])

# Chat input for interacting with the calendar
input_text = st.chat_input("Calendar for you... how can I help?")
if input_text:
    with st.chat_message(name="user"):
        st.write(input_text)
        st.session_state.messages.append({"role": "user", "content": input_text})
    
    with st.chat_message(name="assistant"):
        assistantResponse = getOpenAiResponse(input_text)
        output = assistantResponse.choices[0].message.content
        st.write(output)
        st.session_state.messages.append({"role": "assistant", "content":output})