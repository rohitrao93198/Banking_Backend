import Account from "../models/AccountModel.js";
import Ledger from "../models/LedgerModel.js";
import Transaction from "../models/TransactionModel.js";
import mongoose from "mongoose";
import { sendTransactionEmail } from "../services/emailService.js";


export const createTransaction = async (req, res) => {

    // 1.validate request body

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields: fromAccount, toAccount, amount, idempotencyKey' });
    }

    const fromUserAccount = await Account.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await Account.findOne({
        _id: toAccount,
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({ message: 'One or both accounts not found' });
    }

    // 2.validate idempotency key
    const isTransactionAlreadyExists = await Transaction.findOne({
        idempotencyKey: idempotencyKey
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: 'Transaction already completed',
                transaction: isTransactionAlreadyExists
            });
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: 'Transaction is still pending',
            });
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: 'Transaction failed previously, please try again',
            });
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: 'Transaction was reversed previously, please try again',
            });
        }
    }

    // 3.check account status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({ message: 'One or both accounts are not active' });
    }

    // 4.check sufficient balance
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({ message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}` });
    }

    let transaction;
    try {
        // create transaction with pending status
        const session = await mongoose.startSession();
        session.startTransaction();

        transaction = (await Transaction.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0]

        const debitLedgerEntry = await Ledger.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT",
        }], { session });

        // await (() => {
        //     return new Promise((resolve) => setTimeout(resolve, 100 * 1000)) // Simulate a delay of 100 seconds to test idempotency
        // })()

        const creditLedgerEntry = await Ledger.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT",
        }], { session })

        await Transaction.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session },
        )

        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        return res.status(400).json({
            message: 'Transaction is Pending due to some issue, please try again later',
        })
    }

    // 10.send email notification
    await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)


    return res.status(201).json({
        message: 'Transaction completed successfully',
        transaction: transaction
    });
}


export const createIntialFundTransaction = async (req, res) => {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields: toAccount, amount, idempotencyKey' });
    }

    const toUserAccount = await Account.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({ message: 'Account not found' });
    }

    const fromUserAccount = await Account.findOne({
        // systemUser: true,
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({ message: 'System account not found for the user' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new Transaction({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await Ledger.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
    }], { session })

    const creditLedgerEntry = await Ledger.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
    }], { session })

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message: 'Initial fund transaction completed successfully',
        transaction: transaction
    });
}