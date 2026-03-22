import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  tx: number;
}

interface ClickerPageProps {
  balance: number;
  onEarn: (amount: number) => void;
  totalClicks: number;
  sessionEarned: number;
}

export default function ClickerPage({ balance, onEarn, totalClicks, sessionEarned }: ClickerPageProps) {
  const [isClicking, setIsClicking] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const [balanceAnimating, setBalanceAnimating] = useState(false);
  const coinRef = useRef<HTMLButtonElement>(null);
  const counterRef = useRef(0);
  const earningPerClick = 10;

  const handleCoinClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onEarn(earningPerClick);

    setIsClicking(true);
    setIsPulsing(true);
    setBalanceAnimating(true);

    const rect = coinRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 50;
    const y = rect ? e.clientY - rect.top : 50;
    const tx = (Math.random() - 0.5) * 80;

    counterRef.current += 1;
    const id = counterRef.current;

    setFloatingTexts(prev => [...prev, { id, x, y, tx }]);

    setTimeout(() => setIsClicking(false), 250);
    setTimeout(() => setIsPulsing(false), 600);
    setTimeout(() => setBalanceAnimating(false), 300);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 900);
  }, [onEarn]);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const clicksPerHour = Math.floor(totalClicks * 3.6);

  return (
    <div className="flex flex-col items-center px-4 py-6 animate-fade-in">
      {/* Balance display */}
      <div className="w-full max-w-md mb-8">
        <div className="card-glass rounded-2xl p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
          <p className="text-muted-foreground text-sm font-golos mb-1 uppercase tracking-widest">Текущий баланс</p>
          <div
            className={`font-oswald text-5xl font-bold transition-all duration-200 ${balanceAnimating ? 'animate-number-pop' : ''}`}
            style={{ color: 'hsl(var(--gold))' }}
          >
            {formatBalance(balance)}
            <span className="text-2xl ml-2 text-muted-foreground">₽</span>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">За сессию</p>
              <p className="text-sm font-semibold text-green-400">+{formatBalance(sessionEarned)} ₽</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Кликов</p>
              <p className="text-sm font-semibold text-foreground">{totalClicks.toLocaleString('ru-RU')}</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">За клик</p>
              <p className="text-sm font-semibold gold-text">+{earningPerClick} ₽</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coin clicker */}
      <div className="relative flex items-center justify-center mb-10" style={{ width: 220, height: 220 }}>
        {/* Pulse rings */}
        {isPulsing && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-yellow-400/40 animate-pulse-ring" />
            <div className="absolute inset-0 rounded-full border border-yellow-400/20 animate-pulse-ring" style={{ animationDelay: '0.1s' }} />
          </>
        )}

        {/* Floating +10₽ texts */}
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className="absolute pointer-events-none font-oswald font-bold text-xl animate-float-money z-20"
            style={{
              left: ft.x,
              top: ft.y,
              '--tx': `${ft.tx}px`,
              color: 'hsl(var(--gold))',
              textShadow: '0 0 10px hsl(43 90% 55% / 0.8)',
            } as React.CSSProperties}
          >
            +10 ₽
          </div>
        ))}

        {/* Coin button */}
        <button
          ref={coinRef}
          onClick={handleCoinClick}
          className={`relative w-48 h-48 rounded-full cursor-pointer select-none transition-all focus:outline-none active:scale-90 ${isClicking ? 'animate-coin-click' : ''}`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Coin SVG */}
          <svg viewBox="0 0 200 200" className={`w-full h-full ${isClicking ? 'coin-glow-active' : 'coin-glow'} transition-all duration-200`}>
            {/* Outer ring */}
            <circle cx="100" cy="100" r="96" fill="url(#coinGradOuter)" stroke="url(#coinStroke)" strokeWidth="2" />
            {/* Inner circle */}
            <circle cx="100" cy="100" r="82" fill="url(#coinGradInner)" />
            {/* Rim detail */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(43 90% 70% / 0.3)" strokeWidth="1" strokeDasharray="4 3" />
            {/* 10 text */}
            <text
              x="100"
              y="92"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(38 85% 22%)"
              fontSize="52"
              fontWeight="900"
              fontFamily="Oswald, sans-serif"
            >
              10
            </text>
            {/* РУБЛЕЙ text */}
            <text
              x="100"
              y="128"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(38 85% 28%)"
              fontSize="16"
              fontWeight="600"
              fontFamily="Golos Text, sans-serif"
              letterSpacing="3"
            >
              РУБЛЕЙ
            </text>
            {/* Stars decoration */}
            <text x="34" y="108" textAnchor="middle" fill="hsl(38 85% 28%)" fontSize="12">★</text>
            <text x="166" y="108" textAnchor="middle" fill="hsl(38 85% 28%)" fontSize="12">★</text>

            <defs>
              <radialGradient id="coinGradOuter" cx="40%" cy="35%">
                <stop offset="0%" stopColor="hsl(48 95% 72%)" />
                <stop offset="40%" stopColor="hsl(43 88% 58%)" />
                <stop offset="100%" stopColor="hsl(36 80% 38%)" />
              </radialGradient>
              <radialGradient id="coinGradInner" cx="40%" cy="35%">
                <stop offset="0%" stopColor="hsl(46 95% 68%)" />
                <stop offset="50%" stopColor="hsl(42 86% 54%)" />
                <stop offset="100%" stopColor="hsl(35 78% 36%)" />
              </radialGradient>
              <linearGradient id="coinStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(48 95% 80%)" />
                <stop offset="100%" stopColor="hsl(36 80% 40%)" />
              </linearGradient>
            </defs>
          </svg>
        </button>
      </div>

      {/* Click hint */}
      <p className="text-muted-foreground text-sm mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        Нажимайте на монету для получения прибыли
      </p>

      {/* Mini stats */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        <div className="card-glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <Icon name="TrendingUp" size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Скорость заработка</p>
            <p className="text-sm font-semibold text-foreground">
              {(sessionEarned / Math.max((totalClicks || 1) / 100, 1)).toFixed(0)} ₽/мин
            </p>
          </div>
        </div>
        <div className="card-glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
            <Icon name="Zap" size={18} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Всего заработано</p>
            <p className="text-sm font-semibold gold-text">{formatBalance(balance)} ₽</p>
          </div>
        </div>
      </div>
    </div>
  );
}
