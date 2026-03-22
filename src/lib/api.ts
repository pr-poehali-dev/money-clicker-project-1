import func2url from '../../backend/func2url.json';

// Stable user ID, stored in localStorage
export function getUserId(): string {
  let uid = localStorage.getItem('clicker_user_id');
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('clicker_user_id', uid);
  }
  return uid;
}

const headers = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': getUserId(),
});

export interface UserData {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  total_clicks: number;
  balance: number;
  join_date: string;
  transactions: ApiTransaction[];
}

export interface ApiTransaction {
  id: string;
  type: 'earn' | 'withdraw';
  amount: number;
  commission: number;
  bank?: string;
  account_number?: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

export async function fetchUserData(): Promise<UserData> {
  const res = await fetch(func2url['clicker-data'], { headers: headers() });
  if (!res.ok) throw new Error('Ошибка загрузки данных');
  return res.json();
}

export async function updateProfile(data: { name: string; email: string; phone: string }): Promise<void> {
  const res = await fetch(func2url['clicker-data'], {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Ошибка обновления профиля');
}

export async function earnCoins(clicks: number, amount: number): Promise<{ balance: number; tx_id: string }> {
  const res = await fetch(func2url['clicker-earn'], {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ clicks, amount }),
  });
  if (!res.ok) throw new Error('Ошибка начисления');
  return res.json();
}

export interface WithdrawResult {
  tx_id: string;
  amount: number;
  commission: number;
  to_receive: number;
  bank: string;
  balance: number;
  status: string;
  message: string;
}

export async function withdrawFunds(
  amount: number,
  bank: string,
  account_number: string
): Promise<WithdrawResult> {
  const res = await fetch(func2url['clicker-withdraw'], {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ amount, bank, account_number }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка вывода');
  return data;
}
