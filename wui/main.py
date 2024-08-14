#!/usr/bin/env python

from contextlib import asynccontextmanager
import google.generativeai as gai
from os import environ as env
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    global Model, Chat
    Model = gai.GenerativeModel('gemini-1.5-flash')
    Chat = Model.start_chat()
    yield
    del Model, Chat


load_dotenv()
gai.configure(api_key=env["KEY"])
app = FastAPI(lifespan=lifespan); api = app


class Prompt(BaseModel):
    message: str


@api.post('/chat')
def chat(prompt: Prompt):
    try:
        reply = Chat.send_message(prompt.message)
        # print(reply)
    except Exception as e:
        raise HTTPException(status_code=555, detail=f"Server Error: {e}")
    return {"resp": reply.text.strip()}


# TODO: Enable rendering of markdown (API response)
app.mount("/", StaticFiles(directory="root", html = True), name="root")


if __name__ == '__main__':
    __import__('uvicorn').run('main:app', host='0.0.0.0', port=2580, reload=True)
