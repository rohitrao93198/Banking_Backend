import Account from "../models/AccountModel.js";

export const createAccount = async (req, res) => {

    const user = req.user; // Get the authenticated user from the request

    const account = await Account.create({
        user: user._id, // Associate the account with the authenticated user's ID
    });

    res.status(201).json({
        account
    });
}

export const getAccounts = async (req, res) => {
    const accounts = await Account.find({ user: req.user._id }); // Fetch accounts associated with the authenticated user

    res.status(200).json({
        accounts
    });
}

export const getAccountBalance = async (req, res) => {
    const { accountId } = req.params;

    const account = await Account.findOne({
        _id: accountId,
        user: req.user._id
    })// Ensure the account belongs to the authenticated user

    if (!account) {
        return res.status(404).json({ message: 'Account not found' });
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance
    });
}