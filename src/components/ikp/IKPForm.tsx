import React from "react";

export default function IKPForm({ initialData, onSuccess, onCancel }: any) {
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Input Data IKP</h2>
      <p className="text-gray-500 mb-4">Form input has not been implemented yet.</p>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={onSuccess}>Save</button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
