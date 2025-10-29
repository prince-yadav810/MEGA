const axios = require('axios');

/**
 * Reverse geocode coordinates to get address details
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * For production, consider using Google Maps API or other paid services for better accuracy
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Object} Address details
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'MEGA-Management-System/1.0'
      }
    });

    const data = response.data;

    if (!data || data.error) {
      throw new Error('Unable to fetch address for the given coordinates');
    }

    const address = data.address || {};

    // Format the full address
    const formattedAddress = data.display_name || 'Unknown location';

    return {
      address: formattedAddress,
      city: address.city || address.town || address.village || address.county || '',
      state: address.state || address.region || '',
      country: address.country || '',
      postalCode: address.postcode || '',
      coordinates: {
        latitude,
        longitude
      }
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);

    // Return a fallback response with coordinates
    return {
      address: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: '',
      state: '',
      country: '',
      postalCode: '',
      coordinates: {
        latitude,
        longitude
      }
    };
  }
};

/**
 * Validate coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean}
 */
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return false;
  }

  if (lat < -90 || lat > 90) {
    return false;
  }

  if (lon < -180 || lon > 180) {
    return false;
  }

  return true;
};

module.exports = {
  reverseGeocode,
  validateCoordinates
};
