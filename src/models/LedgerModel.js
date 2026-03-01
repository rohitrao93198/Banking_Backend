import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account reference is required for creating a ledger entry'],
        index: true,
        immutable: true // Once a ledger entry is created, the associated account cannot be changed
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required for creating a ledger entry'],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction reference is required for creating a ledger entry'],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ['DEBIT', 'CREDIT'],
            message: 'Type must be either DEBIT or CREDIT',
        },
        required: [true, 'Type is required for creating a ledger entry'],
        immutable: true
    }
});

function preventLedgerModification() {
    throw new Error('Ledger entries cannot be modified or deleted once created');
}

// Pre hooks to prevent updates and deletions of ledger entries
ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);

const Ledger = mongoose.model('Ledger', ledgerSchema);
export default Ledger;


