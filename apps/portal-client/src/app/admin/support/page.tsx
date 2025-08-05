"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Notification from "@/components/Notification/Notification";
import Modal from "@/components/Modal/Modal";
import FloatingLabelInput from "@/components/FloatingLabelInput/FloatingLabelInput";
import Button from "@/components/Button/Button";

import {
  fetchHelpCategories,
  createHelpCategory,
  updateHelpCategory,
  deleteHelpCategory,
  fetchHelpPosts,
  createHelpPost,
  updateHelpPost,
  deleteHelpPost,
} from "@/services/help";

import type {
  HelpCategory,
  HelpCategoryCreate,
} from "@/types/help";
import type {
  HelpPost,
  HelpPostCreate,
  BlockCreate,
  BlockType,
  HelpPostPage,
} from "@/types/help";

import { PlusCircle, AlignLeft, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import styles from "./page.module.css";

interface NotificationState {
  type: "success" | "error" | "info";
  message: string;
}
const defaultNotification: NotificationState | null = null;

export default function AdminSupportPage() {
  const [notification, setNotification] = useState<NotificationState | null>(defaultNotification);

  /* ===================== CATEGORIES ===================== */
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catMode, setCatMode] = useState<"create" | "edit">("create");
  const [currentCategory, setCurrentCategory] = useState<HelpCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catParent, setCatParent] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await fetchHelpCategories());
    } catch {
      setNotification({ type: "error", message: "Erro ao buscar categorias" });
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openCreateCategory = () => {
    setCatMode("create");
    setCatName("");
    setCatParent(null);
    setCurrentCategory(null);
    setCatModalOpen(true);
  };
  const openEditCategory = (c: HelpCategory) => {
    setCatMode("edit");
    setCurrentCategory(c);
    setCatName(c.name);
    setCatParent(c.parent_id ?? null);
    setCatModalOpen(true);
  };

  const saveCategory = async (e: FormEvent) => {
    e.preventDefault();
    const payload: HelpCategoryCreate = { name: catName, parent_id: catParent };
    try {
      if (catMode === "create") {
        await createHelpCategory(payload);
        setNotification({ type: "success", message: "Categoria criada!" });
      } else if (currentCategory) {
        await updateHelpCategory(currentCategory.id, payload);
        setNotification({ type: "success", message: "Categoria atualizada!" });
      }
      await loadCategories();
      setCatModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao salvar categoria" });
    }
  };
  const removeCategory = async () => {
    if (!currentCategory) return;
    try {
      await deleteHelpCategory(currentCategory.id);
      setNotification({ type: "success", message: "Categoria excluída!" });
      await loadCategories();
      setCatModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao excluir categoria" });
    }
  };

  /* ===================== POSTS ===================== */
  const [posts, setPosts] = useState<HelpPost[]>([]);
  const [postPage, setPostPage] = useState<HelpPostPage | null>(null);
  const [page, setPage] = useState(1);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postMode, setPostMode] = useState<"create" | "edit">("create");
  const [currentPost, setCurrentPost] = useState<HelpPost | null>(null);

