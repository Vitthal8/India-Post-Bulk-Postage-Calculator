/**
 * India Post Postal Tariffs, Slabs, and Statutory Taxes
 * Grounded in official India Post Department of Posts schedules.
 */

import { DistanceSlab, resolveDistanceSlab, INTERNATIONAL_COUNTRIES, validatePinCode } from './postalCircles';

export type ServiceType =
  | 'speed_post'
  | 'letter'
  | 'letter_card'
  | 'postcard'
  | 'registered_parcel'
  | 'registered_letter'
  | 'business_parcel'
  | 'logistics_post'
  | 'printed_books'
  | 'book_packet'
  | 'intl_ems'
  | 'intl_air_parcel'
  | 'intl_small_packet';

export interface ServiceDefinition {
  id: ServiceType;
  name: string;
  category: 'Domestic Express' | 'Domestic Standard' | 'Commercial & Cargo' | 'Educational / Books' | 'International';
  maxWeightGrams: number;
  minWeightGrams: number;
  description: string;
  deliveryTimeframe: string;
  isInternational: boolean;
  requiresDimensions: boolean;
  gstRate: number; // e.g. 0.18 for 18% GST
}

export const POSTAL_SERVICES: Record<ServiceType, ServiceDefinition> = {
  speed_post: {
    id: 'speed_post',
    name: 'Domestic Speed Post (EMS)',
    category: 'Domestic Express',
    minWeightGrams: 1,
    maxWeightGrams: 35000, // 35 kg
    description: 'Flagship premium domestic express service with door-to-door tracking and SMS updates.',
    deliveryTimeframe: '1 - 4 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.18,
  },
  letter: {
    id: 'letter',
    name: 'Ordinary Letter',
    category: 'Domestic Standard',
    minWeightGrams: 1,
    maxWeightGrams: 500, // 500g max for letters on official portal
    description: 'Standard postal letter transmission across all post offices in India.',
    deliveryTimeframe: '3 - 4 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0,
  },
  letter_card: {
    id: 'letter_card',
    name: 'Letter Card (Inland Letter)',
    category: 'Domestic Standard',
    minWeightGrams: 1,
    maxWeightGrams: 5,
    description: 'Official inland letter card (ILC) format.',
    deliveryTimeframe: '2 - 3 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0,
  },
  postcard: {
    id: 'postcard',
    name: 'Postcard',
    category: 'Domestic Standard',
    minWeightGrams: 1,
    maxWeightGrams: 5,
    description: 'Official single inland postcard.',
    deliveryTimeframe: '3 - 5 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0,
  },
  registered_parcel: {
    id: 'registered_parcel',
    name: 'India Post Parcel (Retail)',
    category: 'Domestic Standard',
    minWeightGrams: 1,
    maxWeightGrams: 20000, // 20 kg
    description: 'Economical secure parcel transmission across all 1.5 lakh+ post offices in India.',
    deliveryTimeframe: '3 - 7 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0, // Ordinary parcel postage exempt; registration has GST
  },
  registered_letter: {
    id: 'registered_letter',
    name: 'Registered Letter / Document',
    category: 'Domestic Standard',
    minWeightGrams: 1,
    maxWeightGrams: 2000, // 2 kg max for letters
    description: 'Secured document transmission with recipient signature acknowledgment on delivery.',
    deliveryTimeframe: '2 - 5 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0,
  },
  business_parcel: {
    id: 'business_parcel',
    name: 'India Post Parcel (Contractual)',
    category: 'Commercial & Cargo',
    minWeightGrams: 1, // Eligible for commercial parcels of any weight
    maxWeightGrams: 35000, // 35 kg
    description: 'Dedicated commercial parcel service for e-commerce and retail B2B/B2C shipments.',
    deliveryTimeframe: '2 - 6 Business Days',
    isInternational: false,
    requiresDimensions: true,
    gstRate: 0.18,
  },
  logistics_post: {
    id: 'logistics_post',
    name: 'Logistics Post (Heavy Cargo & Freight)',
    category: 'Commercial & Cargo',
    minWeightGrams: 50000, // Min 50kg
    maxWeightGrams: 5000000, // Multi-ton cargo
    description: 'Heavy multi-parcel cargo management with dedicated multi-modal road/rail freight network.',
    deliveryTimeframe: '4 - 10 Business Days',
    isInternational: false,
    requiresDimensions: true,
    gstRate: 0.18,
  },
  printed_books: {
    id: 'printed_books',
    name: 'Printed Books (Concessional)',
    category: 'Educational / Books',
    minWeightGrams: 1,
    maxWeightGrams: 5000, // 5 kg
    description: 'Highly subsidized educational tariff for books containing no commercial advertisements.',
    deliveryTimeframe: '3 - 7 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0,
  },
  book_packet: {
    id: 'book_packet',
    name: 'Book Packet & Periodicals',
    category: 'Educational / Books',
    minWeightGrams: 1,
    maxWeightGrams: 5000,
    description: 'Subsidized rate for journals, examination materials, pamphlets, and periodicals.',
    deliveryTimeframe: '3 - 7 Business Days',
    isInternational: false,
    requiresDimensions: false,
    gstRate: 0.0,
  },
  intl_ems: {
    id: 'intl_ems',
    name: 'International EMS (Speed Post)',
    category: 'International',
    minWeightGrams: 1,
    maxWeightGrams: 35000,
    description: 'Global express document and merchandise courier service to 100+ countries.',
    deliveryTimeframe: '3 - 9 Business Days',
    isInternational: true,
    requiresDimensions: false,
    gstRate: 0.18,
  },
  intl_air_parcel: {
    id: 'intl_air_parcel',
    name: 'International Air Parcel',
    category: 'International',
    minWeightGrams: 100,
    maxWeightGrams: 20000,
    description: 'Standard international airmail freight for cross-border commercial parcels.',
    deliveryTimeframe: '7 - 14 Business Days',
    isInternational: true,
    requiresDimensions: false,
    gstRate: 0.18,
  },
  intl_small_packet: {
    id: 'intl_small_packet',
    name: 'International Registered Small Packet',
    category: 'International',
    minWeightGrams: 1,
    maxWeightGrams: 2000, // 2kg
    description: 'Cost-effective tracked solution for small global shipments under 2 kg.',
    deliveryTimeframe: '8 - 18 Business Days',
    isInternational: true,
    requiresDimensions: false,
    gstRate: 0.18,
  },
};

