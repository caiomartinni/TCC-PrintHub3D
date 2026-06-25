import mysql from 'mysql2/promise';

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'printhub3d',
  });
  try {
    await conn.execute(
      `ALTER TABLE notifications MODIFY COLUMN type ENUM('ORDER_UPDATE','QUOTE_RECEIVED','QUOTE_ACCEPTED','PAYMENT_CONFIRMED','REVIEW_RECEIVED','NEW_MESSAGE','SYSTEM') NOT NULL`
    );
    console.log('OK: enum NEW_MESSAGE adicionado');
  } catch (e) {
    console.error('Erro:', e);
  } finally {
    await conn.end();
  }
})();
