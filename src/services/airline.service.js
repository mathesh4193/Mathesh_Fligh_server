import axios from "axios";

// Example: aviationstack (adjust params to your provider)
const api = axios.create({
  baseURL: process.env.AIRLINE_API_BASE
});

export const fetchFlightStatus = async ({ flightNumber, date }) => {
  const { data } = await api.get("/flights", {
    params: {
      access_key: process.env.AIRLINE_API_KEY,
      flight_iata: flightNumber,
      flight_date: date
    }
  });
  return data; // normalize in job
};
