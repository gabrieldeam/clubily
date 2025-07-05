# app/services/leaderboard_service.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import User, UserPointsStats, UserPointsTransaction, UserPointsTxType
from typing import Tuple, List

def leaderboard_overall(db: Session, skip: int, limit: int) -> Tuple[int, list]:
    q = (
        db.query(User, UserPointsStats.lifetime_points.label("points"))
          .join(UserPointsStats, User.id == UserPointsStats.user_id)
          .order_by(desc("points"))
    )
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    return total, rows


def leaderboard_today(db: Session, skip: int, limit: int) -> Tuple[int, list]:
    q = (
        db.query(User, UserPointsStats.today_points.label("points"))
          .join(UserPointsStats, User.id == UserPointsStats.user_id)
          .filter(UserPointsStats.today_points > 0)
          .order_by(desc("points"))
    )
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    return total, rows


def leaderboard_month(db: Session, year: int, month: int,
                      skip: int, limit: int) -> Tuple[int, list]:
    # usa month_points se o mês for o corrente; senão agrega transações
    now = datetime.utcnow()
    if year == now.year and month == now.month:
        q = (
            db.query(User, UserPointsStats.month_points.label("points"))
              .join(UserPointsStats, User.id == UserPointsStats.user_id)
              .filter(UserPointsStats.month_points > 0)
              .order_by(desc("points"))
        )
        total = q.count()
        rows  = q.offset(skip).limit(limit).all()
        return total, rows

    # mês passado = agrega na hora
    month_start = datetime(year, month, 1)
    next_month  = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    subq = (
        db.query(
            UserPointsTransaction.user_id,
            func.sum(UserPointsTransaction.amount).label("points")
        )
        .filter(
            UserPointsTransaction.type == UserPointsTxType.award,
            UserPointsTransaction.created_at >= month_start,
            UserPointsTransaction.created_at <  next_month
        )
        .group_by(UserPointsTransaction.user_id)
        .subquery()
    )
    q = (
        db.query(User, subq.c.points)
          .join(User, User.id == subq.c.user_id)
          .order_by(desc(subq.c.points))
    )
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    return total, rows
