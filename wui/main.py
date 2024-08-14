#!/usr/bin/env python

import google.generativeai as gai
from os import environ as env
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


load_dotenv(); chat = None
gai.configure(api_key=env["KEY"])
app = FastAPI(); api = app


class Prompt(BaseModel):
    message: str


@api.get('/')
def redirect_docs():
    return RedirectResponse('/docs')


@api.get('/chat')
def init_chat():
    global chat
    model = gai.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat()
    return {"resp": "Chat Initialized!"}


@api.post('/chat')
def chat(prompt: Prompt):
    try:
        # TODO: Better exception handling: ex prompt ~ Are there any public holidays nearby?
        reply = chat.send_message(prompt.message)
        # print(reply)
    except Exception as e:
        raise HTTPException(status_code=505, detail=f"Server Error: {e}")
    # TODO: integrate frontend, with markdown rendering.
    return {"resp": reply.text.strip()}


app.mount("/", StaticFiles(directory="root"), name="root")


if __name__ == '__main__':
    __import__('uvicorn').run('main:app', host='0.0.0.0', port=2580)