const emptyBlocks: BlockCreate[] = [
  { position: 1, type: "text", content: { html: "" } },
];

  const [postForm, setPostForm] = useState<HelpPostCreate>({
    title: "",
    slug: "",
    category_ids: [],
    blocks: emptyBlocks,
  });

  const updatePostField = <K extends keyof HelpPostCreate>(
    field: K,
    val: HelpPostCreate[K]
  ) => setPostForm(prev => ({ ...prev, [field]: val }));

  const loadPosts = useCallback(async () => {
    try {
      const data = await fetchHelpPosts({ page, page_size: 10 });
      setPosts(data.items);
      setPostPage(data);
    } catch {
      setNotification({ type: "error", message: "Erro ao buscar artigos" });
    }
  }, [page]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const openCreatePost = () => {
    setPostMode("create");
    setPostForm({ title: "", slug: "", category_ids: [], blocks: emptyBlocks });
    setCurrentPost(null);
    setPostModalOpen(true);
  };
  const openEditPost = (p: HelpPost) => {
    setPostMode("edit");
    setCurrentPost(p);
    setPostForm({
      title: p.title,
      slug: p.slug,
      category_ids: p.categories.map(c => c.id),
      blocks: p.blocks.map(b => {
        if (b.type === "text") {
          // Aqui o TS sabe que content tem .html
          const txt = b as { position: number; type: "text"; content: { html: string } };
          return {
            position: txt.position,
            type: "text" as const,
            content: { html: txt.content.html }
          };
        } else {
          // Aqui o TS sabe que content tem .url
          const img = b as { position: number; type: "image"; content: { url: string } };
          return {
            position: img.position,
            type: "image" as const,
            content: { url: img.content.url }
          };
        }
      }),
    });
    setPostModalOpen(true);
  };

  const savePost = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", postForm.title);
    fd.append("slug", postForm.slug);
    fd.append("category_ids", JSON.stringify(postForm.category_ids));
    fd.append("blocks", JSON.stringify(postForm.blocks));

    try {
      if (postMode === "create") {
        await createHelpPost(fd);
        setNotification({ type: "success", message: "Artigo criado!" });
      } else if (currentPost) {
        await updateHelpPost(currentPost.id, fd);
        setNotification({ type: "success", message: "Artigo atualizado!" });
      }
      await loadPosts();
      setPostModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao salvar artigo" });
    }
  };

  const removePost = async () => {
    if (!currentPost) return;
    try {
      await deleteHelpPost(currentPost.id);
      setNotification({ type: "success", message: "Artigo excluído!" });
      await loadPosts();
      setPostModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao excluir artigo" });
    }
  };

 const emptyTextBlock = (): BlockCreate => ({
   position: postForm.blocks.length + 1,
   type: "text",
   content: { html: "" },
 });
 const emptyImageBlock = (): BlockCreate => ({
   position: postForm.blocks.length + 1,
   type: "image",
   content: { url: "" },
 });
  const applyFormat = (command: string, value?: string) =>
    document.execCommand(command, false, value);

  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* =========== CATEGORIES =========== */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Categorias de Suporte</h2>
          <button className={styles.btnPrimary} onClick={openCreateCategory}>
            <PlusCircle size={16} /> Nova Categoria
          </button>
        </header>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr><th>Nome</th><th>Superior</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td data-label="Nome">{c.name}</td>
                  <td data-label="Superior">
                    {c.parent_id
                      ? categories.find(p => p.id === c.parent_id)?.name
                      : "-"}
                  </td>
                  <td className={styles.actions} data-label="Ações">
                    <button
                      className={styles.btnDetail}
                      onClick={() => openEditCategory(c)}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Categoria */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        width={400}
      >
        <div className={styles.detail}>
          <h2>
            {catMode === "create" ? "Nova Categoria" : "Editar Categoria"}
          </h2>
          <form className={styles.form} onSubmit={saveCategory}>
            <FloatingLabelInput
              id="cat-name"
              label="Nome"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              required
            />
            <label className={styles.subText}>
              <strong>Categoria Superior</strong>
            </label>
            <select
              value={catParent ?? ""}
              onChange={(e) => setCatParent(e.target.value || null)}
            >
              <option value="">Nenhuma</option>
              {categories
                .filter((c) => c.id !== currentCategory?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <div className={styles.formActions}>
              {catMode === "edit" && (
                <Button
                  bgColor="#ef4444"
                  type="button"
                  onClick={removeCategory}
                >
                  Excluir
                </Button>
              )}
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========== POSTS =========== */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Artigos de Suporte</h2>
          <button className={styles.btnPrimary} onClick={openCreatePost}>
            <PlusCircle size={16} /> Novo Artigo
          </button>
        </header>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr><th>Título</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td data-label="Título">{p.title}</td>
                  <td className={styles.actions} data-label="Ações">
                    <button
                      className={styles.btnDetail}
                      onClick={() => openEditPost(p)}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            disabled={
              page * (postPage?.page_size ?? 10) >= (postPage?.total ?? 0)
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
      </section>

      {/* Modal Artigo */}
      <Modal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        width={600}
      >
        <div className={styles.detail}>
          <h2>
            {postMode === "create" ? "Novo Artigo" : "Editar Artigo"}
          </h2>
          <form className={styles.form} onSubmit={savePost}>
            <FloatingLabelInput
              id="post-title"
              label="Título"
              value={postForm.title}
              onChange={(e) => updatePostField("title", e.target.value)}
              required
            />
            <FloatingLabelInput
              id="post-slug"
              label="Slug"
              value={postForm.slug}
              onChange={(e) => updatePostField("slug", e.target.value)}
              required
            />
            <label className={styles.subText}>
              <strong>Categorias</strong>
            </label>
            <select
              multiple
              value={postForm.category_ids}
              onChange={(e) => {
                const sel = Array.from(e.target.selectedOptions).map(
                  (o) => o.value
                );
                updatePostField("category_ids", sel);
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Blocos */}
            <label className={styles.subText}>
              <strong>Blocos</strong>
            </label>
            <div className={styles.blockList}>
              {postForm.blocks.map((blk, idx) => (
                <div key={idx} className={styles.blockCard}>
                  <div className={styles.blockHeader}>
                    <div>
                      <select
                        value={blk.type}
                        onChange={(e) => {
                            const nb = [...postForm.blocks];
                            const newType = e.target.value as BlockType;
                            nb[idx].type = newType;
                            nb[idx].content = newType === "text"
                            ? { html: "" }
                            : { url: "" };
                            updatePostField("blocks", nb);
                        }}
                      >
                        <option value="text">Texto</option>
                        <option value="image">Imagem</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={blk.position}
                        onChange={(e) => {
                          const nb = [...postForm.blocks];
                          nb[idx].position = parseInt(e.target.value, 10) || 1;
                          updatePostField("blocks", nb);
                        }}
                        style={{ width: 60 }}
                        title="Posição"
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.blockRemoveBtn}
                      onClick={() => {
                        const nb = postForm.blocks.filter((_, i) => i !== idx);
                        updatePostField("blocks", nb);
                      }}
                    >
                      Remover
                    </button>
                  </div>

                  {blk.type === "text" && (
                    <div className={styles.richTextEditor}>
                      <div className={styles.toolbar}>
                        <button
                          type="button"
                          onClick={() => applyFormat("bold")}
                        >
                          <b>B</b>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("italic")}
                        >
                          <i>I</i>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("fontSize", "4")}
                        >
                          A+
                        </button>
                      </div>
                      <div
                        className={styles.editor}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: (blk.content as { html: string }).html }}
                        onInput={(e) => {
                            const html = (e.target as HTMLDivElement).innerHTML;
                            const nb = [...postForm.blocks];
                            nb[idx].content = { html };               // agora é um dict
                            updatePostField("blocks", nb);
                        }}
                      />
                    </div>
                  )}

                  {blk.type === "image" && (
                    <>
                      {typeof blk.content === "object" && (blk.content as { url: string }).url && (
                        <div
                          style={{
                            position: "relative",
                            width: 200,
                            height: 200,
                            marginBottom: 8,
                          }}
                        >
                          <Image
                            src={(blk.content as { url: string }).url}
                            alt="Preview do bloco"
                            fill
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                                const nb = [...postForm.blocks];
                                nb[idx].content = { url: reader.result as string };  // dict também
                                updatePostField("blocks", nb);
                            };

                          reader.readAsDataURL(file);
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
              <div className={styles.addBlockBar}>
                <button
                  type="button"
                  className={styles.blockTypeBtn}
                  onClick={() =>
                    updatePostField("blocks", [
                      ...postForm.blocks,
                      emptyTextBlock(),
                    ])
                  }
                >
                  <AlignLeft size={16} /> texto
                </button>
                <button
                  type="button"
                  className={styles.blockTypeBtn}
                  onClick={() =>
                    updatePostField("blocks", [
                      ...postForm.blocks,
                      emptyImageBlock(),
                    ])
                  }
                >
                  <ImageIcon size={16} /> imagem
                </button>
              </div>
            </div>

            <div className={styles.formActions}>
              {postMode === "edit" && currentPost && (
                <Button
                  bgColor="#ef4444"
                  type="button"
                  onClick={removePost}
                >
                  Excluir
                </Button>
              )}
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
