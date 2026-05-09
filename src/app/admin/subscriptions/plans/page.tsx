"use client";

import { useEffect, useState } from "react";
import { Crown, Star, TrendingUp, Check, X, Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { AnimatedContainer } from "@/components/animations";

type SellerTier = "FREE" | "PRO" | "BUSINESS";

interface SubscriptionPlan {
  id: string;
  tier: SellerTier;
  name: string;
  price: number;
  periodDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

const tierConfig: Record<SellerTier, { label: string; color: string; bg: string; icon: any }> = {
  FREE: { label: "Coba", color: "text-slate-600", bg: "bg-slate-100", icon: Star },
  PRO: { label: "Berkembang", color: "text-purple-600", bg: "bg-purple-100", icon: TrendingUp },
  BUSINESS: { label: "Bisnis", color: "text-amber-600", bg: "bg-amber-100", icon: Crown },
};

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tier: "PRO" as SellerTier,
    name: "",
    price: 0,
    periodDays: 30,
    features: [] as string[],
    isActive: true,
  });
  const [featureInput, setFeatureInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/subscription-plans");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingPlan
        ? "/api/admin/subscription-plans"
        : "/api/admin/subscription-plans";

      const res = await fetch(url, {
        method: editingPlan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingPlan
            ? { id: editingPlan.id, ...formData }
            : formData
        ),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        fetchPlans();
        resetForm();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus plan ini?")) return;

    try {
      const res = await fetch(`/api/admin/subscription-plans?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Plan dihapus" });
        fetchPlans();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      tier: plan.tier,
      name: plan.name,
      price: plan.price,
      periodDays: plan.periodDays,
      features: plan.features,
      isActive: plan.isActive,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      tier: "PRO",
      name: "",
      price: 0,
      periodDays: 30,
      features: [],
      isActive: true,
    });
    setFeatureInput("");
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <AnimatedContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
            <p className="text-slate-500">Kelola paket langganan</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Plan
          </button>
        </div>
      </AnimatedContainer>

      {message && (
        <AnimatedContainer>
          <div className={`mb-4 p-4 rounded-xl ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        </AnimatedContainer>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const tierStyle = tierConfig[plan.tier as SellerTier] || tierConfig.FREE;
          return (
            <AnimatedContainer key={plan.id}>
              <div className={`bg-white rounded-xl border-2 ${plan.isActive ? "border-slate-200" : "border-slate-100 opacity-60"} p-6 relative`}>
                {!plan.isActive && (
                  <span className="absolute top-4 right-4 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                    Inactive
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${tierStyle.bg}`}>
                    <tierStyle.icon className={`h-5 w-5 ${tierStyle.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.tier}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-slate-500">/{plan.periodDays} days</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-sm text-slate-400">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </AnimatedContainer>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <AnimatedContainer>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPlan ? "Edit Plan" : "Add Plan"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as SellerTier })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      required
                    >
                      <option value="FREE">FREE - Coba</option>
                      <option value="PRO">PRO - Berkembang</option>
                      <option value="BUSINESS">BUSINESS - Bisnis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Active</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        formData.isActive
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g., Berkembang"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (IDR)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="79000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Period (days)</label>
                    <input
                      type="number"
                      value={formData.periodDays}
                      onChange={(e) => setFormData({ ...formData, periodDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Features</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="Add a feature..."
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.features.map((feature, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editingPlan ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </AnimatedContainer>
        </div>
      )}
    </main>
  );
}
