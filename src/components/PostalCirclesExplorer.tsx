import React, { useState } from 'react';
import { POSTAL_CIRCLES, PostalCircleInfo } from '../data/postalCircles';
import { Search, MapPin, Building2, Compass } from 'lucide-react';

export const PostalCirclesExplorer: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const circlesList = Object.values(POSTAL_CIRCLES);

  const filteredCircles = circlesList.filter((circle) => {
    const matchesSearch =
      circle.prefix.includes(search) ||
      circle.circleName.toLowerCase().includes(search.toLowerCase()) ||
      circle.state.toLowerCase().includes(search.toLowerCase()) ||
      circle.headquarters.toLowerCase().includes(search.toLowerCase());

    const matchesZone = selectedZone === 'all' || circle.zone === selectedZone;

    return matchesSearch && matchesZone;
  });

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c4122f] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                India Post Postal Circles & PIN Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mapping the 23 Postal Circles, 8 Regional Postal Zones & 1 CBPO Army Service.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PIN prefix, state, or GPO..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:border-[#c4122f]"
            />
          </div>
        </div>

        {/* Zone Filters */}
        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 dark:border-slate-800 pt-3">
          {['all', 'Northern', 'Western', 'Southern', 'Eastern', 'Army'].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedZone === zone
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {zone === 'all' ? 'All Zones (23 Circles)' : `${zone} Zone`}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4 w-24">PIN Prefix</th>
                <th className="py-2.5 px-4">Circle Name</th>
                <th className="py-2.5 px-4">State / Sub-Region</th>
                <th className="py-2.5 px-4">Postal Headquarters / GPO Hub</th>
                <th className="py-2.5 px-4 w-28">Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCircles.map((circle: PostalCircleInfo) => (
                <tr key={circle.prefix} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sm text-[#c4122f] dark:text-red-400">
                    {circle.prefix}xxxx
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {circle.circleName}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{circle.state}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{circle.headquarters}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{circle.zone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
