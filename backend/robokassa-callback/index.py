"""
Callback-обработчик уведомлений от Robokassa об успешной оплате.
POST / — Robokassa присылает OutSum, InvId, SignatureValue.
При валидной подписи зачисляем сумму на баланс пользователя.
"""
import json
import os
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/plain',
}


def check_signature(password2: str, amount: str, inv_id: str, signature: str) -> bool:
    login = os.environ.get('ROBOKASSA_LOGIN', 'demo')
    raw = f"{amount}:{inv_id}:{password2}"
    expected = hashlib.md5(raw.encode('utf-8')).hexdigest()
    return expected.lower() == signature.lower()


def parse_params(event: dict) -> dict:
    """Извлекаем параметры из GET query или POST body."""
    params = event.get('queryStringParameters') or {}
    if not params and event.get('body'):
        body = event['body']
        # form-urlencoded
        for pair in body.split('&'):
            if '=' in pair:
                k, v = pair.split('=', 1)
                params[k] = v
    return params


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = parse_params(event)
    out_sum = params.get('OutSum', '')
    inv_id = params.get('InvId', '')
    signature = params.get('SignatureValue', '')

    if not out_sum or not inv_id or not signature:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': 'bad request'}

    password2 = os.environ.get('ROBOKASSA_PASSWORD2', '')
    is_test = not password2

    # В тестовом режиме пропускаем проверку подписи
    if not is_test and not check_signature(password2, out_sum, inv_id, signature):
        return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': 'bad sign'}

    amount = float(out_sum)

    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    try:
        with conn:
            with conn.cursor() as cur:
                # Ищем pending-транзакцию по invoice_id
                cur.execute(
                    "SELECT id, user_id, amount, status FROM transactions "
                    "WHERE account_number = %s AND type = 'deposit' AND status = 'pending'",
                    (inv_id,)
                )
                tx = cur.fetchone()
                if not tx:
                    # Уже обработано или не найдено — отвечаем OK чтобы Robokassa не повторяла
                    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': f'OK{inv_id}'}

                user_id = tx['user_id']

                # Зачисляем на баланс
                cur.execute(
                    "UPDATE balances SET amount = amount + %s, updated_at = NOW() WHERE user_id = %s",
                    (amount, user_id)
                )

                # Помечаем транзакцию как completed
                cur.execute(
                    "UPDATE transactions SET status = 'completed' WHERE id = %s",
                    (tx['id'],)
                )

        # Robokassa ожидает ответ вида "OK{InvId}"
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': f'OK{inv_id}'}
    finally:
        conn.close()
