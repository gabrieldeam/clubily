# backend/app/api/v1/endpoints/leaderboard.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.api.deps import get_db
from app.schemas.leaderboard import PaginatedLeaderboard, LeaderboardEntry
from app.services.leaderboard_service import (
    leaderboard_overall, leaderboard_today, leaderboard_month
)

router = APIRouter(tags=["leaderboard"])

def _to_entries(rows):
    return [
        LeaderboardEntry(
            user_id=u.id,
            name=u.name,
            points=points
        ) for u, points in rows
    ]

# --- geral -----------------------------------------------------
@router.get(
    "/overall",
    response_model=PaginatedLeaderboard,
    summary="Ranking geral (lifetime points)"
)
def lb_overall(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, rows = leaderboard_overall(db, skip, limit)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": _to_entries(rows),
        "generated_at": datetime.utcnow()
    }

# --- hoje ------------------------------------------------------
@router.get(
    "/today",
    response_model=PaginatedLeaderboard,
    summary="Ranking de hoje"
)
def lb_today(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, rows = leaderboard_today(db, skip, limit)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": _to_entries(rows),
        "generated_at": datetime.utcnow()
    }

# --- mês -------------------------------------------------------
@router.get(
    "/month/{year}/{month}",
    response_model=PaginatedLeaderboard,
    summary="Ranking de um mês específico (UTC)"
)
def lb_month(
    year:  int,
    month: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, rows = leaderboard_month(db, year, month, skip, limit)
    return {
        "total": total,
        "skip":  skip,
        "limit": limit,
        "items": _to_entries(rows),
        "generated_at": datetime.utcnow()
    }

