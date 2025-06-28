import logging
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from app.services.asaas_client import AsaasClient
from app.models.company_point_purchase import PurchaseStatus
from app.services.point_plan_service import get_plan
from app.services.points_wallet_service import credit_points
from app.models.company import Company
from app.models.company_point_purchase import CompanyPointPurchase, PurchaseStatus

logger = logging.getLogger(__name__)
gateway = AsaasClient()

STATUS_MAP = {
    "PENDING":           PurchaseStatus.PENDING,
    "PAYMENT_PENDING":   PurchaseStatus.PENDING,
    "OVERDUE":           PurchaseStatus.PENDING,
    "PAYMENT_OVERDUE":   PurchaseStatus.PENDING,

    "RECEIVED":          PurchaseStatus.PAID,
    "PAYMENT_RECEIVED":  PurchaseStatus.PAID,
    "CONFIRMED":         PurchaseStatus.PAID,
    "PAYMENT_CONFIRMED": PurchaseStatus.PAID,

    "DELETED":           PurchaseStatus.CANCELLED,
    "PAYMENT_DELETED":   PurchaseStatus.CANCELLED,
    "REFUNDED":          PurchaseStatus.CANCELLED,
    "PAYMENT_REFUNDED":  PurchaseStatus.CANCELLED,
    "REJECTED":          PurchaseStatus.FAILED,
}

def create_point_purchase(db: Session, company_id: str, plan_id: str) -> CompanyPointPurchase:
    """
    Cria uma compra de ponto via PIX e registra em CompanyPointPurchase.
    """
    plan = get_plan(db, plan_id)
    if not plan:
        raise ValueError("Plano não encontrado")

    company = db.get(Company, company_id)
    if not company:
        raise ValueError("Empresa não encontrada")

    # delega ao client Asaas
    qr_info = gateway.create_payment(
        db,
        company_id,
        float(plan.price),
        f"Compra de plano {plan.name}"
    )

    purchase = CompanyPointPurchase(
        company_id=company_id,
        plan_id=plan_id,
        amount=Decimal(str(plan.price)),
        asaas_id=qr_info["asaas_id"],
        status=PurchaseStatus.PENDING,
    )

    # se trouxe QR expirationDate
    if exp := qr_info.get("pix_expires_at"):
        purchase.pix_expires_at = datetime.strptime(exp, "%Y-%m-%d %H:%M:%S")

    purchase.pix_qr_code = qr_info["pix_qr_code"]
    purchase.pix_copy_paste_code = qr_info["pix_copy_paste_code"]

    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase

def refresh_point_purchase_status(db: Session, asaas_id: str) -> CompanyPointPurchase | None:
    """
    Reconsulta o status no Asaas, atualiza e, se ficar PAID, credita pontos.
    """
    purchase = db.query(CompanyPointPurchase).filter_by(asaas_id=asaas_id).first()
    if not purchase:
        return None

    # buscar status no Asaas
    resp = gateway._get_payment(db, asaas_id)  # implemente _get_payment para retornar JSON
    raw = resp.get("status", "").upper()

    from app.services.company_payment_service import STATUS_MAP  # reutiliza o mapeamento
    mapped = STATUS_MAP.get(raw)
    if mapped is None:
        return purchase

    # converte para PurchaseStatus
    if mapped == PurchaseStatus.PAID and purchase.status != PurchaseStatus.PAID:
        purchase.status = PurchaseStatus.PAID
        db.commit()
        db.refresh(purchase)
        # ao virar PAID, credita pontos na carteira da empresa
        credit_points(db, purchase.company_id, plan := get_plan(db, purchase.plan_id).points)

    return purchase

def list_point_purchases(db: Session, company_id: str, skip: int, limit: int) -> tuple[int, list[CompanyPointPurchase]]:
    """
    Lista as compras de pontos de uma empresa (paginação).
    """
    q = (
        db.query(CompanyPointPurchase)
          .filter_by(company_id=company_id)
          .options(joinedload(CompanyPointPurchase.plan))
    )
    total = q.count()
    items = q.order_by(CompanyPointPurchase.created_at.desc()).offset(skip).limit(limit).all()
    return total, items

def list_all_point_purchases(db: Session, skip: int, limit: int) -> tuple[int, list[CompanyPointPurchase]]:
    """
    Endpoint admin: lista todas as compras de pontos de todas as empresas.
    """
    q = (
        db.query(CompanyPointPurchase)
          .options(
              joinedload(CompanyPointPurchase.company),
              joinedload(CompanyPointPurchase.plan),
          )
    )
    total = q.count()
    items = q.order_by(CompanyPointPurchase.created_at.desc()).offset(skip).limit(limit).all()
    return total, items
