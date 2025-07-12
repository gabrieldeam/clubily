'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Ensure Image is imported
import { motion } from 'framer-motion';
import Header from '@/components/Header/Header';
import { useAuth } from '@/context/AuthContext';
import {
  getAllMilestonesStatus,
  getNextMilestone,
  getMyMilestones,
} from '@/services/milestoneService';
import type {
  MilestoneStatusRead,
  NextMilestoneRead,
  UserMilestoneRead,
} from '@/types/milestone';
import styles from './page.module.css';

// Ícones do Lucide (exemplos)
import { Gamepad, Trophy, Star, Zap, Award } from 'lucide-react';

export default function MilestonesPage() {
  const router = useRouter();
  const { user } = useAuth();

  /* ---------------- State ---------------- */
  const [milestones, setMilestones] = useState<MilestoneStatusRead[]>([]);
  const [nextData, setNextData] = useState<NextMilestoneRead | null>(null);
  const [myMilestones, setMyMilestones] = useState<UserMilestoneRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_API_BASE_URL ?? '';

  /* ---------------- Fetch ---------------- */
  useEffect(() => {
    async function fetchAll() {
      try {
        const [allRes, nextRes, myRes] = await Promise.all([
          getAllMilestonesStatus(),
          getNextMilestone().catch(() => null),
          getMyMilestones(),
        ]);

        setMilestones(allRes.data.sort((a, b) => a.points - b.points));
        setNextData(nextRes?.data ?? null);
        setMyMilestones(
          myRes.data.sort(
            (a, b) =>
              new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime(),
          ),
        );
      } catch (e) {
        console.error(e);
        setError('Erro ao carregar marcos.');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  /* -------------- Derivados --------------- */
  const userPoints = useMemo(() => {
    if (nextData) return nextData.user_points;
    const last = milestones
      .filter((m) => m.achieved)
      .sort((a, b) => b.points - a.points)
      .at(0);
    return last?.points ?? 0;
  }, [nextData, milestones]);

  const { lower, upper } = useMemo(() => {
    if (!nextData) {
      const last = milestones
        .filter((m) => m.achieved)
        .sort((a, b) => b.points - a.points)
        .at(0);
      const val = last?.points ?? 0;
      return { lower: val, upper: val };
    }
    const last = milestones
      .filter((m) => m.achieved)
      .sort((a, b) => a.points - b.points)
      .at(-1);
    return { lower: last?.points ?? 0, upper: nextData.points };
  }, [nextData, milestones]);

  const progressPct = useMemo(() => {
    if (upper === lower) return 100;
    return Math.max(
      0,
      Math.min(100, ((userPoints - lower) / (upper - lower)) * 100),
    );
  }, [userPoints, lower, upper]);

  const progressToNextPct = useMemo(() => {
    if (!nextData) return 100;
    return Math.max(0, Math.min(100, (userPoints / nextData.points) * 100));
  }, [userPoints, nextData]);

  const maxPoints = milestones.at(-1)?.points ?? upper;
  const progressTotalPct = useMemo(() => {
    if (!maxPoints) return 0;
    return Math.max(0, Math.min(100, (userPoints / maxPoints) * 100));
  }, [userPoints, maxPoints]);

  /* -------------- UI States -------------- */
  if (loading) return <div className={styles.loader}>CARREGANDO...</div>;
  if (error) return <div className={styles.loader}>{error}</div>;

  /* ---------------- Render ---------------- */
  return (
    <div className={styles.retroBackground}>
      <div className={styles.scanlines}></div>
      <div className={styles.gridOverlay}></div>

      <Header
        onSearch={(q) => router.push(`/search?name=${encodeURIComponent(q)}`)}
      />

      {/* ---------- HERO ---------- */}
      <section className={styles.hero}>
        <div className={styles.heroHeader}>
          <div className={styles.arcadeTitle}>
            <Zap size={24} className={styles.iconPulse} />
            <h1 className={styles.heroTitle}>ARCADE ACHIEVEMENTS</h1>
            <Zap size={24} className={styles.iconPulse} />
          </div>

          <div className={styles.playerInfo}>
            <span className={styles.playerTag}>PLAYER:</span>
            <span className={styles.playerName}>{user?.name || 'GUEST'}</span>
          </div>
        </div>

        <div className={styles.scoreDisplay}>
          {/* <Trophy className={styles.trophyIcon} /> */}
          <p className={styles.points}>
            <strong>{userPoints}</strong>Pts
          </p>
          {/* <Trophy className={styles.trophyIcon} /> */}
        </div>

        {/* ---- BARRAS VERTICAIS ---- */}
        <div className={styles.barsContainer}>
          <div className={styles.barLabel}>LEVEL PROGRESS</div>
          <div className={styles.barsGroup}>
            
            <div className={styles.barsGroupSection}>
              <span className={styles.barLabel}>NEXT</span>
              <div className={styles.verticalBar}>
                  <div className={styles.barOutline}></div>
                  <motion.div
                    className={`${styles.barFill} ${styles.barFillNext}`}
                    initial={{ height: '0%' }}
                    animate={{ height: `${progressToNextPct}%` }}
                    transition={{ duration: 1 }}
                  />
              </div>
            </div>

            <div className={styles.barsGroupSection}>
                <span className={styles.barLabel}>FINAL</span>
              <div className={styles.verticalBar}>
                <div className={styles.barOutline}></div>
                <motion.div
                  className={`${styles.barFill} ${styles.barFillTotal}`}
                  initial={{ height: '0%' }}
                  animate={{ height: `${progressTotalPct}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* ---- BARRA HORIZONTAL ---- */}
        <div className={styles.progressWrapper}>
          <div className={styles.progressLabels}>
            <span className={styles.progressMin}>{lower}PTS</span>
            <span className={styles.progressMax}>{upper}PTS</span>
          </div>

          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressBar}
              initial={{ width: '0%' }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div
            className={styles.progressMarker}
            style={{ left: `${progressPct}%` }}
          >
            <div className={styles.markerTriangle}></div>
            <span className={styles.progressUser}>
              {userPoints}PTS
            </span>
          </div>
        </div>

        {nextData && (
          <p className={styles.progressLabel}>
            <span className={styles.highlight}>FALTAM {nextData.remaining} PTS</span> PARA{' '}
            <span className={styles.highlight}>{nextData.title}</span>
          </p>
        )}
      </section>

      {/* ---------- TIMELINE ---------- */}
      <section className={styles.timelineWrapper}>
        <div className={styles.sectionHeader}>
          <Gamepad size={24} />
          <h2>LEVEL MAP</h2>
          <Gamepad size={24} />
        </div>

        <div className={styles.timelineContainer}>
          <div className={styles.timelineTrack}></div>
          <ul className={styles.timeline}>
            {milestones.map((m) => (
              <li key={m.id} className={styles.milestone}>
                <div
                  className={`${styles.badge} ${
                    m.achieved
                      ? styles.badgeAchieved
                      : nextData?.milestone_id === m.id
                      ? styles.badgeNext
                      : styles.badgePending
                  }`}
                >
                  {/* Conditional rendering for image or icon in the timeline */}
                  {m.image_url ? (
                    <Image
                      src={`${baseUrl}${m.image_url}`}
                      alt={m.title}
                      width={48} // Adjust size as needed
                      height={48} // Adjust size as needed
                      className={styles.milestoneImage} // New class for styling
                    />
                  ) : m.achieved ? (
                    <Award size={32} className={styles.badgeIcon} />
                  ) : nextData?.milestone_id === m.id ? (
                    <Star size={32} className={styles.badgeIcon} />
                  ) : (
                    <div className={styles.lockedIcon}></div>
                  )}
                </div>
                <p className={styles.title}>{m.title}</p>
                <p className={styles.pointsTag}>{m.points} PTS</p>
                {m.achieved && m.achieved_at && (
                  <p className={styles.achievedAt}>
                    {new Date(m.achieved_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- ACHIEVEMENTS LIST ---------- */}
      {!!myMilestones.length && (
        <section className={styles.achievementsSection}>
          <div className={styles.sectionHeader}>
            <Trophy size={24} />
            <h2>CONQUISTAS DESBLOQUEADAS</h2>
            <Trophy size={24} />
          </div>

          <div className={styles.achievementsGrid}>
            {myMilestones.map(({ milestone, achieved_at }) => (
              <motion.div
                key={milestone.id}
                className={styles.achievementCard}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.cardGlow}></div>
                <div className={styles.cardBadge}>
                  {/* Conditional rendering for image or icon in achievement cards */}
                  {milestone.image_url ? (
                    <Image
                      src={`${baseUrl}${milestone.image_url}`}
                      alt={milestone.title}
                      width={48}
                      height={48}
                      className={styles.cardIcon}
                    />
                  ) : (
                    <Award size={48} className={styles.cardIcon} />
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3>{milestone.title}</h3>
                  <p className={styles.cardDesc}>{milestone.description}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardPoints}>{milestone.points} PTS</span>
                    <span className={styles.cardDate}>
                      {new Date(achieved_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}