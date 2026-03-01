import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({

    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'From account reference is required for creating a transaction'],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'To account reference is required for creating a transaction'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'COMPLETED', 'FAILED', "REVERSED"],
            message: 'Status must be either PENDING, COMPLETED, FAILED, or REVERSED',
        },
        default: 'PENDING'
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required for creating a transaction'],
    },
    idempotencyKey: {
        type: String,
        required: [true, 'Idempotency key is required for creating a transaction'],
        unique: [true, 'Idempotency key must be unique to prevent duplicate transactions'],
        index: true
    }

}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;