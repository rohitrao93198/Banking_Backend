import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists'],
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    name: {
        type: String,
        required: [true, 'Name is required for creating an account'],
    },
    password: {
        type: String,
        required: [true, 'Password is required for creating an account'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, {
    timestamps: true
});

// Hash the password before saving the user
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;

    return;
});

// Method to compare the provided password with the stored hashed password
userSchema.methods.comparePassword = async function (password) {
    console.log(password, this.password);
    return await bcrypt.compare(password, this.password);
}

const User = mongoose.model('User', userSchema);
export default User;