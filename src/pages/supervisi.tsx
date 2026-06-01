import React from "react";
import { ClipboardCheck } from "lucide-react";

export default function SupervisiMutu() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-3xl font-bold text-[#10a37f] tracking-tight">
          Supervisi Mutu
        </h1>
        <p className="text-gray-900 mt-1 text-sm font-semibold">
          Daftar pemonitoran dan supervisi indikator mutu unit RS.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <ClipboardCheck className="text-emerald-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">
            Jadwal & Hasil Supervisi
          </h3>
        </div>
        
        <div className="flex-1 overflow-auto rounded-xl border border-gray-100 rounded-b-lg">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="sticky top-0 bg-gray-50 flex-shrink-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 font-semibold text-sm border-b border-gray-200">No</th>
                <th className="p-3 font-semibold text-sm border-b border-gray-200">Unit Bagian</th>
                <th className="p-3 font-semibold text-sm border-b border-gray-200">Fokus Supervisi</th>
                <th className="p-3 font-semibold text-sm text-center border-b border-gray-200">Status</th>
                <th className="p-3 font-semibold text-sm text-center border-b border-gray-200">Aksi</th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              <tr className="hover:bg-gray-50">
                <td className="p-3 border-b border-gray-100 text-sm font-medium">1</td>
                <td className="p-3 border-b border-gray-100 text-sm font-semibold text-emerald-800">Ruang Inap Melati</td>
                <td className="p-3 border-b border-gray-100 text-sm">Kepatuhan Kebersihan Tangan</td>
                <td className="p-3 border-b border-gray-100 text-center">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">
                    Selesai
                  </span>
                </td>
                <td className="p-3 border-b border-gray-100 text-center">
                  <button className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center justify-center mx-auto shadow-sm">Lihat Hasil</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border-b border-gray-100 text-sm font-medium">2</td>
                <td className="p-3 border-b border-gray-100 text-sm font-semibold text-emerald-800">IGD</td>
                <td className="p-3 border-b border-gray-100 text-sm">Waktu Tanggap Pelayanan</td>
                <td className="p-3 border-b border-gray-100 text-center">
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">
                    Terjadwal
                  </span>
                </td>
                <td className="p-3 border-b border-gray-100 text-center">
                  <button className="text-xs font-bold bg-[#10a37f] text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 flex items-center justify-center mx-auto shadow-[0_2px_8px_-1px_rgba(16,163,127,0.4)]">Isi Supervisi</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border-b border-gray-100 text-sm font-medium">3</td>
                <td className="p-3 border-b border-gray-100 text-sm font-semibold text-emerald-800">Farmasi</td>
                <td className="p-3 border-b border-gray-100 text-sm">Ketepatan Waktu Tunggu Obat Minimum</td>
                <td className="p-3 border-b border-gray-100 text-center">
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">
                    Terjadwal
                  </span>
                </td>
                <td className="p-3 border-b border-gray-100 text-center">
                  <button className="text-xs font-bold bg-[#10a37f] text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 flex items-center justify-center mx-auto shadow-[0_2px_8px_-1px_rgba(16,163,127,0.4)]">Isi Supervisi</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
