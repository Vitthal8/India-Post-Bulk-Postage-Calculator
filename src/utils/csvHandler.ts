import { ConsignmentItem } from '../types/consignment';
import { ServiceType, computePostageForService, POSTAL_SERVICES, TariffVersion } from '../data/indiaPostTariffs';
import { validatePinCode } from '../data/postalCircles';

export const CSV_TEMPLATE_HEADERS = [
  'article_type',
  'origin_pin',
  'dest_pin',
  'weight_g',
  'length_cm',
  'width_cm',
  'height_cm',
  'declared_value',
  'cod_flag',
  'reference_id',
  'recipient_name',
];

export const SAMPLE_CSV_ROWS = [
  ['parcel', '400703', '560087', '500', '14', '9', '1', '0', '0', 'ORD-501', 'Ananya Deshmukh'],
  ['letter', '400703', '560087', '50', '15', '10', '1', '0', '0', 'LET-102', 'Venkatesh Rao'],
  ['speed_post', '400703', '400001', '250', '20', '15', '4', '0', '0', 'SP-303', 'Mumbai Delivery'],
  ['business_parcel', '400703', '380001', '3500', '30', '20', '10', '0', '0', 'BIZ-404', 'Gujarat Retail'],
  ['printed_books', '400703', '700001', '1200', '25', '18', '5', '0', '0', 'BK-505', 'Kolkata Book Depot'],
  ['registered_parcel', '400703', '600001', '1800', '24', '18', '8', '0', '0', 'REG-606', 'Chennai Law Firm'],
  ['intl_ems', '400703', 'US', '650', '25', '20', '10', '0', '0', 'INT-707', 'David Miller (USA)'],
];

