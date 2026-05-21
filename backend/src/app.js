import express from 'express';
import 'dotenv/config';
import {
    corsConfig,
    helmetConfig,
    generalLimiter,
    errorHandler,
    requestLogger,
    cookieParserConfig,
    notFoundHandler,
    trustProxy
} from './middleware/security.js';
import apiRoutes from './routes/index.js';
import { bodyParserConfig } from './middleware/security.js';

const app = express();

trustProxy(app);

app.use(express.json(bodyParserConfig));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


app.use(helmetConfig);
app.use(corsConfig);
app.use(cookieParserConfig);
app.use(generalLimiter);
app.use(requestLogger);
app.use('/api', apiRoutes);


app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Mechapef Backend Server Running',
        timestamp: new Date().toISOString()
    });
});

app.use(notFoundHandler);

app.use(errorHandler);

export default app;

