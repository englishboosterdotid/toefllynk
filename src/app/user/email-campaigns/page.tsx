"use client";

import { useState, useEffect } from "react";
import { Mail, Plus, X, Trash2, Edit2, Send, Clock, BarChart2, Check, ChevronRight } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template: string | null;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const TEMPLATES = [
  { id: "welcome", name: "Welcome Email", description: "Greeting template for new subscribers" },
  { id: "orderConfirmation", name: "Order Confirmation", description: "Template for order notifications" },
  { id: "newsletter", name: "Newsletter", description: "General newsletter template" },
];

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    template: "",
    scheduledAt: "",
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/email-campaigns");
      const data = await res.json();

      if (data.success) {
        setCampaigns(data.campaigns || []);
        setQuota(data.quota);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/user/email-campaigns/${editingId}`
        : "/api/user/email-campaigns";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setShowForm(false);
      setEditingId(null);
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to save campaign:", error);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Yakin ingin menghapus campaign ini?")) return;

    try {
      const res = await fetch(`/api/user/email-campaigns/${campaignId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      fetchCampaigns();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  const openEditForm = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      template: campaign.template || "",
      scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const openViewCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/user/email-campaigns/${campaignId}`);
      const data = await res.json();

      if (data.success && data.campaign) {
        setViewingCampaign(data.campaign);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    }
  };

  const getOpenRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return 0;
    return ((campaign.openCount / campaign.sentCount) * 100).toFixed(1);
  };

  const getClickRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return 0;
    return ((campaign.clickCount / campaign.sentCount) * 100).toFixed(1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
            <p className="text-gray-600">Kelola campaign email marketing Anda</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", subject: "", template: "", scheduledAt: "" });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Buat Campaign
        </button>
      </div>

      {/* Quota Info */}
      {quota && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-indigo-900">Kuota Email Marketing</h3>
              <p className="text-sm text-indigo-700 mt-1">
                {quota.isUnlimited
                  ? "Unlimited email untuk tier Anda"
                  : `${quota.remaining} dari ${quota.limit} email tersisa bulan ini`}
              </p>
            </div>
            {!quota.isUnlimited && (
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600"
                  style={{ width: `${((quota.limit - quota.remaining) / quota.limit) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Belum Ada Campaign</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Buat campaign pertama Anda untuk mulai email marketing.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Buat Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white border rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[campaign.status] || "bg-gray-100"}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>

                  <div className="flex items-center gap-6 mt-3">
                    {campaign.status === "SENT" && (
                      <>
                        <div className="flex items-center gap-1 text-sm">
                          <Send className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{campaign.sentCount} sent</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Check className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{campaign.openCount} opened ({getOpenRate(campaign)}%)</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <BarChart2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{campaign.clickCount} clicked ({getClickRate(campaign)}%)</span>
                        </div>
                      </>
                    )}
                    {campaign.status === "SCHEDULED" && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Clock className="w-4 h-4" />
                        <span>Jadwal: {new Date(campaign.scheduledAt!).toLocaleDateString("id-ID")}</span>
                      </div>
                    )}
                    {campaign.status === "DRAFT" && (
                      <span className="text-sm text-gray-400">Draft</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Dibuat {new Date(campaign.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {campaign.status === "DRAFT" && (
                    <button
                      onClick={() => openEditForm(campaign)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openViewCampaign(campaign.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {campaign.status === "DRAFT" && (
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Campaign" : "Buat Campaign Baru"}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Campaign *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Newsletter Mei 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Promo Spesial untuk Anda!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, template: tmpl.id })}
                      className={`p-3 border rounded-lg text-left hover:bg-gray-50 ${
                        formData.template === tmpl.id ? "border-indigo-500 bg-indigo-50" : ""
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{tmpl.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jadwal Kirim (opsional)
                </label>
                <input
                  type="date"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan jika ingin menyimpan sebagai draft
                </p>
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
                  disabled={!formData.name || !formData.subject}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingId ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{viewingCampaign.name}</h2>
              <button onClick={() => setViewingCampaign(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-medium text-gray-900">{viewingCampaign.subject}</p>
              </div>

              {viewingCampaign.status === "SENT" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Kirim</p>
                    <p className="text-2xl font-bold text-gray-900">{viewingCampaign.sentCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Opened</p>
                    <p className="text-2xl font-bold text-green-600">{getOpenRate(viewingCampaign)}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Clicked</p>
                    <p className="text-2xl font-bold text-blue-600">{getClickRate(viewingCampaign)}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Sent At</p>
                    <p className="font-medium text-gray-900">
                      {viewingCampaign.sentAt
                        ? new Date(viewingCampaign.sentAt).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                </div>
              )}

              {viewingCampaign.template && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Template</p>
                  <p className="bg-gray-100 rounded px-3 py-2 text-sm">{viewingCampaign.template}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setViewingCampaign(null)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
                {viewingCampaign.status === "DRAFT" && (
                  <button
                    onClick={() => {
                      setViewingCampaign(null);
                      openEditForm(viewingCampaign);
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}