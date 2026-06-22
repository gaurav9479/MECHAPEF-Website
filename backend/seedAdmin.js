import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './.env' }); // Assuming we cd into backend

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('DB Connected');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const email = 'gaurav.20249013@mnnit.ac.in';
    const hashedPassword = await bcrypt.hash('gaurav', 10);
    
    await usersCollection.updateOne(
      { email },
      {
        $set: {
          name: 'Gaurav',
          email: email,
          password: hashedPassword,
          collegeRegNo: '20249013',
          role: 'SuperAdmin',
          isVerified: true,
          isActive: true,
          branch: 'Mechanical Engineering',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          registeredEvents: [],
          deletedAt: null
        }
      },
      { upsert: true }
    );
    
    console.log('SuperAdmin seeded successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
