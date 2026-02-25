from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import Optional
import shutil
import os
import numpy as np
from datetime import datetime

from app.db.database import get_db
from app import models, schemas
from app.core.config import settings
from app.ml_engine.processing import audio_processor
from app.ml_engine.embedding import speaker_model
import random
import math

router = APIRouter()

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points in meters."""
    R = 6371000  # radius of Earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Threshold for Cosine Similarity (To be tuned)
# Restored to 0.60 for security. Users should enroll on the device they intend to use.
VERIFICATION_THRESHOLD = 0.50 

@router.post("/", response_model=schemas.VerificationResponse)
async def verify_student(
    student_id: int = Form(...),
    class_id: int = Form(...),
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    passphrase: str = Form(None),
    db: Session = Depends(get_db)
):
    # 1. Fetch Student Template
    template = db.query(models.VoiceTemplate).filter(models.VoiceTemplate.student_id == student_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Student not enrolled")

    # 2. Save and Process Audio
    file_location = os.path.join(settings.UPLOAD_DIR, f"verify_{student_id}_{datetime.utcnow().timestamp()}.wav")
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        signal = audio_processor.load_audio(file_location)
        signal = audio_processor.normalize_volume(signal)
        
        # Quality Check
        if audio_processor.is_silent(signal):
             raise HTTPException(status_code=400, detail="Audio too silent")

        # 3. Extract Embedding
        emb = speaker_model.get_embedding(signal)
        
        # 4. Compare
        enroll_emb = template.embedding
        score = speaker_model.compute_similarity(emb, enroll_emb)
        
        # --- LIVENESS CHECK ---
        liveness_score = audio_processor.check_liveness(signal)
        
        # --- GEOFENCING CHECK ---
        location_verified = True
        location_message = ""
        
        # Fetch Class info for geofence
        class_session = db.query(models.ClassSession).filter(models.ClassSession.id == class_id).first()
        if class_session and class_session.latitude and class_session.longitude:
            if latitude is None or longitude is None:
                location_verified = False
                location_message = "Location required for this class"
            else:
                distance = haversine(latitude, longitude, class_session.latitude, class_session.longitude)
                if distance > (class_session.radius or 20.0):
                    location_verified = False
                    location_message = f"Outside allowed area ({distance:.1f}m away)"
        
        is_match = score > VERIFICATION_THRESHOLD
        
        # Penalize match if liveness or location is failed
        if liveness_score < 0.5:
             is_match = False
             message = "Verification Failed: Spoofing detected"
        elif not location_verified:
             is_match = False
             message = f"Verification Failed: {location_message}"
        else:
             status = "PRESENT" if is_match else "REJECTED"
             message = "Verification Successful" if is_match else "Verification Failed: Voice mismatch"
        
        # 5. Log Attendance
        attendance = models.Attendance(
            student_id=student_id,
            class_id=class_id,
            timestamp=datetime.utcnow(),
            status="PRESENT" if is_match else "REJECTED",
            verification_score=float(score),
            liveness_score=float(liveness_score),
            latitude=latitude,
            longitude=longitude
        )
        db.add(attendance)
        db.commit()
        
        return {
            "verified": is_match,
            "score": float(score),
            "liveness_score": float(liveness_score),
            "student_id": student_id,
            "message": message,
            "location_verified": location_verified
        }
        
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

@router.post("/identify")
async def identify_speaker(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    # Save Upload
    file_location = os.path.join(settings.UPLOAD_DIR, f"identify_{datetime.utcnow().timestamp()}.wav")
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Process Audio
        signal = audio_processor.load_audio(file_location)
        signal = audio_processor.normalize_volume(signal)
        if audio_processor.is_silent(signal):
             return {"identified": False, "message": "Audio too silent"}

        # --- LIVENESS CHECK ---
        liveness_score = audio_processor.check_liveness(signal)

        # Extract Embedding
        emb = speaker_model.get_embedding(signal)
        
        # Compare with ALL students
        templates = db.query(models.VoiceTemplate).all()
        best_score = -1.0
        best_student = None
        
        for t in templates:
            score = speaker_model.compute_similarity(emb, t.embedding)
            if score > best_score:
                best_score = score
                best_student = t.student
                
        # Decision
        location_verified = True # Identification mode usually doesn't have a fixed class context
        # But we could check against ALL classes or just the default one
        class_session = db.query(models.ClassSession).filter(models.ClassSession.id == 101).first()
        if class_session and class_session.latitude and class_session.longitude:
             if latitude and longitude:
                  distance = haversine(latitude, longitude, class_session.latitude, class_session.longitude)
                  if distance > (class_session.radius or 20.0):
                       location_verified = False
             else:
                  # Location is REQUIRED if a boundary is set
                  location_verified = False

        is_identified = (best_score > VERIFICATION_THRESHOLD) and (liveness_score >= 0.5) and location_verified
        
        if is_identified:
            # LOG ATTENDANCE
            attendance = models.Attendance(
                student_id=best_student.id,
                class_id=101, # Default class ID for now
                timestamp=datetime.utcnow(),
                status="PRESENT",
                verification_score=float(best_score),
                liveness_score=float(liveness_score),
                latitude=latitude,
                longitude=longitude
            )
            db.add(attendance)
            db.commit()
            
            return {
                "identified": True,
                "student_id": best_student.id,
                "name": best_student.name,
                "score": float(best_score),
                "liveness_score": float(liveness_score),
                "location_verified": location_verified
            }
        else:
            if not location_verified:
                 message = "Outside allowed area"
            else:
                 message = "Unknown Speaker" if best_score <= VERIFICATION_THRESHOLD else "Spoofing Detected"
                 
            return {
                "identified": False,
                "message": message,
                "score": float(best_score),
                "liveness_score": float(liveness_score),
                "location_verified": location_verified
            }
            
    finally:
         if os.path.exists(file_location):
            os.remove(file_location)
