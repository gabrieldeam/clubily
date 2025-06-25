from sqlalchemy import func, cast, Numeric, distinct
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram
from app.models.user import User
import statistics

def _days_in_month(year: int, month: int):
    # retorna lista de date(year,month,1)...até último dia
    from calendar import monthrange
    last = monthrange(year, month)[1]
    return [date(year, month, d) for d in range(1, last+1)]

def get_daily_spend(db: Session, company_id: str, year: int, month: int):
    # sum(amount_spent) grouped by day
    q = (
        db.query(
            func.date_trunc('day', Cashback.assigned_at).label('day'),
            func.coalesce(func.sum(Cashback.amount_spent), 0).label('value')
        )
        .join(CashbackProgram, Cashback.program_id == CashbackProgram.id)
        .filter(
            CashbackProgram.company_id == company_id,
            func.extract('year', Cashback.assigned_at) == year,
            func.extract('month', Cashback.assigned_at) == month,
        )
        .group_by('day')
        .order_by('day')
    )
    data = {row.day.date(): float(row.value) for row in q}
    # preencher dias sem dados
    return [{"day": d, "value": data.get(d, 0.0)} for d in _days_in_month(year, month)]

def get_daily_cashback_value(db: Session, company_id: str, year: int, month: int):
    # sum(cashback_value)
    q = (
        db.query(
            func.date_trunc('day', Cashback.assigned_at).label('day'),
            func.coalesce(func.sum(Cashback.cashback_value), 0).label('value')
        )
        .join(CashbackProgram, Cashback.program_id == CashbackProgram.id)
        .filter(
            CashbackProgram.company_id == company_id,
            func.extract('year', Cashback.assigned_at) == year,
            func.extract('month', Cashback.assigned_at) == month,
        )
        .group_by('day')
        .order_by('day')
    )
    data = {row.day.date(): float(row.value) for row in q}
    return [{"day": d, "value": data.get(d, 0.0)} for d in _days_in_month(year, month)]

def get_daily_cashback_count(db: Session, company_id: str, year: int, month: int):
    # count(*) as value
    q = (
        db.query(
            func.date_trunc('day', Cashback.assigned_at).label('day'),
            func.count(Cashback.id).label('value')
        )
        .join(CashbackProgram, Cashback.program_id == CashbackProgram.id)
        .filter(
            CashbackProgram.company_id == company_id,
            func.extract('year', Cashback.assigned_at) == year,
            func.extract('month', Cashback.assigned_at) == month,
        )
        .group_by('day')
        .order_by('day')
    )
    data = {row.day.date(): int(row.value) for row in q}
    return [{"day": d, "value": data.get(d, 0)} for d in _days_in_month(year, month)]

def get_daily_new_users(db: Session, year: int, month: int):
    # count(*) from users.created_at
    q = (
        db.query(
            func.date_trunc('day', User.created_at).label('day'),
            func.count(User.id).label('value')
        )
        .filter(
            func.extract('year', User.created_at) == year,
            func.extract('month', User.created_at) == month,
        )
        .group_by('day')
        .order_by('day')
    )
    data = {row.day.date(): int(row.value) for row in q}
    return [{"day": d, "value": data.get(d, 0)} for d in _days_in_month(year, month)]

def collect_program_metrics(db: Session, program_id: str):
    # 1) Agregados básicos
    total_value = float(
        db.query(func.coalesce(func.sum(Cashback.cashback_value), 0))
          .filter(Cashback.program_id == program_id)
          .scalar()
    )
    usage_count = db.query(func.count(Cashback.id))\
                    .filter(Cashback.program_id == program_id)\
                    .scalar() or 0
    avg_amount = float(
        db.query(func.coalesce(func.avg(cast(Cashback.amount_spent, Numeric)), 0))
          .filter(Cashback.program_id == program_id)
          .scalar()
    )

    # 2) Usuários únicos
    unique_users = db.query(func.count(distinct(Cashback.user_id)))\
                     .filter(Cashback.program_id == program_id)\
                     .scalar() or 0

    # 3) Média de usos por usuário
    avg_uses = (usage_count / unique_users) if unique_users else 0.0

    # 4) Tempo médio entre usos
    #    buscamos todos os timestamps, agrupados por usuário
    intervals = []
    subq = (
        db.query(Cashback.user_id, Cashback.assigned_at)
          .filter(Cashback.program_id == program_id)
          .order_by(Cashback.user_id, Cashback.assigned_at)
          .all()
    )
    # organiza por user
    from collections import defaultdict
    by_user = defaultdict(list)
    for user_id, ts in subq:
        by_user[user_id].append(ts)
    for lst in by_user.values():
        if len(lst) >= 2:
            # diffs em dias
            days = [
                ( (lst[i] - lst[i-1]).total_seconds() / 86400 )
                for i in range(1, len(lst))
            ]
            intervals.extend(days)
    avg_interval = statistics.mean(intervals) if intervals else None

    # 5) ROI aproximado
    total_spent = float(
        db.query(func.coalesce(func.sum(Cashback.amount_spent), 0))
          .filter(Cashback.program_id == program_id)
          .scalar()
    )
    roi = (total_spent / total_value) if total_value else None

    return {
        "total_value": total_value,
        "usage_count": usage_count,
        "avg_amount": avg_amount,
        "unique_users": unique_users,
        "avg_uses": avg_uses,
        "avg_interval": avg_interval,
        "roi": roi,
    }

def get_all_programs_metrics(db: Session, company_id: str) -> list[dict]:
    """
    Para cada CashbackProgram ativo/visível da empresa, retorna
    um dict com todas as métricas calculadas.
    """
    programs = (
        db.query(CashbackProgram)
          .filter(
              CashbackProgram.company_id == company_id,
              CashbackProgram.is_active == True,
              CashbackProgram.is_visible == True,
          )
          .all()
    )

    result = []
    for prog in programs:
        m = collect_program_metrics(db, str(prog.id))
        # opcional: ignorar ROI nulo
        result.append({
            "program_id": prog.id,
            "name": prog.name,
            "total_cashback_value": m["total_value"],
            "usage_count": m["usage_count"],
            "average_amount_spent": m["avg_amount"],
            "unique_user_count": m["unique_users"],
            "average_uses_per_user": m["avg_uses"],
            "average_interval_days": m["avg_interval"],
            "roi": m["roi"],
        })
    return result

def get_company_metrics(db: Session, company_id: str) -> dict:
    # 1) query base: todos os cashbacks de quaisquer programas da empresa
    q = (
        db.query(Cashback)
          .join(CashbackProgram, Cashback.program_id == CashbackProgram.id)
          .filter(CashbackProgram.company_id == company_id)
    )
    # totais
    total_cb = float(q.with_entities(func.coalesce(func.sum(Cashback.cashback_value), 0)).scalar() or 0)
    total_spent = float(q.with_entities(func.coalesce(func.sum(Cashback.amount_spent), 0)).scalar() or 0)
    count = q.with_entities(func.count(Cashback.id)).scalar() or 0
    uniq_users = q.with_entities(func.count(distinct(Cashback.user_id))).scalar() or 0

    avg_spent_per_use = (total_spent / count) if count else 0.0
    avg_uses_per_user = (count / uniq_users) if uniq_users else 0.0

    return {
        "company_id": company_id,
        "total_cashback_value": total_cb,
        "total_amount_spent": total_spent,
        "usage_count": count,
        "unique_user_count": uniq_users,
        "average_amount_spent_per_use": avg_spent_per_use,
        "average_uses_per_user": avg_uses_per_user,
        "generated_at": datetime.utcnow(),
    }

