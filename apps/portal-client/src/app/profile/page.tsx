// src/app/profile/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/Loading/Loading';
import { listAddresses, deleteAddress } from '@/services/addressService';
import {
  getMyCompanies,
  requestUserDeletion,
  getMyReferralCode,
  createMyReferralCode 
} from '@/services/userService';
import type { AddressRead } from '@/types/address';
import type { CompanyRead } from '@/types/company';
import Header from '@/components/Header/Header';
import Modal from '@/components/Modal/Modal';
import EditUserForm from '@/components/EditUserForm/EditUserForm';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [openEdit, setOpenEdit] = useState(false);

  /* ---------------- endereços ---------------- */
  const [addresses, setAddresses] = useState<AddressRead[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);

  /* ---------------- empresas ----------------- */
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<CompanyRead[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingComp, setLoadingComp] = useState(true);

  /* ---------------- delete conta ------------- */
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg]       = useState<string|null>(null);

  /* ---------------- referral code ---------------- */
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loadingRef, setLoadingRef] = useState(true);
  const [creatingRef, setCreatingRef] = useState(false);

  useEffect(() => {
    // Ao montar, tenta buscar o código
    getMyReferralCode()
      .then(res => setReferralCode(res.data.referral_code))
      .catch(err => {
        // 404 significa “ainda não gerou”
        if (err.response?.status !== 404) {
          console.error('Erro ao buscar referral code', err);
        }
      })
      .finally(() => setLoadingRef(false));
  }, []);

  /* ---------------- helpers ------------------ */
  const displayName = useMemo(() => {
    const name = user?.name ?? '';
    const MAX  = 30;
    return name.length > MAX ? name.slice(0, MAX) + '…' : name;
  }, [user?.name]);

  /* ---------------- redirects ---------------- */
  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  /* ---------------- addresses ---------------- */
  useEffect(() => {
    listAddresses()
      .then(res => setAddresses(res.data))
      .finally(() => setLoadingAddr(false));
  }, []);

  /* ---------------- companies ---------------- */
  useEffect(() => {
    setLoadingComp(true);
    getMyCompanies(page, 10)
      .then(res => {
        setCompanies(res.data);
        setHasMore(res.data.length === 10);
      })
      .finally(() => setLoadingComp(false));
  }, [page]);

  /* ---------------- handlers ----------------- */
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return;
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Falha ao excluir endereço.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);            // 1º clique – pede confirmação
      return;
    }
    try {
      await requestUserDeletion();       // 2º clique – faz requisição
      setDeleteMsg(
        'Solicitação enviada! Em breve você receberá um e-mail com instruções.'
      );
    } catch {
      setDeleteMsg(
        'Não foi possível solicitar a exclusão. Por favor, envie um e-mail através do botão “E-mail” na seção de Ajuda.'
      );
    } finally {
      setDeleteConfirm(false);
    }
  };

  const handleCreateReferral = async () => {
    setCreatingRef(true);
    try {
      const res = await createMyReferralCode();
      setReferralCode(res.data.referral_code);
    } catch (err) {
      console.error('Erro ao criar referral code', err);
      alert('Falha ao gerar código.');
    } finally {
      setCreatingRef(false);
    }
  };

  const handleCopyReferral = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    alert('Código copiado!');
  };

  /* ---------------- loading guard ------------ */
  if (loading) return <div className={styles.container}><Loading/></div>;
  if (!user)    return null;

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* ---------------- render -------------------- */
  return (
    <>
    <Header onSearch={q => router.push(`/search?name=${encodeURIComponent(q)}`)} />
    <div className={styles.container}>
      <main className={styles.gridContainer}>
        {/* ---------- PERFIL ---------- */}
        <div className={styles.gridItem}>
          <div className={styles.profileHeader}>
            <p className={styles.userName} style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {displayName}
            </p>
            <div className={styles.editIcon} onClick={() => setOpenEdit(true)}>
              <Image src="/edit.svg" alt="Editar perfil" width={24} height={24} />
            </div>
          </div>
        </div>

        {/* ---------- CONTATO ---------- */}
        <div className={styles.gridItem}>
          <div className={styles.item}><p>Telefone</p><span>{user.phone}</span></div>
          <div className={styles.item}><p>E-mail</p><span>{user.email}</span></div>
          <div className={styles.item}><p>CPF</p><span>{user.cpf}</span></div>
        </div>

        {/* ---------- LINKS ---------- */}
        <div className={styles.gridItem}>
          {['Sobre nós', 'Política de privacidade', 'Termo de uso'].map(t => (
            <Link key={t} href="/" className={styles.itemLink}>
              <p>{t}</p><Image src="/seta.svg" alt="" width={22} height={22} />
            </Link>
          ))}
        </div>

        {/* ---------- AJUDA / SAIR / DELETAR ---------- */}
        <div className={styles.subGrid}>
          <div className={styles.gridItem}>
            <div className={styles.item}>
              <p>Ajuda</p>
              <div className={styles.gridDivHelp}>
                <button type="button" className={styles.buttomHelp}>Chat</button>
                <a
                  href="mailto:support@clubi.ly"
                  className={styles.buttomHelp}
                  style={{ textDecoration: 'none' }}
                >
                  E-mail
                </a>
              </div>
            </div>
          </div>

          <div className={styles.gridDiv}>
            <div className={styles.gridItem}>
              {deleteMsg ? (
                <p className={styles.deleteMsg}>{deleteMsg}</p>
              ) : (
                <button
                  className={styles.itemDelete}
                  onClick={handleDeleteAccount}
                >
                  {deleteConfirm ? 'Confirmar exclusão da conta' : 'Deletar conta'}
                  <Image src="/redSeta.svg" alt="" width={22} height={22} />
                </button>
              )}
            </div>

            <div className={styles.gridItem}>
              <div className={styles.itemLink} onClick={handleLogout}>
                <p>Sair</p><Image src="/seta.svg" alt="" width={22} height={22} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- ENDEREÇOS ---------- */}
      <div className={styles.gridItem}>
        <h4>Endereços</h4>
        {loadingAddr ? (
          <p className={styles.loading}><Loading/></p>
        ) : addresses.length === 0 ? (
          <p className={styles.loading}>Nenhum endereço cadastrado.</p>
        ) : (
          <ul className={styles.addressList}>
            {addresses.map(addr => (
              <li key={addr.id} className={styles.addressItem}>
                <div className={styles.addressInfo}>
                  {/* 1) Rua e número */}
                  <p>
                    <strong>Rua</strong> {addr.street}, <strong>Nº</strong> {addr.number}
                  </p>

                  {/* 2) Bairro e complemento (se houver) */}
                  <p>
                    <strong>Bairro</strong> {addr.neighborhood}
                    {addr.complement && (
                      <>
                        {' '}
                        – <strong>Complemento</strong> {addr.complement}
                      </>
                    )}
                  </p>

                  {/* 3) Cidade, estado e CEP */}
                  <p>
                    <strong>Cidade</strong> {addr.city} – <strong>Estado</strong> {addr.state},{' '}
                    <strong>CEP</strong> {addr.postal_code}
                  </p>                   
                </div>

                <button
                  className={styles.button}
                  onClick={() => handleDeleteAddress(addr.id)}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------- MINHAS EMPRESAS ---------- */}
      <div className={styles.gridSubItem}>
        <h4>Empresas que têm seu cadastro</h4>

        {loadingComp ? (
          <p className={styles.loading}><Loading/></p>
        ) : companies.length === 0 ? (
          <p className={styles.loading}>Nenhuma empresa associada.</p>
        ) : (
          <ul className={styles.list}>
            {companies.map(c => (
              <li key={c.id}>
                <Link href={`/companies/${c.id}`} className={styles.itemcompanies}>
                  <div className={styles.companyInfo}>
                    {c.logo_url ? (
                      <Image
                        src={`${baseUrl}${c.logo_url}`}
                        alt={c.name}
                        width={60}
                        height={60}
                        className={styles.logo}
                      />
                    ) : (
                      <div className={styles.logo}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}                    
                    <div>
                      <h2 className={styles.name}>{c.name}</h2>
                      {c.description && <p className={styles.companyDesc}>{c.description}</p>}
                    </div>
                  </div>
                  <span className={styles.tag}>Ver empresa</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.pagination}>
          <button disabled={page === 1}      onClick={()=>setPage(p=>p-1)}>Anterior</button>
          <span>Página {page}</span>
          <button disabled={!hasMore}        onClick={()=>setPage(p=>p+1)}>Próxima</button>
        </div>
      </div>

      {/* ---------- CÓDIGO DE AFILIADO ---------- */}
      <div className={`${styles.gridSubItemReferral} ${styles.lastGridSubItem}`}>
        <h4 className={styles.title}>Código de Afiliado</h4>

        <div className={styles.affiliateWrapper}>
          {loadingRef ? (
            <p className={styles.loading}><Loading/></p>
          ) : referralCode ? (
            /* ---------- código JÁ gerado ---------- */
            <div className={styles.affiliateContent}>
              <p className={styles.description}>
                Entregue este código ao lojista e garanta <strong>3 % de cashback vitalício</strong> sobre todas as compras que ele fizer.
              </p>

              <div className={styles.inputGroup}>
                <input
                  readOnly
                  className={styles.referralInput}
                  value={referralCode}
                  onClick={handleCopyReferral}
                />
                <button
                  className={styles.copyButton}
                  onClick={handleCopyReferral}
                >
                  Copiar
                </button>
              </div>

              <div className={styles.linkWrapper}>
                <Link href={`/affiliate/${referralCode}`} className={styles.copyButton}>
                  Ver página de afiliado
                </Link>
              </div>
            </div>
          ) : (
            /* ---------- AINDA não gerado ---------- */
            <div className={styles.affiliateContent}>
              <h5 className={styles.headline}>Ganhe dinheiro em 3 passos simples</h5>

              <div className={styles.stepContent}>
                <div className={styles.stepList}>
                  <div><strong>Gerar</strong> seu código agora.</div>
                  <div><strong>Entregar</strong> ao lojista.</div>
                  <div><strong>Receber 3 %</strong> de todas as compras dele.</div>
                </div>

                <div className={styles.benefitList}>
                  <div>Pronto em menos de 1 minuto</div>
                  <div>Sem gastos com anúncios</div>
                  <div>Comissões recorrentes todos os meses</div>
                </div>
              </div>

              <button
                className={styles.generateButton}
                onClick={handleCreateReferral}
                disabled={creatingRef}
              >
                {creatingRef ? 'Gerando…' : 'Quero meu código agora'}
              </button>
            </div>
          )}
        </div>
      </div>


      {/* ---------- MODAL EDITAR ---------- */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
        <EditUserForm
          onClose={() => setOpenEdit(false)}
          onSaved={() => { refreshUser(); setOpenEdit(false); }}
        />
      </Modal>
    </div>
    </>
  );
}
