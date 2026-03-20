// ====================================================
// Monster Trainer Game — Express + PostgreSQL Server
// ====================================================
// Serves the static frontend AND provides a REST API
// for cloud save/load using a Railway PostgreSQL DB.
//
// Environment variables required:
//   DATABASE_URL  — PostgreSQL connection string (Railway provides this)
//   PORT          — HTTP port (Railway provides this, defaults to 3000)
// ====================================================

const express = require('express');
const { Pool }  = require('pg');
const path      = require('path');

const app  = express();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
        ? { rejectUnauthorized: false }
        : false,
});

// ── Middleware ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// Serve all static game files from this directory
app.use(express.static(path.join(__dirname)));

// ── DB bootstrap ────────────────────────────────────
async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS saves (
            username   TEXT        PRIMARY KEY,
            save_data  JSONB       NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    console.log('✓ saves table ready');
}

// ── API: save ────────────────────────────────────────
// POST /api/save   { username, data }
app.post('/api/save', async (req, res) => {
    const { username, data } = req.body;
    if (!username || !data) {
        return res.status(400).json({ error: 'missing username or data' });
    }
    try {
        await pool.query(
            `INSERT INTO saves (username, save_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (username)
             DO UPDATE SET save_data = $2, updated_at = NOW()`,
            [username, data]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('save error:', err.message);
        res.status(500).json({ error: 'db error' });
    }
});

// ── API: load ────────────────────────────────────────
// GET /api/load/:username
app.get('/api/load/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const result = await pool.query(
            'SELECT save_data FROM saves WHERE username = $1',
            [username]
        );
        if (result.rows.length === 0) {
            return res.json({ found: false });
        }
        res.json({ found: true, data: result.rows[0].save_data });
    } catch (err) {
        console.error('load error:', err.message);
        res.status(500).json({ error: 'db error' });
    }
});

// ── API: has-save ────────────────────────────────────
// GET /api/has-save/:username
app.get('/api/has-save/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const result = await pool.query(
            'SELECT 1 FROM saves WHERE username = $1',
            [username]
        );
        res.json({ exists: result.rows.length > 0 });
    } catch (err) {
        console.error('has-save error:', err.message);
        // On DB error fall back gracefully — client will use localStorage
        res.json({ exists: false, error: 'db error' });
    }
});

// ── Catch-all → index.html (SPA) ─────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

ensureTable()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🎮 Monster Trainer server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to DB:', err.message);
        // Start anyway — saves will fall back to client localStorage
        app.listen(PORT, () => {
            console.log(`🎮 Monster Trainer server running on port ${PORT} (no DB)`);
        });
    });
