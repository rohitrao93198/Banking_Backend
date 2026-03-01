import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createAccount, getAccountBalance, getAccounts } from '../controllers/accountControler.js';

const router = express.Router();

router.post("/", authMiddleware, createAccount);
router.get("/", authMiddleware, getAccounts);
router.get("/balance/:accountId", authMiddleware, getAccountBalance);

export default router;