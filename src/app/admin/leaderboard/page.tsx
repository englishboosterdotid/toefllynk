"use client";

import { useEffect, useState } from "react";
import { Trophy, Users, RefreshCw, Download, Filter } from "lucide-react";
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

export default function AdminLeaderboardPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "top10" | "passing" | "failing">("all");

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

  const filteredResults = results.filter((r) => {
    if (filter === "top10") return results.indexOf(r) < 10;
    if (filter === "passing") return r.totalScore >= 550;
    if (filter === "failing") return r.totalScore < 450;
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const medalEmojis = ["🥇", "🥈", "🥉"];

  const stats = {
    total: results.length,
    average: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.totalScore, 0) / results.length) : 0,
    passing: results.filter(r => r.totalScore >= 550).length,
    highest: results.length > 0 ? Math.max(...results.map(r => r.totalScore)) : 0,
  };

  if (loading) {
    return (
      <main className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-500">Memuat leaderboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
            <p className="mt-1 text-slate-500">Ranking performa siswa</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeaderboard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats Cards */}
      <AnimatedContainer delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Attempts</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Average Score</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.average}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Passing (≥550)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.passing}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Highest Score</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.highest}</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Filters */}
      <AnimatedContainer delay={0.2}>
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-slate-400" />
          <div className="flex gap-2">
            {[
              { key: "all", label: "All" },
              { key: "top10", label: "Top 10" },
              { key: "passing", label: "Passing" },
              { key: "failing", label: "Needs Improvement" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </AnimatedContainer>

      {/* Top 3 Cards */}
      {results.length >= 3 && (
        <AnimatedContainer delay={0.3}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => {
              const result = results[idx];
              const rank = idx + 1;
              const colors = [
                "from-amber-50 to-yellow-50 border-amber-300",
                "from-slate-50 to-gray-50 border-gray-300",
                "from-orange-50 to-amber-50 border-orange-300",
              ];

              return (
                <div
                  key={result.id}
                  className={`bg-gradient-to-br ${colors[idx]} border-2 rounded-2xl p-6`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{medalEmojis[idx]}</div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{result.studentName}</p>
                      <p className="text-sm text-slate-500">{formatDate(result.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-black ${
                        rank === 1 ? "text-amber-600" : rank === 2 ? "text-slate-600" : "text-orange-600"
                      }`}>{result.totalScore}</p>
                      <p className="text-xs text-slate-500">score</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="px-3 py-1 bg-purple-100 rounded-lg text-sm font-medium text-purple-700">
                      L: {result.listeningCorrect}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 rounded-lg text-sm font-medium text-blue-700">
                      S: {result.structureCorrect}
                    </span>
                    <span className="px-3 py-1 bg-green-100 rounded-lg text-sm font-medium text-green-700">
                      R: {result.readingCorrect}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedContainer>
      )}

      {/* Full Leaderboard Table */}
      <AnimatedContainer delay={0.4}>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Rank</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Total Score</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Listening</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Structure</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Reading</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Data</h3>
                      <p className="text-slate-500">Hasil ujian akan muncul setelah siswa menyelesaikan ujian</p>
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result, idx) => {
                    const rank = filter === "all" ? results.indexOf(result) + 1 : idx + 1;
                    return (
                      <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold ${
                            rank === 1 ? "bg-amber-100 text-amber-700" :
                            rank === 2 ? "bg-slate-200 text-slate-600" :
                            rank === 3 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{result.studentName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-lg font-bold ${
                            result.totalScore >= 550 ? "text-green-600" :
                            result.totalScore >= 500 ? "text-blue-600" :
                            result.totalScore >= 450 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>{result.totalScore}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700">{result.listeningCorrect}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700">{result.structureCorrect}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700">{result.readingCorrect}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{formatDate(result.createdAt)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedContainer>
    </main>
  );
}
