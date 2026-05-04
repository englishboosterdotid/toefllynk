"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Target,
  Clock,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedContainer } from "@/components/animations";
import Link from "next/link";

type Stats = {
  totalExams: number;
  avgScore: number;
  passRate: number;
  sectionAverages: {
    listening: string;
    structure: string;
    reading: string;
  };
  hardestSection: string;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsWork: number;
  };
};

type MonthlyTrend = {
  month: string;
  count: number;
  avgScore: number;
};

type TopPerformer = {
  rank: number;
  studentName: string;
  score: number;
  date: string;
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setMonthlyTrend(data.monthlyTrend);
        setTopPerformers(data.topPerformers);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
          <p className="text-slate-500">Memuat analytics...</p>
        </div>
      </main>
    );
  }

  const maxMonthlyCount = Math.max(...monthlyTrend.map(m => m.count), 1);

  return (
    <main className="space-y-8">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="mt-1 text-slate-500">
              Statistik dan insight performa ujian TOEFL
            </p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Top Stats Cards */}
      <AnimatedContainer delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Total
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats?.totalExams || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Total Exam Attempts</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats?.avgScore || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Average Score</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats?.passRate || 0}%</p>
            <p className="text-sm text-slate-500 mt-1">Pass Rate (≥500)</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${
              stats?.hardestSection === "LISTENING" ? "text-purple-600" :
              stats?.hardestSection === "STRUCTURE" ? "text-blue-600" : "text-green-600"
            }`}>
              {stats?.hardestSection}
            </p>
            <p className="text-sm text-slate-500 mt-1">Section Paling Sulit</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Score Distribution & Section Averages */}
      <AnimatedContainer delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Score Distribution</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Excellent (≥550)</div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(stats?.scoreDistribution.excellent || 0) / (stats?.totalExams || 1) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-slate-700">{stats?.scoreDistribution.excellent || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Good (500-549)</div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(stats?.scoreDistribution.good || 0) / (stats?.totalExams || 1) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-slate-700">{stats?.scoreDistribution.good || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Average (450-499)</div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(stats?.scoreDistribution.average || 0) / (stats?.totalExams || 1) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-slate-700">{stats?.scoreDistribution.average || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Needs Work (&lt;450)</div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(stats?.scoreDistribution.needsWork || 0) / (stats?.totalExams || 1) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-slate-700">{stats?.scoreDistribution.needsWork || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Averages */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Section Averages</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Listening</span>
                  <span className="text-lg font-bold text-slate-900">{stats?.sectionAverages.listening}</span>
                </div>
                <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(parseFloat(stats?.sectionAverages.listening || "0") / 50) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Structure</span>
                  <span className="text-lg font-bold text-slate-900">{stats?.sectionAverages.structure}</span>
                </div>
                <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(parseFloat(stats?.sectionAverages.structure || "0") / 40) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Reading</span>
                  <span className="text-lg font-bold text-slate-900">{stats?.sectionAverages.reading}</span>
                </div>
                <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(parseFloat(stats?.sectionAverages.reading || "0") / 50) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Monthly Trend */}
      <AnimatedContainer delay={0.3}>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Monthly Trend (Last 6 Months)</h2>
          <div className="flex items-end gap-4 h-48">
            {monthlyTrend.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-36">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(month.count / maxMonthlyCount) * 100}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg min-h-[4px]"
                  />
                </div>
                <span className="text-xs text-slate-500">{month.month}</span>
                <span className="text-sm font-medium text-slate-700">{month.count}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedContainer>

      {/* Top Performers / Leaderboard */}
      <AnimatedContainer delay={0.4}>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Top Performers</h2>
            <Award className="h-5 w-5 text-amber-500" />
          </div>

          {topPerformers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((performer) => (
                <div
                  key={performer.rank}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    performer.rank === 1
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
                      : performer.rank === 2
                      ? "bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200"
                      : performer.rank === 3
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                    performer.rank === 1
                      ? "bg-amber-500 text-white"
                      : performer.rank === 2
                      ? "bg-slate-400 text-white"
                      : performer.rank === 3
                      ? "bg-orange-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {performer.rank <= 3 ? (
                      performer.rank === 1 ? "🥇" : performer.rank === 2 ? "🥈" : "🥉"
                    ) : (
                      performer.rank
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{performer.studentName}</p>
                    <p className="text-xs text-slate-500">{formatDate(performer.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{performer.score}</p>
                    <p className="text-xs text-slate-500">score</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimatedContainer>
    </main>
  );
}