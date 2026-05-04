"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, RefreshCw } from "lucide-react";
import { AnimatedContainer } from "@/components/animations";

type Result = {
  id: string;
  studentName: string;
  totalScore: number;
  listeningCorrect: number;
  structureCorrect: number;
  readingCorrect: number;
  createdAt: string;
};

export default function LeaderboardPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.success) {
        setResults(data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Memuat leaderboard...</p>
        </div>
      </main>
    );
  }

  const medalEmojis = ["🥇", "🥈", "🥉"];
  const medalColors = [
    "from-amber-400 via-yellow-300 to-amber-500",
    "from-slate-300 via-gray-200 to-slate-400",
    "from-orange-400 via-amber-500 to-orange-500",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm mb-4">
            <Trophy className="h-4 w-4" />
            <span>Global Leaderboard</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">TOEFL Lynk Leaderboard</h1>
          <p className="text-blue-200">Ranking terbaik dari para pejuang TOEFL</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Top 3 Special Cards */}
          {results.slice(0, 3).map((result, idx) => {
            const rank = idx + 1;

            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-gradient-to-r ${
                  rank === 1
                    ? "from-amber-50 to-yellow-50 border-2 border-amber-300"
                    : rank === 2
                    ? "from-slate-50 to-gray-50 border border-gray-300"
                    : "from-orange-50 to-amber-50 border border-orange-300"
                } rounded-2xl p-6`}
              >
                {/* Rank Badge */}
                <div
                  className={`absolute -top-3 left-6 h-12 w-12 rounded-full bg-gradient-to-br ${medalColors[idx]} flex items-center justify-center text-2xl shadow-lg`}
                >
                  {medalEmojis[idx]}
                </div>

                <div className="flex items-center gap-6 ml-12">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{result.studentName}</h3>
                    <p className="text-sm text-slate-500 mt-1">{formatDate(result.createdAt)}</p>
                  </div>

                  {/* Score Display */}
                  <div className="text-right">
                    <p
                      className={`text-4xl font-black ${
                        rank === 1 ? "text-amber-600" : rank === 2 ? "text-slate-600" : "text-orange-600"
                      }`}
                    >
                      {result.totalScore}
                    </p>
                    <p className="text-xs text-slate-500">score</p>
                  </div>

                  {/* Section Scores */}
                  <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-2 bg-purple-100 rounded-lg">
                      <p className="text-lg font-bold text-purple-700">{result.listeningCorrect}</p>
                      <p className="text-xs text-purple-600">L</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-blue-100 rounded-lg">
                      <p className="text-lg font-bold text-blue-700">{result.structureCorrect}</p>
                      <p className="text-xs text-blue-600">S</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-green-100 rounded-lg">
                      <p className="text-lg font-bold text-green-700">{result.readingCorrect}</p>
                      <p className="text-xs text-green-600">R</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Rest of the list */}
          {results.length > 3 && (
            <div className="bg-white/50 backdrop-blur rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-500 mb-4">RANK 4 - {results.length}</h3>
              <div className="space-y-2">
                {results.slice(3).map((result, idx) => {
                  const rank = idx + 4;
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-600">
                        {rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{result.studentName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">{result.totalScore}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <span className="px-2 py-1 bg-purple-100 rounded text-purple-600">{result.listeningCorrect}L</span>
                          <span className="px-2 py-1 bg-blue-100 rounded text-blue-600">{result.structureCorrect}S</span>
                          <span className="px-2 py-1 bg-green-100 rounded text-green-600">{result.readingCorrect}R</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {results.length === 0 && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Belum Ada Data</h3>
              <p className="text-slate-400">Jadilah yang pertama di leaderboard!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}