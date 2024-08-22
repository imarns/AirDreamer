"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const sleepCycleCalculator_1 = require("./sleepCycleCalculator");
const dynamodb_1 = __importDefault(require("./dynamodb"));
const uuid_1 = require("uuid");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Define allowed origins based on the environment
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.CUSTOM_DOMAIN, `www.${process.env.CUSTOM_DOMAIN}`].filter(Boolean)
    : 'http://localhost:3000';
// Use CORS middleware with dynamic origin setting
app.use((0, cors_1.default)({
    origin: allowedOrigins,
}));
const port = 5000;
app.use(express_1.default.json());
// Initialize and cache airport data on server start
(0, sleepCycleCalculator_1.initializeAirportDataCache)()
    .then(() => console.log('Airport data cache initialized'))
    .catch(err => console.error('Failed to initialize airport data cache:', err));
// Endpoint to fetch airport data
app.get('/api/airports', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const airports = (0, sleepCycleCalculator_1.getAirportDataCache)(); // Retrieve from cache
        res.json({ data: airports });
    }
    catch (error) {
        console.error('Error fetching airports:', error);
        res.status(500).send('Error fetching airports');
    }
}));
// Endpoint to handle flight info submission
app.post('/api/submit-flight-info', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Received request body:', req.body);
        const { departure, arrival, fromAirport, toAirport } = req.body;
        // Calculate the sleep cycle with the parsed dates
        const sleepCycle = yield (0, sleepCycleCalculator_1.calculateSleepCycle)(departure, arrival, fromAirport, toAirport);
        console.log('Calculated sleep cycle:', sleepCycle);
        // Prepare and store data in DynamoDB
        const flightInfo = {
            id: (0, uuid_1.v4)(),
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
        yield dynamodb_1.default.put(params).promise();
        console.log('Flight info stored in DynamoDB:', flightInfo);
        res.json({ message: 'Flight info stored successfully!', flightInfo });
    }
    catch (error) {
        console.error('Error in /api/submit-flight-info:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
        else {
            res.status(500).json({ error: 'Internal Server Error', details: 'An unknown error occurred' });
        }
    }
}));
// Message to confirm that Backend is running
app.get('/', (req, res) => {
    res.send('Backend server is running, Ggs');
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
