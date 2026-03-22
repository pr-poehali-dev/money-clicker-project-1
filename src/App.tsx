import { useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import ClickerPage from '@/pages/ClickerPage';
import StatsPage from '@/pages/StatsPage';
import WithdrawPage from '@/pages/WithdrawPage';
import HistoryPage from '@/pages/HistoryPage';
import ProfilePage from '@/pages/ProfilePage';

type TabId = 'clicker' | 'stats' | 'withdraw' | 'history' | 'profile';

interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  date: Date;
  description: string;
  bank?: string;
  status?: 'pending' | 'completed' | 'failed';
}

interface UserProfile {
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('clicker');
  const [balance, setBalance] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [sessionEarned, setSessionEarned] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Пользователь',
    email: '',
    phone: '',
    avatar: '',
    joinDate: new Date(),
  });

  const handleEarn = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
    setTotalClicks(prev => prev + 1);
    setSessionEarned(prev => prev + amount);
  }, []);

  const handleWithdraw = useCallback((amount: number, bank: string, _account: string) => {
    setBalance(prev => prev - amount);
    setTransactions(prev => [
      ...prev,
      {
        id: `w_${Date.now()}`,
        type: 'withdraw',
        amount,
        date: new Date(),
        description: `Вывод на ${bank}`,
        bank,
        status: 'pending',
      }
    ]);
  }, []);

  const formatBalance = (v: number) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  // Track earned session to history on first withdraw
  const handleWithdrawWithHistory = useCallback((amount: number, bank: string, account: string) => {
    if (sessionEarned > 0 && !transactions.some(t => t.type === 'earn')) {
      setTransactions(prev => [
        { id: `e_${Date.now() - 1}`, type: 'earn', amount: sessionEarned, date: new Date(), description: 'Заработок с кликов' },
        ...prev,
      ]);
    }
    handleWithdraw(amount, bank, account);
  }, [sessionEarned, transactions, handleWithdraw]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Top withdrawal banner */}
      <div
        className="w-full px-4 py-2.5 flex items-center justify-center gap-3 relative overflow-hidden cursor-pointer select-none"
        style={{
          background: 'linear-gradient(90deg, hsl(36 80% 18%), hsl(42 88% 28%), hsl(48 92% 35%), hsl(42 88% 28%), hsl(36 80% 18%))',
        }}
        onClick={() => setActiveTab('withdraw')}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)',
          }}
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
      <header
        className="px-4 py-3 flex items-center justify-between sticky top-0 z-40"
        style={{
          background: 'hsl(220 20% 7% / 0.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))' }}
          >
            <Icon name="Coins" size={16} className="text-background" />
          </div>
          <span className="font-oswald font-bold text-lg tracking-wide gold-text">КликПрибыль</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            style={{ background: 'hsl(var(--secondary))' }}
            onClick={() => setActiveTab('stats')}
          >
            <Icon name="Wallet" size={13} className="gold-text" />
            <span className="font-oswald text-sm font-semibold gold-text">{formatBalance(balance)} ₽</span>
          </div>
          <button
            onClick={() => setActiveTab('withdraw')}
            className="px-3 py-1.5 rounded-lg font-oswald text-sm font-bold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))',
              color: 'hsl(220 20% 7%)',
            }}
          >
            Вывести
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24 max-w-lg mx-auto w-full">
        {activeTab === 'clicker' && (
          <ClickerPage
            balance={balance}
            onEarn={handleEarn}
            totalClicks={totalClicks}
            sessionEarned={sessionEarned}
          />
        )}
        {activeTab === 'stats' && (
          <StatsPage
            balance={balance}
            totalClicks={totalClicks}
            sessionEarned={sessionEarned}
            transactions={transactions}
          />
        )}
        {activeTab === 'withdraw' && (
          <WithdrawPage
            balance={balance}
            onWithdraw={handleWithdrawWithHistory}
          />
        )}
        {activeTab === 'history' && (
          <HistoryPage transactions={transactions} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage
            profile={profile}
            onUpdateProfile={setProfile}
            balance={balance}
            totalClicks={totalClicks}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'hsl(220 18% 8% / 0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center justify-around py-1 max-w-lg mx-auto">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const isWithdraw = tab.id === 'withdraw';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
                  isWithdraw
                    ? 'relative -top-3'
                    : isActive
                    ? 'opacity-100'
                    : 'opacity-45 hover:opacity-70'
                }`}
              >
                {isWithdraw ? (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))',
                      boxShadow: '0 4px 20px hsl(43 90% 55% / 0.5)',
                    }}
                  >
                    <Icon name={tab.icon} size={22} className="text-background" />
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive ? 'bg-yellow-500/15' : ''
                    }`}
                  >
                    <Icon
                      name={tab.icon}
                      size={20}
                      className={isActive ? 'gold-text' : 'text-muted-foreground'}
                    />
                  </div>
                )}
                <span
                  className={`text-xs font-golos font-medium transition-colors duration-200 ${
                    isWithdraw
                      ? 'gold-text'
                      : isActive
                      ? 'gold-text'
                      : 'text-muted-foreground'
                  }`}
                >
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
