"""
Получение и сохранение данных пользователя: баланс, профиль, история транзакций.
GET  / — получить данные пользователя
POST / — обновить профиль пользователя
"""
import json
import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Content-Type': 'application/json',
}

def get_or_create_user(cur, user_id: str) -> dict:
    cur.execute(
        "SELECT u.id, u.name, u.email, u.phone, u.total_clicks, u.created_at, b.amount "
        "FROM users u LEFT JOIN balances b ON b.user_id = u.id "
        "WHERE u.id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    if row:
        return dict(row)
    cur.execute(
        "INSERT INTO users (id) VALUES (%s) RETURNING id, name, email, phone, total_clicks, created_at",
        (user_id,)
    )
    user = dict(cur.fetchone())
    cur.execute("INSERT INTO balances (user_id, amount) VALUES (%s, 0.00)", (user_id,))
    user['amount'] = '0.00'
    return user


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    user_id = event.get('headers', {}).get('x-user-id') or event.get('headers', {}).get('X-User-Id')
    if not user_id:
        user_id = str(uuid.uuid4())

    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    try:
        with conn:
            with conn.cursor() as cur:
                method = event.get('httpMethod', 'GET')

                if method == 'GET':
                    user = get_or_create_user(cur, user_id)
                    # Load transactions (last 100)
                    cur.execute(
                        "SELECT id, type, amount::float, commission::float, bank, account_number, status, description, "
                        "to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as created_at "
                        "FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 100",
                        (user_id,)
                    )
                    txs = [dict(r) for r in cur.fetchall()]
                    return {
                        'statusCode': 200,
                        'headers': CORS_HEADERS,
                        'body': json.dumps({
                            'user_id': user_id,
                            'name': user['name'],
                            'email': user['email'] or '',
                            'phone': user['phone'] or '',
                            'total_clicks': user['total_clicks'],
                            'balance': float(user['amount'] or 0),
                            'join_date': str(user['created_at']),
                            'transactions': txs,
                        }, ensure_ascii=False)
                    }

                elif method == 'POST':
                    body = json.loads(event.get('body') or '{}')
                    get_or_create_user(cur, user_id)
                    cur.execute(
                        "UPDATE users SET name=%s, email=%s, phone=%s, updated_at=NOW() WHERE id=%s",
                        (body.get('name', 'Пользователь'), body.get('email', ''), body.get('phone', ''), user_id)
                    )
                    return {
                        'statusCode': 200,
                        'headers': CORS_HEADERS,
                        'body': json.dumps({'ok': True}, ensure_ascii=False)
                    }
    finally:
        conn.close()

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
