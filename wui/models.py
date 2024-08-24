from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    avatar = Column(String, nullable=True)
    chat_id = Column(Integer, nullable=True)
    chats = relationship("Chat", back_populates="user")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user = relationship("User", back_populates="chats")
    histories = relationship("History", back_populates="chat")


class History(Base):
    __tablename__ = "histories"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    chat_id = Column(Integer, ForeignKey('chats.id'), nullable=False)
    chat = relationship("Chat", back_populates="histories")
