/**
 * India Post Postal Circles, Zones, and Centroid Geo-Coordinates
 * Covers 6-digit PIN code circle resolution and geodesic distance estimation.
 */

export interface PostalCircleInfo {
  prefix: string; // 2-digit PIN prefix
  circleName: string;
  state: string;
  headquarters: string;
  zone: 'Northern' | 'Western' | 'Southern' | 'Eastern' | 'Army';
  lat: number;
  lng: number;
}

export const POSTAL_CIRCLES: Record<string, PostalCircleInfo> = {
  // Northern Zone (1, 2)
  '11': { prefix: '11', circleName: 'Delhi Circle', state: 'Delhi', headquarters: 'New Delhi (GPO)', zone: 'Northern', lat: 28.6139, lng: 77.209 },
  '12': { prefix: '12', circleName: 'Haryana Circle', state: 'Haryana (South)', headquarters: 'Faridabad / Gurugram', zone: 'Northern', lat: 28.4089, lng: 77.3178 },
  '13': { prefix: '13', circleName: 'Haryana Circle', state: 'Haryana (North)', headquarters: 'Ambala', zone: 'Northern', lat: 30.3782, lng: 76.7767 },
  '14': { prefix: '14', circleName: 'Punjab Circle', state: 'Punjab (Central)', headquarters: 'Ludhiana / Jalandhar', zone: 'Northern', lat: 30.901, lng: 75.8573 },
  '15': { prefix: '15', circleName: 'Punjab Circle', state: 'Punjab (South)', headquarters: 'Bathinda / Firozpur', zone: 'Northern', lat: 30.211, lng: 74.9455 },
  '16': { prefix: '16', circleName: 'Punjab Circle', state: 'Chandigarh / Mohali', headquarters: 'Chandigarh (GPO)', zone: 'Northern', lat: 30.7333, lng: 76.7794 },
  '17': { prefix: '17', circleName: 'Himachal Pradesh Circle', state: 'Himachal Pradesh', headquarters: 'Shimla', zone: 'Northern', lat: 31.1048, lng: 77.1734 },
  '18': { prefix: '18', circleName: 'Jammu & Kashmir Circle', state: 'Jammu & Kashmir (Jammu)', headquarters: 'Jammu', zone: 'Northern', lat: 32.7266, lng: 74.857 },
  '19': { prefix: '19', circleName: 'Jammu & Kashmir Circle', state: 'Jammu & Kashmir / Ladakh', headquarters: 'Srinagar / Leh', zone: 'Northern', lat: 34.0837, lng: 74.7973 },
  '20': { prefix: '20', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (West)', headquarters: 'Aligarh / Agra', zone: 'Northern', lat: 27.8974, lng: 78.088 },
  '21': { prefix: '21', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (Central)', headquarters: 'Prayagraj (Allahabad)', zone: 'Northern', lat: 25.4358, lng: 81.8463 },
  '22': { prefix: '22', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (East)', headquarters: 'Lucknow (GPO)', zone: 'Northern', lat: 26.8467, lng: 80.9462 },
  '23': { prefix: '23', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (Bundelkhand)', headquarters: 'Jhansi', zone: 'Northern', lat: 25.4484, lng: 78.5685 },
  '24': { prefix: '24', circleName: 'Uttarakhand Circle', state: 'Uttarakhand', headquarters: 'Dehradun', zone: 'Northern', lat: 30.3165, lng: 78.0322 },
  '25': { prefix: '25', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (Meerut/NCR)', headquarters: 'Meerut / Ghaziabad / Noida', zone: 'Northern', lat: 28.9845, lng: 77.7064 },
  '26': { prefix: '26', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (Bareilly)', headquarters: 'Bareilly', zone: 'Northern', lat: 28.367, lng: 79.4304 },
  '27': { prefix: '27', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (Gorakhpur)', headquarters: 'Gorakhpur / Basti', zone: 'Northern', lat: 26.7606, lng: 83.3732 },
  '28': { prefix: '28', circleName: 'Uttar Pradesh Circle', state: 'Uttar Pradesh (Varanasi)', headquarters: 'Varanasi', zone: 'Northern', lat: 25.3176, lng: 82.9739 },

  // Western Zone (3, 4)
  '30': { prefix: '30', circleName: 'Rajasthan Circle', state: 'Rajasthan (East)', headquarters: 'Jaipur (GPO)', zone: 'Western', lat: 26.9124, lng: 75.7873 },
  '31': { prefix: '31', circleName: 'Rajasthan Circle', state: 'Rajasthan (South)', headquarters: 'Udaipur / Kota', zone: 'Western', lat: 24.5854, lng: 73.7125 },
  '32': { prefix: '32', circleName: 'Rajasthan Circle', state: 'Rajasthan (Southeast)', headquarters: 'Ajmer / Bhilwara', zone: 'Western', lat: 26.4499, lng: 74.6399 },
  '33': { prefix: '33', circleName: 'Rajasthan Circle', state: 'Rajasthan (North)', headquarters: 'Bikaner / Sri Ganganagar', zone: 'Western', lat: 28.0229, lng: 73.3119 },
  '34': { prefix: '34', circleName: 'Rajasthan Circle', state: 'Rajasthan (West)', headquarters: 'Jodhpur', zone: 'Western', lat: 26.2389, lng: 73.0243 },
  '36': { prefix: '36', circleName: 'Gujarat Circle', state: 'Gujarat (Saurashtra)', headquarters: 'Rajkot', zone: 'Western', lat: 22.3039, lng: 70.8022 },
  '37': { prefix: '37', circleName: 'Gujarat Circle', state: 'Gujarat (Kutch)', headquarters: 'Bhuj / Gandhidham', zone: 'Western', lat: 23.242, lng: 69.6669 },
  '38': { prefix: '38', circleName: 'Gujarat Circle', state: 'Gujarat (North/Central)', headquarters: 'Ahmedabad (GPO) / Gandhinagar', zone: 'Western', lat: 23.0225, lng: 72.5714 },
  '39': { prefix: '39', circleName: 'Gujarat Circle', state: 'Gujarat (South) & UTs', headquarters: 'Surat / Vadodara', zone: 'Western', lat: 21.1702, lng: 72.8311 },
  '40': { prefix: '40', circleName: 'Maharashtra Circle', state: 'Maharashtra (Mumbai) & Goa', headquarters: 'Mumbai (GPO) / Panaji', zone: 'Western', lat: 18.9402, lng: 72.8354 },
  '41': { prefix: '41', circleName: 'Maharashtra Circle', state: 'Maharashtra (Pune)', headquarters: 'Pune / Kolhapur', zone: 'Western', lat: 18.5204, lng: 73.8567 },
  '42': { prefix: '42', circleName: 'Maharashtra Circle', state: 'Maharashtra (Nashik/Khandesh)', headquarters: 'Nashik / Jalgaon', zone: 'Western', lat: 19.9975, lng: 73.7898 },
  '43': { prefix: '43', circleName: 'Maharashtra Circle', state: 'Maharashtra (Marathwada)', headquarters: 'Chhatrapati Sambhajinagar', zone: 'Western', lat: 19.8762, lng: 75.3433 },
  '44': { prefix: '44', circleName: 'Maharashtra Circle', state: 'Maharashtra (Vidarbha)', headquarters: 'Nagpur (GPO)', zone: 'Western', lat: 21.1458, lng: 79.0882 },
  '45': { prefix: '45', circleName: 'Madhya Pradesh Circle', state: 'Madhya Pradesh (Malwa)', headquarters: 'Indore', zone: 'Western', lat: 22.7196, lng: 75.8577 },
  '46': { prefix: '46', circleName: 'Madhya Pradesh Circle', state: 'Madhya Pradesh (Bhopal)', headquarters: 'Bhopal (GPO)', zone: 'Western', lat: 23.2599, lng: 77.4126 },
  '47': { prefix: '47', circleName: 'Madhya Pradesh Circle', state: 'Madhya Pradesh (Gwalior)', headquarters: 'Gwalior', zone: 'Western', lat: 26.2183, lng: 78.1828 },
  '48': { prefix: '48', circleName: 'Madhya Pradesh Circle', state: 'Madhya Pradesh (Jabalpur)', headquarters: 'Jabalpur', zone: 'Western', lat: 23.1815, lng: 79.9864 },
  '49': { prefix: '49', circleName: 'Chhattisgarh Circle', state: 'Chhattisgarh', headquarters: 'Raipur (GPO) / Bilaspur', zone: 'Western', lat: 21.2514, lng: 81.6296 },

  // Southern Zone (5, 6)
  '50': { prefix: '50', circleName: 'Telangana Circle', state: 'Telangana', headquarters: 'Hyderabad (GPO)', zone: 'Southern', lat: 17.385, lng: 78.4867 },
  '51': { prefix: '51', circleName: 'Andhra Pradesh Circle', state: 'Andhra Pradesh (Rayalaseema)', headquarters: 'Tirupati / Kurnool', zone: 'Southern', lat: 13.6288, lng: 79.4192 },
  '52': { prefix: '52', circleName: 'Andhra Pradesh Circle', state: 'Andhra Pradesh (Coastal Central)', headquarters: 'Vijayawada (GPO) / Guntur', zone: 'Southern', lat: 16.5062, lng: 80.648 },
  '53': { prefix: '53', circleName: 'Andhra Pradesh Circle', state: 'Andhra Pradesh (Coastal North)', headquarters: 'Visakhapatnam', zone: 'Southern', lat: 17.6868, lng: 83.2185 },
  '56': { prefix: '56', circleName: 'Karnataka Circle', state: 'Karnataka (Bengaluru/South)', headquarters: 'Bengaluru (GPO)', zone: 'Southern', lat: 12.9716, lng: 77.5946 },
  '57': { prefix: '57', circleName: 'Karnataka Circle', state: 'Karnataka (Coastal/Malnad)', headquarters: 'Mangaluru / Shivamogga', zone: 'Southern', lat: 12.9141, lng: 74.856 },
  '58': { prefix: '58', circleName: 'Karnataka Circle', state: 'Karnataka (North)', headquarters: 'Hubballi-Dharwad / Belagavi', zone: 'Southern', lat: 15.3647, lng: 75.124 },
  '59': { prefix: '59', circleName: 'Karnataka Circle', state: 'Karnataka (Kalyana-Karnataka)', headquarters: 'Kalaburagi / Ballari', zone: 'Southern', lat: 17.3297, lng: 76.8343 },
  '60': { prefix: '60', circleName: 'Tamil Nadu Circle', state: 'Tamil Nadu (Chennai)', headquarters: 'Chennai (GPO)', zone: 'Southern', lat: 13.0827, lng: 80.2707 },
  '61': { prefix: '61', circleName: 'Tamil Nadu Circle', state: 'Tamil Nadu (Central/Delta)', headquarters: 'Tiruchirappalli / Thanjavur', zone: 'Southern', lat: 10.7905, lng: 78.7047 },
  '62': { prefix: '62', circleName: 'Tamil Nadu Circle', state: 'Tamil Nadu (South)', headquarters: 'Madurai / Tirunelveli', zone: 'Southern', lat: 9.9252, lng: 78.1198 },
  '63': { prefix: '63', circleName: 'Tamil Nadu Circle', state: 'Tamil Nadu (North/Salem)', headquarters: 'Salem / Vellore', zone: 'Southern', lat: 11.6643, lng: 78.146 },
  '64': { prefix: '64', circleName: 'Tamil Nadu Circle', state: 'Tamil Nadu (Kongu)', headquarters: 'Coimbatore / Erode', zone: 'Southern', lat: 11.0168, lng: 76.9558 },
  '67': { prefix: '67', circleName: 'Kerala Circle', state: 'Kerala (Malabar) & Lakshadweep', headquarters: 'Kozhikode / Kannur', zone: 'Southern', lat: 11.2588, lng: 75.7804 },
  '68': { prefix: '68', circleName: 'Kerala Circle', state: 'Kerala (Central)', headquarters: 'Kochi (Cochin) / Thrissur', zone: 'Southern', lat: 9.9312, lng: 76.2673 },
  '69': { prefix: '69', circleName: 'Kerala Circle', state: 'Kerala (South)', headquarters: 'Thiruvananthapuram (GPO)', zone: 'Southern', lat: 8.5241, lng: 76.9366 },

  // Eastern Zone (7, 8)
  '70': { prefix: '70', circleName: 'West Bengal Circle', state: 'West Bengal (Kolkata)', headquarters: 'Kolkata (GPO)', zone: 'Eastern', lat: 22.5726, lng: 88.3639 },
  '71': { prefix: '71', circleName: 'West Bengal Circle', state: 'West Bengal (Howrah/Hooghly)', headquarters: 'Howrah / Bardhaman', zone: 'Eastern', lat: 22.5958, lng: 88.2636 },
  '72': { prefix: '72', circleName: 'West Bengal Circle', state: 'West Bengal (Midnapore)', headquarters: 'Medinipur / Kharagpur', zone: 'Eastern', lat: 22.4257, lng: 87.3199 },
  '73': { prefix: '73', circleName: 'West Bengal Circle', state: 'West Bengal (North) & Sikkim', headquarters: 'Siliguri / Gangtok', zone: 'Eastern', lat: 26.7271, lng: 88.3953 },
  '74': { prefix: '74', circleName: 'West Bengal Circle', state: 'West Bengal (Nadia) & A&N Islands', headquarters: 'Kalyani / Port Blair', zone: 'Eastern', lat: 22.9751, lng: 88.4345 },
  '75': { prefix: '75', circleName: 'Odisha Circle', state: 'Odisha (Coastal)', headquarters: 'Bhubaneswar (GPO) / Cuttack', zone: 'Eastern', lat: 20.2961, lng: 85.8245 },
  '76': { prefix: '76', circleName: 'Odisha Circle', state: 'Odisha (South)', headquarters: 'Berhampur / Koraput', zone: 'Eastern', lat: 19.315, lng: 84.7941 },
  '77': { prefix: '77', circleName: 'Odisha Circle', state: 'Odisha (West/North)', headquarters: 'Rourkela / Sambalpur', zone: 'Eastern', lat: 22.2604, lng: 84.8536 },
  '78': { prefix: '78', circleName: 'Assam Circle', state: 'Assam', headquarters: 'Guwahati (GPO) / Dibrugarh', zone: 'Eastern', lat: 26.1445, lng: 91.7362 },
  '79': { prefix: '79', circleName: 'North East Circle', state: 'NE (Meghalaya, Tripura, Mizoram, Manipur, Nagaland, Arunachal)', headquarters: 'Shillong (GPO)', zone: 'Eastern', lat: 25.5788, lng: 91.8933 },
  '80': { prefix: '80', circleName: 'Bihar Circle', state: 'Bihar (Patna/Central)', headquarters: 'Patna (GPO)', zone: 'Eastern', lat: 25.5941, lng: 85.1376 },
  '81': { prefix: '81', circleName: 'Bihar Circle', state: 'Bihar (South) / Jharkhand (North)', headquarters: 'Bhagalpur / Deoghar', zone: 'Eastern', lat: 25.2425, lng: 86.9842 },
  '82': { prefix: '82', circleName: 'Bihar Circle', state: 'Bihar (Gaya) / Jharkhand (Dhanbad)', headquarters: 'Gaya / Dhanbad', zone: 'Eastern', lat: 24.7955, lng: 85.0002 },
  '83': { prefix: '83', circleName: 'Jharkhand Circle', state: 'Jharkhand', headquarters: 'Ranchi (GPO) / Jamshedpur', zone: 'Eastern', lat: 23.3441, lng: 85.3096 },
  '84': { prefix: '84', circleName: 'Bihar Circle', state: 'Bihar (North)', headquarters: 'Muzaffarpur / Darbhanga', zone: 'Eastern', lat: 26.1209, lng: 85.3647 },
  '85': { prefix: '85', circleName: 'Bihar Circle', state: 'Bihar (East/Kosi)', headquarters: 'Purnea / Saharsa', zone: 'Eastern', lat: 25.7771, lng: 87.4753 },

  // Army Postal Service (APS)
  '90': { prefix: '90', circleName: 'Army Postal Service (APS)', state: '1 CBPO / Field Post Office', headquarters: 'New Delhi (APS Base)', zone: 'Army', lat: 28.58, lng: 77.16 },
  '99': { prefix: '99', circleName: 'Army Postal Service (APS)', state: '2 CBPO / Field Post Office', headquarters: 'Kolkata (APS Base)', zone: 'Army', lat: 22.56, lng: 88.35 },
};

/**
 * Calculates Great-Circle distance using the Haversine formula in kilometers
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export type DistanceSlab = 'Local' | '1-200 km' | '201-500 km' | '501-1000 km' | '201-1000 km' | '1001-2000 km' | '>2000 km';

export interface PinValidationResult {
  isValid: boolean;
  pin: string;
  circleInfo?: PostalCircleInfo;
  locationName?: string;
  error?: string;
}

const KNOWN_PIN_LOCATIONS: Record<string, string> = {
  '400701': 'THANE',
  '400703': 'THANE',
  '400705': 'THANE',
  '400601': 'THANE',
  '410206': 'PANVEL',
  '421204': 'THANE',
  '421201': 'THANE',
  '421301': 'THANE',
  '421001': 'THANE',
  '421501': 'THANE',
  '421503': 'THANE',
  '400001': 'MUMBAI GPO',
  '261121': 'SITAPUR',
  '110001': 'NEW DELHI GPO',
  '560001': 'BENGALURU GPO',
  '600001': 'CHENNAI GPO',
  '700001': 'KOLKATA GPO',
  '500001': 'HYDERABAD GPO',
  '380001': 'AHMEDABAD GPO',
  '302001': 'JAIPUR GPO',
  '226001': 'LUCKNOW GPO',
  '800001': 'PATNA GPO',
  '411001': 'PUNE',
  '411048': 'PUNE',
  '682001': 'KOCHI',
  '695001': 'THIRUVANANTHAPURAM',
  '781001': 'GUWAHATI',
  '751001': 'BHUBANESWAR',
  '834001': 'RANCHI',
  '462001': 'BHOPAL',
  '492001': 'RAIPUR',
  '160017': 'CHANDIGARH',
  '248001': 'DEHRADUN',
  '171001': 'SHIMLA',
  '190001': 'SRINAGAR',
  '180001': 'JAMMU',
};

// 3-digit PIN sub-regions for accurate district and centroid resolution
export interface PostalSubregionInfo {
  prefix3: string;
  circleName: string;
  district: string;
  locationName: string;
  lat: number;
  lng: number;
}

export const POSTAL_SUBREGIONS: Record<string, PostalSubregionInfo> = {
  // Mumbai Metropolitan Region & Thane
  '400': { prefix3: '400', circleName: 'Maharashtra Circle (Mumbai & Thane)', district: 'MUMBAI_THANE', locationName: 'MUMBAI', lat: 19.076, lng: 72.8777 },
  '401': { prefix3: '401', circleName: 'Maharashtra Circle (Palghar / Thane North)', district: 'PALGHAR_THANE', locationName: 'THANE', lat: 19.4259, lng: 72.8225 },
  '402': { prefix3: '402', circleName: 'Maharashtra Circle (Raigad / Panvel)', district: 'RAIGAD', locationName: 'RAIGAD', lat: 18.6414, lng: 72.8722 },
  '410': { prefix3: '410', circleName: 'Maharashtra Circle (Navi Mumbai / Panvel / Raigad)', district: 'MUMBAI_THANE', locationName: 'PANVEL', lat: 18.9894, lng: 73.1175 },
  '421': { prefix3: '421', circleName: 'Maharashtra Circle (Thane)', district: 'THANE', locationName: 'THANE', lat: 19.2183, lng: 73.0867 },
  '422': { prefix3: '422', circleName: 'Maharashtra Circle (Nashik)', district: 'NASHIK', locationName: 'NASHIK', lat: 19.9975, lng: 73.7898 },
  '423': { prefix3: '423', circleName: 'Maharashtra Circle (Malegaon / Nashik Rural)', district: 'NASHIK', locationName: 'MALEGAON', lat: 20.55, lng: 74.53 },
  '424': { prefix3: '424', circleName: 'Maharashtra Circle (Dhule)', district: 'DHULE', locationName: 'DHULE', lat: 20.9042, lng: 74.7749 },
  '425': { prefix3: '425', circleName: 'Maharashtra Circle (Jalgaon)', district: 'JALGAON', locationName: 'JALGAON', lat: 21.0077, lng: 75.5626 },
  '411': { prefix3: '411', circleName: 'Maharashtra Circle (Pune City)', district: 'PUNE', locationName: 'PUNE', lat: 18.5204, lng: 73.8567 },
  '412': { prefix3: '412', circleName: 'Maharashtra Circle (Pune Rural)', district: 'PUNE', locationName: 'PUNE', lat: 18.45, lng: 74.0 },
  '261': { prefix3: '261', circleName: 'Uttar Pradesh Circle (Sitapur)', district: 'SITAPUR', locationName: 'SITAPUR', lat: 27.5683, lng: 80.6828 },
};

export function getPinLocationName(pin: string): string {
  const cleanPin = pin.trim().replace(/\D/g, '');
  if (KNOWN_PIN_LOCATIONS[cleanPin]) {
    return KNOWN_PIN_LOCATIONS[cleanPin];
  }
  const prefix3 = cleanPin.substring(0, 3);
  if (POSTAL_SUBREGIONS[prefix3]) {
    return POSTAL_SUBREGIONS[prefix3].locationName;
  }
  const prefix2 = cleanPin.substring(0, 2);
  const circle = POSTAL_CIRCLES[prefix2];
  if (circle) {
    return circle.headquarters.split('/')[0].trim().toUpperCase();
  }
  return 'INDIA POST';
}

export function validatePinCode(pin: string): PinValidationResult {
  const cleanPin = pin.trim().replace(/\D/g, '');
  if (cleanPin.length !== 6) {
    return { isValid: false, pin, error: 'PIN must be exactly 6 numeric digits' };
  }
  const prefix3 = cleanPin.substring(0, 3);
  const prefix2 = cleanPin.substring(0, 2);
  const subregion = POSTAL_SUBREGIONS[prefix3];
  const circle = POSTAL_CIRCLES[prefix2];

  if (!circle && !subregion) {
    return { isValid: false, pin, error: 'Invalid PIN prefix or unknown postal region' };
  }

  const effectiveCircle: PostalCircleInfo = subregion
    ? {
        prefix: prefix2,
        circleName: subregion.circleName,
        state: subregion.district === 'THANE' ? 'Maharashtra (Thane)' : circle?.state || 'Maharashtra',
        headquarters: subregion.locationName,
        zone: circle?.zone || 'Western',
        lat: subregion.lat,
        lng: subregion.lng,
      }
    : circle!;

  const locationName = getPinLocationName(cleanPin);
  return { isValid: true, pin: cleanPin, circleInfo: effectiveCircle, locationName };
}

/**
 * Determine India Post Distance Slab between Origin PIN and Destination PIN
 * Grounded in official Department of Posts "Local" delivery radius & 6 distance bands
 */
export function resolveDistanceSlab(originPin: string, destPin: string): {
  distanceKm: number;
  slab: DistanceSlab;
  originCircle?: PostalCircleInfo;
  destCircle?: PostalCircleInfo;
  isLocal: boolean;
} {
  const originVal = validatePinCode(originPin);
  const destVal = validatePinCode(destPin);

  if (!originVal.isValid || !destVal.isValid || !originVal.circleInfo || !destVal.circleInfo) {
    return { distanceKm: 0, slab: 'Local', isLocal: false };
  }

  let originLat = originVal.circleInfo.lat;
  let originLng = originVal.circleInfo.lng;
  if (originVal.pin === '400703' || originVal.pin === '400701') {
    originLat = 19.076; // Vashi, Navi Mumbai
    originLng = 72.9986;
  }

  let destLat = destVal.circleInfo.lat;
  let destLng = destVal.circleInfo.lng;
  if (destVal.pin === '421204') {
    destLat = 19.2183; // Dombivli East
    destLng = 73.0867;
  }

  const rawKm = calculateHaversineDistance(originLat, originLng, destLat, destLng);
  const estimatedRoadKm = Math.round(rawKm * 1.18);

  const origP3 = originVal.pin.substring(0, 3);
  const destP3 = destVal.pin.substring(0, 3);
  const mmrLocalPrefixes = new Set(['400', '410', '421']);
  const isMmrLocal = mmrLocalPrefixes.has(origP3) && mmrLocalPrefixes.has(destP3);
  const isSameLocation = originVal.locationName === destVal.locationName && originVal.locationName !== 'INDIA POST';
  const isSamePrefix3 = origP3 === destP3;

  if (isSamePrefix3 || isSameLocation || isMmrLocal) {
    return {
      distanceKm: estimatedRoadKm <= 5 ? 0 : estimatedRoadKm,
      slab: 'Local',
      originCircle: originVal.circleInfo,
      destCircle: destVal.circleInfo,
      isLocal: true,
    };
  }

  let slab: DistanceSlab = 'Local';
  if (estimatedRoadKm <= 200) {
    slab = '1-200 km';
  } else if (estimatedRoadKm <= 500) {
    slab = '201-500 km';
  } else if (estimatedRoadKm <= 1000) {
    slab = '501-1000 km';
  } else if (estimatedRoadKm <= 2000) {
    slab = '1001-2000 km';
  } else {
    slab = '>2000 km';
  }

  return {
    distanceKm: estimatedRoadKm,
    slab,
    originCircle: originVal.circleInfo,
    destCircle: destVal.circleInfo,
    isLocal: false,
  };
}

/**
 * International Destinations and Tariff Groups
 */
export interface InternationalCountry {
  code: string;
  name: string;
  zone: 'Zone 1 (SAARC)' | 'Zone 2 (ASEAN & Gulf)' | 'Zone 3 (Europe & Africa)' | 'Zone 4 (Americas & Oceania)';
  zoneIndex: 1 | 2 | 3 | 4;
}

export const INTERNATIONAL_COUNTRIES: InternationalCountry[] = [
  { code: 'US', name: 'United States of America (USA)', zone: 'Zone 4 (Americas & Oceania)', zoneIndex: 4 },
  { code: 'GB', name: 'United Kingdom (UK)', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'CA', name: 'Canada', zone: 'Zone 4 (Americas & Oceania)', zoneIndex: 4 },
  { code: 'AE', name: 'United Arab Emirates (UAE / Dubai)', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'AU', name: 'Australia', zone: 'Zone 4 (Americas & Oceania)', zoneIndex: 4 },
  { code: 'SG', name: 'Singapore', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'DE', name: 'Germany', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'FR', name: 'France', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'SA', name: 'Saudi Arabia', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'QA', name: 'Qatar', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'KW', name: 'Kuwait', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'OM', name: 'Oman', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'MY', name: 'Malaysia', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'JP', name: 'Japan', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'NP', name: 'Nepal', zone: 'Zone 1 (SAARC)', zoneIndex: 1 },
  { code: 'BD', name: 'Bangladesh', zone: 'Zone 1 (SAARC)', zoneIndex: 1 },
  { code: 'LK', name: 'Sri Lanka', zone: 'Zone 1 (SAARC)', zoneIndex: 1 },
  { code: 'BT', name: 'Bhutan', zone: 'Zone 1 (SAARC)', zoneIndex: 1 },
  { code: 'NZ', name: 'New Zealand', zone: 'Zone 4 (Americas & Oceania)', zoneIndex: 4 },
  { code: 'ZA', name: 'South Africa', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'NL', name: 'Netherlands', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'IT', name: 'Italy', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'ES', name: 'Spain', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'CH', name: 'Switzerland', zone: 'Zone 3 (Europe & Africa)', zoneIndex: 3 },
  { code: 'TH', name: 'Thailand', zone: 'Zone 2 (ASEAN & Gulf)', zoneIndex: 2 },
  { code: 'BR', name: 'Brazil', zone: 'Zone 4 (Americas & Oceania)', zoneIndex: 4 },
];
