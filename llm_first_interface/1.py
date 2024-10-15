import streamlit as st
import openai
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
from urllib.error import HTTPError
load_dotenv()

st.title("A1: LLM first interface")
st.text("By Jatin Mayekar")

bCheckAPIKey = False
bReadyToChat = False
apiKey = ""
assistantResponse = ""
bPlatformSwitch = False
userModelSelection = ""

if "bCheckApiKey" not in st.session_state:
    st.session_state.bCheckApiKey = False

if "platformChoice" not in st.session_state:
    st.session_state.platformChoice = None

if "oldPlatformChoice" not in st.session_state:
    st.session_state.oldPlatformChoice = None

if "modelName" not in st.session_state:
    st.session_state.modelName = "gpt-4o-mini"

if "maxTokens" not in st.session_state:
    st.session_state.maxTokens = 0

if "maxWords" not in st.session_state:
    st.session_state.maxWords = 0

if "temperature" not in st.session_state:
    st.session_state.temperature = 0

if "messages" not in st.session_state:
    st.session_state.messages = []

if "totalCost" not in st.session_state:
    st.session_state.totalCost = 0

if "client" not in st.session_state:
    st.session_state.clientOpenAI = OpenAI(api_key=os.getenv('OPEN_AI_APIKEY'))

def getOpenAiResponse(prompt):
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "setModel",
                    "description": "Set the new model name for the open ai api. Call this function by passing the name of the new model the user has prompted. Example: 'change to gpt-4o' or 'use gpt-4o', then the call this function by passing 'gpt-4o'",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "newModel": {
                                "type": "string",
                                "description": "The new model name",
                            },
                        },
                        "required": ["newModel"],
                        "additionalProperties": False,
                    },
                }
            }
        ]

        response = st.session_state.clientOpenAI.chat.completions.create(
            messages=[{
                        "role": "user",
                        "content": prompt,
                    }],
            model=st.session_state.modelName,
            max_tokens=200,
            tools=tools,
        )
        #print(response)

        if response.choices[0].finish_reason == "tool_calls":
            tool_call = response.choices[0].message.tool_calls[0]
            functionName = tool_call.function.name
            functionArguments = json.loads(tool_call.function.arguments)
            #print(functionArguments)
            newModeName = functionArguments["newModel"]
            if functionName == 'setModel':
                functionResult = setModel(newModeName)
            
            function_call_result_message = {
                "role": "tool",
                "content": json.dumps({
                    "newModel":newModeName,
                    "functionCallResult": functionResult
                }),
                "tool_call_id": tool_call.id
            }

            messageHistory = st.session_state.messages + [
                response.choices[0].message,
                function_call_result_message
            ]
            #messageHistory.append(response.choices[0].message)
            #messageHistory.append(function_call_result_message)
            print("\n Message history: ", messageHistory)

            completion_payload = {
                "model": st.session_state.modelName,
                "messages": messageHistory
            }

            response = st.session_state.clientOpenAI.chat.completions.create(
                model=completion_payload["model"],
                messages=completion_payload["messages"]
            )

        print("\n Final response: ", response)
        return response

def setModel(newModel):
    st.session_state.modelName = newModel
    #print("Model changed to: ", newModel)
    return True

for message in st.session_state.messages:
    with st.chat_message(name=message["role"]):
        st.write(message["content"])

input = st.chat_input("Hello... how can I help you?")
if input:
    with st.chat_message(name="user"):
        st.write(input)
        st.session_state.messages.append({"role": "user", "content":input})
    with st.chat_message(name="assistant"):
        assistantResponse = getOpenAiResponse(input)
        output = assistantResponse.choices[0].message.content
        st.write(output)
        st.session_state.messages.append({"role": "assistant", "content":output})