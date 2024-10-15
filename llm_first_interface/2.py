import streamlit as st
from datetime import datetime
import calendar
from dateutil.parser import parse as date_parse
import openai
from openai import OpenAI
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

st.title("LLM-First Calendar App")

# Initialize session state for chat and events
if "messages" not in st.session_state:
    st.session_state.messages = []

if "events" not in st.session_state:
    st.session_state.events = {}

if "client" not in st.session_state:
    st.session_state.clientOpenAI = OpenAI(api_key=os.getenv('OPEN_AI_APIKEY'))

if "modelName" not in st.session_state:
    st.session_state.modelName = "gpt-4o"

# Initialize month and year in session state
if "calendar_month" not in st.session_state:
    st.session_state.calendar_month = datetime.now().month

if "calendar_year" not in st.session_state:
    st.session_state.calendar_year = datetime.now().year

# Create a placeholder for the calendar
calendar_placeholder = st.empty()

# Helper function to display a simple calendar grid
def display_calendar():
    month = st.session_state.calendar_month
    year = st.session_state.calendar_year

    cal = calendar.monthcalendar(year, month)
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # Update the placeholder with the calendar content
    with calendar_placeholder.container():
        st.subheader(f"📅 {datetime(year, month, 1).strftime('%B %Y')}")
        col = st.columns(7)
        
        # Display day headers
        for idx, day in enumerate(days):
            col[idx].write(f"**{day}**")
        
        # Display calendar days
        for week in cal:
            col = st.columns(7)
            for idx, day in enumerate(week):
                if day == 0:
                    col[idx].write("")  # Empty days
                else:
                    event = st.session_state.events.get(f"{year}-{month:02d}-{day:02d}", "")
                    display_text = f"{day}"
                    if event:
                        display_text += " •"  # Add a dot for each event
                    col[idx].write(display_text)

display_calendar()

# New function to add events to the calendar
def addEventToCalendar(event_text, event_date):
    st.session_state.events[event_date] = event_text
    display_calendar()
    return True

# New function to change the calendar month and year
def changeCalendarMonthYear(month, year):
    st.session_state.calendar_month = month
    st.session_state.calendar_year = year
    display_calendar()  # Refresh the calendar with the new month and year
    return True

# Chatbot interaction
def getOpenAiResponse(prompt):
    tools = [
        {
            "type": "function",
            "function": {
                "name": "addEventToCalendar",
                "description": "Add an event to the calendar for the specified date.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "event_text": {"type": "string", "description": "The event description"},
                        "event_date": {"type": "string", "description": "The date of the event in YYYY-MM-DD format"},
                    },
                    "required": ["event_text", "event_date"],
                    "additionalProperties": False,
                },
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

    response = st.session_state.clientOpenAI.chat.completions.create(
        messages=[{
                    "role": "system",
                    "content": [
                        {
                        "type": "text",
                        "text": "You are a calendar app assistant. Assist users in setting events, checking their schedule, planning their year, setting long and short-term reminders, and changing their calendar view (such as specific months and dates). All interactions with the calendar app will be through you, with no other menu or button interfaces available. You have access to multiple functions to help carry out the users actions.\n\n# Steps\n\n1. **Understand User Intent**: Identify the user's request or query regarding their calendar.\n2. **Confirm Details**: Clarify any ambiguous details by asking specific questions.\n3. **Action Execution**: Implement the action needed, such as setting an event or changing the calendar display.\n4. **Provide Feedback**: Inform the user about the action taken and confirm if further assistance is needed.\n\n# Output Format\n\nProvide responses in a clear, concise sentence or paragraph format. Ensure all user interactions and confirmations are easily understandable. - **Graphical Output Priority**: When showing a calendar using the changeCalendarMonthYear function, the graphic will update so must **not** show a text-based version of the calendar - only confirm the change.\n\n# Examples\n\n**Example 1:**\n- **User Input**: \"Set a meeting with [Name] on [Date] at [Time].\"\n- **Output**: \"Scheduled a meeting with [Name] on [Date] at [Time]. Do you need any other assistance?\"\n\n**Example 2:**\n- **User Input**: \"What does my schedule look like for [Date]?\"\n- **Output**: \"On [Date], you have [Event 1] at [Time], [Event 2] at [Time]. Would you like to view another date?\"\n\n**Example 3:**\n- **User Input**: \"Remind me of [Event] in [Timeframe].\"\n- **Output**: \"A reminder for [Event] has been set for [Timeframe]. Is there anything else I can do for you?\"\n\n# Functions\n- **addEventToCalendar**: Add an event to the calendar for the specified date\n- **changeCalendarMonthYear**: Change the displayed calendar month and year.\n\n# Notes\n\n- Always ensure clarity in all calendar actions and confirmations.\n- For complex queries, break down the task into manageable parts to ensure accuracy.\n- Accommodate edge cases such as recurring events or time zone differences by confirming specifics with the user."
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": prompt,
                }],
        model=st.session_state.modelName,
        max_tokens=200,
        tools=tools,
    )
    print(response)
    
    if response.choices[0].finish_reason == "tool_calls":
        tool_call = response.choices[0].message.tool_calls[0]
        functionName = tool_call.function.name
        functionArguments = json.loads(tool_call.function.arguments)
        
        if functionName == 'addEventToCalendar':
            event_text = functionArguments["event_text"]
            event_date = functionArguments["event_date"]
            functionResult = addEventToCalendar(event_text, event_date)
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "event_text": event_text,
                    "event_date": event_date,
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
# for message in st.session_state.messages:
#     with st.chat_message(name=message["role"]):
#         st.write(message["content"])

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
