from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from app.schemas.help_post import HelpPostRead
from app.schemas.help_category import HelpCategoryCreate, HelpCategoryRead, HelpCategoryTree
from app.services.help_category_service import (
    list_help_categories, get_help_category,
    create_help_category, update_help_category,
    delete_help_category, list_help_category_tree, get_category_tree_with_posts
)
from app.db.deps import get_db
from app.services.help_post_service import get_posts_for_category_tree

router = APIRouter(prefix="/help/categories", tags=["help-categories"])

@router.get("/", response_model=list[HelpCategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return list_help_categories(db)

@router.get("/tree", response_model=list[HelpCategoryRead])
def list_category_tree_endpoint(db: Session = Depends(get_db)):
    """
    GET /help/categories/tree
    Retorna as categorias de nível 1 (parent_id NULL)
    e cada uma já vem com .children -> lista de sub-categorias.
    """
    return list_help_category_tree(db)

@router.get(
    "/{category_id}/tree",
    response_model=HelpCategoryTree,
    summary="Retorna a categoria + toda a sua árvore de subcategorias e posts"
)
def read_category_tree(
    category_id: str = Path(..., description="ID da categoria raiz"),
    db: Session = Depends(get_db),
):
    tree = get_category_tree_with_posts(db, category_id)
    if not tree:
        raise HTTPException(404, f"Categoria {category_id} não encontrada")
    return tree

@router.get("/{category_id}/posts", response_model=list[HelpPostRead])
def read_posts_by_category_tree(
    category_id: str,
    limit: int = Query(5, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # 1) garante que a categoria existe
    cat = get_help_category(db, category_id)
    if not cat:
        raise HTTPException(404, f"Categoria {category_id} não encontrada")

    # 2) pega os posts
    posts = get_posts_for_category_tree(db, category_id, limit)
    return posts


@router.post("/", response_model=HelpCategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(cat_in: HelpCategoryCreate, db: Session = Depends(get_db)):
    return create_help_category(db, cat_in)

@router.get("/{category_id}", response_model=HelpCategoryRead)
def read_category(category_id: str, db: Session = Depends(get_db)):
    cat = get_help_category(db, category_id)
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    return cat

@router.put("/{category_id}", response_model=HelpCategoryRead)
def update_category(category_id: str, cat_in: HelpCategoryCreate, db: Session = Depends(get_db)):
    cat = update_help_category(db, category_id, cat_in)
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    return cat

@router.delete("/{category_id}", response_model=HelpCategoryRead)
def delete_category(category_id: str, db: Session = Depends(get_db)):
    cat = delete_help_category(db, category_id)
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    return cat