export function generateTemplateCSV(): string {
  const lines = [
    CSV_TEMPLATE_HEADERS.join(','),
    ...SAMPLE_CSV_ROWS.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
  ];
  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParseResult {
  items: ConsignmentItem[];
  errors: string[];
  totalParsed: number;
}

/**
 * Robust CSV parser handling both the research schema and flexible spreadsheets
 */
export function parseCSV(
  text: string,
  defaultOriginPin: string = '400703',
  tariffVersion: TariffVersion = '2025_revised'
): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return { items: [], errors: ['CSV file is empty or only contains headers'], totalParsed: 0 };
  }

  // Auto-detect delimiter from header line (, | \t ;)
  let delimiter = ',';
  const headerLine = lines[0];
  const commaCount = (headerLine.match(/,/g) || []).length;
  const pipeCount = (headerLine.match(/\|/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;

  if (pipeCount > commaCount && pipeCount >= tabCount) {
    delimiter = '|';
  } else if (tabCount > commaCount && tabCount >= semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount) {
    delimiter = ';';
  }

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headerTokens = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Disambiguated column matching to prevent 'pin' keyword from confusing origin and destination columns
  const findColumn = (
    exactMatches: string[],
    partialMatches: string[] = [],
    forbiddenKeywords: string[] = []
  ): number => {
    // 1. Try exact token match first
    for (const exact of exactMatches) {
      const idx = headerTokens.indexOf(exact);
      if (idx !== -1) return idx;
    }
    // 2. Try partial substring match, ensuring no forbidden keywords are present
    for (const partial of partialMatches) {
      const idx = headerTokens.findIndex(
        (h) => h.includes(partial) && !forbiddenKeywords.some((f) => h.includes(f))
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Schema keywords
  const typeIdx = findColumn(
    ['articletype', 'article', 'service', 'servicetype', 'product', 'type'],
    ['article', 'service', 'product']
  );
  
  // Origin PIN (From / Sender / Source)
  const origPinIdx = findColumn(
    ['originpin', 'frompin', 'sourcepin', 'originpincode', 'frompincode', 'sourcepincode', 'senderpin'],
    ['origin', 'source', 'frompin', 'sender'],
    ['dest', 'to', 'receiver', 'consignee', 'delivery']
  );

  // Destination PIN (To / Receiver / Delivery)
  let destPinIdx = findColumn(
    ['destpin', 'topin', 'destinationpin', 'destpincode', 'topincode', 'destinationpincode', 'deliverypin', 'receiverpin', 'destination', 'dest'],
    ['dest', 'topin', 'destination', 'deliverypin', 'receiverpin', 'delivery', 'consignee', 'country'],
    ['origin', 'source', 'from', 'sender']
  );

  // If there's only one generic PIN column (e.g. 'pincode', 'pin', 'postalcode') and it wasn't captured as origin PIN, treat it as destination PIN
  if (destPinIdx === -1) {
    const genericPinIdx = headerTokens.findIndex(
      (h, idx) => (h.includes('pin') || h.includes('zip') || h.includes('postal')) && idx !== origPinIdx
    );
    if (genericPinIdx !== -1) {
      destPinIdx = genericPinIdx;
    }
  }

  const weightIdx = findColumn(
    ['weightg', 'weightgrams', 'weight', 'mass', 'wt', 'grams'],
    ['weight', 'mass', 'wt', 'gram']
  );
  const lenIdx = findColumn(['lengthcm', 'length', 'len'], ['length', 'len']);
  const widthIdx = findColumn(['widthcm', 'width', 'wid'], ['width', 'wid']);
  const heightIdx = findColumn(['heightcm', 'height', 'hgt'], ['height', 'hgt']);
  const refIdx = findColumn(
    ['referenceid', 'reference', 'ref', 'id', 'tracking', 'order', 'item', 'consignmentno'],
    ['reference', 'tracking', 'order', 'ref', 'item']
  );
  const nameIdx = findColumn(
    ['recipientname', 'recipient', 'consignee', 'name', 'customer', 'receivername'],
    ['recipient', 'consignee', 'customer', 'receiver']
  );
  const declaredValIdx = findColumn(['declaredvalue', 'value', 'declared', 'invoicevalue'], ['value', 'declared']);
  const codIdx = findColumn(['codflag', 'cod', 'cashondelivery'], ['cod']);

  const items: ConsignmentItem[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawTokens = parseLine(lines[i]);
    if (rawTokens.length === 0 || (rawTokens.length === 1 && !rawTokens[0])) continue;

    const rowNum = i + 1;
    const ref = refIdx >= 0 && rawTokens[refIdx] ? rawTokens[refIdx] : `ITEM-${1000 + i}`;
    const name = nameIdx >= 0 && rawTokens[nameIdx] ? rawTokens[nameIdx] : `Recipient ${i}`;
    
    // Clean origin PIN (handles decimals like '400703.0' or formatting)
    let rawOriginVal = origPinIdx >= 0 && rawTokens[origPinIdx] ? rawTokens[origPinIdx].trim() : '';
    if (rawOriginVal.includes('.')) rawOriginVal = rawOriginVal.split('.')[0];
    const cleanOrigin = rawOriginVal.replace(/\D/g, '').slice(0, 6);
    const rowOriginPin = cleanOrigin.length === 6 ? cleanOrigin : defaultOriginPin;

    // Clean destination PIN or country
    let rawDestVal = destPinIdx >= 0 && rawTokens[destPinIdx] ? rawTokens[destPinIdx].trim() : '';
    // Strip surrounding quotes or decimals from Excel number format (e.g. '560087.0')
    if (rawDestVal.includes('.')) {
      rawDestVal = rawDestVal.split('.')[0];
    }
    const cleanDigits = rawDestVal.replace(/\D/g, '');

    // Normalize Destination
    let destinationType: 'domestic' | 'international' = 'domestic';
    let destinationPin = '560087';
    let destinationCountry = 'US';

    if (cleanDigits.length >= 6) {
      destinationPin = cleanDigits.slice(0, 6);
      destinationType = 'domestic';
    } else if (rawDestVal.length === 2 && /^[A-Za-z]{2}$/.test(rawDestVal)) {
      destinationCountry = rawDestVal.toUpperCase();
      destinationType = 'international';
    } else if (cleanDigits.length > 0) {
      destinationPin = cleanDigits.padEnd(6, '0').slice(0, 6);
      destinationType = 'domestic';
      errors.push(`Row ${rowNum}: Pincode "${rawDestVal}" was padded to 6 digits (${destinationPin}).`);
    } else {
      errors.push(`Row ${rowNum}: Destination PIN was missing or invalid; used default ${destinationPin}.`);
    }

    // Article type mapping with broad alias recognition
    const rawType = typeIdx >= 0 && rawTokens[typeIdx] ? rawTokens[typeIdx].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
    let serviceType: ServiceType = destinationType === 'international' ? 'intl_ems' : 'speed_post';

    if (destinationType === 'international') {
      if (rawType.includes('air')) serviceType = 'intl_air_parcel';
      else if (rawType.includes('small') || rawType.includes('packet')) serviceType = 'intl_small_packet';
      else serviceType = 'intl_ems';
    } else {
      // 1. Contractual Parcel: 'business_parcel', 'contractual', 'contract', 'business_pa', 'india post parcel (contractual)'
      if (
        rawType.includes('contract') ||
        rawType.includes('business') ||
        rawType.includes('biz') ||
        rawType === 'business_pa' ||
        rawType === 'contractual' ||
        rawType === 'b2b'
      ) {
        serviceType = 'business_parcel';
      }
      // 2. Retail Parcel: 'registered_parcel', 'registered_', 'retail', 'parcel' (when not speed post)
      else if (
        rawType.includes('retail') ||
        (rawType.includes('reg') && (rawType.includes('par') || rawType === 'registered_'))
      ) {
        serviceType = 'registered_parcel';
      }
      // 3. Registered Letter / Document
      else if (rawType.includes('reg') && (rawType.includes('let') || rawType.includes('doc'))) {
        serviceType = 'registered_letter';
      }
      // 4. Letter Card (Inland Letter)
      else if (rawType.includes('card') && rawType.includes('let') || rawType === 'letter_card' || rawType === 'letter_card_s') {
        serviceType = 'letter_card';
      }
      // 5. Postcard
      else if (rawType.includes('postcard') || rawType === 'post_card') {
        serviceType = 'postcard';
      }
      // 6. Ordinary Letter
      else if (rawType === 'letter' || rawType === 'letters' || rawType === 'ordinary_letter') {
        serviceType = 'letter';
      }
      // 7. Logistics Post (Heavy Cargo >50kg)
      else if (rawType.includes('log') || rawType.includes('cargo') || rawType.includes('heavy')) {
        serviceType = 'logistics_post';
      }
      // 8. Educational Printed Books
      else if (rawType.includes('book') && (rawType.includes('print') || rawType === 'printed_bo')) {
        serviceType = 'printed_books';
      }
      // 9. Book Packet & Periodicals
      else if (rawType.includes('book') || rawType.includes('periodical')) {
        serviceType = 'book_packet';
      }
      // 10. Speed Post (Flagship express for both parcel and documents)
      else if (
        rawType.includes('speed') ||
        rawType.includes('ems') ||
        rawType === 'parcel' ||
        rawType.includes('doc')
      ) {
        serviceType = 'speed_post';
      }
    }

    // Weight parsing
    const rawWeight = weightIdx >= 0 && rawTokens[weightIdx] ? rawTokens[weightIdx] : '250';
    let weight = parseFloat(rawWeight.replace(/[^0-9.]/g, ''));
    if (isNaN(weight) || weight <= 0) {
      weight = 250;
      errors.push(`Row ${rowNum}: Invalid weight "${rawWeight}", defaulted to 250g.`);
    } else if (weight < 10 && rawWeight.toLowerCase().includes('kg')) {
      weight = Math.round(weight * 1000);
    }

    const l = lenIdx >= 0 && rawTokens[lenIdx] ? parseFloat(rawTokens[lenIdx]) || undefined : undefined;
    const w = widthIdx >= 0 && rawTokens[widthIdx] ? parseFloat(rawTokens[widthIdx]) || undefined : undefined;
    const h = heightIdx >= 0 && rawTokens[heightIdx] ? parseFloat(rawTokens[heightIdx]) || undefined : undefined;
    const declaredValue = declaredValIdx >= 0 && rawTokens[declaredValIdx] ? parseFloat(rawTokens[declaredValIdx]) || 0 : 0;
    const isCod = codIdx >= 0 && rawTokens[codIdx] ? rawTokens[codIdx] === '1' || rawTokens[codIdx].toLowerCase() === 'true' : false;

    const calc = computePostageForService(
      serviceType,
      Math.round(weight),
      rowOriginPin || defaultOriginPin,
      destinationPin,
      destinationCountry,
      l,
      w,
      h,
      false,
      tariffVersion
    );

    items.push({
      id: `csv-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      referenceId: ref,
      recipientName: name,
      destinationType,
      destinationPin,
      destinationCountry,
      serviceType,
      weightGrams: Math.round(weight),
      lengthCm: l,
      widthCm: w,
      heightCm: h,
      hasAck: false,
      calculation: calc,
    });
  }

  return { items, errors, totalParsed: items.length };
}

/**
 * Export calculated consignments adhering to the research note schema:
 * article_type, origin_pin, dest_pin, weight_g, length_cm, width_cm, height_cm, declared_value, cod_flag,
 * distance_band, base_rate, GST, total, error
 */
export function exportConsignmentsToCSV(items: ConsignmentItem[], originPin: string): string {
  const headers = [
    'article_type',
    'origin_pin',
    'dest_pin',
    'weight_g',
    'length_cm',
    'width_cm',
    'height_cm',
    'declared_value',
    'cod_flag',
    'reference_id',
    'recipient_name',
    'distance_band',
    'distance_km',
    'circle_name',
    'base_rate',
    'registration_fee',
    'GST',
    'pod_fee_incl_gst',
    'total',
    'error',
  ];

  const rows = items.map((item) => {
    const c = item.calculation;
    const dest = item.destinationType === 'domestic' ? item.destinationPin : item.destinationCountry;
    const errorMsg = !c.isEligible ? c.ineligibilityReason || 'Ineligible' : c.dimensionWarning || '';
    const base = item.manualBaseOverride ?? c.basePostage;
    const total = item.manualTotalOverride ?? c.totalPostage;
    const gst = item.manualTotalOverride !== undefined ? Math.max(0, total - base - c.registrationFee - c.valueAddedServicesFee) : c.gstAmount;
    const podFee = item.hasAck ? 11.8 : 0;

    return [
      item.serviceType,
      originPin,
      dest,
      item.weightGrams,
      item.lengthCm || '',
      item.widthCm || '',
      item.heightCm || '',
      '0',
      '0',
      `"${(item.referenceId || '').replace(/"/g, '""')}"`,
      `"${(item.recipientName || '').replace(/"/g, '""')}"`,
      `"${(c.distanceSlab || '').replace(/"/g, '""')}"`,
      c.distanceKm || 0,
      `"${(c.circleInfo || '').replace(/"/g, '""')}"`,
      base.toFixed(2),
      c.registrationFee.toFixed(2),
      gst.toFixed(2),
      podFee.toFixed(2),
      total.toFixed(2),
      `"${errorMsg.replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
