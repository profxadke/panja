from base import Column, Integer, String, Text, ForeignKey, DateTime, relationship, datetime, Base
from user import User


class History(Base):
    __tablename__ = 'history'
    id = Column(Integer, primary_key=True, index=True)
    # title = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="chats")


User.chats = relationship("History", back_populates="user")
