import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DB_URL,
}); 

export const query = async (text: string, params: any[] = []): Promise<pkg.QueryResult<any>> => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
};