import mongoose from 'mongoose';
import User from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://gauravshivmurat2_db_user:eoSQqm0JCVBdfkoG@mechpef1.squlcvh.mongodb.net/mechapef_db');
  const users = await User.find({ name: { $exists: false } }).lean();
  console.log("Users without name:", users.length);
  const users2 = await User.find({ name: null }).lean();
  console.log("Users with null name:", users2.length);
  process.exit(0);
}
run();
