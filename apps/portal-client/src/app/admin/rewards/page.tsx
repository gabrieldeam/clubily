// src/app/admin/rewards/page.tsx
"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import {
  adminCreateRewardCategory,
  listRewardCategories,
  adminUpdateRewardCategory,
  adminDeleteRewardCategory,
  adminCreateRewardProduct,
  adminUpdateRewardProduct,
  adminDeleteRewardProduct,
  adminListRewardOrders,
  adminApproveRewardOrder,
  adminRefuseRewardOrder,
  listRewardProducts,
} from "@/services/rewardsService";
import type {
  RewardCategoryRead,
  RewardCategoryCreate,
  RewardCategoryUpdate,
  RewardProductRead,
  RewardProductCreate,
  RewardProductUpdate,
  RewardOrderRead,
  OrderStatus,
} from "@/types/reward";
import {
  createSelection,
  deleteSelection,
  getCategorySelection,
  listProductSelections,
} from "@/services/selectionService";
import Notification from "@/components/Notification/Notification";
import Modal from "@/components/Modal/Modal";
import FloatingLabelInput from "@/components/FloatingLabelInput/FloatingLabelInput";
import Button from "@/components/Button/Button";
import { PlusCircle } from "lucide-react";
import styles from "./page.module.css";

/* ────── TYPES & HELPERS ────── */
type ViewMode = "table" | "cards";
interface NotificationState {
  type: "success" | "error" | "info";
  message: string;
}

interface ProductForm {
  name: string;
  sku: string;
  points_cost: number;
  short_desc?: string;
  long_desc?: string;
  category_ids: string[];
  image?: File | null;
  pdf?: File | null;
  active: boolean;
}

type ProductExtended = RewardProductRead & {
  short_desc?: string;
  long_desc?: string;
  categories?: RewardCategoryRead[];
};

const badgeClass = (status: string) => {
  switch (status) {
    case "PAID":
    case "APPROVED":
      return styles.badgePaid;
    case "PENDING":
      return styles.badgePending;
    case "REFUSED":
    case "FAILED":
      return styles.badgeFailed;
    default:
      return styles.badgeCancelled;
  }
};

