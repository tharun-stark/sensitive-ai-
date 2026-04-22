import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const DatasetUpload = ({ onDataLoaded }) => {
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }
        if (results.data.length === 0) {
          setError('CSV file is empty');
          return;
        }
        const columns = Object.keys(results.data[0]);
        onDataLoaded(results.data, columns);
      },
      error: (err) => {
        setError(`Error: ${err.message}`);
      }
    });
  };

  return (
    <div className="border-2 border-dashed border-line p-8 rounded-xl bg-white/50 hover:bg-white/80 transition-all group">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
      />
      <label
        htmlFor="csv-upload"
        className="flex flex-col items-center justify-center cursor-pointer space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          {fileName ? (
            <FileText className="w-8 h-8 text-ink" />
          ) : (
            <Upload className="w-8 h-8 text-ink/40" />
          )}
        </div>
        <div className="text-center">
          <p className="font-sans font-bold text-lg">
            {fileName ? fileName : 'Upload Dataset (CSV)'}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            Drag and drop or click to browse
          </p>
        </div>
      </label>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {fileName && !error && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-600 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Dataset loaded successfully
        </div>
      )}
    </div>
  );
};
