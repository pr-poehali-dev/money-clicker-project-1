import { useState, useCallback, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import ClickerPage from '@/pages/ClickerPage';
import StatsPage from '@/pages/StatsPage';
import WithdrawPage from '@/pages/WithdrawPage';
import HistoryPage from '@/pages/HistoryPage';
import ProfilePage from '@/pages/ProfilePage';
import { fetchUserData, earnCoins, withdrawFunds, updateProfile, ApiTransaction } from '@/lib/api';

type TabId = 'clicker' | 'stats' | 'withdraw' | 'history' | 'profile';

export interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  date: Date;
  description: string;
  bank?: string;
  status?: 'pending' | 'completed' | 'failed';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: Date;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'clicker', label: 'Кликер', icon: 'Coins' },
  { id: 'stats', label: 'Баланс', icon: 'BarChart2' },
  { id: 'withdraw', label: 'Вывод', icon: 'ArrowUpRight' },
  { id: 'history', label: 'История', icon: 'ClipboardList' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
];

const EARN_BATCH_MS = 2000;

function mapTx(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount,
    date: new Date(t.created_at),
    description: t.description,
    bank: t.bank,
    status: t.status,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('clicker');
  const [balance, setBalance] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [sessionEarned, setSessionEarned] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfileState] = useState<UserProfile>({
    name: 'Пользователь',
    email: '',
    phone: '',
    avatar: '',
    joinDate: new Date(),
  });

  const pendingClicks = useRef(0);
  const pendingAmount = useRef(0);
  const earnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchUserData()
      .then(data => {
        setBalance(data.balance);
        setTotalClicks(data.total_clicks);
        setProfileState({
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatar: '',
          joinDate: new Date(data.join_date),
        });
        setTransactions(data.transactions.map(mapTx));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const flushEarn = useCallback(() => {
    if (pendingClicks.current <= 0) return;
    const clicks = pendingClicks.current;
    const amount = pendingAmount.current;
    pendingClicks.current = 0;
    pendingAmount.current = 0;
    earnCoins(clicks, amount)
      .then(res => setBalance(res.balance))
      .catch(() => {});
  }, []);

  const handleEarn = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
    setTotalClicks(prev => prev + 1);
    setSessionEarned(prev => prev + amount);
    pendingClicks.current += 1;
    pendingAmount.current += amount;
    if (earnTimer.current) clearTimeout(earnTimer.current);
    earnTimer.current = setTimeout(flushEarn, EARN_BATCH_MS);
  }, [flushEarn]);

  const handleWithdraw = useCallback(async (amount: number, bank: string, account: string): Promise<void> => {
    setBalance(prev => prev - amount);
    const tempId = `tmp_${Date.now()}`;
    setTransactions(prev => [{
      id: tempId, type: 'withdraw', amount, date: new Date(),
      description: `Вывод`, bank, status: 'pending',
    }, ...prev]);

    try {
      const res = await withdrawFunds(amount, bank, account);
      setBalance(res.balance);
      setTransactions(prev => prev.map(t => t.id === tempId ? {
        id: res.tx_id, type: 'withdraw', amount: res.amount,
        date: new Date(), description: `Вывод на ${res.bank}`,
        bank, status: 'pending',
      } : t));
    } catch (err) {
      setBalance(prev => prev + amount);
      setTransactions(prev => prev.filter(t => t.id !== tempId));
      throw err;
    }
  }, []);

  const handleUpdateProfile = useCallback(async (p: UserProfile) => {
    setProfileState(p);
    await updateProfile({ name: p.name, email: p.email, phone: p.phone });
  }, []);

  const formatBalance = (v: number) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))' }}
          >
            <Icon name="Coins" size={32} className="text-background" />
          </div>
          <p className="font-oswald text-xl gold-text">КликПрибыль</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'hsl(var(--gold))', animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Top withdrawal banner */}
      <div
        className="w-full px-4 py-2.5 flex items-center justify-center gap-3 relative overflow-hidden cursor-pointer select-none"
        style={{ background: 'linear-gradient(90deg, hsl(36 80% 18%), hsl(42 88% 28%), hsl(48 92% 35%), hsl(42 88% 28%), hsl(36 80% 18%))' }}
        onClick={() => setActiveTab('withdraw')}
      >
        <div className="absolute inset-0 opacity-15"
          style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)' }}
        />
        <Icon name="Banknote" size={15} className="text-yellow-300 flex-shrink-0 relative z-10" />
        <span className="banner-shine font-oswald font-bold text-sm uppercase tracking-widest relative z-10">
          Вывод средств на счета банков России
        </span>
        <span className="text-yellow-300/70 text-xs font-golos flex items-center gap-1 flex-shrink-0 relative z-10">
          Сбер · ВТБ · РСХБ · ЮMoney
          <Icon name="ChevronRight" size={12} className="text-yellow-300/70" />
        </span>
      </div>

      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 z-40"
        style={{ background: 'hsl(220 20% 7% / 0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))' }}>
            <Icon name="Coins" size={16} className="text-background" />
          </div>
          <span className="font-oswald font-bold text-lg tracking-wide gold-text">КликПрибыль</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            style={{ background: 'hsl(var(--secondary))' }}
            onClick={() => setActiveTab('stats')}>
            <Icon name="Wallet" size={13} className="gold-text" />
            <span className="font-oswald text-sm font-semibold gold-text">{formatBalance(balance)} ₽</span>
          </div>
          <button onClick={() => setActiveTab('withdraw')}
            className="px-3 py-1.5 rounded-lg font-oswald text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))', color: 'hsl(220 20% 7%)' }}>
            Вывести
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24 max-w-lg mx-auto w-full">
        <div key={activeTab} className="animate-tab-enter">
        {activeTab === 'clicker' && (
          <ClickerPage balance={balance} onEarn={handleEarn} totalClicks={totalClicks} sessionEarned={sessionEarned} />
        )}
        {activeTab === 'stats' && (
          <StatsPage balance={balance} totalClicks={totalClicks} sessionEarned={sessionEarned} transactions={transactions} />
        )}
        {activeTab === 'withdraw' && (
          <WithdrawPage balance={balance} onWithdraw={handleWithdraw} />
        )}
        {activeTab === 'history' && <HistoryPage transactions={transactions} />}
        {activeTab === 'profile' && (
          <ProfilePage profile={profile} onUpdateProfile={handleUpdateProfile} balance={balance} totalClicks={totalClicks} />
        )}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'hsl(220 18% 8% / 0.98)', backdropFilter: 'blur(16px)', borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-around py-1 max-w-lg mx-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const isWithdraw = tab.id === 'withdraw';
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${isWithdraw ? 'relative -top-3' : isActive ? 'opacity-100' : 'opacity-45 hover:opacity-70'}`}>
                {isWithdraw ? (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))', boxShadow: '0 4px 20px hsl(43 90% 55% / 0.5)' }}>
                    <Icon name={tab.icon} size={22} className="text-background" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-yellow-500/15' : ''}`}>
                    <Icon name={tab.icon} size={20} className={isActive ? 'gold-text' : 'text-muted-foreground'} />
                  </div>
                )}
                <span className={`text-xs font-golos font-medium transition-colors duration-200 ${isWithdraw || isActive ? 'gold-text' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}