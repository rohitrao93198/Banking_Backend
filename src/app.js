import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoutes.js';
import accountRouter from './routes/accountRoutes.js';
import transactionRouter from './routes/transactionRoutes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);

export default app;