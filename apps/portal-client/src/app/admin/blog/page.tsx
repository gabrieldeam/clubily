"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Notification from "@/components/Notification/Notification";
import Modal from "@/components/Modal/Modal";
import FloatingLabelInput from "@/components/FloatingLabelInput/FloatingLabelInput";
import Button from "@/components/Button/Button";

import {
  fetchAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from "@/services/authorService";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categoryBlogService";
import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "@/services/bannerService";
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
} from "@/services/postService";

import type { Author } from "@/types/author";
import type { Category, CategoryCreate } from "@/types/categoryBlog";
import type { Banner } from "@/types/banner";
import type {
  Post,
  PostCreate,
  BlockCreate,
  BlockType,
  PostPage
} from "@/types/post";
import { PlusCircle, AlignLeft, Image } from "lucide-react";
import styles from "./page.module.css";

/* ──────────────────────────── Helpers & Types ─────────────────────────── */

interface NotificationState {
  type: "success" | "error" | "info";
  message: string;
}

/** Genérico usado em todos os CRUDs */
const defaultNotification: NotificationState | null = null;

/*****************************************************************
 * COMPONENTE
 *****************************************************************/
export default function AdminBlogPage() {
  const [notification, setNotification] = useState(defaultNotification);

  /* ===================== AUTHORS ===================== */
  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [authorMode, setAuthorMode] = useState<"create" | "edit">("create");
  const [currentAuthor, setCurrentAuthor] = useState<Author | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorAvatar, setAuthorAvatar] = useState<File | null>(null);
  const [postThumbnailFile, setPostThumbnailFile] = useState<File | null>(null);

  const loadAuthors = useCallback(async () => {
    try {
      const data = await fetchAuthors();
      setAuthors(data);
    } catch (e: unknown) {
      setNotification({ type: "error", message: "Erro ao buscar autores" });
    }
  }, []);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const openCreateAuthor = () => {
    setAuthorMode("create");
    setAuthorName("");
    setAuthorBio("");
    setAuthorAvatar(null);
    setAuthorModalOpen(true);
  };

  const openEditAuthor = (a: Author) => {
    setAuthorMode("edit");
    setCurrentAuthor(a);
    setAuthorName(a.name);
    setAuthorBio(a.bio ?? "");
    setAuthorAvatar(null);
    setAuthorModalOpen(true);
  };

  const saveAuthor = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", authorName);
    fd.append("bio", authorBio);
    if (authorAvatar) fd.append("avatar", authorAvatar);

    try {
      if (authorMode === "create") {
        await createAuthor(fd);
        setNotification({ type: "success", message: "Autor criado!" });
      } else if (currentAuthor) {
        await updateAuthor(currentAuthor.id, fd);
        setNotification({ type: "success", message: "Autor atualizado!" });
      }
      await loadAuthors();
      setAuthorModalOpen(false);
    } catch (err) {
      setNotification({ type: "error", message: "Erro ao salvar autor" });
    }
  };

  const removeAuthor = async () => {
    if (!currentAuthor) return;
    try {
      await deleteAuthor(currentAuthor.id);
      setNotification({ type: "success", message: "Autor excluído!" });
      await loadAuthors();
      setAuthorModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao excluir autor" });
    }
  };

  /* ===================== CATEGORIES ===================== */
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<"create" | "edit">(
    "create"
  );
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryParent, setCategoryParent] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await fetchCategories());
    } catch {
      setNotification({ type: "error", message: "Erro ao buscar categorias" });
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateCategory = () => {
    setCategoryMode("create");
    setCategoryName("");
    setCategoryParent(null);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setCategoryMode("edit");
    setCurrentCategory(c);
    setCategoryName(c.name);
    setCategoryParent(c.parent_id ?? null);
    setCategoryModalOpen(true);
  };

  const saveCategory = async (e: FormEvent) => {
    e.preventDefault();
    const payload: CategoryCreate = { name: categoryName, parent_id: categoryParent };
    try {
      if (categoryMode === "create") {
        await createCategory(payload);
        setNotification({ type: "success", message: "Categoria criada!" });
      } else if (currentCategory) {
        await updateCategory(currentCategory.id, payload);
        setNotification({ type: "success", message: "Categoria atualizada!" });
      }
      await loadCategories();
      setCategoryModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao salvar categoria" });
    }
  };

  const removeCategory = async () => {
    if (!currentCategory) return;
    try {
      await deleteCategory(currentCategory.id);
      setNotification({ type: "success", message: "Categoria excluída!" });
      await loadCategories();
      setCategoryModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao excluir categoria" });
    }
  };

  /* ===================== BANNERS ===================== */
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerMode, setBannerMode] = useState<"create" | "edit">("create");
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLink, setBannerLink] = useState<string | "">("");
  const [bannerOrder, setBannerOrder] = useState<number>(0);
  const [bannerImage, setBannerImage] = useState<File | null>(null);

  const loadBanners = useCallback(async () => {
    try {
      setBanners(await fetchBanners());
    } catch {
      setNotification({ type: "error", message: "Erro ao buscar banners" });
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const openCreateBanner = () => {
    setBannerMode("create");
    setBannerTitle("");
    setBannerLink("");
    setBannerOrder(0);
    setBannerImage(null);
    setBannerModalOpen(true);
  };

  const openEditBanner = (b: Banner) => {
    setBannerMode("edit");
    setCurrentBanner(b);
    setBannerTitle(b.title);
    setBannerLink(b.link_url ?? "");
    setBannerOrder(b.order);
    setBannerImage(null);
    setBannerModalOpen(true);
  };

  const saveBanner = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", bannerTitle);
    fd.append("order", String(bannerOrder));
    fd.append("link_url", bannerLink);
    if (bannerImage) fd.append("image", bannerImage);
    try {
      if (bannerMode === "create") {
        await createBanner(fd);
        setNotification({ type: "success", message: "Banner criado!" });
      } else if (currentBanner) {
        await updateBanner(currentBanner.id, fd);
        setNotification({ type: "success", message: "Banner atualizado!" });
      }
      await loadBanners();
      setBannerModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao salvar banner" });
    }
  };

  const removeBanner = async () => {
    if (!currentBanner) return;
    try {
      await deleteBanner(currentBanner.id);
      setNotification({ type: "success", message: "Banner excluído!" });
      await loadBanners();
      setBannerModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao excluir banner" });
    }
  };

  /* ===================== POSTS ===================== */
  const [posts, setPosts] = useState<Post[]>([]);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postMode, setPostMode] = useState<"create" | "edit">("create");
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [postPage, setPostPage] = useState<PostPage | null>(null);
  const [page, setPage] = useState(1);

  const emptyBlocks: BlockCreate[] = [
    { position: 1, type: "text", content: "" },
  ];

  const [postForm, setPostForm] = useState<PostCreate>({
    title: "",
    slug: "",
    author_id: "",
    category_ids: [],
    blocks: emptyBlocks,
  });

  const updatePostField = <K extends keyof PostCreate>(field: K, val: PostCreate[K]) =>
    setPostForm((prev) => ({ ...prev, [field]: val }));


const loadPosts = useCallback(async () => {
  try {
    const data = await fetchPosts({ page, page_size: 10 });

    if (Array.isArray(data)) {
      // serviço ainda retorna lista simples
      setPosts(data);
      setPostPage(null);
    } else {
      // serviço paginado
      setPosts(Array.isArray(data.items) ? data.items : []);
      setPostPage(data as PostPage);
    }
  } catch {
    setNotification({ type: "error", message: "Erro ao buscar posts" });
  }
}, [page]);


  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const openCreatePost = () => {
    setPostMode("create");
    setPostForm({ title: "", slug: "", author_id: "", category_ids: [], blocks: emptyBlocks });
    setPostModalOpen(true);
  };

  const openEditPost = (p: Post) => {
    setPostMode("edit");
    setCurrentPost(p);
    setPostForm({
      title: p.title,
      slug: p.slug,
      author_id: p.author.id,
      category_ids: p.categories.map((c) => c.id),
      blocks: p.blocks.map((b) => ({ position: b.position, type: b.type as BlockType, content: b.content })) as BlockCreate[],
      thumbnail_url: p.thumbnail_url,
    });
    setPostModalOpen(true);
  };

  const savePost = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", postForm.title);
    fd.append("slug", postForm.slug);
    fd.append("author_id", postForm.author_id);
    fd.append("category_ids", JSON.stringify(postForm.category_ids));
    fd.append("blocks", JSON.stringify(postForm.blocks));
    if (postThumbnailFile) {
      fd.append("thumbnail", postThumbnailFile);
    }

    try {
      if (postMode === "create") {
        await createPost(fd);       // ajuste seu service para receber FormData
        setNotification({ type: "success", message: "Post criado!" });
      } else if (currentPost) {
        await updatePost(currentPost.id, fd);
        setNotification({ type: "success", message: "Post atualizado!" });
      }
      await loadPosts();
      setPostModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao salvar post" });
    }
  };


  const removePost = async () => {
    if (!currentPost) return;
    try {
      await deletePost(currentPost.id);
      setNotification({ type: "success", message: "Post excluído!" });
      await loadPosts();
      setPostModalOpen(false);
    } catch {
      setNotification({ type: "error", message: "Erro ao excluir post" });
    }
  };


  const emptyTextBlock = (): BlockCreate => ({
    position: postForm.blocks.length + 1,
    type: "text",
    content: ""
  });

  const emptyImageBlock = (): BlockCreate => ({
    position: postForm.blocks.length + 1,
    type: "image",
    content: ""   // colocaremos a URL base64/preview depois
  });

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  /* ===================== RENDER ===================== */
  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* =========== AUTORES =========== */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Autores</h2>
          <button className={styles.btnPrimary} onClick={openCreateAuthor}>
            <PlusCircle size={16} /> Novo Autor
          </button>
        </header>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Bio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((a) => (
                <tr key={a.id}>
                  <td data-label="Nome">{a.name}</td>
                  <td data-label="Bio">{a.bio?.slice(0, 40)}</td>
                  <td className={styles.actions} data-label="Ações">
                    <button className={styles.btnDetail} onClick={() => openEditAuthor(a)}>
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

        {/* Modal Autor */}
        <Modal open={authorModalOpen} onClose={() => setAuthorModalOpen(false)} width={400}>
        <div className={styles.detail}>
            <h2>{authorMode === "create" ? "Novo Autor" : "Editar Autor"}</h2>
            <form className={styles.form} onSubmit={saveAuthor}>
            <FloatingLabelInput
                id="author-name"
                label="Nome"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
            />
            <FloatingLabelInput
                id="author-bio"
                label="Bio"
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
            />

            {/* Preview do avatar somente em edição */}
            {authorMode === "edit" && currentAuthor?.avatar_url && (
                <div className={styles.avatarPreviewContainer}>
                <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${currentAuthor.avatar_url}`}
                    alt={`Avatar de ${currentAuthor.name}`}
                    className={styles.avatarPreview}
                />
                </div>
            )}

            <label className={styles.subText}>
                <strong>Avatar</strong>
            </label>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setAuthorAvatar(e.target.files?.[0] ?? null)}
            />

            <div className={styles.formActions}>
                {authorMode === "edit" && (
                <Button bgColor="#ef4444" type="button" onClick={removeAuthor}>
                    Excluir
                </Button>
                )}
                <Button type="submit">Salvar</Button>
            </div>
            </form>
        </div>
        </Modal>


      {/* =========== CATEGORIAS =========== */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Categorias</h2>
          <button className={styles.btnPrimary} onClick={openCreateCategory}>
            <PlusCircle size={16} /> Nova Categoria
          </button>
        </header>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Superior</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td data-label="Nome">{c.name}</td>
                  <td data-label="Superior">{c.parent_id ? categories.find((p) => p.id === c.parent_id)?.name ?? "-" : "-"}</td>
                  <td className={styles.actions} data-label="Ações">
                    <button className={styles.btnDetail} onClick={() => openEditCategory(c)}>
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
      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} width={400}>
        <div className={styles.detail}>
          <h2>{categoryMode === "create" ? "Nova Categoria" : "Editar Categoria"}</h2>
          <form className={styles.form} onSubmit={saveCategory}>
            <FloatingLabelInput id="cat-name" label="Nome" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
            <label className={styles.subText}><strong>Categoria superior</strong></label>
            <select value={categoryParent ?? ""} onChange={(e) => setCategoryParent(e.target.value || null)}>
              <option value="">Nenhuma</option>
              {categories.filter((c) => c.id !== currentCategory?.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className={styles.formActions}>
              {categoryMode === "edit" && (
                <Button bgColor="#ef4444" type="button" onClick={removeCategory}>Excluir</Button>
              )}
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========== BANNERS =========== */}
      <section className={styles.purchasesSection}>
        <header className={styles.header}>
          <h2>Banners</h2>
          <button className={styles.btnPrimary} onClick={openCreateBanner}>
            <PlusCircle size={16} /> Novo Banner
          </button>
        </header>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Ordem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td data-label="Título">{b.title}</td>
                  <td data-label="Ordem">{b.order}</td>
                  <td className={styles.actions} data-label="Ações">
                    <button className={styles.btnDetail} onClick={() => openEditBanner(b)}>
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Banner */}
      <Modal open={bannerModalOpen} onClose={() => setBannerModalOpen(false)} width={400}>
        <div className={styles.detail}>
          <h2>{bannerMode === "create" ? "Novo Banner" : "Editar Banner"}</h2>
          <form className={styles.form} onSubmit={saveBanner}>
            <FloatingLabelInput
              id="banner-title"
              label="Título"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              required
            />
            <FloatingLabelInput
              id="banner-order"
              label="Ordem"
              type="number"
              value={bannerOrder}
              onChange={(e) => setBannerOrder(parseInt(e.target.value, 10) || 0)}
              required
            />
            <FloatingLabelInput
              id="banner-link"
              label="Link (opcional)"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
            />

            {/* Preview do banner somente em edição */}
            {bannerMode === "edit" && currentBanner?.image_url && (
              <div className={styles.bannerPreviewContainer}>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${currentBanner.image_url}`}
                  alt={`Banner: ${currentBanner.title}`}
                  className={styles.bannerPreview}
                />
              </div>
            )}

            <label className={styles.subText}>
              <strong>Imagem</strong>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBannerImage(e.target.files?.[0] ?? null)}
            />

            <div className={styles.formActions}>
              {bannerMode === "edit" && (
                <Button bgColor="#ef4444" type="button" onClick={removeBanner}>
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
          <h2>Posts</h2>
          <button className={styles.btnPrimary} onClick={openCreatePost}>
            <PlusCircle size={16} /> Novo Post
          </button>
        </header>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(posts ?? []).map((p) => (
                <tr key={p.id}>
                  <td data-label="Título">{p.title}</td>
                  <td data-label="Autor">{p.author.name}</td>
                  <td className={styles.actions} data-label="Ações">
                    <button className={styles.btnDetail} onClick={() => openEditPost(p)}>
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          
          <span>Página {page}</span>
          
          <button
            disabled={!postPage || page * postPage.page_size >= postPage.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
      </section>

      {/* Modal Post */}
      <Modal open={postModalOpen} onClose={() => setPostModalOpen(false)} width={600}>
        <div className={styles.detail}>
          <h2>{postMode === "create" ? "Novo Post" : "Editar Post"}</h2>
          <form className={styles.form} onSubmit={savePost}>
            <FloatingLabelInput id="post-title" label="Título" value={postForm.title} onChange={(e) => updatePostField("title", e.target.value)} required />
            <FloatingLabelInput id="post-slug" label="Slug" value={postForm.slug} onChange={(e) => updatePostField("slug", e.target.value)} required />
            <label className={styles.subText}><strong>Autor</strong></label>
            <select value={postForm.author_id} onChange={(e) => updatePostField("author_id", e.target.value)} required>
              <option value="">Selecione…</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <label className={styles.subText}><strong>Categorias</strong></label>
            <select multiple value={postForm.category_ids} onChange={(e) => {
              const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
              updatePostField("category_ids", sel);
            }}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {/* ====== Blocos ====== */}
            <label className={styles.subText}><strong>Blocos do Post</strong></label>

            <div className={styles.blockList}>
              {postForm.blocks.map((blk, idx) => (
                <div key={idx} className={styles.blockCard}>
                  <div className={styles.blockHeader}>
                    <div>
                      <select
                        value={blk.type}
                        onChange={(e) => {
                          const newBlocks = [...postForm.blocks];
                          newBlocks[idx].type = e.target.value as BlockType;
                          newBlocks[idx].content = "";
                          updatePostField("blocks", newBlocks);
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
                          const newBlocks = [...postForm.blocks];
                          newBlocks[idx].position = parseInt(e.target.value, 10) || 1;
                          updatePostField("blocks", newBlocks);
                        }}
                        style={{ width: 60 }}
                        title="Posição"
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.blockRemoveBtn}
                      onClick={() => {
                        const newBlocks = postForm.blocks.filter((_, i) => i !== idx);
                        updatePostField("blocks", newBlocks);
                      }}
                    >
                      Remover
                    </button>
                  </div>

                  {/* corpo do bloco */}
                  {blk.type === "text" && (
                    <div className={styles.richTextEditor}>
                      <div className={styles.toolbar}>
                        <button
                          type="button"
                          onClick={() => applyFormat("bold")}
                          aria-label="Negrito"
                        >
                          <b>B</b>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("italic")}
                          aria-label="Itálico"
                        >
                          <i>I</i>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormat("fontSize", "4")}
                          aria-label="Aumentar fonte"
                        >
                          A+
                        </button>
                      </div>
                      <div
                        className={styles.editor}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: blk.content as string }}
                        onInput={(e) => {
                          const html = (e.target as HTMLDivElement).innerHTML;
                          const newBlocks = [...postForm.blocks];
                          newBlocks[idx].content = html;
                          updatePostField("blocks", newBlocks);
                        }}
                      />
                    </div>
                  )}

                  {blk.type === "image" && (
                    <>
                      {typeof blk.content === "string" && blk.content && (
                        <img
                          src={blk.content as string}
                          alt="Preview"
                          style={{ maxWidth: "200px", marginBottom: 8 }}
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // converte para base64 somente para preview; você pode
                          // fazer upload imediato se preferir
                          const reader = new FileReader();
                          reader.onload = () => {
                            const newBlocks = [...postForm.blocks];
                            newBlocks[idx].content = reader.result as string;
                            updatePostField("blocks", newBlocks);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </>
                  )}
                </div>
              ))}

              {/* barra de adição de bloco */}
              <div className={styles.addBlockBar}>
                <button
                  type="button"
                  className={styles.blockTypeBtn}
                  onClick={() =>
                    updatePostField("blocks", [...postForm.blocks, emptyTextBlock()])
                  }
                >
                  <AlignLeft size={16} /> texto
                </button>

                <button
                  type="button"
                  className={styles.blockTypeBtn}
                  onClick={() =>
                    updatePostField("blocks", [...postForm.blocks, emptyImageBlock()])
                  }
                >
                  <Image size={16} /> imagem
                </button>
              </div>

            </div>

            <div className={styles.formActions}>
              {postMode === "edit" && (
                <Button bgColor="#ef4444" type="button" onClick={removePost}>Excluir</Button>
              )}
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
