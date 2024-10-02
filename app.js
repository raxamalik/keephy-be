const express = require('express');
const morgan = require('morgan');
const path = require('path');
const businessRouter = require('./routes/businessRoutes');
const franchiseRouter = require('./routes/franchiseRoutes');
const formRouter = require('./routes/formRoutes');
const userRouter = require('./routes/userRoutes');
const cookieParser = require('cookie-parser');
const categoryRouter = require('./routes/categoryRoutes');
const planRouter = require('./routes/planRoutes');
const SubscriptionRouter = require('./routes/subscriptionRoutes');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const HttpError = require('./utils/httpError');
const helmet = require('helmet');
const cors = require('cors');
dotenv.config({ path: '.env' });

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

app.use(cors({
  origin: ["https://keephy-next-js.vercel.app", "http://localhost:3000", "http://localhost:3001"],
  credentials: true // Allows cookies to be included
}));

connectDB();
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send(`Keephy API is running`);
});

// Serve static files
app.use('/uploads/logo', express.static(path.join('uploads', 'logo')));

// API routes
app.use('/api/v1/business', businessRouter);
app.use('/api/v1/franchise', franchiseRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/category', categoryRouter);
app.use('/api/v1/typeForm', formRouter);
app.use('/api/v1/plan', planRouter);
app.use('/api/v1/Subscription', SubscriptionRouter);

// Error handling for undefined routes
app.use((req, res, next) => {
  return next(new HttpError('Could not find the route', 404));
});

// Centralized error handling middleware
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
