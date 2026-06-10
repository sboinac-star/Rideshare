"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface JCBOrder {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  duration: string;
  address: string;
  notes: string;
  status: OrderStatus;
  createdAt: Timestamp;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  date: "",
  time: "",
  duration: "",
  address: "",
  notes: "",
};

export default function JCBBookingPage() {
  const [orders, setOrders] = useState<JCBOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const q = query(collection(db, "jcb_orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOrders(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JCBOrder, "id">) }))
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(order: JCBOrder) {
    setEditId(order.id);
    setForm({
      name: order.name,
      phone: order.phone,
      date: order.date,
      time: order.time,
      duration: order.duration,
      address: order.address,
      notes: order.notes,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date || !form.address) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "jcb_orders", editId), { ...form });
      } else {
        await addDoc(collection(db, "jcb_orders"), {
          ...form,
          status: "pending",
          createdAt: Timestamp.now(),
        });
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      await fetchOrders();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: OrderStatus) {
    await updateDoc(doc(db, "jcb_orders", id), { status });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;
    await deleteDoc(doc(db, "jcb_orders", id));
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-yellow-400 px-4 py-5 shadow">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏗️ JCB Bookings</h1>
            <p className="text-sm text-gray-700 mt-0.5">Operator Order Dashboard</p>
          </div>
          <button
            onClick={openNew}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-700 transition"
          >
            + New Order
          </button>
        </div>
      </div>

      {/* Order Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{editId ? "Edit Order" : "New Order"}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Ramesh Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g. 4 hours, 1 day, 2 days"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address / Site Location *
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  rows={2}
                  placeholder="Village, Taluk, District..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  rows={2}
                  placeholder="Any special requirements, work type, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg py-2 text-sm transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : editId ? "Update Order" : "Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">Click &quot;+ New Order&quot; to log a booking</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{order.name}</h3>
                    {order.phone && (
                      <a
                        href={`tel:${order.phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {order.phone}
                      </a>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status as OrderStatus]}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                    {order.date && (
                      <span>
                        📅 {order.date}
                        {order.time && ` at ${order.time}`}
                      </span>
                    )}
                    {order.duration && <span>⏱ {order.duration}</span>}
                    {order.address && (
                      <span className="col-span-2 sm:col-span-3">
                        📍 {order.address}
                      </span>
                    )}
                    {order.notes && (
                      <span className="col-span-2 sm:col-span-3 text-gray-500 italic">
                        💬 {order.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(order)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="flex-1 text-xs border border-red-200 text-red-500 rounded-lg px-2 py-1 hover:bg-red-50 transition"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
