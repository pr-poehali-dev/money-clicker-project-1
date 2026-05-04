"""
Создание платежа через Robokassa для пополнения баланса.
POST / — генерирует ссылку на оплату Robokassa.
Тело: {"amount": 500.0}
Возвращает: {"payment_url": "...", "invoice_id": "..."}
"""
import json
import os
import hashlib
import random
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Content-Type': 'application/json',
}

ROBOKASSA_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx'
MIN_DEPOSIT = 10.0


def make_signature(login: str, amount: str, invoice_id: str, password: str) -> str:
    raw = f"{login}:{amount}:{invoice_id}:{password}"
    return hashlib.md5(raw.encode('utf-8')).hexdigest()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    user_id = event.get('headers', {}).get('x-user-id') or event.get('headers', {}).get('X-User-Id', '')
    if not user_id:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'X-User-Id required'})}

    body = json.loads(event.get('body') or '{}')
    amount = float(body.get('amount', 0))
    description = 'Пополнение баланса'

    if amount < MIN_DEPOSIT:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Минимальная сумма пополнения {MIN_DEPOSIT} ₽'}, ensure_ascii=False)
        }

    login = os.environ.get('ROBOKASSA_LOGIN', '')
    password1 = os.environ.get('ROBOKASSA_PASSWORD1', '')

    # TEST режим пока ключи не заданы
    is_test = not login or not password1
    amount_str = f"{amount:.2f}"
    invoice_id = str(random.randint(100000000, 999999999))

    # Сохраняем pending-транзакцию (account_number хранит invoice_id для поиска при callback)
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO transactions (id, user_id, type, amount, commission, bank, account_number, status, description) "
                        "VALUES (%s, %s, 'deposit', %s, 0, 'robokassa', %s, 'pending', %s)",
                        (invoice_id, user_id, amount, invoice_id, description)
                    )
        finally:
            conn.close()
    except Exception:
        pass  # не блокируем создание ссылки если БД недоступна

    if is_test:
        sig = make_signature('demo', amount_str, invoice_id, 'password1')
        payment_url = (
            f"{ROBOKASSA_URL}?MerchantLogin=demo&OutSum={amount_str}"
            f"&InvId={invoice_id}&Description={description}"
            f"&SignatureValue={sig}&Culture=ru&Encoding=utf-8&IsTest=1"
        )
    else:
        sig = make_signature(login, amount_str, invoice_id, password1)
        payment_url = (
            f"{ROBOKASSA_URL}?MerchantLogin={login}&OutSum={amount_str}"
            f"&InvId={invoice_id}&Description={description}"
            f"&SignatureValue={sig}&Culture=ru&Encoding=utf-8"
        )

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'ok': True,
            'payment_url': payment_url,
            'invoice_id': invoice_id,
            'amount': amount,
            'is_test': is_test,
        }, ensure_ascii=False)
    }