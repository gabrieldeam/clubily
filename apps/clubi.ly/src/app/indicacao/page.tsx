"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, DollarSign, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { listPublicCategories } from "@/services/categoryService";
import type { CategoryPage, CategoryRead } from "@/types/category";
import styles from "./page.module.css";

export default function ReferralProgramPage() {
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? "";

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const size = 20;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CategoryRead[]>([]);
  const [total, setTotal] = useState(0);
  const lastPage = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const fmtPct = (v?: number | null) =>
    v == null
      ? "Padrão 3%"
      : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v)}%`;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    listPublicCategories(page, size, q || undefined)
      .then((res) => {
        if (!isMounted) return;
        const data: CategoryPage = res.data;
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [page, q]);

  return (
    <main className={styles.container}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              Programa de indicação
            </h1>
            <p className={styles.subtitle}>
              Indique empresas, ajude-as a vender mais e receba comissões de forma simples e transparente.
            </p>
            <div className={styles.heroCtas}>
              <Link href="https://app.clubi.ly" className={styles.primaryBtn}>
                Criar meu código de indicação
              </Link>
              <Link href="#comissoes" className={styles.secondaryBtn} scroll>
                <span>Ver tabela de comissões</span>
                <ArrowRight size={18} />
              </Link>
            </div>
            <ul className={styles.points}>
              {[
                { icon: TrendingUp, text: "Comissões recorrentes sobre compras de créditos" },
                { icon: DollarSign, text: "Pagamentos direto na sua conta" },
                { icon: Users, text: "Sem limite de empresas indicadas" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i}><Icon size={18} /> {text}</li>
              ))}
            </ul>
          </div>
          <div className={styles.heroArt}>
            <Image
              src="/affiliate-code.png"
              alt="Painel de indicações"
              width={520}
              height={380}
              className={styles.heroImg}
              priority
            />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className={styles.howItWorks}>
        <h2>Como funciona</h2>
        <ol className={styles.steps}>
          {[
            { title: "Crie seu código", desc: "Na sua área do cliente, gere um código único para compartilhar." },
            { title: "Compartilhe com empresas", desc: "Envie para estabelecimentos que você recomenda e confia." },
            { title: "Ganhe comissão", desc: "Toda vez que a empresa comprar créditos, você recebe uma porcentagem." },
          ].map(({ title, desc }, idx) => (
            <li key={title} className={styles.stepCard}>
              <div className={styles.stepNumber}>{idx + 1}</div>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className={styles.disclaimer}>
          <CheckCircle size={18} />
          <p>
            A porcentagem utilizada é a da <strong>categoria principal</strong> definida pela empresa. <br />
            Se a empresa não tiver categoria principal (ou a categoria não tiver porcentagem definida),
            aplicamos a <strong>comissão padrão de 3%</strong>.
          </p>
        </div>
      </section>

      {/* Tabela de Comissões por Categoria */}
   {/* Comissões por Categoria - Cards */}
<section id="comissoes" className={styles.commissions}>
  <div className={styles.tableHeader}>
    <h2>Comissões por categoria</h2>
    <div className={styles.searchRow}>
      <input
        type="search"
        placeholder="Buscar categoria..."
        value={q}
        onChange={(e) => {
          setPage(1);
          setQ(e.target.value);
        }}
        aria-label="Buscar categoria"
      />
    </div>
  </div>

  <div
    className={styles.cardGrid}
    role="region"
    aria-live="polite"
    aria-busy={loading}
  >
    {loading
      ? Array.from({ length: 6 }).map((_, i) => (
          <div key={`sk-${i}`} className={styles.cardSkeleton}>
            <div className={styles.skelAvatar} />
            <div className={styles.skelLines}>
              <span className={styles.skelLine} style={{ width: "60%" }} />
              <span className={styles.skelLine} style={{ width: "40%" }} />
            </div>
          </div>
        ))
      : items.length === 0 ? (
        <p className={styles.emptyState}>
          Nenhuma categoria encontrada para “{q}”.
        </p>
      ) : (
        items.map((cat) => {
          const pct = cat.commission_percent ?? null;
          const pctClass =
            pct == null
              ? styles.pctNeutral
              : pct >= 6
              ? styles.pctHigh
              : pct >= 4
              ? styles.pctMid
              : styles.pctLow;

          return (
            <div key={cat.id} className={styles.cardItem}>
              <div className={styles.cardMedia}>
                {cat.image_url ? (
                  <Image
                    src={`${baseUrl}${cat.image_url}`}
                    alt={cat.name}
                    width={48}
                    height={48}
                    className={styles.iconImg}
                    loader={({ src }) => src}
                    unoptimized
                  />
                ) : (
                  <span className={styles.iconFallback}>
                    {cat.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <span className={styles.catName}>{cat.name}</span>
              </div>

              <span className={`${styles.badgePct} ${pctClass}`}>
                {fmtPct(cat.commission_percent)}
              </span>
            </div>
          );
        })
      )}
  </div>

  {/* Paginação */}
  {!loading && (
    <div className={styles.pagination}>
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
        Anterior
      </button>
      <span>{page} / {lastPage}</span>
      <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}>
        Próxima
      </button>
    </div>
  )}
</section>


      {/* CTA final */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <h2>Pronto para começar a indicar?</h2>
          <p>Crie seu código de indicação e comece a ganhar comissão hoje mesmo.</p>
          <Link href="https://app.clubi.ly" className={styles.ctaBtn}>
            Criar meu código
          </Link>
        </div>
      </section>
    </main>
  );
}
