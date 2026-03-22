import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface WithdrawPageProps {
  balance: number;
  onWithdraw: (amount: number, bank: string, account: string) => void;
}

const BANKS = [
  {
    id: 'sber',
    name: 'Сбербанк',
    shortName: 'Сбер',
    color: '#21A038',
    bgColor: 'rgba(33, 160, 56, 0.12)',
    borderColor: 'rgba(33, 160, 56, 0.3)',
    logo: '🟢',
    placeholder: '79XXXXXXXXX или номер счёта',
    hint: 'Номер карты, телефона или расчётного счёта'
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    shortName: 'ВТБ',
    color: '#009FDF',
    bgColor: 'rgba(0, 159, 223, 0.12)',
    borderColor: 'rgba(0, 159, 223, 0.3)',
    logo: '🔵',
    placeholder: 'Номер карты или счёта ВТБ',
    hint: '20-значный номер счёта или номер карты'
  },
  {
    id: 'rshb',
    name: 'Россельхозбанк',
    shortName: 'РСХБ',
    color: '#00843D',
    bgColor: 'rgba(0, 132, 61, 0.12)',
    borderColor: 'rgba(0, 132, 61, 0.3)',
    logo: '🌾',
    placeholder: 'Номер счёта Россельхозбанка',
    hint: '20-значный номер расчётного счёта'
  },
  {
    id: 'ymoney',
    name: 'ЮMoney',
    shortName: 'ЮMoney',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    logo: '💜',
    placeholder: 'Номер кошелька ЮMoney',
    hint: '15-значный номер кошелька ЮMoney'
  },
];

export default function WithdrawPage({ balance, onWithdraw }: WithdrawPageProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [success, setSuccess] = useState(false);

  const COMMISSION = 0.01;
  const MIN_WITHDRAW = 100;

  const amountNum = parseFloat(amount) || 0;
  const commission = amountNum * COMMISSION;
  const toReceive = amountNum - commission;
  const canWithdraw = selectedBank && amountNum >= MIN_WITHDRAW && amountNum <= balance && account.length >= 10;

  const bank = BANKS.find(b => b.id === selectedBank);

  const formatBalance = (v: number) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const handleWithdraw = () => {
    if (!canWithdraw || !selectedBank) return;
    onWithdraw(amountNum, selectedBank, account);
    setSuccess(true);
    setAmount('');
    setAccount('');
    setTimeout(() => setSuccess(false), 3500);
  };

  const setMaxAmount = () => {
    setAmount(Math.floor(balance).toString());
  };

  return (
    <div className="px-4 py-6 animate-fade-in">
      <h2 className="font-oswald text-2xl font-bold mb-2 text-foreground uppercase tracking-wide">
        Вывод средств
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Комиссия за вывод: <span className="gold-text font-semibold">1%</span>
      </p>

      {/* Balance available */}
      <div className="card-glass rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Доступно к выводу</p>
          <p className="font-oswald text-2xl font-bold gold-text">{formatBalance(balance)} ₽</p>
        </div>
        {balance < MIN_WITHDRAW && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Icon name="AlertCircle" size={14} />
            <span>Мин. {MIN_WITHDRAW} ₽</span>
          </div>
        )}
        {balance >= MIN_WITHDRAW && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Icon name="CheckCircle2" size={14} />
            <span>Вывод доступен</span>
          </div>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="CheckCircle" size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-400">Заявка на вывод создана!</p>
            <p className="text-xs text-muted-foreground">Средства поступят в течение 1-3 рабочих дней</p>
          </div>
        </div>
      )}

      {/* Bank selection */}
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-3 font-golos">Выберите банк</p>
        <div className="grid grid-cols-2 gap-2.5">
          {BANKS.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBank(b.id)}
              className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 ${
                selectedBank === b.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{
                background: selectedBank === b.id ? b.bgColor : 'hsl(var(--card))',
                borderColor: selectedBank === b.id ? b.borderColor : 'hsl(var(--border))',
                boxShadow: selectedBank === b.id ? `0 0 12px ${b.color}30` : 'none',
              }}
            >
              {selectedBank === b.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: b.color }}>
                    <Icon name="Check" size={10} className="text-white" />
                  </div>
                </div>
              )}
              <span className="text-xl mb-1.5 block">{b.logo}</span>
              <p className="text-sm font-semibold text-foreground">{b.shortName}</p>
              <p className="text-xs text-muted-foreground">{b.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2 font-golos">Сумма вывода</p>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Введите сумму"
            min={MIN_WITHDRAW}
            max={balance}
            className="w-full bg-input border border-border rounded-xl px-4 py-3.5 pr-24 text-foreground font-oswald text-lg focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
            style={{ fontSize: 20 }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={setMaxAmount}
              className="text-xs px-2 py-1 rounded-md font-semibold transition-all hover:opacity-80"
              style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--primary-foreground))' }}
            >
              МАКС
            </button>
            <span className="text-muted-foreground text-lg">₽</span>
          </div>
        </div>
      </div>

      {/* Account input */}
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-2 font-golos">
          {bank ? bank.hint : 'Реквизиты для вывода'}
        </p>
        <input
          type="text"
          value={account}
          onChange={e => setAccount(e.target.value)}
          placeholder={bank ? bank.placeholder : 'Сначала выберите банк'}
          disabled={!selectedBank}
          className="w-full bg-input border border-border rounded-xl px-4 py-3.5 text-foreground font-golos focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all disabled:opacity-40"
        />
      </div>

      {/* Calculation breakdown */}
      {amountNum > 0 && (
        <div className="card-glass rounded-xl p-4 mb-5 animate-slide-up">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Сумма вывода:</span>
              <span className="text-foreground font-semibold">{formatBalance(amountNum)} ₽</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Комиссия (1%):</span>
              <span className="text-red-400">−{formatBalance(commission)} ₽</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground font-oswald">Получите:</span>
              <span className="gold-text font-oswald">{formatBalance(toReceive)} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw button */}
      <button
        onClick={handleWithdraw}
        disabled={!canWithdraw}
        className="w-full py-4 rounded-xl font-oswald text-lg font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canWithdraw
            ? 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))'
            : 'hsl(var(--muted))',
          color: canWithdraw ? 'hsl(220 20% 7%)' : 'hsl(var(--muted-foreground))',
          boxShadow: canWithdraw ? '0 4px 20px hsl(43 90% 55% / 0.35)' : 'none',
        }}
      >
        {canWithdraw ? `Вывести ${formatBalance(toReceive)} ₽` : `Выведите от ${MIN_WITHDRAW} ₽`}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Срок зачисления: 1–3 рабочих дня
      </p>
    </div>
  );
}
