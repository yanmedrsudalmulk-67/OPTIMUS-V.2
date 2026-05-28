import React from "react";
import { Shield } from "lucide-react";

export default function Risiko() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#10a37f] tracking-tight">
            Manajemen Risiko
          </h1>
          <p className="text-gray-900 mt-1 text-sm font-semibold">
            Identifikasi dan mitigasi risiko operasional & klinis.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Risk Register
        </h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 font-semibold text-sm border-b">
                Kategori Risiko
              </th>
              <th className="p-3 font-semibold text-sm border-b">
                Identifikasi
              </th>
              <th className="p-3 font-semibold text-sm text-center border-b">
                Likelihood
              </th>
              <th className="p-3 font-semibold text-sm text-center border-b">
                Severity
              </th>
              <th className="p-3 font-semibold text-sm text-center border-b">
                Grading
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-b text-sm">Klinis</td>
              <td className="p-3 border-b text-sm">Kesalahan pemberian obat</td>
              <td className="p-3 border-b text-center text-sm">3</td>
              <td className="p-3 border-b text-center text-sm">4</td>
              <td className="p-3 border-b text-center">
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">
                  12 - HIGH
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
