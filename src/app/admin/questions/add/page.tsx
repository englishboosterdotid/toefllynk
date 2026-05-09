"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedContainer } from "@/components/animations";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FileUpload } from "@/components/ui/FileUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const sectionConfig = {
  LISTENING: {
    label: "Listening",
    icon: Headphones,
    color: "blue",
    description: "Soal dengan audio recording",
    bgGradient: "from-blue-500 to-blue-600",
    textGradient: "text-blue-600",
    bgLight: "bg-blue-50",
    borderLight: "border-blue-200",
  },
  STRUCTURE: {
    label: "Structure",
    icon: PenTool,
    color: "purple",
    description: "Soal grammar dan structure",
    bgGradient: "from-purple-500 to-purple-600",
    textGradient: "text-purple-600",
    bgLight: "bg-purple-50",
    borderLight: "border-purple-200",
  },
  READING: {
    label: "Reading",
    icon: BookOpen,
    color: "green",
    description: "Soal dengan teks bacaan",
    bgGradient: "from-green-500 to-green-600",
    textGradient: "text-green-600",
    bgLight: "bg-green-50",
    borderLight: "border-green-200",
  },
};

export default function AddQuestionPage() {
  const [selectedSection, setSelectedSection] = useState<string>("LISTENING");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    questionNumber: "",
    questionText: "",
    passageText: "",
    audioUrl: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    explanation: "",
  });

  const getSectionIcon = (section: string) => {
    const Icon = sectionConfig[section as keyof typeof sectionConfig]?.icon || BookOpen;
    return <Icon className="h-4 w-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("section", selectedSection);
    Object.entries(form).forEach(([key, value]) => {
      fd.append(key, value);
    });

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Pertanyaan berhasil disimpan!");
        setForm({
          questionNumber: "",
          questionText: "",
          passageText: "",
          audioUrl: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "",
          explanation: "",
        });
        // Refresh the page to show success
        setTimeout(() => {
          window.location.href = "/admin/questions";
        }, 1500);
      } else {
        setError(data.message || "Gagal menyimpan pertanyaan");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      questionNumber: "",
      questionText: "",
      passageText: "",
      audioUrl: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      explanation: "",
    });
  };

  return (
    <main className="space-y-8">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/questions"
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tambah Soal Baru</h1>
            <p className="mt-1 text-slate-500">
              Buat soal TOEFL baru untuk bank pertanyaan
            </p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">{success}</span>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Selection */}
          <AnimatedContainer>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Pilih Section</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(sectionConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedSection === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedSection(key)}
                      className={`relative p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${config.bgGradient}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">{config.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{config.description}</p>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </AnimatedContainer>

          {/* Question Details */}
          <AnimatedContainer delay={0.1}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  selectedSection === "LISTENING" ? "bg-blue-100" :
                  selectedSection === "STRUCTURE" ? "bg-purple-100" : "bg-green-100"
                }`}>
                  {getSectionIcon(selectedSection)}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Detail Pertanyaan</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questionNumber">Question Number</Label>
                  <Input
                    id="questionNumber"
                    type="number"
                    placeholder="1"
                    min="1"
                    value={form.questionNumber}
                    onChange={(e) => setForm({ ...form, questionNumber: e.target.value })}
                    required
                  />
                </div>

                {selectedSection === "LISTENING" && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-slate-500" />
                      Audio File
                    </Label>
                    <FileUpload
                      folder="audio/listening"
                      accept="audio/*"
                      maxSize={50}
                      currentValue={form.audioUrl}
                      onUploadComplete={(result) => {
                        setForm({ ...form, audioUrl: result.url });
                      }}
                      onUploadError={(err) => {
                        setError(err);
                      }}
                    />
                    <p className="text-xs text-slate-400">
                      Upload audio file or enter URL below
                    </p>
                    <Input
                      placeholder="Or paste audio URL here..."
                      value={form.audioUrl}
                      onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Question Text</Label>
                <RichTextEditor
                  value={form.questionText}
                  onChange={(value) => setForm({ ...form, questionText: value })}
                  placeholder="Ketik pertanyaan di sini..."
                  className="min-h-[120px]"
                />
              </div>

              {(selectedSection === "READING" || selectedSection === "STRUCTURE") && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-500" />
                    Passage Text
                  </Label>
                  <RichTextEditor
                    value={form.passageText}
                    onChange={(value) => setForm({ ...form, passageText: value })}
                    placeholder="Masukkan teks bacaan untuk soal ini..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-slate-400">
                    Teks bacaan akan ditampilkan bersama pertanyaan
                  </p>
                </div>
              )}
            </div>
          </AnimatedContainer>

          {/* Answer Options */}
          <AnimatedContainer delay={0.2}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Pilihan Jawaban</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["A", "B", "C", "D"].map((option) => (
                  <div key={option} className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                      form.correctAnswer === option
                        ? "bg-green-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {option}
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder={`Jawaban ${option}`}
                        value={form[`option${option}` as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [`option${option}`]: e.target.value })}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, correctAnswer: option })}
                      className={`h-10 px-4 rounded-xl text-sm font-medium transition-all ${
                        form.correctAnswer === option
                          ? "bg-green-100 text-green-700 border-2 border-green-500"
                          : "bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200"
                      }`}
                    >
                      {form.correctAnswer === option ? "✓ Benar" : "Pilih"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Klik tombol "Pilih" di samping setiap jawaban untuk menandai sebagai jawaban benar.
                </p>
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit */}
          <AnimatedContainer delay={0.3}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Simpan Pertanyaan
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetForm}
              >
                Reset Form
              </Button>
            </div>
          </AnimatedContainer>

          {/* Explanation */}
          <AnimatedContainer delay={0.4}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Penjelasan (Opsional)</h2>
              <RichTextEditor
                value={form.explanation}
                onChange={(value) => setForm({ ...form, explanation: value })}
                placeholder="Jelaskan mengapa jawaban ini benar..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-slate-400">
                Penjelasan akan membantu siswa memahami materi
              </p>
            </div>
          </AnimatedContainer>

          {/* Tips */}
          <AnimatedContainer delay={0.5}>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Tips Penting
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">LISTENING</p>
                    <p className="text-xs text-slate-600">Pastikan URL audio valid dan dapat diakses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">READING</p>
                    <p className="text-xs text-slate-600">Teks bacaan harus relevan dengan pertanyaan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">STRUCTURE</p>
                    <p className="text-xs text-slate-600">Fokus pada grammar pattern yang diuji</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Jawaban</p>
                    <p className="text-xs text-slate-600">Pilih jawaban yang benar dengan tombol "Pilih"</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </form>
    </main>
  );
}