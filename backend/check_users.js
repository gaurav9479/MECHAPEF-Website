import mongoose from 'mongoose';
import User from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://gauravshivmurat2_db_user:eoSQqm0JCVBdfkoG@mechpef1.squlcvh.mongodb.net/mechapef_db');
  const users = await User.find({}).sort({createdAt: -1}).limit(5).lean();
  console.log(JSON.stringify(users.map(u => ({ id: u._id, name: u.name, email: u.email, regNo: u.collegeRegNo, initials: u.initials })), null, 2));
  process.exit(0);
}
run();
