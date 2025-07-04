# backend/app/api/v1/endpoints/points.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db, get_current_company, get_current_user
from app.schemas.points_rule import (
    PointsRuleCreate, PointsRuleRead, PointsRuleUpdate
)
from app.schemas.user_points import (
    UserPointsWalletRead, PaginatedUserPointsTransactions
)
from app.services.points_rule_service import (
    get_company_rules, get_visible_rules, get_rule,
    create_rule,
    get_or_create_user_points_wallet,
    list_user_points_transactions,
)
from app.models.points_rule import PointsRule

router = APIRouter(tags=["points"])

# CRUD regras (só empresa/admin)
@router.get(
    "/rules",
    response_model=List[PointsRuleRead],
    summary="Empresa: Listar todas as regras de pontos"
)
def list_rules(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return get_company_rules(db, str(current_company.id))


@router.post(
    "/rules",
    response_model=PointsRuleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Empresa: Criar nova regra de pontos"
)
def create_points_rule(
    rule_in: PointsRuleCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return create_rule(db, str(current_company.id), rule_in)


@router.get(
    "/rules/{rule_id}",
    response_model=PointsRuleRead,
    summary="Empresa: Obter uma regra de pontos pelo ID"
)
def get_points_rule(
    rule_id: UUID = Path(..., description="ID da regra"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    rule = get_rule(db, str(rule_id))
    if not rule or rule.company_id != str(current_company.id):
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    return rule


@router.put(
    "/rules/{rule_id}",
    response_model=PointsRuleRead,
    summary="Empresa: Atualizar uma regra de pontos existente"
)
def update_points_rule(
    rule_id: UUID = Path(..., description="ID da regra"),
    rule_in: PointsRuleUpdate = Body(...),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    # busca só a regra desta empresa
    rule = (
        db.query(PointsRule)
          .filter(PointsRule.id == rule_id,
                  PointsRule.company_id == current_company.id)
          .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Regra não encontrada")

    # aplica update
    for field, value in rule_in.dict().items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Empresa: Deletar uma regra de pontos"
)
def delete_points_rule(
    rule_id: UUID = Path(..., description="ID da regra"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    rule = (
        db.query(PointsRule)
          .filter(PointsRule.id == rule_id,
                  PointsRule.company_id == current_company.id)
          .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Regra não encontrada")

    db.delete(rule)
    db.commit()
    return


@router.get(
    "/rules/company/{company_id}",
    response_model=List[PointsRuleRead],
    summary="Usuário: Regras de pontos ativas/visíveis de uma empresa específica"
)
def list_company_visible_rules(
    company_id: UUID = Path(..., description="ID da empresa cujas regras serão listadas"),
    db: Session = Depends(get_db),
):
    """
    Retorna todas as regras de pontos que a empresa deixou *ativas* **e** *visíveis*  
    (ou seja, prontas para serem exibidas no app do usuário).
    """
    return get_visible_rules(db, str(company_id))












# Endpoints usuário
@router.get(
    "/balanceUser",
    response_model=UserPointsWalletRead,
    summary="Saldo de pontos do usuário autenticado"
)
def read_user_points_balance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retorna a carteira global de pontos do usuário logado.
    """
    return get_or_create_user_points_wallet(db, str(current_user.id))


@router.get(
    "/transactionsUser",
    response_model=PaginatedUserPointsTransactions,
    summary="Extrato paginado de pontos do usuário autenticado"
)
def list_user_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    total, items = list_user_points_transactions(
        db,
        str(current_user.id),
        skip,
        limit
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }


# Listar regras visíveis para front
@router.get(
    "/rules/active",
    response_model=List[PointsRuleRead],
    summary="Regras ativas visíveis para front"
)
def list_active_rules(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    return get_visible_rules(db, str(current_company.id))
