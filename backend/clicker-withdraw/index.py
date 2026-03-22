"""
Вывод денежных средств на банковский счёт пользователя.
POST / — создать заявку на вывод. Комиссия 1%.
Обработка занимает около 5 минут (статус pending → completed).
Тело: {"amount": 500.0, "bank": "sber", "account_number": "79991234567"}
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

BANK_NAMES = {
    'sber': 'Сбербанк',
    'vtb': 'ВТБ',
    'rshb': 'Россельхозбанк',
    'ymoney': 'ЮMoney',
}

COMMISSION_RATE = 0.01
MIN_WITHDRAW = 100.0


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
    bank = body.get('bank', '')
    account_number = body.get('account_number', '')

    if amount < MIN_WITHDRAW:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Минимальная сумма вывода {MIN_WITHDRAW} ₽'}, ensure_ascii=False)
        }
    if bank not in BANK_NAMES:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неизвестный банк'}, ensure_ascii=False)}
    if not account_number or len(account_number) < 10:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректные реквизиты'}, ensure_ascii=False)}

    commission = round(amount * COMMISSION_RATE, 2)
    to_receive = round(amount - commission, 2)

    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    try:
        with conn:
            with conn.cursor() as cur:
                # Check user and balance
                cur.execute("SELECT amount::float FROM balances WHERE user_id = %s", (user_id,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'}, ensure_ascii=False)}

                current_balance = float(row['amount'])
                if current_balance < amount:
                    return {
                        'statusCode': 400,
                        'headers': CORS_HEADERS,
                        'body': json.dumps({'error': f'Недостаточно средств. Баланс: {current_balance:.2f} ₽'}, ensure_ascii=False)
                    }

                # Deduct balance
                cur.execute(
                    "UPDATE balances SET amount = amount - %s, updated_at = NOW() WHERE user_id = %s",
                    (amount, user_id)
                )

                # Create withdrawal transaction (status: pending — обрабатывается ~5 мин)
                tx_id = str(uuid.uuid4())
                bank_name = BANK_NAMES[bank]
                cur.execute(
                    "INSERT INTO transactions (id, user_id, type, amount, commission, bank, account_number, status, description) "
                    "VALUES (%s, %s, 'withdraw', %s, %s, %s, %s, 'pending', %s)",
                    (
                        tx_id, user_id, amount, commission, bank,
                        account_number,
                        f'Вывод на {bank_name}: {account_number[:4]}****'
                    )
                )

                # Get updated balance
                cur.execute("SELECT amount::float FROM balances WHERE user_id = %s", (user_id,))
                new_balance = float(cur.fetchone()['amount'])

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'ok': True,
                'tx_id': tx_id,
                'amount': amount,
                'commission': commission,
                'to_receive': to_receive,
                'bank': bank_name,
                'balance': new_balance,
                'status': 'pending',
                'message': f'Заявка принята. Средства поступят на счёт {bank_name} в течение 5 минут.',
            }, ensure_ascii=False)
        }
    finally:
        conn.close()
