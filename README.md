Sleep Cycle Flight Planner ✈️💤

-----------------------------------
Sleep Cycle Flight Planner is a web application designed to help travelers optimize their sleep schedules during flights. By entering your departure and arrival times, along with the airports you’re traveling between, the app calculates the best times to sleep or stay awake, ensuring you sync with the destination's time zone. This helps minimize jet lag and allows you to adjust smoothly to the local time at your destination.

-----------------------------------

Features
- Flight Sleep Schedule Calculation: Provides suggestions on when to sleep during your flight to best adjust to the destination's time zone.
- Airport Data Integration: Uses real-world airport data to calculate timezone differences.
- User-Friendly Interface: Simple and intuitive UI to input flight details.
- Data Persistence: Stores flight information using AWS DynamoDB for future reference.

-----------------------------------

Setup Instructions
Prerequisites
- Node.js: Make sure you have Node.js installed.
- AWS SDK: Ensure you have AWS credentials configured if you plan to use DynamoDB.
- React: Basic understanding of React for frontend development.

-----------------------------------

Installation
1. Clone the Repository:

    git clone https://github.com/imarns/AirDreamer.git
    cd AirDreamer

2. Install Backend Dependencies:

    npm install

3. Install Frontend Dependencies:

    cd ../client
    npm install

4. Set Up Backend Environment Variables:

In the root folder, create a .env file with your API key using .env.example for reference:

    BACK_APP_AVIATIONSTACK_API_KEY=<INSERT YOUR AVIATIONSTACK API KEY HERE>
    

5. Inside the root folder, start the Backend Server:

    npx tsc
    node dist/index.js

Open your web browser and navigate to http://localhost:5000/ to confirm the backend is running.

6. Inside the client folder, start the Frontend Development Server:

    cd ../client
    npm start

-----------------------------------

Usage
1. Access the Application:
Open your web browser and navigate to http://localhost:3000.

2. Input Flight Details:

Departure Time: Use the date picker to select your flight's departure time.
Arrival Time: Use the date picker to select your flight's arrival time.
Departure Airport: Select the airport you're flying from.
Arrival Airport: Select the airport you're flying to.

3. Calculate Sleep Cycle:
Click on "Calculate Sleep Cycle" to receive recommendations on when to sleep or stay awake during your flight.

4. View Recommendations:
The app will display:

Real Flight Duration
Time Zone Difference
Sleep Start and End Times
Additional Travel Advice

-----------------------------------

Project Structure

src/index.ts: Sets up the Express server, handles API endpoints, and initializes airport data cache.
serc/sleepCycleCalculator.ts: Contains the core logic for calculating the optimal sleep cycle based on flight details.
src/dynamodb.ts: Configures and interacts with AWS DynamoDB to store flight information.
client/App.tsx: The main React component for the frontend, handling user inputs, form submissions, and displaying the sleep cycle recommendations.

-----------------------------------

AWS DynamoDB Configuration

Region: Ensure that your DynamoDB table is set up in the region specified in dynamodb.ts.
Table Name: Modify the table name in the params object in index.ts to match your DynamoDB table.