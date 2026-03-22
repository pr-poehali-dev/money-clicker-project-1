"""
Начисление заработка от кликов.
POST / — начислить заработок пользователю.
Тело: {"clicks": 50, "amount": 500.0}
"""
import json
import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Content-Type': 'application/json',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    user_id = event.get('headers', {}).get('x-user-id') or event.get('headers', {}).get('X-User-Id', '')
    if not user_id:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'X-User-Id required'})}

    body = json.loads(event.get('body') or '{}')
    clicks = int(body.get('clicks', 0))
    amount = float(body.get('amount', 0))

    if clicks <= 0 or amount <= 0:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'clicks and amount must be > 0'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    try:
        with conn:
            with conn.cursor() as cur:
                # Ensure user exists
                cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if not cur.fetchone():
                    cur.execute("INSERT INTO users (id) VALUES (%s)", (user_id,))
                    cur.execute("INSERT INTO balances (user_id, amount) VALUES (%s, 0.00)", (user_id,))

                # Update balance and clicks
                cur.execute(
                    "UPDATE balances SET amount = amount + %s, updated_at = NOW() WHERE user_id = %s",
                    (amount, user_id)
                )
                cur.execute(
                    "UPDATE users SET total_clicks = total_clicks + %s, updated_at = NOW() WHERE id = %s",
                    (clicks, user_id)
                )

                # Save earn transaction
                tx_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO transactions (id, user_id, type, amount, commission, status, description) "
                    "VALUES (%s, %s, 'earn', %s, 0, 'completed', %s)",
                    (tx_id, user_id, amount, f'Заработок: {clicks} кликов')
                )

                # Get new balance
                cur.execute("SELECT amount::float FROM balances WHERE user_id = %s", (user_id,))
                row = cur.fetchone()
                new_balance = float(row['amount']) if row else amount

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'ok': True, 'balance': new_balance, 'tx_id': tx_id}, ensure_ascii=False)
        }
    finally:
        conn.close()
