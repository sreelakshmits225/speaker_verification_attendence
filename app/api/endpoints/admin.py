from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io

from app.db.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/classes/{class_id}", response_model=schemas.ClassSession)
def get_class(class_id: int, db: Session = Depends(get_db)):
    class_session = db.query(models.ClassSession).filter(models.ClassSession.id == class_id).first()
    if not class_session:
        # Create default class if it doesn't exist (ID 101)
        if class_id == 101:
            class_session = models.ClassSession(id=101, course_id="DEFAULT", date="2024-01-01", time="09:00", room="Main Hall")
            db.add(class_session)
            db.commit()
            db.refresh(class_session)
        else:
            raise HTTPException(status_code=404, detail="Class not found")
    return class_session

@router.post("/classes/{class_id}/location")
def update_class_location(class_id: int, location: schemas.ClassLocationUpdate, db: Session = Depends(get_db)):
    class_session = db.query(models.ClassSession).filter(models.ClassSession.id == class_id).first()
    if not class_session:
        if class_id == 101:
            class_session = models.ClassSession(id=101, course_id="DEFAULT", date="2024-01-01", time="09:00", room="Main Hall")
            db.add(class_session)
        else:
            raise HTTPException(status_code=404, detail="Class not found")
    
    class_session.latitude = location.latitude
    class_session.longitude = location.longitude
    class_session.radius = location.radius
    db.commit()
    return {"message": "Classroom location updated", "latitude": location.latitude, "longitude": location.longitude}

@router.get("/attendance", response_model=List[schemas.Attendance])
def read_attendance(
    skip: int = 0, 
    limit: int = 100, 
    class_id: Optional[int] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Attendance)
    if class_id:
        query = query.filter(models.Attendance.class_id == class_id)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
        
    return query.offset(skip).limit(limit).all()

@router.delete("/attendance/reset")
def reset_attendance(db: Session = Depends(get_db)):
    """
    Clears all attendance records.
    Used to start a fresh day.
    """
    db.query(models.Attendance).delete()
    db.commit()
    return {"message": "Attendance reset successfully"}

@router.get("/attendance/export")
def export_attendance_csv(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Get all students
    student_query = db.query(models.Student)
    if class_id:
        student_query = student_query.filter(models.Student.class_id == class_id)
    students = student_query.all()
    
    # Get all present students (IDs)
    attendance_query = db.query(models.Attendance)
    if class_id:
        attendance_query = attendance_query.filter(models.Attendance.class_id == class_id)
    attendance_records = attendance_query.all()
    
    # Create a map of student_id -> attendance_record
    attendance_map = {r.student_id: r for r in attendance_records}
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Name", "Roll Number", "Course", "Status", "Time", "Confidence Score"])
    
    for student in students:
        record = attendance_map.get(student.id)
        
        status = "Present" if record else "Absent"
        timestamp = record.timestamp if record else ""
        score = f"{record.verification_score:.2f}" if record else ""
        
        writer.writerow([
            student.id,
            student.name,
            student.roll_number,
            student.course,
            status,
            timestamp,
            score
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=student_attendance_report.csv"}
    )
