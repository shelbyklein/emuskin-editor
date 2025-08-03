// Entry point for the Emulator Skin Generator API
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Emulator Skin API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});