import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mechapef';

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('MongoDB connected successfully');

        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', false); 
        }

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('MongoDB error:', error);
});

export default connectDB;
