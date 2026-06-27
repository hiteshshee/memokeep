import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import { localUploadDir } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import documentRoutes from './routes/document.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// CLIENT_URL may hold several comma-separated origins (e.g. the Vercel URL and
// the custom domain). Allow any of them, plus same-origin / non-browser calls.
const allowedOrigins = env.clientUrl
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

// Serve locally stored uploads (when Cloudinary is not configured).
app.use('/uploads', express.static(localUploadDir));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', cloudinary: env.cloudinary.enabled, time: new Date().toISOString() })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
