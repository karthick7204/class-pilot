import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = Number(process.env.PORT) || 5055;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AttendWise Server running on ${PORT}`);
});

