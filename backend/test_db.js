import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  for (let u of users) {
    console.log(u.email + " -> " + u.role);
  }
  process.exit(0);
});
