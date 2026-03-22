import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: Date;
}

interface ProfilePageProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  balance: number;
  totalClicks: number;
}

export default function ProfilePage({ profile, onUpdateProfile, balance, totalClicks }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);

  const formatBalance = (v: number) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const handleSave = () => {
    onUpdateProfile(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const avatarLetters = (profile.name || 'П').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const level = totalClicks < 100 ? 'Новичок' :
    totalClicks < 1000 ? 'Кликер' :
    totalClicks < 5000 ? 'Про' : 'Эксперт';

  const levelColor = totalClicks < 100 ? 'text-muted-foreground' :
    totalClicks < 1000 ? 'text-blue-400' :
    totalClicks < 5000 ? 'text-purple-400' : 'text-yellow-400';

  return (
    <div className="px-4 py-6 animate-fade-in">
      <h2 className="font-oswald text-2xl font-bold mb-6 text-foreground uppercase tracking-wide">
        Профиль
      </h2>

      {/* Avatar & name */}
      <div className="card-glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-oswald text-2xl font-bold text-background"
          style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))' }}
        >
          {avatarLetters}
        </div>
        <div className="flex-1">
          <p className="font-oswald text-xl font-bold text-foreground">{profile.name || 'Пользователь'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-semibold ${levelColor}`}>
              {level}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">
              С {profile.joinDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: 'hsl(var(--secondary))' }}
        >
          <Icon name={editing ? 'X' : 'Pencil'} size={16} className="text-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Баланс', value: `${formatBalance(balance)} ₽`, icon: 'Wallet', color: 'text-yellow-400' },
          { label: 'Кликов', value: totalClicks.toLocaleString('ru-RU'), icon: 'MousePointerClick', color: 'text-purple-400' },
          { label: 'Уровень', value: level, icon: 'Star', color: levelColor },
        ].map((s, i) => (
          <div key={i} className="card-glass rounded-xl p-3 text-center">
            <Icon name={s.icon} fallback="CircleAlert" size={18} className={`${s.color} mx-auto mb-1.5`} />
            <p className={`text-sm font-bold font-oswald ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Success */}
      {saved && (
        <div className="mb-4 p-3 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-2 animate-slide-up">
          <Icon name="CheckCircle" size={16} className="text-green-400" />
          <span className="text-sm text-green-400">Профиль сохранён</span>
        </div>
      )}

      {/* Edit form */}
      {editing ? (
        <div className="card-glass rounded-xl p-5 space-y-4 animate-slide-up">
          <h3 className="font-oswald text-base font-semibold text-foreground">Редактировать профиль</h3>

          {[
            { label: 'Имя', key: 'name', placeholder: 'Ваше имя', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'email@example.com', type: 'email' },
            { label: 'Телефон', key: 'phone', placeholder: '+7 (XXX) XXX-XX-XX', type: 'tel' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs text-muted-foreground mb-1.5 block font-golos">{field.label}</label>
              <input
                type={field.type}
                value={form[field.key as keyof UserProfile] as string}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-foreground font-golos text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-oswald font-bold uppercase tracking-wide text-sm transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))',
              color: 'hsl(220 20% 7%)',
            }}
          >
            Сохранить изменения
          </button>
        </div>
      ) : (
        <div className="card-glass rounded-xl p-5 space-y-3.5">
          <h3 className="font-oswald text-base font-semibold text-foreground mb-1">Контактные данные</h3>
          {[
            { icon: 'User', label: 'Имя', value: profile.name || '—' },
            { icon: 'Mail', label: 'Email', value: profile.email || '—' },
            { icon: 'Phone', label: 'Телефон', value: profile.phone || '—' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon name={row.icon} fallback="CircleAlert" size={14} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm text-foreground font-golos">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications toggle */}
      <div className="card-glass rounded-xl p-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Icon name="Bell" size={14} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Уведомления</p>
            <p className="text-xs text-muted-foreground">О выводах и начислениях</p>
          </div>
        </div>
        <div
          className="w-11 h-6 rounded-full flex items-center cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg, hsl(43 90% 55%), hsl(38 85% 42%))' }}
        >
          <div className="w-4 h-4 rounded-full bg-background ml-auto mr-1 shadow" />
        </div>
      </div>
    </div>
  );
}
