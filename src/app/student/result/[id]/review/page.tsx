"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Option = {
  id: string;
  optionKey: string;
  optionText: string;
};

type Question = {
  id: string;
  section: string;
  questionNumber: number;
  questionText: string;
  passageText?: string | null;
  audioUrl?: string | null;
  correctAnswer: string;
  explanation?: string | null;
  options: Option[];
};

type Answer = {
  selectedKey: string;
};

export default function ReviewAnswersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [resultId, setResultId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = { current: null as HTMLAudioElement | null };

  useEffect(() => {
    params.then((p) => setResultId(p.id));
  }, [params]);

  useEffect(() => {
    if (!resultId) return;

    // Fetch questions and student's answers
    Promise.all([
      fetch("/api/student-questions").then((res) => res.json()),
      fetch(`/api/student/exam-session?resultId=${resultId}`)
        .then((res) => res.json())
        .catch(() => ({ answers: {} })),
    ])
      .then(([qData, aData]) => {
        if (qData.questions) {
          setQuestions(qData.questions);
        }
        if (aData && "answers" in aData && aData.answers) {
          setAnswers(aData.answers);
        }
      })
      .finally(() => setLoading(false));
  }, [resultId]);

  const question = questions[current];
  const userAnswer = question ? answers[question.id]?.selectedKey : null;
  const isCorrect = userAnswer === question?.correctAnswer;

  const sectionConfig: Record<string, { label: string; color: string; bg: string }> = {
    LISTENING: { label: "Listening", color: "text-purple-600", bg: "bg-purple-100" },
    STRUCTURE: { label: "Structure", color: "text-blue-600", bg: "bg-blue-100" },
    READING: { label: "Reading", color: "text-green-600", bg: "bg-green-100" },
  };

  const questionsBySection = questions.reduce((acc, q) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  const getSectionStats = (section: string) => {
    const sectionQs = questionsBySection[section] || [];
    const correct = sectionQs.filter((q) => answers[q.id]?.selectedKey === q.correctAnswer).length;
    return { total: sectionQs.length, correct };
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat review jawaban...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/student/result/${resultId}`}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Review Jawaban</h1>
                <p className="text-sm text-slate-500">Lihat jawaban Anda dan pembahasannya</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Section Navigator */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Section Overview</h3>

              {Object.entries(questionsBySection).map(([section, qs]) => {
                const config = sectionConfig[section] || sectionConfig.READING;
                const stats = getSectionStats(section);
                const percent = Math.round((stats.correct / stats.total) * 100);

                return (
                  <div key={section} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                      <span className="text-sm text-slate-500">{stats.correct}/{stats.total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${percent >= 70 ? "bg-green-500" : percent >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">All Questions</h4>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const answer = answers[q.id];
                    const isCorrect = answer?.selectedKey === q.correctAnswer;
                    const isCurrent = idx === current;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrent(idx)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-lg"
                            : isCorrect
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-green-100 border border-green-300" />
                  <span className="text-slate-500">Benar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-red-100 border border-red-300" />
                  <span className="text-slate-500">Salah</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Question */}
          <div className="flex-1">
            {question && (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between ${
                  question.section === "LISTENING"
                    ? "bg-gradient-to-r from-purple-500 to-purple-600"
                    : question.section === "STRUCTURE"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
                } text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/20">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">
                      {sectionConfig[question.section]?.label} Section - #{question.questionNumber}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isCorrect ? "bg-green-500" : "bg-red-500"
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Benar</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Salah</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Passage */}
                {question.passageText && (
                  <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Reading Passage</p>
                    <div className="prose prose-amber prose-sm max-w-none text-amber-900" dangerouslySetInnerHTML={{ __html: question.passageText }} />
                  </div>
                )}

                {/* Audio Player */}
                {question.section === "LISTENING" && question.audioUrl && (
                  <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            if (isPlaying) {
                              audioRef.current.pause();
                            } else {
                              audioRef.current.play();
                            }
                            setIsPlaying(!isPlaying);
                          }
                        }}
                        className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg"
                      >
                        {isPlaying ? "❚❚" : "▶"}
                      </button>
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Audio</span>
                      </div>
                      <audio ref={audioRef} src={question.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="p-6">
                  <div className="prose prose-slate max-w-none text-slate-800 text-lg mb-6" dangerouslySetInnerHTML={{ __html: question.questionText }} />

                  {/* Options */}
                  <div className="space-y-3">
                    {question.options.map((opt) => {
                      const isUserAnswer = userAnswer === opt.optionKey;
                      const isCorrectAnswer = question.correctAnswer === opt.optionKey;

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                            isCorrectAnswer
                              ? "border-green-500 bg-green-50"
                              : isUserAnswer && !isCorrectAnswer
                              ? "border-red-500 bg-red-50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                            isCorrectAnswer
                              ? "bg-green-500 text-white"
                              : isUserAnswer
                              ? "bg-red-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}>
                            {opt.optionKey}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`text-slate-700 ${
                                isCorrectAnswer ? "font-medium text-green-800" : ""
                              }`}
                              dangerouslySetInnerHTML={{ __html: opt.optionText }}
                            />
                          </div>
                          {isCorrectAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Your Answer vs Correct */}
                  {!isCorrect && userAnswer && (
                    <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-sm text-red-800">
                        <strong>Jawaban Anda:</strong> {userAnswer} | <strong>Jawaban yang benar:</strong> {question.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">Penjelasan:</p>
                        <div className="text-sm text-blue-700 prose prose-blue prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: question.explanation }} />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                disabled={current === 0}
                className="gap-2 px-5 py-5 rounded-xl"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </Button>

              <span className="text-slate-500">
                Question {current + 1} of {questions.length}
              </span>

              <Button
                onClick={() => setCurrent((c) => Math.min(c + 1, questions.length - 1))}
                disabled={current === questions.length - 1}
                className="gap-2 px-6 py-5 rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}