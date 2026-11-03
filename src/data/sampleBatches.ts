import { ConsignmentItem } from '../types/consignment';
import { computePostageForService } from './indiaPostTariffs';

export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  originPin: string;
  originName: string;
  badge: string;
  generateItems: () => ConsignmentItem[];
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'ecommerce_mixed',
    name: 'E-Commerce Mixed Dispatch',
    description: '10 customer retail shipments across Delhi, Mumbai, Bengaluru, Kolkata, Jaipur & Chennai.',
    originPin: '400703',
    originName: 'Navi Mumbai Vashi (Maharashtra Circle)',
    badge: '10 Shipments',
    generateItems: () => {
      const samples = [
        { ref: 'INDPOST-LOCAL-421204', name: 'Satyaprakash Raju Yemul (Thane Local)', pin: '421204', weight: 1200, l: 14, w: 9, h: 1, service: 'business_parcel' as const, note: 'Dombivli, Thane (Verified Portal ₹42: Base ₹36 + GST ₹6)' },
        { ref: 'INDPOST-BENCHMARK', name: 'Sitapur Customer (Official Test)', pin: '261121', weight: 1200, l: 14, w: 9, h: 1, service: 'speed_post' as const, note: 'Sitapur, UP (Verified Portal ₹270: Base ₹228 + GST ₹42)' },
        { ref: 'EC-101', name: 'Rahul Verma', pin: '400001', weight: 180, service: 'speed_post' as const, note: 'Mumbai Fort (Local Delivery)' },
        { ref: 'EC-102', name: 'Priya Iyer', pin: '560001', weight: 450, service: 'speed_post' as const, note: 'Bengaluru Central (201-1000 km)' },
        { ref: 'EC-103', name: 'Siddharth Patel', pin: '380001', weight: 850, service: 'speed_post' as const, note: 'Ahmedabad (201-1000 km)' },
        { ref: 'EC-104', name: 'Amitabh Sen', pin: '700001', weight: 320, service: 'speed_post' as const, note: 'Kolkata (1001-2000 km)' },
        { ref: 'EC-105', name: 'Kavita Nair', pin: '695001', weight: 920, service: 'speed_post' as const, note: 'Thiruvananthapuram (1001-2000 km)' },
        { ref: 'EC-106', name: 'Manish Sharma', pin: '411001', weight: 2400, l: 30, w: 20, h: 10, service: 'business_parcel' as const, note: 'Pune (1-200 km)' },
        { ref: 'EC-107', name: 'Sunita Ghosh', pin: '110001', weight: 3800, l: 35, w: 25, h: 15, service: 'business_parcel' as const, note: 'New Delhi (1001-2000 km)' },
        { ref: 'EC-108', name: 'Deepak Joshi', pin: '248001', weight: 280, service: 'speed_post' as const, note: 'Dehradun (1001-2000 km)' },
        { ref: 'EC-109', name: 'Robert Thomas', isIntl: true, country: 'US', weight: 650, service: 'intl_ems' as const, note: 'New York, USA' },
        { ref: 'EC-110', name: 'Fatima Al-Zahra', isIntl: true, country: 'AE', weight: 400, service: 'intl_small_packet' as const, note: 'Dubai, UAE' },
      ];

      return samples.map((s, idx) => {
        const destType = s.isIntl ? 'international' : 'domestic';
        const pin = s.pin || '400703';
        const cCode = s.country || 'US';
        const calc = computePostageForService(s.service, s.weight, '400703', pin, cCode, s.l, s.w, s.h);

        return {
          id: `sample-ec-${idx + 1}-${Date.now()}`,
          referenceId: s.ref,
          recipientName: s.name,
          destinationType: destType,
          destinationPin: pin,
          destinationCountry: cCode,
          serviceType: s.service,
          weightGrams: s.weight,
          lengthCm: s.l,
          widthCm: s.w,
          heightCm: s.h,
          hasAck: false,
          notes: s.note,
          calculation: calc,
        };
      });
    },
  },
  {
    id: 'publishing_house',
    name: 'Publishing House & Book Post',
    description: 'Bulk academic books, university journals, and periodicals dispatched under concessional postal rates.',
    originPin: '700001',
    originName: 'Kolkata GPO (West Bengal Circle)',
    badge: 'Educational Tariffs',
    generateItems: () => {
      const samples = [
        { ref: 'BK-401', name: 'Delhi University Library', pin: '110007', weight: 1800, service: 'printed_books' as const, note: 'Historical monograph (5 vols)' },
        { ref: 'BK-402', name: 'Pune College Department', pin: '411004', weight: 950, service: 'printed_books' as const, note: 'Mathematics text workbook' },
        { ref: 'BK-403', name: 'Madras Literary Society', pin: '600006', weight: 1400, service: 'printed_books' as const, note: 'Literary quarterly journal' },
        { ref: 'BK-404', name: 'Bhubaneswar State Archive', pin: '751001', weight: 700, service: 'printed_books' as const, note: 'Research paper compendium' },
        { ref: 'BK-405', name: 'Guwahati Study Circle', pin: '781001', weight: 450, service: 'book_packet' as const, note: 'Quarterly newsletter bundle' },
        { ref: 'BK-406', name: 'Patna University Registrar', pin: '800005', weight: 320, service: 'book_packet' as const, note: 'Examination syllabus packets' },
      ];

      return samples.map((s, idx) => {
        const calc = computePostageForService(s.service, s.weight, '700001', s.pin, 'IN');
        return {
          id: `sample-bk-${idx + 1}-${Date.now()}`,
          referenceId: s.ref,
          recipientName: s.name,
          destinationType: 'domestic' as const,
          destinationPin: s.pin,
          destinationCountry: 'IN',
          serviceType: s.service,
          weightGrams: s.weight,
          hasAck: false,
          notes: s.note,
          calculation: calc,
        };
      });
    },
  },
  {
    id: 'legal_corporate',
    name: 'Legal Notices & Registered Letters',
    description: 'Registered posts with acknowledgment (AD) for corporate notices, tribunals, and legal compliance.',
    originPin: '400001',
    originName: 'Mumbai GPO (Maharashtra Circle)',
    badge: 'Registered Post + AD',
    generateItems: () => {
      const samples = [
        { ref: 'LEG-01', name: 'Registrar of Companies', pin: '400002', weight: 35, service: 'registered_letter' as const, ack: true, note: 'Statutory annual filing copy' },
        { ref: 'LEG-02', name: 'National Green Tribunal', pin: '110001', weight: 80, service: 'registered_letter' as const, ack: true, note: 'Affidavit submission' },
        { ref: 'LEG-03', name: 'High Court Registry', pin: '500066', weight: 120, service: 'registered_letter' as const, ack: true, note: 'Hyderabad bench counter reply' },
        { ref: 'LEG-04', name: 'Income Tax Appellate', pin: '380014', weight: 65, service: 'registered_letter' as const, ack: true, note: 'Ahmedabad bench hearing brief' },
        { ref: 'LEG-05', name: 'State Consumer Commission', pin: '560027', weight: 145, service: 'registered_letter' as const, ack: true, note: 'Bengaluru Commission case docket' },
      ];

      return samples.map((s, idx) => {
        const calc = computePostageForService(s.service, s.weight, '400001', s.pin, 'IN', undefined, undefined, undefined, s.ack);
        return {
          id: `sample-leg-${idx + 1}-${Date.now()}`,
          referenceId: s.ref,
          recipientName: s.name,
          destinationType: 'domestic' as const,
          destinationPin: s.pin,
          destinationCountry: 'IN',
          serviceType: s.service,
          weightGrams: s.weight,
          hasAck: s.ack,
          notes: s.note,
          calculation: calc,
        };
      });
    },
  },
];
