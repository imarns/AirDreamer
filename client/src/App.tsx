import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select, { SingleValue, ActionMeta } from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';

// Define the interface for airport objects
interface Airport {
  airport_name: string;
  latitude: string;
  longitude: string;
  iata_code: string;
}

// Define the type for select options
interface SelectOption {
  value: string;
  label: string;
}

// Define the interface for sleep cycle result
interface SleepCycleResult {
  realFlightDuration: string;
  timeZoneDifference: string;
  sleepSuggestion: string;
  additionalAdvice: string;
}

function App() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [arrivalDate, setArrivalDate] = useState<Date | null>(new Date());
  const [fromAirport, setFromAirport] = useState<string>('');
  const [toAirport, setToAirport] = useState<string>('');
  const [sleepCycleResult, setSleepCycleResult] = useState<SleepCycleResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/airports');
        setAirports(response.data.data);
      } catch (error) {
        console.error('Error fetching airports:', error);
      }
    };
    fetchAirports();
  }, []);

  const handleDateChange = (date: Date | null, dateType: 'departure' | 'arrival') => {
    if (dateType === 'departure') {
      setDepartureDate(date);
    } else {
      setArrivalDate(date);
    }
  };

  const handleSelectChange = (selectedOption: SingleValue<SelectOption>, actionMeta: ActionMeta<SelectOption>) => {
    if (selectedOption) {
      if (actionMeta.name === 'fromAirport') {
        setFromAirport(selectedOption.value);
      } else if (actionMeta.name === 'toAirport') {
        setToAirport(selectedOption.value);
      }
    }
  };

  // Function to handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (departureDate && arrivalDate && fromAirport && toAirport) {
      fetch('/api/submit-flight-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departure: departureDate.toISOString(),
          arrival: arrivalDate.toISOString(),
          fromAirport,
          toAirport
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setSleepCycleResult(data.flightInfo.sleepCycle);
        setShowResult(true);
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to calculate sleep cycle. Please try again.');
      });
    } else {
      alert('Please fill in all the fields.');
    }
  };

  const airportOptions = airports.map(airport => ({
    value: airport.iata_code,
    label: airport.airport_name
  }));

  return (
    <motion.div 
      className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center items-center sm:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="relative py-3 w-full max-w-xl mx-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform sm:rounded-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        ></motion.div>
        <motion.div 
          className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="max-w-md mx-auto">
            <motion.h1 
              className="text-4xl font-extrabold text-gray-900 mb-6 text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              ✈️ Sleep Cycle Calculator 💤
            </motion.h1>
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">🛫 Departure Time</label>
                <DatePicker
                  selected={departureDate}
                  onChange={(date) => handleDateChange(date, 'departure')}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select Departure Time"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">🛬 Arrival Time</label>
                <DatePicker
                  selected={arrivalDate}
                  onChange={(date) => handleDateChange(date, 'arrival')}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select Arrival Time"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">🏙️ Departure Airport</label>
                <Select
                  name="fromAirport"
                  options={airportOptions}
                  onChange={handleSelectChange}
                  placeholder="Select Departure Airport"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">🌆 Arrival Airport</label>
                <Select
                  name="toAirport"
                  options={airportOptions}
                  onChange={handleSelectChange}
                  placeholder="Select Arrival Airport"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <motion.button 
                type="submit" 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Calculate Sleep Cycle 🧮
              </motion.button>
            </motion.form>
            <AnimatePresence>
              {showResult && sleepCycleResult && (
                <motion.div 
                  className="mt-8 p-6 bg-gray-50 rounded-lg shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">💤 Sleep Cycle Recommendation</h3>
                  <p className="text-sm text-gray-600 mb-2">⏱️ Real Flight Duration: {sleepCycleResult.realFlightDuration}</p>
                  <p className="text-sm text-gray-600 mb-2">🌐 Time Zone Difference: {sleepCycleResult.timeZoneDifference}</p>
                  {sleepCycleResult.sleepSuggestion.startsWith('Sleep Suggestion: It\'s recommended to stay awake') ? (
                    <p className="text-sm text-gray-600 mb-2">👀 {sleepCycleResult.sleepSuggestion}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">🛌 Sleep Start: {sleepCycleResult.sleepSuggestion.split('Sleep starting around ')[1].split(' and wake up')[0]}</p>
                      <p className="text-sm text-gray-600 mb-2">⏰ Sleep End: {sleepCycleResult.sleepSuggestion.split('wake up around ')[1]}</p>
                    </>
                  )}
                  <p className="text-sm text-gray-600">💡 {sleepCycleResult.additionalAdvice}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
      <motion.footer 
        className="w-full absolute bottom-0 py-4 text-center text-sm text-gray-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        Created by Arns © 2024 CloudBoyzz. All rights reserved.
      </motion.footer>
    </motion.div>
  );
}

export default App;