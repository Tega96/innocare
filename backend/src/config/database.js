const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

/**
 * PostgreSQL connection pool configuration
 * This manages database connections efficiently for our application
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.stack);
  } else {
    console.log('✅ Successfully connected to PostgreSQL database');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};