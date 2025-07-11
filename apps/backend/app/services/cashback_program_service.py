from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, Numeric, distinct
from app.models.cashback import Cashback
from datetime import datetime
from app.models.cashback_program import CashbackProgram
from ..schemas.cashback_program import CashbackProgramCreate, ProgramUsageAssociation
from app.schemas.cashback_program import UserProgramStats
import statistics

def create_program(db: Session, company_id: str, obj_in: CashbackProgramCreate) -> CashbackProgram:
    program = CashbackProgram(
        company_id=company_id,
        name =obj_in.name,
        description=obj_in.description,
        percent=obj_in.percent,
        validity_days=obj_in.validity_days,
        is_active=obj_in.is_active,
        is_visible=obj_in.is_visible,
        max_per_user=obj_in.max_per_user,
        min_cashback_per_user=obj_in.min_cashback_per_user,
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def get_programs_by_company(db: Session, company_id: str):
    return db.query(CashbackProgram).filter(CashbackProgram.company_id == company_id).all()


def get_program(db: Session, program_id: str):
    return db.get(CashbackProgram, program_id)


def update_program(db: Session, program: CashbackProgram, data: dict):
    for field, val in data.items():
        setattr(program, field, val)
    db.commit()
    db.refresh(program)
    return program


def delete_program(db: Session, program: CashbackProgram):
    db.delete(program)
    db.commit()

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

def get_program_associations_paginated(
    db: Session,
    program_id: str,
    skip: int,
    limit: int
):
    base_q = db.query(Cashback)\
               .options(joinedload(Cashback.user))\
               .filter(Cashback.program_id == program_id)\
               .order_by(Cashback.assigned_at.desc())

    total_assocs = base_q.count()
    items = base_q.offset(skip).limit(limit).all()

    associations = []
    for cb in items:
        associations.append(ProgramUsageAssociation(
            id=cb.id,
            user_id=cb.user_id,
            user_name=cb.user.name,
            user_email=cb.user.email,
            amount_spent=float(cb.amount_spent),
            cashback_value=float(cb.cashback_value),
            assigned_at=cb.assigned_at,
            expires_at=cb.expires_at,
            is_active=cb.is_active,
            created_at=cb.created_at,
        ))

    return total_assocs, associations


def get_user_program_stats(
    db: Session,
    company_id: str,
    program_id: str,
    user_id: str
) -> UserProgramStats:
    now = datetime.utcnow()

    # 1) stats para o programa específico
    q_prog = db.query(Cashback).filter(
        Cashback.program_id == program_id,
        Cashback.user_id == user_id,
        Cashback.is_active == True,
        Cashback.expires_at >= now
    )
    prog_count = q_prog.count()
    prog_sum = float(q_prog.with_entities(func.coalesce(func.sum(Cashback.cashback_value), 0)).scalar() or 0.0)

    # 2) stats para todos os programas da empresa
    #    fazemos join para garantir que o programa pertence a esta empresa
    q_comp = (
        db.query(Cashback)
          .join(CashbackProgram, Cashback.program_id == CashbackProgram.id)
          .filter(
              CashbackProgram.company_id == company_id,
              Cashback.user_id == user_id,
              Cashback.is_active == True,
              Cashback.expires_at >= now
          )
    )
    comp_count = q_comp.count()
    comp_sum = float(q_comp.with_entities(func.coalesce(func.sum(Cashback.cashback_value), 0)).scalar() or 0.0)

    return UserProgramStats(
        program_id=program_id,
        user_id=user_id,
        program_valid_count=prog_count,
        program_total_cashback=prog_sum,
        company_valid_count=comp_count,
        company_total_cashback=comp_sum,
        generated_at=now,
    )

def get_public_programs_by_company(db: Session, company_id: str) -> list[CashbackProgram]:
    """
    Retorna somente os programas de cashback que estão ativos e visíveis
    para a empresa informada.
    """
    return (
        db.query(CashbackProgram)
          .filter(
              CashbackProgram.company_id == company_id,
              CashbackProgram.is_active   == True,
              CashbackProgram.is_visible  == True,
          )
          .all()
    )