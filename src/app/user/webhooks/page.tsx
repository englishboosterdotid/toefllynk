"use client";

import { useState, useEffect } from "react";
import { Webhook, Plus, X, Trash2, Edit2, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Shield, Eye } from "lucide-react";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered: string | null;
  failureCount: number;
  createdAt: string;
}

const EVENTS = [
  { id: "order.completed", label: "Order Completed", description: "Triggered when an order is successfully completed" },
  { id: "order.refunded", label: "Order Refunded", description: "Triggered when an order is refunded" },
  { id: "order.pending", label: "Order Pending", description: "Triggered when a new order is created" },
  { id: "withdrawal.completed", label: "Withdrawal Completed", description: "Triggered when a withdrawal is approved and processed" },
  { id: "withdrawal.rejected", label: "Withdrawal Rejected", description: "Triggered when a withdrawal is rejected" },
  { id: "subscription.activated", label: "Subscription Activated", description: "Triggered when a subscription tier is activated" },
  { id: "subscription.expired", label: "Subscription Expired", description: "Triggered when a subscription tier expires" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: "",
    events: ["order.completed"],
    secret: "",
  });

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/webhooks");
      const data = await res.json();

      if (data.success) {
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/user/webhooks?id=${editingId}`
        : "/api/user/webhooks";
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
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to save webhook:", error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm("Yakin ingin menghapus webhook ini?")) return;

    try {
      const res = await fetch(`/api/user/webhooks?id=${webhookId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      fetchWebhooks();
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  const openEditForm = (webhook: WebhookEndpoint) => {
    setEditingId(webhook.id);
    setFormData({
      url: webhook.url,
      events: webhook.events,
      secret: "",
    });
    setShowForm(true);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const getEventLabel = (eventId: string) => {
    return EVENTS.find((e) => e.id === eventId)?.label || eventId;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Webhook className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Webhook Endpoints</h1>
            <p className="text-gray-600">Receive real-time notifications for events</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ url: "", events: ["order.completed"], secret: "" });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900">Webhook Access for BUSINESS</h3>
            <p className="text-sm text-purple-700 mt-1">
              Webhook endpoints are available for BUSINESS tier users only. Configure endpoints to receive
              real-time notifications about orders, withdrawals, and subscriptions.
            </p>
          </div>
        </div>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : webhooks.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Webhooks</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Create your first webhook to receive real-time notifications.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white border rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 break-all">{webhook.url}</p>
                    <button
                      onClick={() => handleCopy(webhook.url, webhook.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                      >
                        {getEventLabel(event)}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Created {new Date(webhook.createdAt).toLocaleDateString("id-ID")}</span>
                    {webhook.lastTriggered && (
                      <span>Last triggered: {new Date(webhook.lastTriggered).toLocaleDateString("id-ID")}</span>
                    )}
                    {webhook.failureCount > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {webhook.failureCount} failures
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      webhook.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {webhook.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => openEditForm(webhook)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Webhook" : "Add Webhook"}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-server.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The URL that will receive POST requests when events occur.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events *
                </label>
                <div className="space-y-2">
                  {EVENTS.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="mt-1 rounded text-purple-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{event.label}</p>
                        <p className="text-sm text-gray-500">{event.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret (optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used to generate signature for webhook payloads.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.url || formData.events.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-2">Webhook Payload Format</h3>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
          <pre>{`{
  "event": "order.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "orderId": "...",
    "productTitle": "...",
    "buyerEmail": "...",
    "totalAmount": 150000
  }
}`}</pre>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          All webhook requests include a <code className="bg-gray-100 px-1 rounded">X-Webhook-Signature</code> header
          for verification.
        </p>
      </div>
    </div>
  );
}