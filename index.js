import app from './src/app.js';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

dotenv.config();


connectDB();

app.listen(3000, () => {
    console.log('Server is running on port http://localhost:3000');
});