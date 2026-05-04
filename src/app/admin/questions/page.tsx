"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  Headphones,
  BookOpen,
  PenTool,
  Trash2,
  Edit,
  Search,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Upload,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedContainer } from "@/components/animations";
import Link from "next/link";

interface QuestionOption {
  id: string;
  optionKey: string;
  optionText: string;
}

interface Question {
  id: string;
  section: string;
  questionNumber: number;
  questionText: string;
  passageText?: string;
  audioUrl?: string;
  correctAnswer: string;
  explanation?: string;
  createdAt: string;
  options?: QuestionOption[];
}

const sectionConfig = {
  LISTENING: {
    label: "Listening",
    icon: Headphones,
    description: "Soal dengan audio",
    bgGradient: "from-blue-500 to-blue-600",
    textGradient: "text-blue-600",
    bgLight: "bg-blue-50",
    borderLight: "border-blue-200",
  },
  STRUCTURE: {
    label: "Structure",
    icon: PenTool,
    description: "Soal grammar",
    bgGradient: "from-purple-500 to-purple-600",
    textGradient: "text-purple-600",
    bgLight: "bg-purple-50",
    borderLight: "border-purple-200",
  },
  READING: {
    label: "Reading",
    icon: BookOpen,
    description: "Soal dengan teks bacaan",
    bgGradient: "from-green-500 to-green-600",
    textGradient: "text-green-600",
    bgLight: "bg-green-50",
    borderLight: "border-green-200",
  },
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [viewModal, setViewModal] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Question | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questions");
      const data = await res.json();
      if (data.success) {
        const transformed = (data.questions || []).map((q: any) => ({
          id: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          passageText: q.passageText,
          audioUrl: q.audioUrl,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          createdAt: q.createdAt,
          options: q.options || [],
        }));
        setQuestions(transformed);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/questions/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        showNotification("success", "Pertanyaan berhasil dihapus");
        setDeleteConfirm(null);
        fetchQuestions();
      } else {
        showNotification("error", data.message || "Gagal menghapus pertanyaan");
      }
    } catch (err) {
      showNotification("error", "Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSection === "all" || q.section === filterSection;
    return matchesSearch && matchesSection;
  });

  const getSectionIcon = (section: string) => {
    const Icon = sectionConfig[section as keyof typeof sectionConfig]?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getSectionBadgeColor = (section: string) => {
    const config = sectionConfig[section as keyof typeof sectionConfig];
    if (!config) return "bg-slate-100 text-slate-600";
    return `${config.bgLight} ${config.textGradient}`;
  };

  return (
    <main className="space-y-8">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 right-4 z-50 rounded-xl p-4 flex items-center gap-3 shadow-lg ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Question Bank</h1>
            <p className="mt-1 text-slate-500">
              Kelola bank soal TOEFL untuk simulasi ujian
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/questions/import-export"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import/Export
            </Link>
            <Link href="/admin/questions/add">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Soal
              </Button>
            </Link>
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(sectionConfig).map(([key, config], index) => {
          const count = questions.filter((q) => q.section === key).length;
          const Icon = config.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl border ${config.borderLight} p-6`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${config.bgGradient}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${config.bgLight} ${config.textGradient}`}>
                  {config.label}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-500">Questions</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Section</option>
            <option value="LISTENING">Listening</option>
            <option value="STRUCTURE">Structure</option>
            <option value="READING">Reading</option>
          </select>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Soal</h3>
            <p className="text-slate-500 mb-6">Tambahkan soal TOEFL baru untuk memulai</p>
            <Link href="/admin/questions/add">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Soal Pertama
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Correct
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getSectionBadgeColor(question.section)}`}>
                          {getSectionIcon(question.section)}
                          {sectionConfig[question.section as keyof typeof sectionConfig]?.label || question.section}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">
                          #{question.questionNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-slate-900 line-clamp-2 max-w-md prose prose-sm prose-slate max-w-none"
                          dangerouslySetInnerHTML={{ __html: question.questionText }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                          {question.correctAnswer}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewModal(question)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/questions/edit/${question.id}`}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(question)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setViewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getSectionBadgeColor(viewModal.section)}`}>
                    {getSectionIcon(viewModal.section)}
                    {sectionConfig[viewModal.section as keyof typeof sectionConfig]?.label}
                  </span>
                  <span className="text-sm text-slate-500">#{viewModal.questionNumber}</span>
                </div>
                <button
                  onClick={() => setViewModal(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                {/* Audio for Listening */}
                {viewModal.section === "LISTENING" && viewModal.audioUrl && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">Audio File</p>
                        <a
                          href={viewModal.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {viewModal.audioUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passage for Reading/Structure */}
                {(viewModal.section === "READING" || viewModal.section === "STRUCTURE") && viewModal.passageText && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Passage</p>
                    <div
                      className="prose prose-sm prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewModal.passageText }}
                    />
                  </div>
                )}

                {/* Question */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Question</p>
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewModal.questionText }}
                  />
                </div>

                {/* Options */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Answer Options</p>
                  <div className="space-y-2">
                    {viewModal.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          opt.optionKey === viewModal.correctAnswer
                            ? "bg-green-50 border-2 border-green-500"
                            : "bg-slate-50 border-2 border-transparent"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          opt.optionKey === viewModal.correctAnswer
                            ? "bg-green-500 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {opt.optionKey}
                        </div>
                        <div
                          className="flex-1 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: opt.optionText }}
                        />
                        {opt.optionKey === viewModal.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {viewModal.explanation && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-600 uppercase mb-2">Explanation</p>
                    <div
                      className="prose prose-sm prose-amber max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewModal.explanation }}
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <Button variant="outline" onClick={() => setViewModal(null)}>
                  Tutup
                </Button>
                <Link href={`/admin/questions/edit/${viewModal.id}`}>
                  <Button className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Soal
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Pertanyaan?</h3>
                <p className="text-slate-500 mb-6">
                  Anda yakin ingin menghapus pertanyaan ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-600">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getSectionBadgeColor(deleteConfirm.section)}`}>
                      {getSectionIcon(deleteConfirm.section)}
                    </span>
                    {" "}#{deleteConfirm.questionNumber}
                  </p>
                  <p className="text-sm text-slate-900 mt-2 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: deleteConfirm.questionText }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={actionLoading}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Menghapus...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}