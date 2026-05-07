/**
 * Supabase PostgreSQL Service
 * Handles connection to Supabase PostgreSQL database
 */

const { Pool } = require('pg');

class SupabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionString = null;
  }

  /**
   * Initialize Supabase connection using the provided credentials
   * @param {string} connectionString - PostgreSQL connection string
   * @param {string} supabaseUrl - Supabase project URL (for API)
   * @param {string} supabaseKey - Supabase anon/public API key
   */
  initialize(connectionString, supabaseUrl = null, supabaseKey = null) {
    try {
      this.connectionString = connectionString;
      this.supabaseUrl = supabaseUrl;
      this.supabaseKey = supabaseKey;

      // Create PostgreSQL connection pool
      this.pool = new Pool({
        connectionString: connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Set up error handler
      this.pool.on('error', (err) => {
        console.error('⚠️ Supabase Pool Error:', err.message);
        this.isConnected = false;
      });

      console.log('✅ SupabaseService initialized');
      return true;
    } catch (err) {
      console.error('❌ SupabaseService init error:', err.message);
      return false;
    }
  }

  /**
   * Test the database connection
   */
  async testConnection() {
    if (!this.pool) {
      console.warn('⚠️ No pool initialized');
      return false;
    }

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      client.release();
      
      console.log('✅ Supabase PostgreSQL connected successfully');
      console.log('   PostgreSQL Version:', result.rows[0].pg_version.split(' ')[0]);
      console.log('   Server Time:', result.rows[0].current_time);
      
      this.isConnected = true;
      return true;
    } catch (err) {
      console.error('❌ Supabase connection failed:', err.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Execute a SQL query
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   */
  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      console.log(`📊 Query executed in ${duration}ms - Rows: ${result.rowCount}`);
      
      return result;
    } catch (err) {
      console.error('❌ Query error:', err.message);
      throw err;
    }
  }

  /**
   * Get all diseases from the database
   */
  async getDiseases() {
    try {
      const result = await this.query('SELECT * FROM diseases ORDER BY name');
      return result.rows;
    } catch (err) {
      console.warn('⚠️ Diseases table query failed, using fallback data');
      return null;
    }
  }

  /**
   * Get all symptoms from the database
   */
  async getSymptoms() {
    try {
      const result = await this.query('SELECT * FROM symptoms ORDER BY name');
      return result.rows;
    } catch (err) {
      console.warn('⚠️ Symptoms table query failed, using fallback data');
      return null;
    }
  }

  /**
   * Get health data for a user
   * @param {string} userId - User ID
   */
  async getHealthData(userId) {
    try {
      const result = await this.query(
        'SELECT * FROM health_data WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [userId]
      );
      return result.rows;
    } catch (err) {
      console.warn('⚠️ Health data query failed');
      return null;
    }
  }

  /**
   * Save health data
   * @param {object} healthData - Health data object
   */
  async saveHealthData(healthData) {
    try {
      const result = await this.query(
        `INSERT INTO health_data (user_id, age, gender, bmi, blood_glucose, systolic_bp, diastolic_bp, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          healthData.userId,
          healthData.age,
          healthData.gender,
          healthData.bmi,
          healthData.bloodGlucose,
          healthData.systolicBp,
          healthData.diastolicBp
        ]
      );
      return result.rows[0];
    } catch (err) {
      console.warn('⚠️ Save health data failed:', err.message);
      return null;
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Supabase connection pool closed');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      initialized: this.pool !== null,
      url: this.supabaseUrl ? 'configured' : 'not configured'
    };
  }
}

// Export singleton instance
module.exports = new SupabaseService();
