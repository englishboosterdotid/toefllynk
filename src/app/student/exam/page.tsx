"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  Clock,
  Target,
  Flag,
  X,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Monitor,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  options: Option[];
};

type AnswerData = {
  selectedKey: string;
  isFlagged: boolean;
  timeSpent?: number;
};

const SECTION_TIME_LIMITS: Record<string, number> = {
  LISTENING: 35 * 60,
  STRUCTURE: 25 * 60,
  READING: 55 * 60,
};

const sectionConfig = {
  LISTENING: {
    label: "Listening",
    color: "purple",
    bgGradient: "from-purple-500 to-purple-600",
    textColor: "text-purple-600",
    bgLight: "bg-purple-50",
    borderLight: "border-purple-200",
  },
  STRUCTURE: {
    label: "Structure",
    color: "blue",
    bgGradient: "from-blue-500 to-blue-600",
    textColor: "text-blue-600",
    bgLight: "bg-blue-50",
    borderLight: "border-blue-200",
  },
  READING: {
    label: "Reading",
    color: "green",
    bgGradient: "from-green-500 to-green-600",
    textColor: "text-green-600",
    bgLight: "bg-green-50",
    borderLight: "border-green-200",
  },
};

const SECTION_ORDER = ["LISTENING", "STRUCTURE", "READING"];

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Randomize options for a question
function randomizeOptions(options: Option[]): Option[] {
  const shuffled = shuffleArray(options);
  const keys = ["A", "B", "C", "D"];
  return shuffled.map((opt, idx) => ({
    ...opt,
    optionKey: keys[idx],
  }));
}

// Randomize questions
function randomizeQuestions(questions: Question[]): Question[] {
  return shuffleArray(questions).map((q) => ({
    ...q,
    options: randomizeOptions(q.options),
  }));
}

