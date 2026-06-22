import mongoose from 'mongoose';
import User from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://gauravshivmurat2_db_user:eoSQqm0JCVBdfkoG@mechpef1.squlcvh.mongodb.net/mechapef_db');
  
  const filter = { deletedAt: null };
  const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(5)
      .select('-password -emailVerificationToken -emailVerificationExpiry');
      
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
run();
