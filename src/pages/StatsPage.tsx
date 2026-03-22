import { useMemo } from 'react';
import Icon from '@/components/ui/icon';

interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  date: Date;
  description: string;
}

interface StatsPageProps {
  balance: number;
  totalClicks: number;
  sessionEarned: number;
  transactions: Transaction[];
}

export default function StatsPage({ balance, totalClicks, sessionEarned, transactions }: StatsPageProps) {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalEarned = transactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);

  // Generate chart data (last 7 days)
  const chartData = useMemo(() => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const today = new Date().getDay();
    const reordered = [...days.slice(today), ...days.slice(0, today)];

    // Simulate data based on session
    const baseEarn = sessionEarned / 7;
    return reordered.map((day, i) => ({
      day,
      value: Math.max(0, baseEarn + (Math.sin(i * 1.2) * baseEarn * 0.6) + (i === 6 ? sessionEarned * 0.4 : 0)),
    }));
  }, [sessionEarned]);

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  const statCards = [
    { label: 'Текущий баланс', value: `${formatBalance(balance)} ₽`, icon: 'Wallet', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Всего заработано', value: `${formatBalance(totalEarned + sessionEarned)} ₽`, icon: 'TrendingUp', color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Выведено', value: `${formatBalance(totalWithdrawn)} ₽`, icon: 'ArrowUpRight', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Всего кликов', value: totalClicks.toLocaleString('ru-RU'), icon: 'MousePointerClick', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="px-4 py-6 animate-fade-in">
      <h2 className="font-oswald text-2xl font-bold mb-6 text-foreground uppercase tracking-wide">
        Статистика & Аналитика
      </h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="card-glass rounded-xl p-4 animate-slide-up"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <Icon name={card.icon} fallback="CircleAlert" size={18} className={card.color} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-base font-bold font-oswald ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card-glass rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-oswald text-lg font-semibold text-foreground">График заработка</h3>
            <p className="text-xs text-muted-foreground">Последние 7 дней</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Icon name="TrendingUp" size={14} />
            <span>+{formatBalance(sessionEarned)} ₽ сегодня</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-32">
          {chartData.map((d, i) => {
            const heightPct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
            const isToday = i === 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 104 }}>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-700 bar-animated`}
                    style={{
                      height: `${heightPct}%`,
                      minHeight: heightPct > 0 ? 4 : 0,
                      background: isToday
                        ? 'linear-gradient(180deg, hsl(43 90% 65%), hsl(38 85% 45%))'
                        : 'linear-gradient(180deg, hsl(220 15% 30%), hsl(220 15% 22%))',
                      boxShadow: isToday ? '0 0 8px hsl(43 90% 55% / 0.4)' : 'none',
                    }}
                  />
                </div>
                <span className={`text-xs ${isToday ? 'gold-text font-semibold' : 'text-muted-foreground'}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="card-glass rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-oswald text-base font-semibold text-foreground">До следующего вывода</h3>
          <span className="text-xs text-muted-foreground">Мин. 100 ₽</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((balance / 100) * 100, 100)}%`,
              background: 'linear-gradient(90deg, hsl(38 85% 45%), hsl(43 90% 60%))',
              boxShadow: '0 0 8px hsl(43 90% 55% / 0.5)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="gold-text font-semibold">{formatBalance(balance)} ₽</span>
          <span className="text-muted-foreground">100.00 ₽</span>
        </div>
        {balance >= 100 && (
          <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
            <Icon name="CheckCircle" size={16} />
            <span>Доступен вывод!</span>
          </div>
        )}
      </div>
    </div>
  );
}