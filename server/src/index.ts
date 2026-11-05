import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5055;

app.listen(PORT, () => {
  console.log(`🚀 AttendWise Server running on http://localhost:${PORT}`);
});

