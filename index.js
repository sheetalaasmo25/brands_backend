const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const brandRoutes = require('./routes/brandRoutes')
const app = express();
const PORT = process.env.PORT || 5000;
app.use(
  cors({
      origin:"*",
      methods:['GET' , 'POST' , 'DELETE' , 'PUT'],
      allowedHeaders:[
          'Content-Type',
          'Authorization',
          'Cache-Control',
          'Expires',
          'Pragma'
      ],
      credentials:true
  })
)
// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/brand',brandRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
