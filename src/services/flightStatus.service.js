// services/flightStatus.service.js
import axios from "axios";

const API_KEY = process.env.AVIATIONSTACK_KEY;

export const getFlightStatus = async (flightNumber) => {
  const res = await axios.get(`http://api.aviationstack.com/v1/flights`, {
    params: { access_key: API_KEY, flight_iata: flightNumber },
  });

  const data = res.data.data?.[0];
  if (!data) return null;

  return {
    airline: data.airline.name,
    flightNumber: data.flight.iata,
    status: data.flight_status,
    departure: data.departure.estimated,
    arrival: data.arrival.estimated,
    delay: data.departure.delay || 0,
  };
};