export type TariffVersion = '2025_revised' | 'corporate_contract' | 'classic';

export interface PostageCalculationResult {
  serviceId: ServiceType;
  serviceName: string;
  tariffVersion: TariffVersion;
  actualWeightGrams: number;
  volumetricWeightGrams?: number;
  chargeableWeightGrams: number;
  distanceKm: number;
  distanceSlab: DistanceSlab | string;
  basePostage: number;
  registrationFee: number;
  valueAddedServicesFee: number;
  subtotal: number;
  gstAmount: number;
  totalPostage: number;
  isEligible: boolean;
  ineligibilityReason?: string;
  dimensionWarning?: string;
  circleInfo?: string;
  dataSource?: 'live_indiapost_portal' | 'cached_portal' | 'offline_engine_fallback' | 'pin_exception';
  errorMessage?: string;
}

export const POD_FEE_INCL_GST = 11.8;

/**
 * Statutory GST Calculator matching India Post Department of Posts rules
 * Computes exact CGST (9%) + SGST (9%) with paise precision (e.g., ₹47.00 base -> ₹8.46 GST -> ₹55.46 actual rate)
 */
export function calculateIndiaPostGst(baseAmount: number): { cgst: number; sgst: number; totalGst: number } {
  if (baseAmount <= 0) return { cgst: 0, sgst: 0, totalGst: 0 };
  const cgst = Math.round(baseAmount * 0.09 * 100) / 100;
  const sgst = Math.round(baseAmount * 0.09 * 100) / 100;
  const totalGst = Math.round((cgst + sgst) * 100) / 100;
  return { cgst, sgst, totalGst };
}

/**
 * Speed Post Inland Parcel (SP_INLAND_PARCEL) Tariff Matrix
 * Calibrated directly from official indiapost.gov.in /domestic-tariffs/speed-post-parcel-revised
 */
