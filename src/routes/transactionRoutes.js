import express from 'express';
import { authMiddleware, authSystemUserMiddleware } from '../middlewares/authMiddleware.js';
import { createIntialFundTransaction, createTransaction } from '../controllers/transactionController.js';

const router = express.Router();

router.post("/", authMiddleware, createTransaction);
router.post("/system/initial-funds", authSystemUserMiddleware, createIntialFundTransaction);

export default router;