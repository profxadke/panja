#!/usr/bin/env python

import httpx
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from os import environ as env
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import google.generativeai as gAI
from jose import jwt, JWTError
from typing import Annotated
from pydantic import BaseModel

from database import get_db, engine, SessionLocal
from models import Base, Chat, History, User
from auth import create_access_token, oauth2_scheme
from schemas import Prompt

# Load environment variables
load_dotenv()
chat = None
# Configure Google Generative AI
gAI.configure(api_key=env["KEY"])

# FastAPI app initialization
app = FastAPI()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create all database tables
Base.metadata.create_all(bind=engine)

# Lifespan for the app to manage AI model lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    global Model, Ch4t
    Model = gAI.GenerativeModel('gemini-1.5-flash')
    Ch4t = Model.start_chat()
    yield
    del Model, Ch4t


class Token(BaseModel):
    access_token: str
    token_type: str


app = FastAPI(lifespan=lifespan)


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, env['KEY'], algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as e:
        raise credentials_exception

    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    db.close()
    return user


# Chat API endpoint
@app.post('/chat/{id}')
def _chat(prompt: Prompt, db: Session = Depends(get_db), id: int = 0, current_user: User = Depends(get_current_user)):
    global chat
    try:
        chat_history = []
        reply = Ch4t.send_message(prompt.message)

        # Generate chat title based on initial prompt
        chat_title = Model.generate_content(
            f'Give me a short chat context to be set as chat title based on this as first prompt by the user: "{prompt.message}"'
        ).text

        # TODO: Handle chat (context) change.
        if not id:
            # Create new chat entry
            new_chat = Chat(title=chat_title, user_id=current_user.id)
            db.add(new_chat)
            db.commit()
            db.refresh(new_chat)
            chat = new_chat
            id = chat.id
            user = db.query(User).filter(User.email == current_user.email).first()
            setattr(user, 'chat_id', id)
            db.commit()
            db.refresh(user)
        else:
            chat = db.query(Chat).filter(Chat.id == id).first()
            db.refresh(chat)
        # TODO: Update last chat id on user's table (on auth)

        # Save user prompt to history
        user_entry = History(role="user", message=prompt.message, chat_id=id)
        db.add(user_entry)
        db.commit()
        db.refresh(user_entry)

        # Save model reply to history
        model_entry = History(role="model", message=reply.text.strip(), chat_id=id)
        db.add(model_entry)
        db.commit()
        db.refresh(model_entry)

        for history in Ch4t.history:
            chat_history.append({
                'role': history.role,
                'msg': history.parts[0].text
            })

        if len(chat_history) >= 11:
            chat_history = chat_history[-11:]

    except Exception as e:
        print(f'[-] Err -> {e}')
        raise HTTPException(status_code=555, detail=f"Server Error: {e}")

    return {"resp": reply.text.strip(), "history": chat_history, "chat": id}


# History retrieval endpoint
@app.get('/history/{chat_id}')
def return_chat_history(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO: Prevent IDOR (leakage of chat history via other authenticated user(s).)
    try:
        if chat_id == 0:
            chat_history = db.query(History).filter(History.chat_id == current_user.chat_id).all()
        else:
            chat_history = db.query(History).filter(History.chat_id == chat_id).all()
        return {"resp": chat_history}
    except Exception as e:
        raise HTTPException(status_code=555, detail=f"Unknown Internal Server Error: {e}")


# Google OAuth login endpoint
@app.get("/login/google")
async def login_google():
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={env['GOOGLE_CLIENT_ID']}&redirect_uri={env['GOOGLE_REDIRECT_URI']}&scope=openid%20profile%20email&access_type=offline")


# Google OAuth callback endpoint
@app.get("/auth/google")
async def auth_google(code: str, db: Session = Depends(get_db)):
    token_url = "https://accounts.google.com/o/oauth2/token"
    data = {
        "code": code,
        "client_id": env['GOOGLE_CLIENT_ID'],
        "client_secret": env['GOOGLE_CLIENT_SECRET'],
        "redirect_uri": env['GOOGLE_REDIRECT_URI'],
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        access_token = response.json().get("access_token")
        user_info = await client.get("https://www.googleapis.com/oauth2/v1/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        info = user_info.json()

        # Check if user exists in the database
        email = info['email']
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(name=info['name'], avatar=info['picture'], email=email)
            db.add(user)
            db.commit()

        db.refresh(user)

        # Create access token
        token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=30))
        code = f'''
        <html>
        <body>
        <script>
        localStorage.setItem('token', '{token}');
        location.href = '/';
        </script>
        </body>
        </html>
        '''
        return HTMLResponse(code)


# Token validation endpoint
@app.get("/token")
async def get_token(token: str = Depends(oauth2_scheme)):
    return jwt.decode(token, env['KEY'], algorithms=["HS256"])


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    if not form_data.username.lower() in ('oauth', 'google', 'passwordless', 'passwdless'):
        raise HTTPException(status_code=401, detail="Invalid credentials supplied.")
    user = get_current_user(form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=30))
    return Token(access_token=access_token, token_type="bearer")


# Privacy policy endpoint
@app.get('/pp')
@app.get('/privacy_policy')
def privacy_policy():
    return RedirectResponse('/privacy_policy.html')


# Terms of Service endpoint
@app.get('/tos')
@app.get('/terms_of_service')
def terms_of_service():
    return RedirectResponse('/tos.html')


# Mount static files
app.mount("/", StaticFiles(directory="root", html=True), name="root")


# Run the app
if __name__ == '__main__':
    __import__('uvicorn').run('main:app', host='0.0.0.0', port=2580, reload=False)
