import User from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import { sendRegisterEmail } from '../services/emailService.js';
import TokenBlacklist from '../models/BlacklistMode.js';

export const register = async (req, res) => {
    const { email, password, name } = req.body;

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
        return res.status(422).json({ message: 'Email already exists', status: "failed" });
    }

    // Create a new user instance and save it to the database
    const user = new User({ email, password, name });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '3d'
    });
    res.cookie("token", token);

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });

    await sendRegisterEmail(user.email, user.name);
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email }).select('+password'); // Include the password field for comparison

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '3d'
    });
    res.cookie("token", token);

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
}

export const logout = async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: 'Token is required for logout' });
    }

    await TokenBlacklist.create({ token: token });

    res.clearCookie("token");

    res.status(200).json({ message: 'Logged out successfully' });

}