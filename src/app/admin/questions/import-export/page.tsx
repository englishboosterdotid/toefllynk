"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedContainer } from "@/components/animations";
import Link from "next/link";

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export default function QuestionImportExportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      data.push(row);
    }

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      setPreviewData(data.slice(0, 5));
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const questions = parseCSV(text);

      if (questions.length === 0) {
        setError("No valid questions found in file");
        setImporting(false);
        return;
      }

      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, mode: "replace" }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.results);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      window.open("/api/admin/questions?format=csv", "_blank");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="p-8 space-y-8">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Import / Export Questions</h1>
            <p className="mt-1 text-slate-500">Import soal dari CSV atau export database soal</p>
          </div>
          <Link
            href="/admin/questions"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Back to Questions
          </Link>
        </div>
      </AnimatedContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Import Questions</h2>
                <p className="text-sm text-slate-500">Upload file CSV dengan soal TOEFL</p>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                file
                  ? "border-green-400 bg-green-50"
                  : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 ${
                file ? "text-green-500" : "text-slate-400"
              }`} />
              {file ? (
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-700">Klik untuk upload file CSV</p>
                  <p className="text-sm text-slate-500 mt-1">Format: CSV dengan header yang benar</p>
                </div>
              )}
            </div>

            {/* Preview Data */}
            {previewData.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Preview (5 pertama):</p>
                <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(previewData, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full mt-6 bg-green-600 hover:bg-green-700"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import {previewData.length} Questions
                </span>
              )}
            </Button>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200"
              >
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Import Berhasil!</span>
                </div>
                <div className="text-sm text-green-700">
                  <p>Created: {result.created}</p>
                  <p>Updated: {result.updated}</p>
                  {result.errors.length > 0 && (
                    <div className="mt-2 text-red-600">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc list-inside">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>... dan {result.errors.length - 5} error lainnya</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}
          </div>
        </AnimatedContainer>

        {/* Export Section */}
        <AnimatedContainer delay={0.2}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Export Questions</h2>
                <p className="text-sm text-slate-500">Download semua soal dalam format CSV</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <FileSpreadsheet className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-2">Export Database Soal</h3>
              <p className="text-sm text-slate-500 mb-6">
                Download semua pertanyaan dalam format CSV yang bisa diedit di Excel atau Google Sheets
              </p>

              <Button
                onClick={handleExport}
                disabled={exporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {exporting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Preparing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </span>
                )}
              </Button>
            </div>

            {/* CSV Format Guide */}
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Format CSV yang didukung:</p>
              <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono overflow-x-auto">
                <pre className="text-slate-600">
{`section,questionNumber,questionText,passageText,audioUrl,correctAnswer,optionA,optionB,optionC,optionD,explanation
"LISTENING","1","Audio question text...","","https://...","A","Option A text...","Option B text...","Option C text...","Option D text...","Explanation..."
"STRUCTURE","1","Structure question...","","","B","Option A...","Option B...","Option C...","Option D...","..."
"READING","1","Reading question...","Passage text here...","","C","Option A...","Option B...","Option C...","Option D...","..."`}
                </pre>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Petunjuk:</p>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Section: LISTENING, STRUCTURE, atau READING</li>
                <li>questionNumber: Nomor soal (1, 2, 3...)</li>
                <li>questionText: Teks pertanyaan (support HTML)</li>
                <li>passageText: Teks bacaan untuk Reading (opsional)</li>
                <li>audioUrl: Link audio untuk Listening (opsional)</li>
                <li>correctAnswer: Jawaban benar (A, B, C, atau D)</li>
                <li>optionA - optionD: Pilihan jawaban</li>
                <li>explanation: Penjelasan jawaban (opsional)</li>
              </ul>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    </main>
  );
}
