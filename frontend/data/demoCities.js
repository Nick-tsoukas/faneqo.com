/**
 * Demo cities for analytics and moment creation
 */

export const demoCities = [
  { name: 'Los Angeles', state: 'CA', country: 'US', lat: 34.0522, lon: -118.2437 },
  { name: 'New York', state: 'NY', country: 'US', lat: 40.7128, lon: -74.0060 },
  { name: 'Chicago', state: 'IL', country: 'US', lat: 41.8781, lon: -87.6298 },
  { name: 'Austin', state: 'TX', country: 'US', lat: 30.2672, lon: -97.7431 },
  { name: 'Nashville', state: 'TN', country: 'US', lat: 36.1627, lon: -86.7816 },
  { name: 'Seattle', state: 'WA', country: 'US', lat: 47.6062, lon: -122.3321 },
  { name: 'Denver', state: 'CO', country: 'US', lat: 39.7392, lon: -104.9903 },
  { name: 'Atlanta', state: 'GA', country: 'US', lat: 33.7490, lon: -84.3880 },
  { name: 'Miami', state: 'FL', country: 'US', lat: 25.7617, lon: -80.1918 },
  { name: 'Portland', state: 'OR', country: 'US', lat: 45.5152, lon: -122.6784 },
  { name: 'San Francisco', state: 'CA', country: 'US', lat: 37.7749, lon: -122.4194 },
  { name: 'Boston', state: 'MA', country: 'US', lat: 42.3601, lon: -71.0589 },
  { name: 'Philadelphia', state: 'PA', country: 'US', lat: 39.9526, lon: -75.1652 },
  { name: 'Detroit', state: 'MI', country: 'US', lat: 42.3314, lon: -83.0458 },
  { name: 'Minneapolis', state: 'MN', country: 'US', lat: 44.9778, lon: -93.2650 },
  { name: 'Phoenix', state: 'AZ', country: 'US', lat: 33.4484, lon: -112.0740 },
  { name: 'San Diego', state: 'CA', country: 'US', lat: 32.7157, lon: -117.1611 },
  { name: 'Dallas', state: 'TX', country: 'US', lat: 32.7767, lon: -96.7970 },
  { name: 'Houston', state: 'TX', country: 'US', lat: 29.7604, lon: -95.3698 },
  { name: 'Cleveland', state: 'OH', country: 'US', lat: 41.4993, lon: -81.6944 },
]

export function getRandomCity() {
  return demoCities[Math.floor(Math.random() * demoCities.length)]
}

export function getCityByName(name) {
  return demoCities.find(c => c.name.toLowerCase() === name.toLowerCase())
}
