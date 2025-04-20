// backend/script.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '0521', 
  database: 'sistema_asistencia'
};

// Conexión a la base de datos
let pool;
async function initDB() {
  pool = mysql.createPool(dbConfig);
  console.log('Conectado a MySQL :) ');
}
initDB();

// Login
app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  
  try {
    const [rows] = await pool.query('SELECT * FROM Maestros WHERE correo = ?', [correo]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    const maestro = rows[0];
    const match = await bcrypt.compare(password, maestro.password);
    
    if (match) {
      res.json({ 
        id: maestro.id, 
        nombre: maestro.nombre, 
        apellido: maestro.apellido 
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener grados por profesor
app.get('/api/grados/:profesorId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Grados WHERE profesor_id = ?', [req.params.profesorId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estudiantes por grado
app.get('/api/estudiantes/:gradoId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Estudiantes WHERE id_grado = ?', [req.params.gradoId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar asistencia
app.post('/api/asistencia', async (req, res) => {
  const { grado_id, alumno_id, maestro_id, fecha, estado } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO Asistencia (grado_id, alumno_id, maestro_id, fecha, estado) VALUES (?, ?, ?, ?, ?)',
      [grado_id, alumno_id, maestro_id, fecha, estado]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener asistencia por fecha y grad
app.get('/api/asistencia/:gradoId/:fecha', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, e.nombre as alumno_nombre FROM Asistencia a JOIN Estudiantes e ON a.alumno_id = e.id WHERE a.grado_id = ? AND a.fecha = ?',
      [req.params.gradoId, req.params.fecha]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});