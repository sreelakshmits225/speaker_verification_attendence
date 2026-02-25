from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Student Schemas
class StudentBase(BaseModel):
    name: str
    roll_number: str
    course: str

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceBase(BaseModel):
    student_id: int
    class_id: int
    status: str

class AttendanceCreate(AttendanceBase):
    verification_score: float

class Attendance(AttendanceBase):
    id: int
    timestamp: datetime
    verification_score: float
    liveness_score: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    class Config:
        from_attributes = True

# Class Session Schemas
class ClassLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    radius: Optional[float] = 20.0

class ClassSession(BaseModel):
    id: int
    course_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: float
    class Config:
        from_attributes = True

# Response Schemas
class VerificationResponse(BaseModel):
    verified: bool
    score: float
    liveness_score: float
    student_id: Optional[int] = None
    message: str
    location_verified: bool = True # Default for now