/* ────── COMPONENT ────── */
export default function AdminRewardsPage() {
  /* GLOBAL NOTIFICATION */
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );

  /* ========== CATEGORIES ========== */
  const [categories, setCategories] = useState<RewardCategoryRead[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryPage, setCategoryPage] = useState(1);
  const categoryLimit = 10;
  const [categoryTotal, setCategoryTotal] = useState(0);
  const lastCategoryPage = Math.ceil(categoryTotal / categoryLimit);
  const [categoryViewMode, setCategoryViewMode] = useState<ViewMode>("table");
  const [categorySlug, setCategorySlug] = useState("");

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<"create" | "edit">(
    "create"
  );
  const [currentCategory, setCurrentCategory] =
    useState<RewardCategoryRead | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedProductIds, setSelectedProductIds] = useState<
    Set<string>
  >(new Set());

  /* ---- Seleções persistidas ---- */
  useEffect(() => {
    getCategorySelection().then((res) => setSelectedCategoryId(res.data.item_id));
    listProductSelections().then((res) =>
      setSelectedProductIds(new Set(res.data.map((p) => p.item_id)))
    );
  }, []);

  async function toggleCategorySelection(id: string) {
    if (selectedCategoryId === id) {
      await deleteSelection("category");
      setSelectedCategoryId(null);
    } else {
      await createSelection({ type: "category", item_id: id });
      setSelectedCategoryId(id);
    }
  }

  async function toggleProductSelection(id: string) {
    if (selectedProductIds.has(id)) {
      await deleteSelection("product", id);
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await createSelection({ type: "product", item_id: id });
      setSelectedProductIds((prev) => new Set(prev).add(id));
    }
  }

  useEffect(() => {
    setCategorySlug(
      categoryName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
    );
  }, [categoryName]);

  /* ---- Fetch categories ---- */
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const skip = (categoryPage - 1) * categoryLimit;
      const res = await listRewardCategories(skip, categoryLimit);
      setCategories(res.data.items);
      setCategoryTotal(res.data.total);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao buscar categorias";
      setNotification({ type: "error", message: msg });
    } finally {
      setLoadingCategories(false);
    }
  }, [categoryPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openCreateCategory() {
    setCategoryMode("create");
    setCurrentCategory(null);
    setCategoryName("");
    setCategorySlug("");
    setCategoryModalOpen(true);
  }
  function openEditCategory(cat: RewardCategoryRead) {
    setCategoryMode("edit");
    setCurrentCategory(cat);
    setCategoryName(cat.name);
    setCategorySlug(cat.slug);
    setCategoryModalOpen(true);
  }
  function closeCategoryModal() {
    setCategoryModalOpen(false);
    setCurrentCategory(null);
  }

  async function handleSaveCategory(e: FormEvent) {
    e.preventDefault();
    try {
      if (categoryMode === "create") {
        const payload: RewardCategoryCreate = {
          name: categoryName,
          slug: categorySlug,
        };
        await adminCreateRewardCategory(payload);
        setNotification({ type: "success", message: "Categoria criada!" });
      } else if (currentCategory) {
        const payload: RewardCategoryUpdate = {
          name: categoryName,
          slug: categorySlug,
        };
        await adminUpdateRewardCategory(currentCategory.id, payload);
        setNotification({ type: "success", message: "Categoria atualizada!" });
      }
      await fetchCategories();
      closeCategoryModal();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao salvar categoria";
      setNotification({ type: "error", message: msg });
    }
  }

  async function handleDeleteCategory() {
    if (!currentCategory) return;
    try {
      await adminDeleteRewardCategory(currentCategory.id);
      setNotification({ type: "success", message: "Categoria excluída!" });
      await fetchCategories();
      closeCategoryModal();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao excluir categoria";
      setNotification({ type: "error", message: msg });
    }
  }

  /* ========== PRODUCTS ========== */
  const [products, setProducts] = useState<RewardProductRead[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productPage, setProductPage] = useState(1);
  const productLimit = 10;
  const [productTotal, setProductTotal] = useState(0);
  const lastProductPage = Math.ceil(productTotal / productLimit);
  const [productViewMode, setProductViewMode] = useState<ViewMode>("table");

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productMode, setProductMode] = useState<"create" | "edit">("create");
  const [currentProduct, setCurrentProduct] =
    useState<RewardProductRead | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    sku: "",
    points_cost: 0,
    short_desc: "",
    long_desc: "",
    category_ids: [],
    image: null,
    pdf: null,
    active: true,
  });
  const updateProductField = <K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K]
  ) => setProductForm((prev) => ({ ...prev, [field]: value }));

  /* ---- Fetch products ---- */
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const skip = (productPage - 1) * productLimit;
      const res = await listRewardProducts(skip, productLimit);
      setProducts(res.data.items);
      setProductTotal(res.data.total);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao buscar produtos";
      setNotification({ type: "error", message: msg });
    } finally {
      setLoadingProducts(false);
    }
  }, [productPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreateProduct() {
    setProductMode("create");
    setCurrentProduct(null);
    setProductForm({
      name: "",
      sku: "",
      points_cost: 0,
      short_desc: "",
      long_desc: "",
      category_ids: [],
      image: null,
      pdf: null,
      active: true,
    });
    setProductModalOpen(true);
  }

  function openEditProduct(p: ProductExtended) {
    setProductMode("edit");
    setCurrentProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      points_cost: p.points_cost,
      short_desc: p.short_desc ?? "",
      long_desc: p.long_desc ?? "",
      category_ids: p.categories?.map((c) => c.id) ?? [],
      image: null,
      pdf: null,
      active: p.active,
    });
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
    setCurrentProduct(null);
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    try {
      if (productMode === "create") {
        await adminCreateRewardProduct(productForm as RewardProductCreate);
        setNotification({ type: "success", message: "Produto criado!" });
      } else if (currentProduct) {
        await adminUpdateRewardProduct(currentProduct.id, productForm as RewardProductUpdate);
        setNotification({ type: "success", message: "Produto atualizado!" });
      }
      await fetchProducts();
      closeProductModal();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao salvar produto";
      setNotification({ type: "error", message: msg });
    }
  }

  async function handleDeleteProduct() {
    if (!currentProduct) return;
    try {
      await adminDeleteRewardProduct(currentProduct.id);
      setNotification({ type: "success", message: "Produto excluído!" });
      await fetchProducts();
      closeProductModal();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao excluir produto";
      setNotification({ type: "error", message: msg });
    }
  }

  /* ========== ORDERS ========== */
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? "";
  const [orders, setOrders] = useState<RewardOrderRead[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderPage, setOrderPage] = useState(1);
  const orderLimit = 10;
  const [orderTotal, setOrderTotal] = useState(0);
  const lastOrderPage = Math.ceil(orderTotal / orderLimit);
  const [orderViewMode, setOrderViewMode] = useState<ViewMode>("table");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<RewardOrderRead | null>(
    null
  );

  /* ---- Fetch orders ---- */
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const skip = (orderPage - 1) * orderLimit;
      const statusParam = (orderStatusFilter || undefined) as
        | OrderStatus
        | undefined;
      const res = await adminListRewardOrders(statusParam, skip, orderLimit);
      setOrders(res.data.items);
      setOrderTotal(res.data.total);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao buscar pedidos";
      setNotification({ type: "error", message: msg });
    } finally {
      setLoadingOrders(false);
    }
  }, [orderPage, orderStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function openOrderDetails(o: RewardOrderRead) {
    setCurrentOrder(o);
    setOrderModalOpen(true);
  }
  function closeOrderModal() {
    setCurrentOrder(null);
    setOrderModalOpen(false);
  }

  async function approveOrder() {
    if (!currentOrder) return;
    try {
      await adminApproveRewardOrder(currentOrder.id);
      setNotification({ type: "success", message: "Pedido aprovado!" });
      await fetchOrders();
      closeOrderModal();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao aprovar pedido";
      setNotification({ type: "error", message: msg });
    }
  }

  async function refuseOrder() {
    if (!currentOrder) return;
    const reason = prompt("Motivo da recusa:");
    if (!reason) return;
    try {
      await adminRefuseRewardOrder(currentOrder.id, reason);
      setNotification({ type: "success", message: "Pedido recusado!" });
      await fetchOrders();
      closeOrderModal();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erro ao recusar pedido";
      setNotification({ type: "error", message: msg });
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ================= CATEGORIAS ================= */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Categorias</h2>
          <div className={styles.actionsHeader}>
            <button className={styles.btnPrimary} onClick={openCreateCategory}>
              <PlusCircle size={16} /> Nova Categoria
            </button>
            <div className={styles.viewToggle}>
              <button
                className={
                  categoryViewMode === "table" ? styles.activeToggle : ""
                }
                onClick={() => setCategoryViewMode("table")}
              >
                Tabela
              </button>
              <button
                className={
                  categoryViewMode === "cards" ? styles.activeToggle : ""
                }
                onClick={() => setCategoryViewMode("cards")}
              >
                Cards
              </button>
            </div>
          </div>
        </header>
        {loadingCategories ? (
          <p>Carregando...</p>
        ) : categoryViewMode === "table" ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td data-label="Nome">{cat.name}</td>
                    <td data-label="Slug">{cat.slug}</td>
                    <td data-label="Ações" className={styles.actions}>
                      <button
                        className={styles.btnDetail}
                        onClick={() => openEditCategory(cat)}
                      >
                        Detalhes
                      </button>
                      <button
                        className={
                          selectedCategoryId === cat.id
                            ? styles.btnSelected
                            : styles.btnSelect
                        }
                        onClick={() => toggleCategorySelection(cat.id)}
                      >
                        {selectedCategoryId === cat.id
                          ? "Selecionada"
                          : "Selecionar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {categories.map((cat) => (
              <div key={cat.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3>{cat.name}</h3>
                  <button
                    className={styles.btnDetail}
                    onClick={() => openEditCategory(cat)}
                  >
                    Detalhes
                  </button>
                  <button
                    className={
                      selectedCategoryId === cat.id
                        ? styles.btnSelected
                        : styles.btnSelect
                    }
                    onClick={() => toggleCategorySelection(cat.id)}
                  >
                    {selectedCategoryId === cat.id
                      ? "Selecionada"
                      : "Selecionar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.pagination}>
          <button
            onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
            disabled={categoryPage === 1}
          >
            ←
          </button>
          <span>
            {categoryPage} / {lastCategoryPage}
          </span>
          <button
            onClick={() =>
              setCategoryPage((p) => Math.min(lastCategoryPage, p + 1))
            }
            disabled={categoryPage === lastCategoryPage}
          >
            →
          </button>
        </div>
      </section>

      {/* Modal Categoria */}
      <Modal open={categoryModalOpen} onClose={closeCategoryModal} width={400}>
        <div className={styles.detail}>
          <h2>
            {categoryMode === "create" ? "Nova Categoria" : "Editar Categoria"}
          </h2>
          <form className={styles.form} onSubmit={handleSaveCategory}>
            <FloatingLabelInput
              id="cat-name"
              label="Nome"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <FloatingLabelInput
              id="cat-slug"
              label="Slug"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              required
            />
            <div className={styles.formActions}>
              {categoryMode === "edit" && (
                <Button bgColor="#ef4444" onClick={handleDeleteCategory} type="button">
                  Excluir
                </Button>
              )}
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ================= PRODUTOS ================= */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Produtos</h2>
          <div className={styles.actionsHeader}>
            <button className={styles.btnPrimary} onClick={openCreateProduct}>
              <PlusCircle size={16} /> Novo Produto
            </button>
            <div className={styles.viewToggle}>
              <button
                className={
                  productViewMode === "table" ? styles.activeToggle : ""
                }
                onClick={() => setProductViewMode("table")}
              >
                Tabela
              </button>
              <button
                className={
                  productViewMode === "cards" ? styles.activeToggle : ""
                }
                onClick={() => setProductViewMode("cards")}
              >
                Cards
              </button>
            </div>
          </div>
        </header>
        {loadingProducts ? (
          <p>Carregando...</p>
        ) : productViewMode === "table" ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>SKU</th>
                  <th>Pontos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod.id}>
                    <td data-label="Nome">{prod.name}</td>
                    <td data-label="SKU">{prod.sku}</td>
                    <td data-label="Pontos">{prod.points_cost}</td>
                    <td data-label="Ações" className={styles.actions}>
                      <button
                        className={styles.btnDetail}
                        onClick={() =>
                          openEditProduct(prod as ProductExtended)
                        }
                      >
                        Detalhes
                      </button>
                      <button
                        className={
                          selectedProductIds.has(prod.id)
                            ? styles.btnSelected
                            : styles.btnSelect
                        }
                        onClick={() => toggleProductSelection(prod.id)}
                      >
                        {selectedProductIds.has(prod.id)
                          ? "Selecionado"
                          : "Selecionar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {products.map((prod) => (
              <div key={prod.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3>{prod.name}</h3>
                  <p>{prod.points_cost} pontos</p>
                  <p className={styles.subText}>
                    {(prod as ProductExtended).short_desc ?? ""}
                  </p>
                  <button
                    className={styles.btnDetail}
                    onClick={() =>
                      openEditProduct(prod as ProductExtended)
                    }
                  >
                    Detalhes
                  </button>
                  <button
                    className={
                      selectedProductIds.has(prod.id)
                        ? styles.btnSelected
                        : styles.btnSelect
                    }
                    onClick={() => toggleProductSelection(prod.id)}
                  >
                    {selectedProductIds.has(prod.id)
                      ? "Selecionado"
                      : "Selecionar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.pagination}>
          <button
            onClick={() => setProductPage((p) => Math.max(1, p - 1))}
            disabled={productPage === 1}
          >
            ←
          </button>
          <span>
            {productPage} / {lastProductPage}
          </span>
          <button
            onClick={() =>
              setProductPage((p) => Math.min(lastProductPage, p + 1))
            }
            disabled={productPage === lastProductPage}
          >
            →
          </button>
        </div>
      </section>

      {/* Modal Produto */}
      <Modal open={productModalOpen} onClose={closeProductModal} width={600}>
        <div className={styles.detail}>
          <h2>{productMode === 'create' ? 'Novo Produto' : 'Editar Produto'}</h2>
          <form className={styles.form} onSubmit={handleSaveProduct}>
            <FloatingLabelInput id="prod-name" label="Nome" value={productForm.name} onChange={e => updateProductField('name', e.target.value)} required />
            <FloatingLabelInput id="prod-sku" label="SKU" value={productForm.sku} onChange={e => updateProductField('sku', e.target.value)} required />
            <FloatingLabelInput id="prod-points" label="Pontos" type="number" value={productForm.points_cost} onChange={e => updateProductField('points_cost', parseInt(e.target.value, 10) || 0)} required />
             {/* Descrição Curta com limite e contador */}
          <div className={styles.fieldGroup}>
            <label htmlFor="prod-short" className={styles.label}>Descrição Curta</label>
            <textarea
              id="prod-short"
              className={styles.textarea}
              maxLength={255}
              rows={3}
              value={productForm.short_desc ?? ''}
              onChange={e => updateProductField('short_desc', e.target.value)}
            />
            <div className={styles.charCount}>
              {(productForm.short_desc ?? '').length} / 255
            </div>
          </div>

          {/* Descrição Longa com limite e contador */}
          <div className={styles.fieldGroup}>
            <label htmlFor="prod-long" className={styles.label}>Descrição Longa</label>
            <textarea
              id="prod-long"
              className={styles.textarea}
              maxLength={1000}
              rows={6}
              value={productForm.long_desc ?? ''}
              onChange={e => updateProductField('long_desc', e.target.value)}
            />
            <div className={styles.charCount}>
              {(productForm.long_desc ?? '').length} / 1000
            </div>
          </div>
            {/* Categorias */}
            <label className={styles.subText}><strong>Categorias</strong></label>
            <select multiple value={productForm.category_ids} onChange={e => {
              const sel = Array.from(e.target.selectedOptions).map(o => o.value);
              updateProductField('category_ids', sel);
            }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Uploads */}
            <label className={styles.subText}><strong>Imagem</strong></label>
            <input type="file" accept="image/*" onChange={e => updateProductField('image', e.target.files?.[0] ?? null)} />
            <label className={styles.subText}><strong>PDF (opcional)</strong></label>
            <input type="file" accept="application/pdf" onChange={e => updateProductField('pdf', e.target.files?.[0] ?? null)} />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={productForm.active}
                  onChange={e => updateProductField('active', e.target.checked)}
                />{' '}
                Ativo
              </label>
            </div>
            <div className={styles.formActions}>
              {productMode === 'edit' && (
                <Button bgColor="#ef4444" type="button" onClick={handleDeleteProduct}>Excluir</Button>
              )}
              <Button bgColor="#3b82f6" type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ================= PEDIDOS ================= */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Pedidos</h2>
          <div className={styles.actionsHeader}>
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REFUSED">Recusado</option>
            </select>
            <div className={styles.viewToggle}>
              <button className={orderViewMode === 'table' ? styles.activeToggle : ''} onClick={() => setOrderViewMode('table')}>Tabela</button>
              <button className={orderViewMode === 'cards' ? styles.activeToggle : ''} onClick={() => setOrderViewMode('cards')}>Cards</button>
            </div>
          </div>
        </header>
        {loadingOrders ? (
          <p>Carregando...</p>
        ) : orderViewMode === 'table' ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr><th>ID</th><th>Destinatário</th><th>Endereço</th><th>Status</th><th>Criado</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td data-label="ID">{o.id.slice(0,8)}…</td>
                    <td data-label="Destinatário">{o.recipient}</td>
                    <td data-label="Endereço">
                      {`${o.street}, ${o.number}${o.complement ? `, ${o.complement}` : ''} – ${o.neighborhood}, ${o.city}/${o.state}`}
                    </td>
                    <td data-label="Status"><span className={badgeClass(o.status)}>{o.status}</span></td>
                    <td data-label="Criado">{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                    <td data-label="Ações" className={styles.actions}><button className={styles.btnDetail} onClick={() => openOrderDetails(o)}>Detalhes</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {orders.map(o => (
              <div key={o.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3>{o.recipient}</h3>
                  <p>{`${o.street}, ${o.number}${o.complement ? `, ${o.complement}` : ''} – ${o.neighborhood}, ${o.city}/${o.state}`}</p>
                  <p><span className={badgeClass(o.status)}>{o.status}</span></p>
                  <p className={styles.subText}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                  <button className={styles.btnDetail} onClick={() => openOrderDetails(o)}>Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.pagination}>
          <button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}>←</button>
          <span>{orderPage} / {lastOrderPage}</span>
          <button onClick={() => setOrderPage(p => Math.min(lastOrderPage, p + 1))} disabled={orderPage === lastOrderPage}>→</button>
        </div>
      </section>

      {/* Modal Pedido */}
<Modal open={orderModalOpen} onClose={closeOrderModal} width={600}>
  {currentOrder && (
    <div className={styles.detail}>
      <h2>Pedido {currentOrder.id.slice(0, 8)}…</h2>

      <section>
        <h3>Produtos</h3>
        <ul className={styles.orderItems}>
          {currentOrder.items.map((it, idx) => (
            <li key={idx} className={styles.orderItem}>
              {/* Imagem do produto */}
              {it.product.image_url && (
               <Image
                  loader={({ src }) => src}
                  src={`${baseUrl}${it.product.image_url}`}
                  alt={it.product.name}
                  width={80}
                  height={80}
                  className={styles.productImage}
                />
              )}
              <div className={styles.productInfo}>
                <p>
                  <strong>Nome:</strong> {it.product.name}
                </p>
                <p>
                  <strong>SKU:</strong> {it.product.sku}
                </p>
                <p>
                  <strong>Quantidade:</strong> {it.quantity}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Destinatário & Endereço</h3>
        <p>
          <strong>Destinatário:</strong> {currentOrder.recipient}
        </p>
        <p>
          <strong>Endereço:</strong>{' '}
          {`${currentOrder.street}, ${currentOrder.number}${
            currentOrder.complement ? `, ${currentOrder.complement}` : ''
          }`}
          <br />
          {`${currentOrder.neighborhood}, ${currentOrder.city}/${currentOrder.state} – CEP ${currentOrder.postal_code}`}
        </p>
      </section>

      <section>
        <h3>Status</h3>
        <p>
          <span className={badgeClass(currentOrder.status)}>
            {currentOrder.status}
          </span>
        </p>
        <p>
          <strong>Criado em:</strong>{' '}
          {new Date(currentOrder.created_at).toLocaleString('pt-BR')}
        </p>
      </section>

      {currentOrder.status === 'pending' && (
        <div className={styles.formActions}>
          <Button bgColor="#10b981" type="button" onClick={approveOrder}>
            Aprov​ar
          </Button>
          <Button bgColor="#ef4444" type="button" onClick={refuseOrder}>
            Recusar
          </Button>
        </div>
      )}
    </div>
  )}
</Modal>

    </div>
  );
}
