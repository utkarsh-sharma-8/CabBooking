import axios from "axios";
import { baseUrl } from "../../../utils/constants";

const fetchInitialData = async (latitude, longitude) => {
  try {
    console.log("Making API call..."); // Debugging
    const response = await axios.post(`${baseUrl}get-all-cabs`, { latitude, longitude });

    console.log("Fetched Data:", response.data);

    if (response.data.success && response.data.data.length > 0) {
      return response.data.data.map(car => ({
        id: car._id,
        latitude: car.location.coordinates[1], // Extract latitude
        longitude: car.location.coordinates[0], // Extract longitude
        car_no: car.car_no,
        name: car.name
      }));
    }

    return []; // Return empty array if no cars found
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return []; // Return empty array in case of error
  }
};

export default fetchInitialData;
