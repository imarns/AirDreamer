import express from 'express';
import 'dotenv/config';
import { calculateSleepCycle, initializeAirportDataCache, getAirportDataCache } from './sleepCycleCalculator';
import dynamoDB from './dynamodb';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';


const app = express();

// Define allowed origins based on the environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CUSTOM_DOMAIN, `www.${process.env.CUSTOM_DOMAIN}`].filter(Boolean) as string[]
  : 'http://localhost:3000';

// Use CORS middleware with dynamic origin setting
app.use(cors({
  origin: allowedOrigins,
}));

const port = 5000;
app.use(express.json());


// Initialize and cache airport data on server start
initializeAirportDataCache()
  .then(() => console.log('Airport data cache initialized'))
  .catch(err => console.error('Failed to initialize airport data cache:', err));

// Endpoint to fetch airport data
app.get('/api/airports', async (req, res) => {
  try {
    const airports = getAirportDataCache(); // Retrieve from cache
    res.json({ data: airports });
  } catch (error) {
    console.error('Error fetching airports:', error);
    res.status(500).send('Error fetching airports');
  }
});

// Endpoint to handle flight info submission
app.post('/api/submit-flight-info', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { departure, arrival, fromAirport, toAirport } = req.body;

    // Calculate the sleep cycle with the parsed dates
    const sleepCycle = await calculateSleepCycle(departure, arrival, fromAirport, toAirport);
    console.log('Calculated sleep cycle:', sleepCycle);

    // Prepare and store data in DynamoDB
    const flightInfo = {
      id: uuidv4(),
      departure,
      arrival,
      fromAirport,
      toAirport,
      sleepCycle
    };

    const params = {
      TableName: 'FlightInfo', // Use your DynamoDB table name
      Item: flightInfo
    };

    // Store in DynamoDB
    await dynamoDB.put(params).promise();
    console.log('Flight info stored in DynamoDB:', flightInfo);

    res.json({ message: 'Flight info stored successfully!', flightInfo });
  } catch (error) {
    console.error('Error in /api/submit-flight-info:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error', details: 'An unknown error occurred' });
    }
  }
});


// Message to confirm that Backend is running
app.get('/', (req, res) => {
    res.send('Backend server is running, Ggs');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