export default function StudentExamPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabWarningCountRef = useRef(0);
  const audioPlayPromiseRef = useRef<Promise<void> | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(SECTION_TIME_LIMITS.LISTENING);
  const [currentSection, setCurrentSection] = useState("LISTENING");
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"saved" | "syncing" | "offline">("saved");
  const [showNavigator, setShowNavigator] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  // Anti-cheat states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Time tracking per question
  const questionStartTimeRef = useRef<number>(Date.now());
  const questionTimeSpentRef = useRef<Record<string, number>>({});

  // Log activity to database
  const logActivity = useCallback(async (activityType: string, details?: object) => {
    try {
      await fetch("/api/student/exam-activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          activityType,
          details: details || { warningCount: tabSwitchCount },
        }),
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }, [sessionId, tabSwitchCount]);

  // Filter questions by current section only
  const questionsBySection = SECTION_ORDER.reduce((acc, section) => {
    acc[section] = questions.filter((q) => q.section === section);
    return acc;
  }, {} as Record<string, Question[]>);

  // Current section's questions only
  const currentSectionQuestions = questionsBySection[currentSection] || [];

  const question = currentSectionQuestions[current];
  const currentSectionConfig = sectionConfig[currentSection as keyof typeof sectionConfig] || sectionConfig.LISTENING;

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const flaggedCount = Object.values(answers).filter((a) => a.isFlagged).length;

  // ============== AUTO SUBMIT FUNCTION ==============
  const autoSubmitExam = useCallback(async () => {
    setIsSubmitting(true);
    const payload = Object.entries(answers).map(([questionId, data]) => ({
      questionId,
      selectedKey: data.selectedKey,
    }));

    try {
      const res = await fetch("/api/student-submit-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      const data = await res.json();
      if (data.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        router.push(`/student/result/${data.resultId}`);
      }
    } catch {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      router.push("/student/dashboard");
    }
  }, [answers, router]);

  // ============== FULLSCREEN ENFORCEMENT ==============
  // Audio URL for fullscreen resume (computed from current question)
  const currentAudioUrl = question?.audioUrl;

  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement;

    if (el.requestFullscreen) {
      // Request fullscreen immediately without waiting
      const fullscreenPromise = el.requestFullscreen();

      // Create session in background (don't await)
      fetch("/api/student/exam-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).then(sessionRes => sessionRes.json()).then(sessionData => {
        if (sessionData.success && sessionData.session?.id) {
          setSessionId(sessionData.session.id);
        }
      }).catch(err => {
        console.error("Failed to create exam session:", err);
      });

      // Log activity immediately
      logActivity("FULLSCREEN_ENTER", { timestamp: new Date().toISOString() });

      fullscreenPromise.then(() => {
        setIsFullscreen(true);
        setShowFullscreenPrompt(false);
        setIsSecureMode(true);

        // Resume audio if it was playing (browser pauses it during fullscreen transition)
        setTimeout(() => {
          const audio = audioRef.current;
          if (audio && currentAudioUrl) {
            audio.src = currentAudioUrl;
            audio.load();
            audio.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {});
          }
        }, 200);
      }).catch(() => {
        setShowFullscreenPrompt(true);
      });
    }
  }, [logActivity, currentAudioUrl]);

  const handleFullscreenChange = useCallback(() => {
    const fullscreenElement = document.fullscreenElement;
    setIsFullscreen(!!fullscreenElement);

    if (!fullscreenElement && isSecureMode && !isSubmitting) {
      tabWarningCountRef.current += 1;
      setTabSwitchCount(tabWarningCountRef.current);
      setShowTabWarning(true);

      // Log the activity
      logActivity("FULLSCREEN_EXIT", {
        warningCount: tabWarningCountRef.current,
        timestamp: new Date().toISOString(),
      });

      if (tabWarningCountRef.current >= 3) {
        logActivity("AUTO_SUBMIT", {
          reason: "exceeded_warning_limit",
          warningCount: tabWarningCountRef.current,
        });
        setTimeout(() => {
          autoSubmitExam();
        }, 500);
      }
    }
  }, [isSecureMode, isSubmitting, autoSubmitExam, logActivity]);

  // ============== KEYBOARD & CONTEXT MENU DISABLE ==============
  useEffect(() => {
    if (!isSecureMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))
      ) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+C, Ctrl+V, Ctrl+A when on exam
      if (e.ctrlKey && ["c", "v", "a", "x", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }

      // Disable PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isSecureMode]);

  // ============== TAB SWITCH DETECTION ==============
  useEffect(() => {
    if (!isSecureMode) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isSecureMode && !isSubmitting) {
        tabWarningCountRef.current += 1;
        setTabSwitchCount(tabWarningCountRef.current);
        setShowTabWarning(true);

        // Log the activity
        logActivity("TAB_SWITCH", {
          warningCount: tabWarningCountRef.current,
          timestamp: new Date().toISOString(),
        });

        if (tabWarningCountRef.current >= 3) {
          logActivity("AUTO_SUBMIT", {
            reason: "exceeded_warning_limit",
            warningCount: tabWarningCountRef.current,
          });
          setTimeout(() => {
            autoSubmitExam();
          }, 500);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSecureMode, isSubmitting, autoSubmitExam, logActivity]);

  // ============== FULLSCREEN LISTENERS ==============
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // ============== TIMER ==============
  useEffect(() => {
    const timer = setInterval(() => {
      setSectionTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Section time warning
  useEffect(() => {
    if (sectionTimeLeft === 300) {
      alert("Sisa waktu section ini 5 menit!");
    } else if (sectionTimeLeft === 60) {
      alert("Sisa waktu 1 menit!");
    } else if (sectionTimeLeft === 0) {
      const currentIndex = SECTION_ORDER.indexOf(currentSection);
      if (currentIndex < SECTION_ORDER.length - 1) {
        const nextSection = SECTION_ORDER[currentIndex + 1];
        setCurrentSection(nextSection);
        setSectionTimeLeft(SECTION_TIME_LIMITS[nextSection]);
        setCurrent(0);
      }
    }
  }, [sectionTimeLeft, currentSection]);

  // ============== AUTO-SAVE ==============
  const saveProgress = useCallback(async () => {
    // Only save if we have a session ID
    if (!sessionId) return;

    if (!isOnline) {
      setSyncStatus("offline");
      return;
    }

    setSyncStatus("syncing");
    try {
      await fetch("/api/student/exam-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question?.id,
          selectedKey: answers[question?.id]?.selectedKey || "",
          isFlagged: answers[question?.id]?.isFlagged || false,
          currentSection,
          sectionTimeLeft,
          totalElapsedTime: 0,
        }),
      });
      setSyncStatus("saved");
    } catch {
      setSyncStatus("offline");
    }
  }, [answers, currentSection, sectionTimeLeft, isOnline, question?.id, sessionId]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 2000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, saveProgress]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ============== LOAD QUESTIONS WITH RANDOMIZATION ==============
  useEffect(() => {
    fetch("/api/student-credit-status")
      .then((res) => res.json())
      .then((creditData) => {
        setAvailableCredits(creditData.availableCredits || 0);

        if ((creditData.availableCredits || 0) > 0) {
          fetch("/api/student-questions")
            .then((res) => res.json())
            .then((data) => {
              if (data.questions && data.questions.length > 0) {
                // Randomize questions and options
                const randomized = randomizeQuestions(data.questions);
                setQuestions(randomized);
              }
            });
        }
      });

    fetch("/api/student/exam-session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session?.id) {
          setSessionId(data.session.id);
        }
        if (data.session?.answers) {
          setAnswers(data.session.answers);
        }
        if (data.session?.currentSection) {
          setCurrentSection(data.session.currentSection);
        }
        if (data.session?.sectionTimeLeft) {
          setSectionTimeLeft(data.session.sectionTimeLeft);
        }
      });
  }, []);

  // Audio playback control with better error handling
  const toggleAudio = async () => {
    if (!audioRef.current) {
      console.warn("Audio element not ready");
      return;
    }
    try {
      // Cancel any pending play operation
      if (audioPlayPromiseRef.current) {
        audioPlayPromiseRef.current = null;
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayPromiseRef.current = audioRef.current.play();
        await audioPlayPromiseRef.current;
        setIsPlaying(true);
        audioPlayPromiseRef.current = null;
      }
    } catch (err: any) {
      // Ignore AbortError - happens when switching questions
      if (err.name !== "AbortError") {
        console.warn("Audio toggle error:", err);
      }
      setIsPlaying(false);
      audioPlayPromiseRef.current = null;
    }
  };

  // Auto-play audio for LISTENING
  useEffect(() => {
    // Reset playing state when question changes
    setIsPlaying(false);
    setAudioProgress(0);

    if (!question?.audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    // Cancel any pending play operation
    audioPlayPromiseRef.current = null;

    // Create a promise that we can track
    const loadAndPlay = async () => {
      try {
        audio.src = question.audioUrl!;
        audio.load();

        // Wait a bit for load to start
        await new Promise(resolve => setTimeout(resolve, 50));

        audioPlayPromiseRef.current = audio.play();

        await audioPlayPromiseRef.current;
        setIsPlaying(true);
      } catch (err: any) {
        // Ignore AbortError - happens when switching questions rapidly
        if (err.name !== "AbortError") {
          console.log("Autoplay prevented:", err.message);
        }
        setIsPlaying(false);
      } finally {
        audioPlayPromiseRef.current = null;
      }
    };

    const timer = setTimeout(loadAndPlay, 150);
    return () => {
      clearTimeout(timer);
      audioPlayPromiseRef.current = null;
    };
  }, [current, question]);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(progress);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(100);
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    // Reset when section changes (only pause, don't reset progress)
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentSection]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const selectAnswer = (questionId: string, optionKey: string) => {
    // Track time spent on this question
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    questionTimeSpentRef.current[questionId] = timeSpent;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedKey: optionKey,
        isFlagged: prev[questionId]?.isFlagged || false,
        timeSpent,
      },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedKey: prev[questionId]?.selectedKey || "",
        isFlagged: !prev[questionId]?.isFlagged,
      },
    }));
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    const payload = Object.entries(answers).map(([questionId, data]) => ({
      questionId,
      selectedKey: data.selectedKey,
      timeSpent: questionTimeSpentRef.current[questionId] || 0,
    }));

    // Log manual submit
    logActivity("MANUAL_SUBMIT", {
      answeredCount: Object.keys(answers).length,
      warningCount: tabSwitchCount,
    });

    try {
      const res = await fetch("/api/student-submit-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      const data = await res.json();

      if (data.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        router.push(`/student/result/${data.resultId}`);
      } else {
        alert(data.message || "Unable to submit exam");
        setIsSubmitting(false);
      }
    } catch {
      alert("Terjadi kesalahan");
      setIsSubmitting(false);
    }
  };

  // ============== RENDER STATES ==============
  if (showFullscreenPrompt && availableCredits !== null && availableCredits > 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        {/* Hidden audio element - mounted early for fullscreen transition */}
        <audio ref={audioRef} className="hidden" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-slate-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl"
          >
            <Monitor className="h-12 w-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Aktifkan Mode Aman</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Untuk menjaga integritas ujian, Anda harus dalam mode fullscreen selama ujian berlangsung.
            <br />
            <span className="text-amber-600 font-medium">Dilarang keluar dari fullscreen atau switch tab.</span>
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3 mb-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">Fitur Keamanan:</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 ml-8">
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" /> Fullscreen wajib selama ujian
              </li>
              <li className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-amber-500" /> Deteksi perpindahan tab
              </li>
              <li className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-500" /> Disable copy-paste &amp; shortcut keyboard
              </li>
            </ul>
          </div>

          <Button onClick={enterFullscreen} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
            <Monitor className="h-5 w-5 mr-2" />
            Aktifkan Fullscreen &amp; Mulai
          </Button>

          <p className="text-xs text-slate-400 mt-4">
            Keluar dari fullscreen akan dianggap sebagai kecurangan
          </p>
        </motion.div>
      </main>
    );
  }

  if (availableCredits === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-500">Memuat exam...</p>
        </motion.div>
      </main>
    );
  }

  if (availableCredits <= 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-md w-full border border-slate-100">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Tidak Ada Credit Tersedia</h1>
          <p className="text-slate-500 mb-8">Silakan purchase paket TOEFL simulation untuk melanjutkan mengambil ujian.</p>
          <Button onClick={() => router.push("/student/dashboard")} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
            Kembali ke Dashboard
          </Button>
        </motion.div>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-500">Memuat soal...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hidden audio element - always mounted */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setAudioProgress(100);
        }}
        onError={(e) => console.error("Audio load error:", e)}
        className="hidden"
      />

      {/* Tab Switch Warning Overlay */}
      <AnimatePresence>
        {showTabWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[100]"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-10 max-w-lg w-full text-center shadow-2xl"
            >
              {tabSwitchCount >= 3 ? (
                <>
                  {/* Auto-submit warning */}
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
                    <AlertTriangle className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">Ujian Akan Disubmit!</h2>
                  <p className="text-lg text-slate-600 mb-4">
                    Batas peringatan ({tabSwitchCount}x) telah exceeded.
                  </p>
                  <div className="bg-red-100 rounded-xl p-4 mb-6 border border-red-300">
                    <p className="text-red-700 font-bold text-lg mb-1">
                      Ujian sedang disubmit secara otomatis...
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Normal warning */}
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <AlertTriangle className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">Peringatan!</h2>
                  <p className="text-lg text-slate-600 mb-4">
                    Anda terdeteksi berpindah dari tab ujian.
                  </p>

                  {/* Warning Counter - Big and Clear */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-red-200">
                    <p className="text-5xl font-black text-red-600 mb-1">{tabSwitchCount}x</p>
                    <p className="text-sm text-red-600 font-medium">Jumlah Peringatan</p>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Catatan:</strong> Aktivitas ini tercatat dan akan dilaporkan kepada admin.
                    </p>
                  </div>
                  <Button onClick={() => {
                    setShowTabWarning(false);
                    enterFullscreen();
                  }} className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg" size="lg">
                    Kembali ke Ujian
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left - Logo & Section */}
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">TOEFL Simulation</h1>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentSectionConfig.bgLight} ${currentSectionConfig.textColor}`}>
                    {currentSectionConfig.label}
                  </span>
                  {isSecureMode && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Secure
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Center - Section Timer */}
            <div className="hidden md:flex items-center gap-3">
              <div className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all ${
                sectionTimeLeft <= 60 ? "bg-red-50 border-2 border-red-500" : "bg-blue-50 border-2 border-blue-500"
              }`}>
                <Clock className={`h-4 w-4 ${sectionTimeLeft <= 60 ? "text-red-500" : "text-blue-500"}`} />
                <span className={`text-sm font-bold font-mono ${sectionTimeLeft <= 60 ? "text-red-600" : "text-blue-600"}`}>
                  {currentSectionConfig.label}: {formatTime(sectionTimeLeft)}
                </span>
              </div>
            </div>

            {/* Right - Stats & Controls */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3">
              {/* Tab switch warning indicator */}
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 border-2 border-red-300">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-base font-bold text-red-700">{tabSwitchCount}x</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{answeredCount}/{questions.length}</span>
              </div>
              <button
                onClick={() => setShowNavigator(!showNavigator)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors md:hidden"
              >
                {showNavigator ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Question Navigator - Sidebar */}
          <AnimatePresence>
            {showNavigator && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="hidden lg:block w-72 flex-shrink-0"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-28">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">{currentSectionConfig.label}</h3>
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-xs ${syncStatus === "saved" ? "text-green-600" : syncStatus === "syncing" ? "text-yellow-600" : "text-red-500"}`}>
                        {syncStatus === "saved" ? "Saved" : syncStatus === "syncing" ? "Syncing..." : "Offline"}
                      </span>
                    </div>
                  </div>

                  {/* Current section questions only */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Question {current + 1} of {currentSectionQuestions.length}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {currentSectionQuestions.map((q, idx) => {
                        const answer = answers[q.id];
                        const isCurrent = idx === current;
                        const isFlagged = answer?.isFlagged;
                        const hasAnswer = !!answer?.selectedKey;

                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrent(idx)}
                            className={`h-9 w-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                              isCurrent
                                ? "bg-blue-600 text-white shadow-lg"
                                : isFlagged
                                ? "bg-amber-100 text-amber-700 border-2 border-amber-400"
                                : hasAnswer
                                ? "bg-green-500 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other sections progress (read-only) */}
                  {SECTION_ORDER.filter(s => s !== currentSection).map((section) => {
                    const config = sectionConfig[section as keyof typeof sectionConfig];
                    const sectionQuestions = questionsBySection[section];
                    const answered = sectionQuestions.filter((q) => answers[q.id]?.selectedKey).length;
                    return (
                      <div key={section} className="pt-3 border-t border-slate-100">
                        <div className={`text-xs font-medium ${config.textColor} mb-2`}>
                          {config.label}
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
                          <span className="text-sm text-slate-600">{answered}/{sectionQuestions.length} answered</span>
                          <div className={`h-2 w-2 rounded-full ${answered === sectionQuestions.length ? "bg-green-500" : "bg-slate-300"}`} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-blue-600" />
                      <span className="text-slate-500">Current</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-green-500" />
                      <span className="text-slate-500">Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-amber-100 border border-amber-400" />
                      <span className="text-slate-500">Flagged</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-slate-100" />
                      <span className="text-slate-500">Unanswered</span>
                    </div>
                  </div>

                  {/* Summary Button */}
                  <Button onClick={() => setShowSummary(true)} variant="outline" className="w-full mt-4" size="sm">
                    Review All ({answeredCount}/{questions.length})
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Question Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                  {/* Section Header */}
                  <div className={`px-6 py-4 bg-gradient-to-r ${currentSectionConfig.bgGradient} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/20">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <span className="font-semibold">{currentSectionConfig.label} Section</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFlag(question.id)}
                        className={`p-2 rounded-lg transition-colors ${answers[question.id]?.isFlagged ? "bg-amber-500 text-white" : "bg-white/20 hover:bg-white/30"}`}
                      >
                        <Flag className="h-5 w-5" />
                      </button>
                      <span className="text-sm opacity-80">#{question.questionNumber}</span>
                    </div>
                  </div>

                  {/* Passage Text */}
                  {question.passageText && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-6 py-5 bg-gradient-to-b from-amber-50 to-amber-100/50 border-b border-amber-200"
                    >
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Reading Passage</p>
                      <div className="prose prose-amber prose-sm max-w-none text-amber-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: question.passageText }} />
                    </motion.div>
                  )}

                  {/* Audio Player - only for LISTENING */}
                  {question.section === "LISTENING" && question.audioUrl && (
                    <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-200">
                      <div className="flex items-center gap-4">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleAudio}
                          className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg text-white"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </motion.button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Volume2 className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">Audio Question</span>
                            <span className="text-xs text-purple-500">{isPlaying ? "Playing..." : "Paused"}</span>
                          </div>
                          {/* Audio progress bar */}
                          <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-100"
                              style={{ width: `${audioProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="p-6">
                    <div className="prose prose-slate max-w-none text-slate-800 text-lg leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: question.questionText }} />

                    {/* Answer Options */}
                    <div className="space-y-3">
                      {question.options.map((opt, index) => {
                        const answer = answers[question.id];
                        const isSelected = answer?.selectedKey === opt.optionKey;
                        return (
                          <motion.button
                            key={opt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => selectAnswer(question.id, opt.optionKey)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              isSelected ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                              {opt.optionKey}
                            </div>
                            <div className={`flex-1 prose prose-sm max-w-none ${isSelected ? "text-blue-800" : "text-slate-700"}`} dangerouslySetInnerHTML={{ __html: opt.optionText }} />
                            {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

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

                  {current < currentSectionQuestions.length - 1 ? (
                    <Button
                      onClick={() => setCurrent((c) => c + 1)}
                      className="gap-2 px-6 py-5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      Next
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  ) : currentSection !== "READING" ? (
                    <Button
                      onClick={() => {
                        const nextIdx = SECTION_ORDER.indexOf(currentSection) + 1;
                        if (nextIdx < SECTION_ORDER.length) {
                          setCurrentSection(SECTION_ORDER[nextIdx]);
                          setCurrent(0);
                          setSectionTimeLeft(SECTION_TIME_LIMITS[SECTION_ORDER[nextIdx]]);
                        }
                      }}
                      className="gap-2 px-6 py-5 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg"
                    >
                      Next Section
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowSummary(true)}
                      className="gap-2 px-6 py-5 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Review & Submit
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Answer Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Answer Summary</h2>
                <button onClick={() => setShowSummary(false)} className="p-2 rounded-lg hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
                    <p className="text-sm text-green-600">Answered</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{flaggedCount}</p>
                    <p className="text-sm text-amber-600">Flagged</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{questions.length - answeredCount}</p>
                    <p className="text-sm text-red-600">Unanswered</p>
                  </div>
                </div>

                {/* Section by Section */}
                {SECTION_ORDER.map((section) => {
                  const config = sectionConfig[section as keyof typeof sectionConfig];
                  const sectionQuestions = questionsBySection[section];
                  const answered = sectionQuestions.filter((q) => answers[q.id]?.selectedKey).length;
                  const flagged = sectionQuestions.filter((q) => answers[q.id]?.isFlagged).length;

                  return (
                    <div key={section} className="mb-4">
                      <div className={`font-semibold ${config.textColor} mb-3 flex items-center gap-2`}>
                        <div className={`h-2 w-2 rounded-full bg-current`} />
                        {config.label} - {answered}/{sectionQuestions.length} answered
                        {flagged > 0 && <span className="text-amber-600 ml-2">({flagged} flagged)</span>}
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {sectionQuestions.map((q, idx) => {
                          const answer = answers[q.id];
                          return (
                            <button
                              key={q.id}
                              onClick={() => {
                                setCurrentSection(section);
                                setCurrent(sectionQuestions.findIndex(sq => sq.id === q.id));
                                setShowSummary(false);
                              }}
                              className={`h-10 w-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                                answer?.isFlagged ? "bg-amber-100 border-2 border-amber-400 text-amber-700" : answer?.selectedKey ? "bg-green-500 text-white" : "bg-red-100 text-red-600"
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Warning if unanswered */}
                {questions.length - answeredCount > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Anda memiliki <strong>{questions.length - answeredCount} soal</strong> yang belum dijawab.
                      Anda yakin ingin submit?
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowSummary(false)}>
                  Continue Review
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={submitExam} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Exam"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Submit Exam?</h2>
              <p className="text-slate-500 text-center mb-8">
                Anda telah menjawab <span className="font-bold text-blue-600">{answeredCount}</span> dari <span className="font-bold">{questions.length}</span> soal.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 py-6 rounded-xl" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button className="flex-1 py-6 rounded-xl bg-green-600 hover:bg-green-700" onClick={submitExam} disabled={isSubmitting}>
                  {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting...</span> : "Submit"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}