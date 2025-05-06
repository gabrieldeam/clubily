from fastapi import APIRouter, Depends, Response, status, BackgroundTasks
import app.api.deps as deps
from ....schemas.user import UserRead
from ....models.user import User

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(deps.get_current_user)):
    return current_user
