from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from models.database import get_session, User, Lab
from core.security import verify_password, get_password_hash, create_access_token, get_current_user, get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/signup", response_model=Token)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(name=user_data.name, email=user_data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create a default Lab for this user
    lab_name = f"{user_data.name}'s Lab" if user_data.name else f"{user_data.email.split('@')[0]}'s Lab"
    default_lab = Lab(name=lab_name, domain="General Research", user_id=new_user.id)
    db.add(default_lab)
    db.commit()
    
    # Generate token
    access_token = create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

class GoogleLoginRequest(BaseModel):
    credential: str

@router.post("/google", response_model=Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    import os

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "DUMMY_CLIENT_ID")
    
    try:
        # If DUMMY_CLIENT_ID, bypass for demo purposes since we can't verify an empty setup.
        # In production with a real client ID, we enforce verify_oauth2_token
        if GOOGLE_CLIENT_ID == "DUMMY_CLIENT_ID":
            # Just decode payload without verification for dummy setup
            import jwt
            idinfo = jwt.decode(request.credential, options={"verify_signature": False})
        else:
            idinfo = id_token.verify_oauth2_token(request.credential, requests.Request(), GOOGLE_CLIENT_ID)

        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")

        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Auto-signup
            user = User(name=name, email=email, hashed_password=get_password_hash("google-oauth-random-pw"))
            db.add(user)
            db.commit()
            db.refresh(user)

            lab = Lab(name=f"{name}'s Lab", domain="General Research", user_id=user.id)
            db.add(lab)
            db.commit()

        access_token = create_access_token(data={"sub": user.id})
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    is_google = verify_password("google-oauth-random-pw", current_user.hashed_password)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_google": is_google,
    }

class ProfileUpdate(BaseModel):
    name: str

@router.put("/me")
def update_profile(data: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    current_user.name = data.name.strip()
    db.commit()
    return {"status": "success", "message": "Profile updated", "name": current_user.name}

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@router.put("/change-password")
def change_password(data: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully"}

@router.delete("/me")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models.database import Lab, Experiment, ExperimentPlanVersion, RetrievalTrace, PlanPatch, Researcher, InventoryItem
    
    # Fetch user's lab(s)
    labs = db.query(Lab).filter(Lab.user_id == current_user.id).all()
    for lab in labs:
        # Delete dependent data manually to avoid FK constraint errors
        experiment_ids = [str(e.id) for e in lab.experiments]
        if experiment_ids:
            db.query(ExperimentPlanVersion).filter(ExperimentPlanVersion.experiment_id.in_(experiment_ids)).delete(synchronize_session=False)
            db.query(RetrievalTrace).filter(RetrievalTrace.experiment_id.in_(experiment_ids)).delete(synchronize_session=False)
            db.query(PlanPatch).filter(PlanPatch.experiment_id.in_(experiment_ids)).delete(synchronize_session=False)
            db.query(Experiment).filter(Experiment.lab_id == lab.id).delete(synchronize_session=False)
        
        # Delete researchers and inventory items
        db.query(Researcher).filter(Researcher.lab_id == lab.id).delete(synchronize_session=False)
        db.query(InventoryItem).filter(InventoryItem.lab_id == lab.id).delete(synchronize_session=False)
        db.delete(lab)
        
    db.delete(current_user)
    db.commit()
    return {"status": "success", "message": "Account deleted successfully"}


