import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface WithdrawPageProps {
  balance: number;
  onWithdraw: (amount: number, bank: string, account: string) => Promise<void>;
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
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    shortName: 'ВТБ',
    color: '#009FDF',
    bgColor: 'rgba(0, 159, 223, 0.12)',
    borderColor: 'rgba(0, 159, 223, 0.3)',
    logo: '🔵',
  },
  {
    id: 'rshb',
    name: 'Россельхозбанк',
    shortName: 'РСХБ',
    color: '#00843D',
    bgColor: 'rgba(0, 132, 61, 0.12)',
    borderColor: 'rgba(0, 132, 61, 0.3)',
    logo: '🌾',
  },
  {
    id: 'tinkoff',
    name: 'Т-Банк',
    shortName: 'Т-Банк',
    color: '#FFDD2D',
    bgColor: 'rgba(255, 221, 45, 0.1)',
    borderColor: 'rgba(255, 221, 45, 0.3)',
    logo: '🟡',
  },
  {
    id: 'alfa',
    name: 'Альфа-Банк',
    shortName: 'Альфа',
    color: '#EF3124',
    bgColor: 'rgba(239, 49, 36, 0.1)',
    borderColor: 'rgba(239, 49, 36, 0.3)',
    logo: '🔴',
  },
  {
    id: 'other',
    name: 'Другой банк',
    shortName: 'Другой',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    logo: '🏦',
  },
];

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function getCardSystem(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard / Мир';
  if (/^2/.test(digits)) return 'Мир';
  return '';
}

export default function WithdrawPage({ balance, onWithdraw }: WithdrawPageProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const COMMISSION = 0.01;
  const MIN_WITHDRAW = 100;

  const amountNum = parseFloat(amount) || 0;
  const commission = amountNum * COMMISSION;
  const toReceive = amountNum - commission;
  const rawCard = cardNumber.replace(/\s/g, '');
  const cardValid = rawCard.length === 16;
  const holderValid = cardHolder.trim().length >= 2;
  const canWithdraw =
    selectedBank && amountNum >= MIN_WITHDRAW && amountNum <= balance && cardValid && holderValid && !processing;

  const bank = BANKS.find(b => b.id === selectedBank);
  const cardSystem = getCardSystem(cardNumber);

  const formatBalance = (v: number) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleWithdraw = async () => {
    if (!canWithdraw || !selectedBank) return;
    setProcessing(true);
    setError('');
    try {
      const account = `${cardNumber} (${cardHolder.trim()})`;
      await onWithdraw(amountNum, selectedBank, account);
      setSuccess(true);
      setAmount('');
      setCardNumber('');
      setCardHolder('');
      setSelectedBank(null);
      setTimeout(() => setSuccess(false), 6000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка вывода. Попробуйте снова.');
    } finally {
      setProcessing(false);
    }
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
        {balance < MIN_WITHDRAW ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Icon name="AlertCircle" size={14} />
            <span>Мин. {MIN_WITHDRAW} ₽</span>
          </div>
        ) : (
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
            <p className="text-sm font-semibold text-green-400">Заявка принята!</p>
            <p className="text-xs text-muted-foreground">Деньги поступят на карту в течение 5 минут</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name="AlertCircle" size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-400">Ошибка вывода</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Bank selection */}
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-3 font-golos">Банк получателя</p>
        <div className="grid grid-cols-3 gap-2">
          {BANKS.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBank(b.id)}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                selectedBank === b.id ? 'scale-[1.03]' : 'hover:scale-[1.01]'
              }`}
              style={{
                background: selectedBank === b.id ? b.bgColor : 'hsl(var(--card))',
                borderColor: selectedBank === b.id ? b.borderColor : 'hsl(var(--border))',
                boxShadow: selectedBank === b.id ? `0 0 12px ${b.color}30` : 'none',
              }}
            >
              {selectedBank === b.id && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: b.color }}>
                    <Icon name="Check" size={8} className="text-white" />
                  </div>
                </div>
              )}
              <span className="text-lg mb-1 block">{b.logo}</span>
              <p className="text-xs font-semibold text-foreground leading-tight">{b.shortName}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Card number input */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2 font-golos">Номер карты</p>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={handleCardInput}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="w-full bg-input border border-border rounded-xl px-4 py-3.5 pr-24 text-foreground font-oswald text-lg tracking-widest focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {cardValid && (
              <Icon name="CheckCircle2" size={16} className="text-green-400" />
            )}
            {cardSystem && (
              <span className="text-xs text-muted-foreground">{cardSystem}</span>
            )}
          </div>
        </div>
        {cardNumber.length > 0 && !cardValid && (
          <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
            <Icon name="Info" size={11} />
            Введите все 16 цифр карты
          </p>
        )}
      </div>

      {/* Cardholder name */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2 font-golos">Имя владельца карты</p>
        <input
          type="text"
          value={cardHolder}
          onChange={e => setCardHolder(e.target.value.toUpperCase())}
          placeholder="IVAN IVANOV"
          className="w-full bg-input border border-border rounded-xl px-4 py-3.5 text-foreground font-oswald tracking-wider focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all uppercase"
        />
        <p className="text-xs text-muted-foreground mt-1.5">Латинскими буквами, как на карте</p>
      </div>

      {/* Amount input */}
      <div className="mb-5">
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

      {/* Card preview */}
      {(cardValid || cardNumber.length > 0) && (
        <div className="mb-5 animate-slide-up">
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: bank
                ? `linear-gradient(135deg, ${bank.color}22, ${bank.color}44)`
                : 'linear-gradient(135deg, hsl(220 18% 14%), hsl(220 18% 18%))',
              border: `1px solid ${bank ? bank.borderColor : 'hsl(var(--border))'}`,
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground">Банк</p>
                <p className="text-sm font-semibold text-foreground">{bank?.name ?? '—'}</p>
              </div>
              <Icon name="CreditCard" size={22} className="text-muted-foreground" />
            </div>
            <p className="font-oswald text-xl tracking-widest text-foreground mb-3">
              {cardNumber || '•••• •••• •••• ••••'}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Держатель</p>
                <p className="text-sm font-semibold text-foreground">{cardHolder || '—'}</p>
              </div>
              {cardSystem && (
                <p className="text-xs text-muted-foreground">{cardSystem}</p>
              )}
            </div>
          </div>
        </div>
      )}

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
        className="w-full py-4 rounded-xl font-oswald text-lg font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: canWithdraw
            ? 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))'
            : 'hsl(var(--muted))',
          color: canWithdraw ? 'hsl(220 20% 7%)' : 'hsl(var(--muted-foreground))',
          boxShadow: canWithdraw ? '0 4px 20px hsl(43 90% 55% / 0.35)' : 'none',
        }}
      >
        {processing ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Отправка заявки...
          </>
        ) : canWithdraw ? (
          `Вывести ${formatBalance(toReceive)} ₽`
        ) : (
          'Заполните все поля'
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Обработка перевода: ~5 минут · Комиссия 1%
      </p>
    </div>
  );
}
