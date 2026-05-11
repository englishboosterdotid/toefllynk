"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Activity,
  RefreshCw,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedContainer } from "@/components/animations";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Session = {
  id: string;
  studentName: string;
  studentEmail: string;
  currentSection: string;
  sectionTimeLeft: number;
  answeredCount: number;
  warningCount: number;
  hasAutoSubmit: boolean;
  lastActivity: string;
  recentLogs: { type: string; createdAt: string }[];
};

type CompletedSession = {
  id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  warningCount: number;
  wasAutoSubmitted: boolean;
  completedAt: string;
};

type Stats = {
  totalActive: number;
  flaggedSessions: number;
  autoSubmitted24h: number;
};

export default function ExamMonitoringPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [completed, setCompleted] = useState<CompletedSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/exam-monitoring");
      const data = await res.json();

      if (data.success) {
        setSessions(data.activeSessions || []);
        setCompleted(data.recentCompleted || []);
        setStats(data.stats || null);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TAB_SWITCH":
        return <Eye className="h-4 w-4 text-amber-500" />;
      case "FULLSCREEN_EXIT":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "AUTO_SUBMIT":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "MANUAL_SUBMIT":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "FULLSCREEN_ENTER":
        return <Monitor className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Exam Monitoring</h1>
            <p className="mt-1 text-slate-500">
              Monitor student exam activities in real-time
            </p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats Cards */}
      {stats && (
        <AnimatedContainer delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Exams</p>
                  <p className="text-4xl font-bold mt-1">{stats.totalActive}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Flagged Sessions</p>
                  <p className="text-4xl font-bold mt-1">{stats.flaggedSessions}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Auto-Submitted (24h)</p>
                  <p className="text-4xl font-bold mt-1">{stats.autoSubmitted24h}</p>
                </div>
                <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </AnimatedContainer>
      )}

      {/* Active Sessions */}
      <AnimatedContainer delay={0.2}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Active Exam Sessions</h2>
                <p className="text-sm text-slate-500">Real-time monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <span className="text-xs text-slate-400">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              {isRefreshing && (
                <span className="text-xs text-blue-500 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Refreshing...
                </span>
              )}
              <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2" disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No active exam sessions</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Warnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{session.studentName}</p>
                          <p className="text-sm text-slate-500">{session.studentEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.currentSection === "LISTENING"
                            ? "bg-purple-100 text-purple-700"
                            : session.currentSection === "STRUCTURE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {session.currentSection}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className={`font-mono ${session.sectionTimeLeft < 60 ? "text-red-500 font-bold" : "text-slate-600"}`}>
                            {formatTime(session.sectionTimeLeft)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(session.answeredCount / 150) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-600">{session.answeredCount}/150</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {session.warningCount > 0 ? (
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            session.warningCount >= 3
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            <AlertTriangle className="h-4 w-4" />
                            {session.warningCount}x
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {session.hasAutoSubmit ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Auto-submit pending
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {session.recentLogs.slice(0, 3).map((log, idx) => (
                            <div key={idx} className="p-1.5 rounded-lg bg-slate-100" title={`${log.type} at ${formatDate(log.createdAt)}`}>
                              {getActivityIcon(log.type)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AnimatedContainer>

      {/* Recent Completed */}
      <AnimatedContainer delay={0.3}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="font-semibold text-slate-900">Recent Completed (24h)</h2>
          </div>

          <div className="overflow-x-auto">
            {completed.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No recent completions
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Warnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Auto-Submit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completed.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{session.studentName}</p>
                          <p className="text-sm text-slate-500">{session.studentEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.warningCount > 0
                            ? session.warningCount >= 3
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {session.warningCount} warnings
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {session.wasAutoSubmitted ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Manual</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(session.completedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AnimatedContainer>
    </main>
  );
}