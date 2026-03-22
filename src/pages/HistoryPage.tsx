import Icon from '@/components/ui/icon';

interface Transaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  date: Date;
  description: string;
  bank?: string;
  status?: 'pending' | 'completed' | 'failed';
}

interface HistoryPageProps {
  transactions: Transaction[];
}

const BANK_NAMES: Record<string, string> = {
  sber: 'Сбербанк',
  vtb: 'ВТБ',
  rshb: 'Россельхозбанк',
  ymoney: 'ЮMoney',
};

const STATUS_MAP = {
  pending: { label: 'Обрабатывается', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  completed: { label: 'Завершено', color: 'text-green-400', bg: 'bg-green-400/10' },
  failed: { label: 'Ошибка', color: 'text-red-400', bg: 'bg-red-400/10' },
};

export default function HistoryPage({ transactions }: HistoryPageProps) {
  const formatBalance = (amount: number) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const totalEarn = transactions.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0);
  const totalWithdraw = transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="px-4 py-6 animate-fade-in">
      <h2 className="font-oswald text-2xl font-bold mb-2 text-foreground uppercase tracking-wide">
        История операций
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-glass rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="ArrowDownLeft" size={14} className="text-green-400" />
            <p className="text-xs text-muted-foreground">Начислено</p>
          </div>
          <p className="font-oswald text-lg font-bold text-green-400">+{formatBalance(totalEarn)} ₽</p>
        </div>
        <div className="card-glass rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="ArrowUpRight" size={14} className="text-blue-400" />
            <p className="text-xs text-muted-foreground">Выведено</p>
          </div>
          <p className="font-oswald text-lg font-bold text-blue-400">−{formatBalance(totalWithdraw)} ₽</p>
        </div>
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Icon name="ClipboardList" size={28} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold mb-1">История пуста</p>
          <p className="text-sm text-muted-foreground">Начните кликать на монету,<br />чтобы здесь появились записи</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...transactions].reverse().map((t, i) => {
            const isEarn = t.type === 'earn';
            const statusInfo = t.status ? STATUS_MAP[t.status] : STATUS_MAP.completed;

            return (
              <div
                key={t.id}
                className="card-glass rounded-xl p-4 flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isEarn ? 'bg-green-500/15' : 'bg-blue-500/15'}`}>
                  <Icon
                    name={isEarn ? 'Coins' : 'ArrowUpRight'}
                    size={18}
                    className={isEarn ? 'text-green-400' : 'text-blue-400'}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {isEarn ? 'Заработок с кликов' : `Вывод → ${BANK_NAMES[t.bank || ''] || t.bank || 'Банк'}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                    {!isEarn && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className={`font-oswald text-base font-bold ${isEarn ? 'text-green-400' : 'text-foreground'}`}>
                    {isEarn ? '+' : '−'}{formatBalance(t.amount)} ₽
                  </p>
                  {!isEarn && (
                    <p className="text-xs text-muted-foreground">
                      −{formatBalance(t.amount * 0.01)} ком.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
