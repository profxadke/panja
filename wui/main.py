#!/usr/bin/env python

from contextlib import asynccontextmanager
import google.generativeai as gAI
from os import environ as env
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    global Model, Chat
    Model = gAI.GenerativeModel('gemini-1.5-flash')
    Chat = Model.start_chat()
    yield
    del Model, Chat


load_dotenv()
gAI.configure(api_key=env["KEY"])
app = FastAPI(lifespan=lifespan); api = app


class Prompt(BaseModel):
    message: str


@api.post('/chat')
def chat(prompt: Prompt):
    try:
        chat_history = []
        reply = Chat.send_message(prompt.message)
        if Chat.history:
            for history in Chat.history:
                chat_history.append({
                    'role': history.role,
                    'msg': history.parts[0].text
                })
        if len(chat_history) >= 11: chat_history = chat_history[-11:]
        # print(reply)
    except Exception as e:
        raise HTTPException(status_code=555, detail=f"Server Error: {e}")
    return {"resp": reply.text.strip(), "history": chat_history}


@api.get('/history')
def return_chat_history():
    try:
        id = 0
        chat_history = []
        for history in Chat.history:
            chat_history.append({
                'id': id,
                'role': history.role,
                'content': history.parts[0].text
            })
            id += 1
    except Exception as e:
        raise HTTPException(status_code=555, detail=f"Unknwn Internal Server Error ~ Check Console/Terminal: {e}")
    return {"resp": chat_history}


app.mount("/", StaticFiles(directory="root", html = True), name="root")


if __name__ == '__main__':
    __import__('uvicorn').run('main:app', host='0.0.0.0', port=2580, reload=True)
