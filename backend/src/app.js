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
import vaultRoutes from './routes/vault.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import cronRoutes from './routes/cron.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// CLIENT_URL may hold several comma-separated origins (e.g. the Vercel URL and
// a custom domain). Allow any of them, plus any of this app's own
// memokeep*.vercel.app subdomains (so renaming the Vercel domain just works),
// plus same-origin / non-browser calls.
const allowedOrigins = env.clientUrl
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const memokeepVercel = /^https:\/\/[a-z0-9-]*memokeep[a-z0-9-]*\.vercel\.app$/;

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin) || memokeepVercel.test(origin)) {
        return cb(null, true);
      }
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
app.use('/api/vault', vaultRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
