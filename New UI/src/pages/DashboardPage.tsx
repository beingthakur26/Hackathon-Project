import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FadeIn, StaggerChildren } from '../ui/animations/FadeIn';
import { CountUp } from '../ui/animations/CountUp';
import { BarChart3, Clock, FlaskConical, TrendingUp, Trash2, Search } from 'lucide-react';
import { historyService, type HistoryEntry } from '../data/services/history.service';
import { useAuthStore } from '../features/auth/useAuthStore';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, toxic: 0, safe: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await historyService.getList(0, 50);
        setHistory(response.entries);
        const total = response.total;
        const toxic = response.entries.filter(e => e.prediction === 1).length;
        const safe = response.entries.filter(e => e.prediction === 0).length;
        setStats({ total, toxic, safe });
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await historyService.delete(id);
      setHistory(prev => prev.filter(e => e.id !== id));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch {
      // Silently fail
    }
  };

  const CARDS = [
    { icon: <FlaskConical size={20} />, label: 'Total', value: stats.total, suffix: '' },
    { icon: <TrendingUp size={20} />, label: 'Toxic', value: stats.toxic, suffix: '' },
    { icon: <BarChart3 size={20} />, label: 'Safe', value: stats.safe, suffix: '' },
    { icon: <Clock size={20} />, label: 'Latency', value: 0.8, suffix: 's', decimals: 1 },
  ];

  return (
    <div className="dashboard-page">
      <div className="container">
        <FadeIn>
          <div className="page-header">
            <h1 className="page-title"><em>Dashboard</em>.</h1>
          </div>
        </FadeIn>

        <StaggerChildren className="dash-grid" staggerDelay={0.05}>
          {CARDS.map((card) => (
            <div key={card.label} className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__icon">{card.icon}</div>
                <span className="dash-card__label">{card.label}</span>
              </div>
              <div className="dash-card__value">
                <CountUp end={card.value} suffix={card.suffix} decimals={card.decimals ?? 0} />
              </div>
            </div>
          ))}
        </StaggerChildren>

        <FadeIn delay={0.2}>
          <div className="dash-history">
            <h3>Recent Records</h3>
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : !user ? (
              <div className="empty-content">
                <p><Link to="/login" className="dash-link">Sign in</Link> to view history.</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-content">
                <p>No records found. <Link to="/toxicity" className="dash-link">Analyze now</Link></p>
              </div>
            ) : (
              <div className="history-list">
                {history.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-item__info">
                      <span className={`history-item__badge ${entry.prediction === 1 ? 'is-toxic' : 'is-safe'}`}>
                        {entry.prediction === 1 ? 'Toxic' : 'Safe'}
                      </span>
                      <span className="history-item__smiles">{entry.smiles}</span>
                    </div>
                    <div className="history-item__actions">
                      <Link to={`/toxicity?smiles=${encodeURIComponent(entry.smiles)}`}>
                        <Search size={16} />
                      </Link>
                      <button onClick={() => handleDelete(entry.id)} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
};

export default DashboardPage;
