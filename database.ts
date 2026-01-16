import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = pool;

// Khởi tạo table khi server start
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        originalName VARCHAR(255) NOT NULL,
        size INTEGER NOT NULL,
        mimeType VARCHAR(100),
        filePath VARCHAR(255) NOT NULL,
        uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table uploads đã sẵn sàng');
  } catch (err) {
    console.error('Lỗi tạo table:', err);
  } finally {
    client.release();
  }
}

// Hàm thêm file vào database
export async function addFileToDb(
  filename: string,
  originalName: string,
  size: number,
  mimeType: string,
  filePath: string
): Promise<number> {
  const result = await db.query(
    `INSERT INTO uploads (filename, originalName, size, mimeType, filePath) 
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [filename, originalName, size, mimeType, filePath]
  );
  return result.rows[0].id;
}

// Hàm lấy tất cả files
export async function getAllFiles(): Promise<any[]> {
  const result = await db.query(
    `SELECT * FROM uploads ORDER BY uploadedAt DESC`
  );
  return result.rows;
}

// Hàm lấy file theo ID
export async function getFileById(id: number): Promise<any> {
  const result = await db.query(
    `SELECT * FROM uploads WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

// Hàm xóa file từ database
export async function deleteFileFromDb(id: number): Promise<void> {
  await db.query(
    `DELETE FROM uploads WHERE id = $1`,
    [id]
  );
}

export default db;
