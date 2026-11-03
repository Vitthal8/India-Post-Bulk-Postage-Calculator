import React, { useState } from 'react';
import { POSTAL_SERVICES, ServiceType, TariffVersion } from '../data/indiaPostTariffs';
import { BookOpen, ShieldCheck, Info, FileSpreadsheet, ExternalLink, Layers, Check } from 'lucide-react';

interface TariffExplorerProps {
  tariffVersion?: TariffVersion;
  setTariffVersion?: (v: TariffVersion) => void;
}

export const TariffExplorer: React.FC<TariffExplorerProps> = ({
  tariffVersion = '2025_revised',
  setTariffVersion,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceType>('speed_post');
  const [viewVersion, setViewVersion] = useState<TariffVersion>(tariffVersion);

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c4122f] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                India Post Tariff Schedules & Rate Versioning
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compare 2025 Revised Tariffs vs Classic Rates, distance brackets, weight limits, and GST rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setViewVersion('2025_revised');
                  if (setTariffVersion) setTariffVersion('2025_revised');
                }}
                className={`px-3 py-1 rounded transition-colors ${
                  viewVersion === '2025_revised'
                    ? 'bg-white dark:bg-slate-900 text-[#c4122f] dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                2025 Revised Slabs
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewVersion('classic');
                  if (setTariffVersion) setTariffVersion('classic');
                }}
                className={`px-3 py-1 rounded transition-colors ${
                  viewVersion === 'classic'
                    ? 'bg-white dark:bg-slate-900 text-[#c4122f] dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Classic Slabs
              </button>
            </div>

            <a
              href="https://www.indiapost.gov.in/calculate-postage"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors"
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Service Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-6 border-b border-slate-100 dark:border-slate-800 pb-3">
          {Object.values(POSTAL_SERVICES).map((svc) => (
            <button
              key={svc.id}
              onClick={() => setSelectedService(svc.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedService === svc.id
                  ? 'bg-[#c4122f] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {svc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Post Rate Card */}
      {selectedService === 'speed_post' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Domestic Speed Post (EMS) Rate Matrix
                </h3>
                <span className="text-[11px] font-mono font-bold text-[#c4122f] dark:text-red-400 bg-red-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {viewVersion === '2025_revised' ? '2025 Revised Structure' : 'Classic Structure'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official base tariffs (exclusive of 18% GST).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
              Max 35 kg · Min Size 14 × 9 × 1 cm
            </span>
          </div>

          <div className="overflow-x-auto">
            {viewVersion === '2025_revised' ? (
              <table className="w-full text-xs text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Distance Slab</th>
                    <th className="py-2.5 px-3 text-right">Up to 50g</th>
                    <th className="py-2.5 px-3 text-right">51g - 250g</th>
                    <th className="py-2.5 px-3 text-right">251g - 500g</th>
                    <th className="py-2.5 px-3 text-right">Addl 500g (or part)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      Local (Within Municipal / City Area)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹19.00</td>
                    <td className="py-2.5 px-3 text-right">₹32.00</td>
                    <td className="py-2.5 px-3 text-right">₹40.00</td>
                    <td className="py-2.5 px-3 text-right">₹12.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      Up to 200 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹47.00</td>
                    <td className="py-2.5 px-3 text-right">₹55.00</td>
                    <td className="py-2.5 px-3 text-right">₹65.00</td>
                    <td className="py-2.5 px-3 text-right">₹20.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      201 to 1000 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹47.00</td>
                    <td className="py-2.5 px-3 text-right">₹65.00</td>
                    <td className="py-2.5 px-3 text-right">₹80.00</td>
                    <td className="py-2.5 px-3 text-right">₹35.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      1001 to 2000 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹47.00</td>
                    <td className="py-2.5 px-3 text-right">₹85.00</td>
                    <td className="py-2.5 px-3 text-right">₹105.00</td>
                    <td className="py-2.5 px-3 text-right">₹45.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      Above 2000 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹47.00</td>
                    <td className="py-2.5 px-3 text-right">₹95.00</td>
                    <td className="py-2.5 px-3 text-right">₹120.00</td>
                    <td className="py-2.5 px-3 text-right">₹55.00</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Distance Slab</th>
                    <th className="py-2.5 px-3 text-right">Up to 50g</th>
                    <th className="py-2.5 px-3 text-right">51g - 200g</th>
                    <th className="py-2.5 px-3 text-right">201g - 500g</th>
                    <th className="py-2.5 px-3 text-right">Addl 500g (or part)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      Local (Within Municipal / City Area)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹15.00</td>
                    <td className="py-2.5 px-3 text-right">₹25.00</td>
                    <td className="py-2.5 px-3 text-right">₹30.00</td>
                    <td className="py-2.5 px-3 text-right">₹10.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      1 to 200 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹35.00</td>
                    <td className="py-2.5 px-3 text-right">₹35.00</td>
                    <td className="py-2.5 px-3 text-right">₹50.00</td>
                    <td className="py-2.5 px-3 text-right">₹15.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      201 to 1000 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹35.00</td>
                    <td className="py-2.5 px-3 text-right">₹40.00</td>
                    <td className="py-2.5 px-3 text-right">₹60.00</td>
                    <td className="py-2.5 px-3 text-right">₹30.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      1001 to 2000 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹35.00</td>
                    <td className="py-2.5 px-3 text-right">₹60.00</td>
                    <td className="py-2.5 px-3 text-right">₹70.00</td>
                    <td className="py-2.5 px-3 text-right">₹40.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      Above 2000 km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#c4122f]">₹35.00</td>
                    <td className="py-2.5 px-3 text-right">₹70.00</td>
                    <td className="py-2.5 px-3 text-right">₹80.00</td>
                    <td className="py-2.5 px-3 text-right">₹50.00</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div><strong>Statutory Tax:</strong> All domestic Speed Post consignments carry 18% GST (CGST 9% + SGST 9% or IGST 18%).</div>
            <div><strong>Minimum Parcel Size:</strong> 14 cm × 9 cm × 1 cm as mandated under India Post booking rules.</div>
          </div>
        </div>
      )}

      {selectedService === 'letter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Ordinary Letter Tariffs</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>First 20 grams:</strong> ₹5.00 flat pan-India postage.</li>
            <li>• <strong>Additional Slabs:</strong> ₹6.00 for every additional 20 grams or fraction thereof (50g = ₹17.00).</li>
            <li>• <strong>Maximum Weight:</strong> 500 grams (0.5 kg). Items exceeding 500g must be booked as parcel.</li>
            <li>• <strong>Statutory Tax:</strong> Exempt from GST (0% GST on statutory postage stamp values).</li>
            <li>• <strong>Delivery Timeframe:</strong> 3 to 4 business days.</li>
          </ul>
        </div>
      )}

      {selectedService === 'letter_card' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Inland Letter Card (ILC)</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Flat Tariff:</strong> ₹2.50 per letter card across India.</li>
            <li>• <strong>Maximum Weight:</strong> 5 grams.</li>
            <li>• <strong>Statutory Tax:</strong> Exempt from GST.</li>
            <li>• <strong>Delivery Timeframe:</strong> 2 to 3 business days.</li>
          </ul>
        </div>
      )}

      {selectedService === 'postcard' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Postcard</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Flat Tariff:</strong> ₹0.50 per postcard across India.</li>
            <li>• <strong>Maximum Weight:</strong> 5 grams.</li>
            <li>• <strong>Statutory Tax:</strong> Exempt from GST.</li>
            <li>• <strong>Delivery Timeframe:</strong> 3 to 5 business days.</li>
          </ul>
        </div>
      )}

      {selectedService === 'registered_parcel' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Parcel Rules</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Base Tariff:</strong> ₹19.00 for the first 500 grams.</li>
            <li>• <strong>Incremental Weight:</strong> ₹16.00 for every additional 500 grams (or fraction thereof).</li>
            <li>• <strong>Registration Fee:</strong> ₹17.00 fixed booking fee (carries 18% GST).</li>
            <li>• <strong>Maximum Weight:</strong> 20 kg (parcels over 4 kg must be booked as registered parcel).</li>
            <li>• <strong>Delivery Timeframe:</strong> 3 to 7 business days standard pan-India transit.</li>
          </ul>
        </div>
      )}

      {selectedService === 'registered_letter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Letter & Document</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Base Letter Postage:</strong> ₹5.00 for first 20 grams, + ₹5.00 for every additional 20 grams.</li>
            <li>• <strong>Registration Fee:</strong> ₹17.00 mandatory registered docket fee.</li>
            <li>• <strong>Acknowledgment Due (AD):</strong> ₹3.00 for physical signed acknowledgment card returned to sender.</li>
            <li>• <strong>Maximum Weight:</strong> 2,000 grams (2 kg). Items exceeding 2 kg must be booked as parcel.</li>
          </ul>
        </div>
      )}

      {selectedService === 'business_parcel' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Business Parcel (Commercial)</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Minimum Chargeable Weight:</strong> 2 kg (items under 2kg are charged at the 2kg base slab).</li>
            <li>• <strong>Volumetric Weight Divisor:</strong> Length (cm) × Width (cm) × Height (cm) / 6000.</li>
            <li>• <strong>Within City / Local:</strong> ₹45.00 for first 2kg + ₹12.00 for each additional 1kg.</li>
            <li>• <strong>Within State / Same Circle:</strong> ₹80.00 for first 2kg + ₹20.00 for each additional 1kg.</li>
            <li>• <strong>Metro to Metro:</strong> ₹100.00 for first 2kg + ₹25.00 for each additional 1kg.</li>
            <li>• <strong>Rest of India:</strong> ₹115.00 for first 2kg + ₹30.00 for each additional 1kg.</li>
            <li>• <strong>GST:</strong> 18% GST applies to full invoice amount.</li>
          </ul>
        </div>
      )}

      {selectedService === 'printed_books' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Printed Books (Concessional Educational Tariff)</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Concessional Tariff:</strong> ₹1.00 for first 100 grams + ₹1.00 for each additional 100 grams.</li>
            <li>• <strong>Eligibility:</strong> Books containing no advertisements or commercial promotion; intended for schools, colleges, and libraries.</li>
            <li>• <strong>Maximum Weight:</strong> 5,000 grams (5 kg).</li>
            <li>• <strong>GST:</strong> Exempted (0% GST).</li>
          </ul>
        </div>
      )}

      {selectedService === 'book_packet' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Book Packet & Periodicals</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li>• <strong>Base Tariff:</strong> ₹4.00 for first 50 grams + ₹3.00 for each additional 50 grams.</li>
            <li>• <strong>Applies To:</strong> Magazines, journals, examination papers, circulars, and literary pamphlets.</li>
            <li>• <strong>Maximum Weight:</strong> 5 kg.</li>
          </ul>
        </div>
      )}

      {selectedService === 'intl_ems' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">International EMS (Speed Post) Zones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white font-sans block mb-1">Zone 1: SAARC (Nepal, Bangladesh, Sri Lanka, Bhutan)</span>
              <div>First 250g: ₹500.00</div>
              <div>Each addl 250g: ₹85.00</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white font-sans block mb-1">Zone 2: ASEAN & Gulf (UAE, Singapore, Saudi, Malaysia)</span>
              <div>First 250g: ₹750.00</div>
              <div>Each addl 250g: ₹140.00</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white font-sans block mb-1">Zone 3: Europe & Africa (UK, Germany, France, Japan)</span>
              <div>First 250g: ₹1,050.00</div>
              <div>Each addl 250g: ₹220.00</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white font-sans block mb-1">Zone 4: Americas & Oceania (USA, Canada, Australia)</span>
              <div>First 250g: ₹1,250.00</div>
              <div>Each addl 250g: ₹280.00</div>
            </div>
          </div>
        </div>
      )}

      {selectedService === 'intl_air_parcel' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">International Air Parcel</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For cross-border merchandise consignments up to 20kg. First 500g slab + additional 500g slabs categorized by destination country tariff group.
          </p>
        </div>
      )}

      {selectedService === 'intl_small_packet' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">International Registered Small Packet</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Cost-effective solution for small lightweight items under 2,000 grams (2 kg). Base weight bracket starts at 100g with ₹150 international registration docket fee.
          </p>
        </div>
      )}

      {selectedService === 'logistics_post' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Logistics Post (Heavy Multi-Consignment Cargo)</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Designed for consignments weighing 50 kg or more. Base handling fee ₹150 + distance slab charges based on multi-modal freight network per quintal (100 kg) slab.
          </p>
        </div>
      )}
    </div>
  );
};
