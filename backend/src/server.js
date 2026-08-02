import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🏥 MedConnect Karavali Express Backend Server`);
  console.log(` 🚀 Listening on http://localhost:${PORT}`);
  console.log(` 🐘 PostgreSQL DB URL: ${process.env.DATABASE_URL || 'Localhost Default'}`);
  console.log(`====================================================`);
});
