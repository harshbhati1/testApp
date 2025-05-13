const axios = require('axios');

const cache = new Map();
const CACHE_TTL = (process.env.CLEARBIT_CACHE_MIN || 60) * 60 * 1000; // minutes to ms

async function searchCompanies(query) {
  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await axios.get(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`
    );
    
    const data = response.data;
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error('Clearbit API error:', error);
    return [];
  }
}

module.exports = { searchCompanies }; 