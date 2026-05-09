"use client";

import { useState, useEffect } from "react";
import { HelpCircle, Plus, X, Send, MessageSquare, ChevronRight, Clock, AlertCircle } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  responseMessage: string | null;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-500",
  NORMAL: "text-blue-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};

const CATEGORIES = [
  { id: "GENERAL", label: "General", description: "General questions and inquiries" },
  { id: "BUG", label: "Bug Report", description: "Report a technical issue or bug" },
  { id: "FEATURE", label: "Feature Request", description: "Suggest a new feature" },
  { id: "BILLING", label: "Billing", description: "Payment and billing related issues" },
  { id: "ACCOUNT", label: "Account", description: "Account access and settings" },
  { id: "TECHNICAL", label: "Technical Support", description: "Technical help and guidance" },
];

const PRIORITIES = [
  { id: "LOW", label: "Low", description: "Not urgent, can wait" },
  { id: "NORMAL", label: "Normal", description: "Standard priority" },
  { id: "HIGH", label: "High", description: "Important, needs attention soon" },
  { id: "URGENT", label: "Urgent", description: "Critical, needs immediate attention" },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "GENERAL",
    priority: "NORMAL",
  });
  const [replyMessage, setReplyMessage] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/support");
      const data = await res.json();

      if (data.success) {
        setTickets(data.tickets || []);
        setOpenCount(data.openCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/user/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setShowForm(false);
      setFormData({ subject: "", message: "", category: "GENERAL", priority: "NORMAL" });
      fetchTickets();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return;

    try {
      const res = await fetch(`/api/user/support/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseMessage: replyMessage }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setReplyMessage("");
      fetchTickets();

      // Update viewing ticket
      if (viewingTicket?.id === ticketId) {
        setViewingTicket(data.ticket);
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const openViewTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/user/support/${ticketId}`);
      const data = await res.json();

      if (data.success && data.ticket) {
        setViewingTicket(data.ticket);
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support</h1>
            <p className="text-gray-600">Kelola tiket support dan bantuan</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({ subject: "", message: "", category: "GENERAL", priority: "NORMAL" });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          Buat Tiket
        </button>
      </div>

      {/* Open Tickets Badge */}
      {openCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Anda memiliki {openCount} tiket terbuka</span>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum Ada Tiket</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Buat tiket baru jika Anda membutuhkan bantuan.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Buat Tiket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white border rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openViewTicket(ticket.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    {ticket.priority === "URGENT" && (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {ticket.category}
                    </span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  {ticket.responseMessage && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Balasan tersedia
                    </p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Buat Tiket Support</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ringkasan masalah Anda"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`p-3 border rounded-lg text-left hover:bg-gray-50 ${
                        formData.category === cat.id ? "border-orange-500 bg-orange-50" : ""
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.id })}
                      className={`px-3 py-2 border rounded-lg text-sm ${
                        formData.priority === p.id
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pesan *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Jelaskan masalah Anda secara detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!formData.subject || !formData.message}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  Kirim Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ticket Detail Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{viewingTicket.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[viewingTicket.status]}`}>
                    {viewingTicket.status}
                  </span>
                  <span className="text-xs text-gray-500">{viewingTicket.category}</span>
                </div>
              </div>
              <button onClick={() => setViewingTicket(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  Dikirim pada {new Date(viewingTicket.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{viewingTicket.message}</p>
              </div>

              {/* Response */}
              {viewingTicket.responseMessage && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Balasan dari Tim Support
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingTicket.responseMessage}</p>
                </div>
              )}

              {/* Reply Form (if not closed) */}
              {viewingTicket.status !== "CLOSED" && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tambah Informasi
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tambahkan informasi tambahan untuk ticket ini..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setViewingTicket(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => handleSendReply(viewingTicket.id)}
                      disabled={!replyMessage.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Kirim
                    </button>
                  </div>
                </div>
              )}

              {viewingTicket.status === "CLOSED" && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setViewingTicket(null)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}