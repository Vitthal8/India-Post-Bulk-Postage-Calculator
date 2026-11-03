import { ServiceType, PostageCalculationResult } from '../data/indiaPostTariffs';

export interface ConsignmentItem {
  id: string;
  referenceId: string;
  recipientName: string;
  destinationType: 'domestic' | 'international';
  destinationPin: string;
  destinationCountry: string; // ISO code like 'US', 'GB', 'AE'
  serviceType: ServiceType;
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  hasAck: boolean;
  notes?: string;
  calculation: PostageCalculationResult;
  manualBaseOverride?: number;
  manualTotalOverride?: number;
}

export interface BatchSummary {
  totalItems: number;
  eligibleItems: number;
  ineligibleItems: number;
  totalWeightKg: number;
  totalBasePostage: number;
  totalRegistrationFee: number;
  totalGst: number;
  grandTotal: number;
  serviceCounts: Record<string, number>;
}
