import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Sign a SuperAdmin token
const token = jwt.sign(
  { userId: "6a3922b1342859f3b87f649c", email: "gaurav.20249013@mnnit.ac.in", role: "SuperAdmin" },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: '1h' }
);

console.log("Token:", token);

// Now fetch from local backend (assuming it is running on PORT 5001)
fetch('http://localhost:5001/api/v1/auth/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error(err));
