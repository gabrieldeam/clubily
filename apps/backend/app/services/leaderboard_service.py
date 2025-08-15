from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_
from app.models import User, UserPointsStats, UserPointsTransaction, UserPointsTxType

def leaderboard_overall(db, skip, limit):
    q = (
        db.query(User, UserPointsStats.lifetime_points.label("points"))
          .join(UserPointsStats, User.id == UserPointsStats.user_id)
          # opcional: só quem tem > 0 pontos
          # .filter(UserPointsStats.lifetime_points > 0)
          .order_by(desc("points"))
    )
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    return total, rows

def leaderboard_today(db, skip, limit):
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    end   = start + timedelta(days=1)
    q = (
        db.query(User, UserPointsStats.today_points.label("points"))
          .join(UserPointsStats, User.id == UserPointsStats.user_id)
          .filter(
              UserPointsStats.today_points > 0,
              UserPointsStats.updated_at >= start,
              UserPointsStats.updated_at <  end
          )
          .order_by(desc("points"))
    )
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    return total, rows

def leaderboard_month(db, year, month, skip, limit):
    now = datetime.utcnow()
    if year == now.year and month == now.month:
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month  = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        q = (
            db.query(User, UserPointsStats.month_points.label("points"))
              .join(UserPointsStats, User.id == UserPointsStats.user_id)
              .filter(
                  UserPointsStats.month_points > 0,
                  UserPointsStats.updated_at >= month_start,
                  UserPointsStats.updated_at <  next_month
              )
              .order_by(desc("points"))
        )
        total = q.count()
        rows  = q.offset(skip).limit(limit).all()
        return total, rows

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
