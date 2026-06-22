import mongoose from 'mongoose';
import User from './src/models/User.js';

mongoose.connect('mongodb://127.0.0.1:27017/mechapef')
  .then(async () => {
    const users = await User.find().sort({createdAt: -1}).limit(5);
    console.log(users.map(u => ({ name: u.name, email: u.email, role: u.role, isVerified: u.isVerified })));
    process.exit(0);
  });
