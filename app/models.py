from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, PickleType
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    roll_number = Column(String, unique=True, index=True)
    course = Column(String)
    
    # Relationships
    voice_templates = relationship("VoiceTemplate", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")

class VoiceTemplate(Base):
    __tablename__ = "voice_templates"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    embedding = Column(PickleType) # Storing numpy array as bytes/pickle
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="voice_templates")

class ClassSession(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(String, index=True)
    date = Column(String) # YYYY-MM-DD
    time = Column(String) # HH:MM
    room = Column(String)
    
    # Geofencing coordinates (Classroom center)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius = Column(Float, default=20.0) # Allowed radius in meters
    
    attendance_records = relationship("Attendance", back_populates="class_session")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String) # PRESENT, REJECTED
    verification_score = Column(Float)
    liveness_score = Column(Float)
    
    # Location where attendance was marked
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    student = relationship("Student", back_populates="attendance_records")
    class_session = relationship("ClassSession", back_populates="attendance_records")
