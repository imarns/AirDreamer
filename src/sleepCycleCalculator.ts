import axios from 'axios';
import moment from 'moment-timezone';
import geoTz from 'geo-tz';
import 'dotenv/config';

// Define a type for airport data
interface AirportData {
  iata_code: string;
  latitude: string;
  longitude: string;
}

// Cache for storing airport data
let airportDataCache: AirportData[] = [];

// Helper function to format time in hours and minutes
const formatHoursAndMinutes = (totalHours: number): string => {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours % 1) * 60);
  return `${hours} hours and ${minutes} minutes`;
};

// Function to initialize the cache with airport data
export const initializeAirportDataCache = async () => {
  const apiKey = process.env.BACK_APP_AVIATIONSTACK_API_KEY;
  const url = `http://api.aviationstack.com/v1/airports?access_key=${apiKey}`;

  try {
      const response = await axios.get(url);
      airportDataCache = response.data.data as AirportData[];
  } catch (error) {
      console.error('Error initializing airport data cache:', error);
  }
};

// Function to get airport data from cache
export const getAirportDataCache = () => airportDataCache;

// Function to fetch timezone offset using moment-timezone and geo-tz
const getTimeZoneOffset = (latitude: number, longitude: number, date: Date): number => {
  const timezoneName = geoTz.find(latitude, longitude)[0];
  const timezone = moment.tz.zone(timezoneName);

  if (!timezone) {
    throw new Error('Time zone not found for given coordinates');
  }

  return timezone.utcOffset(date.getTime());
};

// Main function to calculate sleep cycle
export const calculateSleepCycle = async (
  departure: string,
  arrival: string,
  fromIataCode: string,
  toIataCode: string
) => {
  const fromAirportData = airportDataCache.find(airport => airport.iata_code === fromIataCode);
  const toAirportData = airportDataCache.find(airport => airport.iata_code === toIataCode);

  if (!fromAirportData || !toAirportData) {
      throw new Error('Airport data not found in cache');
  }

  // Get timezone names for departure and arrival airports
  const fromTimezoneName = geoTz.find(parseFloat(fromAirportData.latitude), parseFloat(fromAirportData.longitude))[0];
  const toTimezoneName = geoTz.find(parseFloat(toAirportData.latitude), parseFloat(toAirportData.longitude))[0];

  // Parse departure and arrival times in their respective timezones
  const departureTime = moment.tz(departure, fromTimezoneName);
  const arrivalTime = moment.tz(arrival, toTimezoneName);

  // Calculate timezone difference
  const timeZoneDifference = arrivalTime.utcOffset() - departureTime.utcOffset();
  const timeZoneDifferenceHours = timeZoneDifference / 60;

  // Calculate real flight duration
  const apparentDuration = arrivalTime.diff(departureTime, 'hours', true);
  const realFlightDuration = apparentDuration - timeZoneDifferenceHours;

  // Calculate optimal sleep time based on arrival time and flight duration
  let sleepStartTime: moment.Moment | null = null;
  let sleepEndTime: moment.Moment | null = null;
  let sleepSuggestion = '';

  const arrivalHour = arrivalTime.hour();
  
  if (arrivalHour >= 5 && arrivalHour < 14) {
    // Arriving in the morning or early afternoon
    // Aim to wake up about 1-2 hours before landing
    sleepEndTime = moment(arrivalTime).subtract(1.5, 'hours');
    sleepStartTime = moment(sleepEndTime).subtract(Math.min(realFlightDuration - 2, 8), 'hours');
  } else if (arrivalHour >= 14 && arrivalHour < 21) {
    // Arriving in the late afternoon or evening
    // Try to stay awake and sleep only if the flight is long enough
    if (realFlightDuration > 6) {
      sleepEndTime = moment(arrivalTime).subtract(2, 'hours');
      sleepStartTime = moment(sleepEndTime).subtract(Math.min(realFlightDuration - 4, 6), 'hours');
    } else {
      sleepSuggestion = `Sleep Suggestion: It's recommended to stay awake for this flight. The flight duration is ${formatHoursAndMinutes(realFlightDuration)}, which is relatively short. Staying awake will help you adjust to the destination time zone more quickly.`;
    }
  } else {
    // Arriving at night
    // Try to sleep towards the end of the flight
    sleepEndTime = moment(arrivalTime);
    sleepStartTime = moment(sleepEndTime).subtract(Math.min(realFlightDuration - 1, 7), 'hours');
  }

  // Ensure sleep doesn't start before departure
  if (sleepStartTime && sleepEndTime) {
    sleepStartTime = moment.max(departureTime, sleepStartTime);

    const sleepStartHours = sleepStartTime.diff(departureTime, 'hours', true);
    const sleepEndHours = sleepEndTime.diff(departureTime, 'hours', true);

    // Calculate total sleep duration
    const sleepDurationHours = sleepEndHours - sleepStartHours;

    // Use helper function to format durations
    const formattedSleepStart = formatHoursAndMinutes(sleepStartHours);
    const formattedSleepEnd = formatHoursAndMinutes(sleepEndHours);
    const sleepDurationFormatted = formatHoursAndMinutes(sleepDurationHours);

    // Calculate local time at destination for sleep start and end
    const sleepStartDestinationTime = sleepStartTime.tz(toTimezoneName).format('HH:mm');
    const sleepEndDestinationTime = sleepEndTime.tz(toTimezoneName).format('HH:mm');

    sleepSuggestion = `Sleep starting around ${formattedSleepStart} into the flight (${sleepStartDestinationTime} destination time) and wake up around ${formattedSleepEnd} into the flight (${sleepEndDestinationTime} destination time)`;
  }

  const formattedRealFlightDuration = formatHoursAndMinutes(realFlightDuration);
  const formattedTimeZoneDifference = formatHoursAndMinutes(Math.abs(timeZoneDifferenceHours));

  return {
    realFlightDuration: formattedRealFlightDuration,
    timeZoneDifference: `${timeZoneDifferenceHours >= 0 ? '+' : '-'}${formattedTimeZoneDifference}`,
    sleepSuggestion,
    additionalAdvice: sleepSuggestion.startsWith('Sleep Suggestion: It\'s recommended to stay awake') ?
      `Try to adjust your sleep schedule to the destination time zone a few days before your flight. Stay hydrated and avoid caffeine and alcohol. After arrival, expose yourself to sunlight to help reset your circadian rhythm. Happy and healthy travels!` :
      `Try to adjust your sleep schedule to the destination time zone a few days before your flight. During the flight, aim to sleep when it's nighttime at your destination. Stay hydrated and avoid caffeine and alcohol. Consider using a sleep mask and earplugs. After arrival, expose yourself to sunlight to help reset your circadian rhythm. Happy and healthy travels!`
  };
};

// Explanation of the updated sleep cycle calculation:
// 1. We now consider the arrival time at the destination to determine the optimal sleep schedule.
// 2. For morning/early afternoon arrivals, we aim to wake up 1-2 hours before landing.
// 3. For late afternoon/evening arrivals, we suggest staying awake if possible, or having a shorter sleep if the flight is long.
// 4. For night arrivals, we recommend sleeping towards the end of the flight.
// 5. We still ensure that sleep doesn't start too early in the flight and cap the maximum sleep duration.
// 6. We provide sleep start and end times in both flight duration and destination local time.
// 7. For very short flights or when staying awake is recommended, we indicate this in a single sleep suggestion message and adjust the additional advice accordingly.
