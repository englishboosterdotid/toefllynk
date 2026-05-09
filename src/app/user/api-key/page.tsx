"use client";

import { useState, useEffect } from "react";
import { Key, Copy, Check, RefreshCw, Trash2, AlertCircle, Shield, ExternalLink } from "lucide-react";

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const PERMISSIONS = [
  { id: "read:products", label: "Read Products", description: "View product list and details" },
  { id: "write:products", label: "Write Products", description: "Create and update products" },
  { id: "read:orders", label: "Read Orders", description: "View order list and details" },
  { id: "write:orders", label: "Write Orders", description: "Create orders" },
  { id: "read:customers", label: "Read Customers", description: "View customer list" },
  { id: "write:customers", label: "Write Customers", description: "Create and update customers" },
  { id: "read:analytics", label: "Read Analytics", description: "View analytics data" },
  { id: "read:withdrawals", label: "Read Withdrawals", description: "View withdrawal history" },
];

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "Production",
    permissions: ["read:products", "read:orders"],
  });

  const fetchApiKey = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/api-key");
      const data = await res.json();

      if (data.success) {
        setApiKey(data.apiKey);
        setHasKey(data.hasKey);
        if (data.plainKey) {
          setPlainKey(data.plainKey);
        }
      }
    } catch (error) {
      console.error("Failed to fetch API key:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  const handleSubmit = async (e: React.FormEvent, regenerate = false) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          regenerate,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setPlainKey(data.plainKey);
      setShowForm(false);
      fetchApiKey();
    } catch (error) {
      console.error("Failed to save API key:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus API key? Tindakan ini tidak bisa diundo.")) return;

    try {
      const res = await fetch("/api/user/api-key", { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      setApiKey(null);
      setPlainKey(null);
      setHasKey(false);
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const handleCopy = () => {
    if (plainKey) {
      navigator.clipboard.writeText(plainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Key className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Key Management</h1>
          <p className="text-gray-600">Generate and manage API keys for external integrations</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">API Access for PRO+</h3>
            <p className="text-sm text-blue-700 mt-1">
              API key feature is available for PRO and BUSINESS tier users only.
              Use your API key to integrate with third-party services.
            </p>
          </div>
        </div>
      </div>

      {/* API Key Display */}
      {plainKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-900 flex items-center gap-2">
                <Check className="w-5 h-5" />
                API Key Created Successfully
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Save this key securely. It will not be displayed again.
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Key"}
            </button>
          </div>
          <div className="mt-3 bg-white rounded p-3 font-mono text-sm break-all">
            {plainKey}
          </div>
        </div>
      )}

      {/* Existing Key */}
      {apiKey && !plainKey && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-lg font-medium text-gray-900">{apiKey.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(apiKey.createdAt).toLocaleDateString("id-ID")}
              </p>
              {apiKey.lastUsedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  apiKey.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {apiKey.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Key Preview:</p>
            <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm">
              {apiKey.keyPrefix}****************************
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
            <div className="flex flex-wrap gap-2">
              {apiKey.permissions.map((perm) => {
                const permInfo = PERMISSIONS.find((p) => p.id === perm);
                return (
                  <span
                    key={perm}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {permInfo?.label || perm}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Create/Regenerate Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="font-lg font-medium text-gray-900 mb-4">
            {hasKey ? "Regenerate API Key" : "Create API Key"}
          </h3>

          <form onSubmit={(e) => handleSubmit(e, hasKey)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Production, Development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {PERMISSIONS.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="mt-1 rounded text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{perm.label}</p>
                      <p className="text-sm text-gray-500">{perm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formData.permissions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {hasKey ? "Regenerate Key" : "Create Key"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Button */}
      {!apiKey && !showForm && (
        <div className="text-center py-8">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No API Key</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Create your first API key to start integrating with external services.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create API Key
          </button>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-2">API Documentation</h3>
        <p className="text-sm text-gray-600 mb-3">
          Learn how to use the API with our documentation.
        </p>
        <a
          href="/docs/api"
          target="_blank"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          View API Documentation
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}