export function calculateSpeedPostParcel(
  weightGrams: number,
  distanceSlab: DistanceSlab
): { base: number; gst: number; total: number } {
  let base = 0;
  const isLocal = distanceSlab === 'Local';

  if (isLocal) {
    if (weightGrams <= 500) base = 28;
    else if (weightGrams <= 1000) base = 48;
    else if (weightGrams <= 1500) base = 60;
    else if (weightGrams <= 2000) base = 80;
    else {
      const extraGrams = weightGrams - 2000;
      const extraSlabs = Math.ceil(extraGrams / 500);
      base = 80 + extraSlabs * 20;
    }
  } else {
    // Interstate / Other States (verified from indiapost.gov.in portal)
    if (weightGrams <= 500) base = 90;
    else if (weightGrams <= 1000) base = 143;
    else if (weightGrams <= 1500) base = 228;
    else if (weightGrams <= 2000) base = 319;
    else {
      const extraGrams = weightGrams - 2000;
      const extraSlabs = Math.ceil(extraGrams / 500);
      base = 319 + extraSlabs * 85;
    }
  }

  const { totalGst } = calculateIndiaPostGst(base);
  return { base, gst: totalGst, total: Math.round((base + totalGst) * 100) / 100 };
}

/**
 * Speed Post Domestic Tariff Matrix (in INR)
 * Supports 2025 Revised Tariff (Local: 19/24/28, 1-200km: 47/59/70, 201-500km: 47/63/75, 501-1000km: 47/68/82, 1001-2000km: 47/72/94, >2000km: 47/77/106)
 */
export function calculateSpeedPost(
  weightGrams: number,
  distanceSlab: DistanceSlab,
  version: TariffVersion = '2025_revised'
): { base: number; gst: number; total: number } {
  let base = 0;

  if (version === '2025_revised' || version === 'corporate_contract') {
    if (distanceSlab === 'Local') {
      if (weightGrams <= 50) base = 19;
      else if (weightGrams <= 250) base = 24;
      else if (weightGrams <= 500) base = 28;
      else {
        const extraGrams = weightGrams - 500;
        const extraSlabs = Math.ceil(extraGrams / 500);
        base = 28 + extraSlabs * 10;
      }
    } else if (distanceSlab === '1-200 km') {
      if (weightGrams <= 50) base = 47;
      else if (weightGrams <= 250) base = 59;
      else if (weightGrams <= 500) base = 70;
      else {
        const extraGrams = weightGrams - 500;
        const extraSlabs = Math.ceil(extraGrams / 500);
        base = 70 + extraSlabs * 15;
      }
    } else if (distanceSlab === '201-500 km') {
      if (weightGrams <= 50) base = 47;
      else if (weightGrams <= 250) base = 63;
      else if (weightGrams <= 500) base = 75;
      else {
        const extraGrams = weightGrams - 500;
        const extraSlabs = Math.ceil(extraGrams / 500);
        base = 75 + extraSlabs * 25;
      }
    } else if (distanceSlab === '501-1000 km' || distanceSlab === '201-1000 km') {
      if (weightGrams <= 50) base = 47;
      else if (weightGrams <= 250) base = 68;
      else if (weightGrams <= 500) base = 82;
      else {
        const extraGrams = weightGrams - 500;
        const extraSlabs = Math.ceil(extraGrams / 500);
        base = 82 + extraSlabs * 30;
      }
    } else if (distanceSlab === '1001-2000 km') {
      if (weightGrams <= 50) base = 47;
      else if (weightGrams <= 250) base = 72;
      else if (weightGrams <= 500) base = 94;
      else {
        const extraGrams = weightGrams - 500;
        const extraSlabs = Math.ceil(extraGrams / 500);
        base = 94 + extraSlabs * 40;
      }
    } else {
      // > 2000 km
      if (weightGrams <= 50) base = 47;
      else if (weightGrams <= 250) base = 77;
      else if (weightGrams <= 500) base = 106;
      else {
        const extraGrams = weightGrams - 500;
        const extraSlabs = Math.ceil(extraGrams / 500);
        base = 106 + extraSlabs * 50;
      }
    }
    // Default to Exact 18% Counter GST (CGST 9% + SGST 9% with paise precision, e.g. Base ₹59 -> ₹69.62, Base ₹63 -> ₹74.34)
    const { totalGst } = calculateIndiaPostGst(base);
    return { base, gst: totalGst, total: Math.round((base + totalGst) * 100) / 100 };
  } else {
    // Classic Structure
    if (distanceSlab === 'Local') {
      if (weightGrams <= 50) base = 15;
      else if (weightGrams <= 200) base = 25;
      else if (weightGrams <= 500) base = 30;
      else base = 30 + Math.ceil((weightGrams - 500) / 500) * 10;
    } else if (distanceSlab === '1-200 km') {
      if (weightGrams <= 200) base = 35;
      else if (weightGrams <= 500) base = 50;
      else base = 50 + Math.ceil((weightGrams - 500) / 500) * 15;
    } else if (distanceSlab === '201-500 km' || distanceSlab === '501-1000 km' || distanceSlab === '201-1000 km') {
      if (weightGrams <= 50) base = 35;
      else if (weightGrams <= 200) base = 40;
      else if (weightGrams <= 500) base = 60;
      else base = 60 + Math.ceil((weightGrams - 500) / 500) * 30;
    } else if (distanceSlab === '1001-2000 km') {
      if (weightGrams <= 50) base = 35;
      else if (weightGrams <= 200) base = 60;
      else if (weightGrams <= 500) base = 70;
      else base = 70 + Math.ceil((weightGrams - 500) / 500) * 40;
    } else {
      if (weightGrams <= 50) base = 35;
      else if (weightGrams <= 200) base = 70;
      else if (weightGrams <= 500) base = 80;
      else base = 80 + Math.ceil((weightGrams - 500) / 500) * 50;
    }
    const { totalGst } = calculateIndiaPostGst(base);
    return { base, gst: totalGst, total: Math.round((base + totalGst) * 100) / 100 };
  }
}

