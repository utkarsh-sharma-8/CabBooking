export const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name || "Unknown Location";
    } catch (error) {
      console.error("Geocoding Error:", error);
      return "Unknown Location";
    }
  };

export const getCoordinatesFromAddress = async (address) => {
  try {
      if (!address || address.trim() === "") {
          return null;
      }

      const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
          throw new Error(`Geocoding failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          if (isNaN(lat) || isNaN(lon)) {
              console.error("Invalid coordinates received from geocoding");
              return null;
          }

          return {
              latitude: lat,
              longitude: lon
          };
      }
      
      console.error("No results found for address:", address);
      return null;
  } catch (error) {
      console.error("Geocoding Error:", error);
      return null;
  }
};