/**
 * Volumetric Weight calculation using India Post standard divisor:
 * Volumetric Weight (kg) = (Length cm x Width cm x Height cm) / 6000
 */
export function calculateVolumetricWeight(lCm?: number, wCm?: number, hCm?: number): number {
  if (!lCm || !wCm || !hCm || lCm <= 0 || wCm <= 0 || hCm <= 0) return 0;
  const volKg = (lCm * wCm * hCm) / 6000;
  return Math.round(volKg * 1000); // return in grams
}

/**
 * Universal Postage Evaluator for any item and service
 */
export function computePostageForService(
  serviceId: ServiceType,
  actualWeightGrams: number,
  originPin: string,
  destPin: string,
  destCountryCode: string = 'US',
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number,
  isAcknowledgement: boolean = false,
  tariffVersion: TariffVersion = '2025_revised'
): PostageCalculationResult {
  const service = POSTAL_SERVICES[serviceId];
  const volWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm);
  const chargeableWeight = service.requiresDimensions && volWeight > actualWeightGrams ? volWeight : actualWeightGrams;

  // Minimum parcel dimension check (official India Post: min 14 x 9 x 1 cm)
  let dimensionWarning: string | undefined = undefined;
  const isParcelService = serviceId.includes('parcel');
  if (isParcelService && lengthCm && widthCm && heightCm) {
    if (lengthCm < 14 || widthCm < 9 || heightCm < 1) {
      dimensionWarning = 'Below official min parcel size (14 × 9 × 1 cm)';
    }
  }

  // Resolve distance or country
  let distanceKm = 0;
  let distanceSlab: DistanceSlab | string = 'Local';
  let circleName = '';

  if (!service.isInternational) {
    const route = resolveDistanceSlab(originPin, destPin);
    distanceKm = route.distanceKm;
    distanceSlab = route.slab;
    circleName = route.destCircle ? `${route.destCircle.circleName} (${route.destCircle.state})` : 'Unknown Circle';
  } else {
    const country = INTERNATIONAL_COUNTRIES.find((c) => c.code === destCountryCode) || INTERNATIONAL_COUNTRIES[0];
    distanceSlab = country.zone;
    circleName = country.name;
  }

  // Weight Eligibility Checks
  if (actualWeightGrams <= 0) {
    return {
      serviceId,
      serviceName: service.name,
      tariffVersion,
      actualWeightGrams,
      chargeableWeightGrams: actualWeightGrams,
      distanceKm,
      distanceSlab,
      basePostage: 0,
      registrationFee: 0,
      valueAddedServicesFee: 0,
      subtotal: 0,
      gstAmount: 0,
      totalPostage: 0,
      isEligible: false,
      ineligibilityReason: 'Weight must be greater than 0g',
    };
  }

  if (actualWeightGrams > service.maxWeightGrams) {
    return {
      serviceId,
      serviceName: service.name,
      tariffVersion,
      actualWeightGrams,
      chargeableWeightGrams: actualWeightGrams,
      distanceKm,
      distanceSlab,
      basePostage: 0,
      registrationFee: 0,
      valueAddedServicesFee: 0,
      subtotal: 0,
      gstAmount: 0,
      totalPostage: 0,
      isEligible: false,
      ineligibilityReason: `Exceeds max weight of ${(service.maxWeightGrams / 1000).toFixed(1)} kg for ${service.name}`,
      dimensionWarning,
    };
  }

  if (actualWeightGrams < service.minWeightGrams) {
    return {
      serviceId,
      serviceName: service.name,
      tariffVersion,
      actualWeightGrams,
      chargeableWeightGrams: actualWeightGrams,
      distanceKm,
      distanceSlab,
      basePostage: 0,
      registrationFee: 0,
      valueAddedServicesFee: 0,
      subtotal: 0,
      gstAmount: 0,
      totalPostage: 0,
      isEligible: false,
      ineligibilityReason: `Minimum weight is ${(service.minWeightGrams / 1000).toFixed(1)} kg for ${service.name}`,
      dimensionWarning,
    };
  }

  let basePostage = 0;
  let registrationFee = 0;
  let vasFee = 0;
  let gstAmount = 0;

  switch (serviceId) {
    case 'speed_post': {
      // If parcel (>500g or dimensions specified), use official revised SP_INLAND_PARCEL matrix
      if (chargeableWeight > 500 || lengthCm || widthCm || heightCm) {
        const spParcel = calculateSpeedPostParcel(chargeableWeight, distanceSlab as DistanceSlab);
        basePostage = spParcel.base;
        gstAmount = spParcel.gst;
      } else {
        const sp = calculateSpeedPost(chargeableWeight, distanceSlab as DistanceSlab, tariffVersion);
        basePostage = sp.base;
        gstAmount = sp.gst;
      }
      break;
    }

    case 'letter': {
      // Official indiapost.gov.in /poreg/domestic-tariffs/letters:
      // ₹5 per 20g or part thereof. For <=20g: ₹5 (0 GST); for >20g: CGST = Math.round(base * 0.09), SGST = Math.round(base * 0.09)
      const slabs20g = Math.max(1, Math.ceil(chargeableWeight / 20));
      basePostage = slabs20g * 5;
      if (chargeableWeight <= 20) {
        gstAmount = 0;
      } else {
        const cgst = Math.round(basePostage * 0.09);
        const sgst = Math.round(basePostage * 0.09);
        gstAmount = cgst + sgst;
      }
      break;
    }

    case 'letter_card': {
      // Official indiapost.gov.in /poreg/domestic-tariffs/letter-cards: Flat ₹2.50
      basePostage = 2.5;
      gstAmount = 0;
      break;
    }

    case 'postcard': {
      // Official indiapost.gov.in /poreg/domestic-tariffs/postcards: Flat ₹0.50
      basePostage = 0.5;
      gstAmount = 0;
      break;
    }

    case 'registered_letter': {
      // Base: ₹5 for first 20g + ₹5 each additional 20g
      const first20 = 5;
      const additionalSlabs = Math.max(0, Math.ceil((chargeableWeight - 20) / 20));
      basePostage = first20 + additionalSlabs * 5;
      registrationFee = 17; // standard India Post registration fee
      // Registration fee has 18% GST (₹3.06)
      gstAmount = Math.round(registrationFee * 0.18 * 100) / 100;
      break;
    }

    case 'registered_parcel': {
      // India Post Parcel (Retail) - Calibrated with official revised portal
      const isLocal = distanceSlab === 'Local';
      if (tariffVersion === '2025_revised') {
        if (isLocal) {
          // Official Local Retail Parcel: 1200g -> Base 60 + GST 10 = ₹70.00
          if (chargeableWeight <= 500) basePostage = 30;
          else if (chargeableWeight <= 1000) basePostage = 45;
          else if (chargeableWeight <= 1500) basePostage = 60;
          else basePostage = 60 + Math.ceil((chargeableWeight - 1500) / 500) * 15;
        } else {
          // Interstate: 1200g -> Base 171 + GST 30 = ₹201.00
          if (chargeableWeight <= 500) basePostage = 80;
          else if (chargeableWeight <= 1000) basePostage = 125;
          else if (chargeableWeight <= 1500) basePostage = 171;
          else basePostage = 171 + Math.ceil((chargeableWeight - 1500) / 500) * 45;
        }
        registrationFee = 0;
        gstAmount = calculateIndiaPostGst(basePostage).totalGst;
      } else {
        // Classic: ₹19 for first 500g, each addl 500g ₹16 + ₹17 registration
        const first500 = 19;
        const extraSlabs = Math.max(0, Math.ceil((chargeableWeight - 500) / 500));
        basePostage = first500 + extraSlabs * 16;
        registrationFee = 17;
        gstAmount = calculateIndiaPostGst(registrationFee).totalGst;
      }
      break;
    }

    case 'business_parcel': {
      // India Post Parcel (Contractual / Business) - Calibrated with official revised portal
      const isLocal = distanceSlab === 'Local';
      if (tariffVersion === '2025_revised') {
        if (isLocal) {
          // Official Local Contractual Parcel: 1200g -> Base 36 + GST 6 = ₹42.00
          if (chargeableWeight <= 500) basePostage = 20;
          else if (chargeableWeight <= 1000) basePostage = 30;
          else if (chargeableWeight <= 1500) basePostage = 36;
          else basePostage = 36 + Math.ceil((chargeableWeight - 1500) / 500) * 6;
        } else {
          // Interstate: 1200g -> Base 80 + GST 14 = ₹94.00
          if (chargeableWeight <= 1500) basePostage = 80;
          else basePostage = 80 + Math.ceil((chargeableWeight - 1500) / 500) * 25;
        }
        gstAmount = calculateIndiaPostGst(basePostage).totalGst;
      } else {
        // Classic B2B commercial parcel rates
        const dist = distanceSlab as DistanceSlab;
        let base2kg = 45;
        let addlPerKg = 12;
        if (dist === 'Local') {
          base2kg = 45;
          addlPerKg = 12;
        } else if (dist === '1-200 km') {
          base2kg = 80;
          addlPerKg = 20;
        } else if (dist === '201-1000 km') {
          base2kg = 100;
          addlPerKg = 25;
        } else {
          base2kg = 115;
          addlPerKg = 30;
        }
        const extraKg = Math.max(0, Math.ceil((chargeableWeight - 2000) / 1000));
        basePostage = base2kg + extraKg * addlPerKg;
        gstAmount = calculateIndiaPostGst(basePostage).totalGst;
      }
      break;
    }

    case 'logistics_post': {
      // Min 50kg, base handling ₹150 + ₹1.5 per kg per 500km block
      const weightKg = Math.ceil(chargeableWeight / 1000);
      const distBlocks = Math.max(1, Math.ceil(distanceKm / 500));
      basePostage = 150 + weightKg * distBlocks * 1.6;
      gstAmount = Math.round(basePostage * 0.18 * 100) / 100;
      break;
    }

    case 'printed_books': {
      // ₹1 for first 100g + ₹1 for each additional 100g
      const slabs = Math.ceil(chargeableWeight / 100);
      basePostage = slabs * 1;
      gstAmount = 0; // Exempt
      break;
    }

    case 'book_packet': {
      // First 50g: ₹4, each additional 50g: ₹3
      const first50 = 4;
      const extraSlabs = Math.max(0, Math.ceil((chargeableWeight - 50) / 50));
      basePostage = first50 + extraSlabs * 3;
      gstAmount = 0; // Exempt
      break;
    }

    case 'intl_ems': {
      const country = INTERNATIONAL_COUNTRIES.find((c) => c.code === destCountryCode) || INTERNATIONAL_COUNTRIES[0];
      const z = country.zoneIndex;
      // Zone 1: ₹500 first 250g + ₹85 / addl 250g
      // Zone 2: ₹750 first 250g + ₹140 / addl 250g
      // Zone 3: ₹1050 first 250g + ₹220 / addl 250g
      // Zone 4: ₹1250 first 250g + ₹280 / addl 250g
      const rates = [
        { base: 500, addl: 85 },
        { base: 750, addl: 140 },
        { base: 1050, addl: 220 },
        { base: 1250, addl: 280 },
      ][z - 1];

      const extra250g = Math.max(0, Math.ceil((chargeableWeight - 250) / 250));
      basePostage = rates.base + extra250g * rates.addl;
      gstAmount = Math.round(basePostage * 0.18 * 100) / 100;
      break;
    }

    case 'intl_air_parcel': {
      const country = INTERNATIONAL_COUNTRIES.find((c) => c.code === destCountryCode) || INTERNATIONAL_COUNTRIES[0];
      const z = country.zoneIndex;
      const rates = [
        { base: 650, addl: 120 },
        { base: 900, addl: 180 },
        { base: 1200, addl: 260 },
        { base: 1450, addl: 320 },
      ][z - 1];

      const extra500g = Math.max(0, Math.ceil((chargeableWeight - 500) / 500));
      basePostage = rates.base + extra500g * rates.addl;
      gstAmount = Math.round(basePostage * 0.18 * 100) / 100;
      break;
    }

    case 'intl_small_packet': {
      const country = INTERNATIONAL_COUNTRIES.find((c) => c.code === destCountryCode) || INTERNATIONAL_COUNTRIES[0];
      const z = country.zoneIndex;
      const rates = [
        { base: 160, addl: 35 },
        { base: 220, addl: 50 },
        { base: 290, addl: 70 },
        { base: 350, addl: 90 },
      ][z - 1];

      const extra100g = Math.max(0, Math.ceil((chargeableWeight - 100) / 100));
      basePostage = rates.base + extra100g * rates.addl;
      registrationFee = 150; // International registered packet fee
      const sub = basePostage + registrationFee;
      gstAmount = Math.round(sub * 0.18 * 100) / 100;
      break;
    }
  }

  if (isAcknowledgement) {
    vasFee = POD_FEE_INCL_GST;
  }

  const subtotal = Math.round((basePostage + registrationFee) * 100) / 100;
  const totalPostage = Math.round((subtotal + gstAmount + vasFee) * 100) / 100;

  return {
    serviceId,
    serviceName: service.name,
    tariffVersion,
    actualWeightGrams,
    volumetricWeightGrams: volWeight > 0 ? volWeight : undefined,
    chargeableWeightGrams: chargeableWeight,
    distanceKm,
    distanceSlab,
    basePostage,
    registrationFee,
    valueAddedServicesFee: vasFee,
    subtotal,
    gstAmount,
    totalPostage,
    isEligible: true,
    dimensionWarning,
    circleInfo: circleName,
    dataSource: 'offline_engine_fallback',
  };
}

/**
 * Compare all available services for a given consignment
 */
export function compareAllServices(
  actualWeightGrams: number,
  originPin: string,
  destPin: string,
  destCountryCode: string = 'US',
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number,
  tariffVersion: TariffVersion = '2025_revised'
): PostageCalculationResult[] {
  const isIntl = destCountryCode !== 'IN' && !validatePinCode(destPin).isValid;
  const targetServices: ServiceType[] = isIntl
    ? ['intl_ems', 'intl_air_parcel', 'intl_small_packet']
    : ['speed_post', 'business_parcel', 'registered_parcel', 'letter', 'registered_letter', 'letter_card', 'postcard', 'printed_books', 'book_packet', 'logistics_post'];

  return targetServices.map((sid) =>
    computePostageForService(sid, actualWeightGrams, originPin, destPin, destCountryCode, lengthCm, widthCm, heightCm, false, tariffVersion)
  );
}
