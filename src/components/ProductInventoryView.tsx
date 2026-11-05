/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ProductInventoryItem, StockRestockOrder, AbcClassification, StockStatus } from '../types';
import { INITIAL_PRODUCTS, INITIAL_RESTOCK_ORDERS } from '../data/analyticsExtendedData';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Layers,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldAlert,
  Boxes,
  Truck,
  Sparkles,
  Link2
} from 'lucide-react';

export const ProductInventoryView: React.FC = () => {
  const [products, setProducts] = useState<ProductInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('pulsetrack_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [restockOrders, setRestockOrders] = useState<StockRestockOrder[]>(() => {
    try {
      const saved = localStorage.getItem('pulsetrack_restock_orders');
      return saved ? JSON.parse(saved) : INITIAL_RESTOCK_ORDERS;
    } catch {
      return INITIAL_RESTOCK_ORDERS;
    }
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [abcFilter, setAbcFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Restock Calculator states
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [targetStockDays, setTargetStockDays] = useState<number>(30);
  const [orderCreatedNotice, setOrderCreatedNotice] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (abcFilter !== 'all' && p.abcClass !== abcFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categoryFilter, abcFilter, statusFilter, searchQuery]);

  // Aggregate Inventory KPIs
  const kpis = useMemo(() => {
    const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + p.currentStock * p.cogs, 0);
    const totalRetailValue = products.reduce((acc, p) => acc + p.currentStock * p.price, 0);
    const criticalStockCount = products.filter(
      (p) => p.status === 'critical' || p.status === 'out_of_stock'
    ).length;
    const avgDaysRemaining = Number(
      (
        products.reduce((acc, p) => acc + (p.daysOfInventory > 0 ? p.daysOfInventory : 0), 0) /
        products.filter((p) => p.daysOfInventory > 0).length
      ).toFixed(1)
    );
    const avgGrossMargin = Number(
      (products.reduce((acc, p) => acc + p.grossMarginPercent, 0) / products.length).toFixed(1)
    );

    return {
      totalStockUnits,
      totalInventoryValue,
      totalRetailValue,
      criticalStockCount,
      avgDaysRemaining,
      avgGrossMargin,
    };
  }, [products]);

  // Selected product for calculator
  const activeProductForRestock = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Restock calculation
  const restockRecommendation = useMemo(() => {
    if (!activeProductForRestock) return { qty: 0, cost: 0 };
    const requiredForTarget = Math.ceil(activeProductForRestock.dailyBurnRate * targetStockDays);
    const needed = Math.max(0, requiredForTarget - activeProductForRestock.currentStock);
    const totalCost = needed * activeProductForRestock.cogs;
    return {
      neededQty: needed,
      totalCost,
    };
  }, [activeProductForRestock, targetStockDays]);

  const handleCreateRestockPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductForRestock) return;

    const newPO: StockRestockOrder = {
      id: `po-${Date.now().toString().slice(-4)}`,
      sku: activeProductForRestock.sku,
      productName: activeProductForRestock.name,
      orderQuantity: restockRecommendation.neededQty || 50,
      unitCost: activeProductForRestock.cogs,
      totalCost: restockRecommendation.totalCost || 50 * activeProductForRestock.cogs,
      supplier: 'Supplier Resmi Pabrik',
      estimatedArrival: new Date(
        Date.now() + 86400000 * activeProductForRestock.leadTimeDays
      ).toLocaleDateString('id-ID'),
      status: 'ordered',
      createdAt: new Date().toLocaleDateString('id-ID'),
    };

    const updatedOrders = [newPO, ...restockOrders];
    setRestockOrders(updatedOrders);
    localStorage.setItem('pulsetrack_restock_orders', JSON.stringify(updatedOrders));

    setOrderCreatedNotice(`✓ Purchase Order #${newPO.id} berhasil dicatat untuk ${activeProductForRestock.name} (${newPO.orderQuantity} unit)!`);
    setTimeout(() => setOrderCreatedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-800/40 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                Product Velocity & Inventory Health
              </span>
              <span className="text-xs text-emerald-300">·</span>
              <span className="text-xs text-emerald-200">
                {products.length} SKU Aktif Terpantau
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Analisis Produk & Manajemen Stok
            </h2>
            <p className="text-xs text-emerald-200 max-w-2xl leading-relaxed">
              Pantau kecepatan penjualan barang (*sell-through rate*), cegah kehabisan stok pada produk viral, klasifikasikan barang dengan analisis Pareto ABC, dan rencanakan *restock replenishment* secara otomatis.
            </p>
          </div>

          {/* Quick Metrics Header Pill */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-emerald-700/50 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Nilai Stok (HPP)</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-200">
                Rp {(kpis.totalInventoryValue / 1000000).toFixed(1)} Jt
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Potensi Omzet Stok</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                Rp {(kpis.totalRetailValue / 1000000).toFixed(1)} Jt
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Peringatan Kritis</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-400">
                {kpis.criticalStockCount} SKU
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Rata-rata Margin</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-cyan-400">
                {kpis.avgGrossMargin}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ABC Inventory Pareto Classification Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Klasifikasi Inventaris Pareto (ABC Analysis)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Fokuskan modal & pemantauan harian pada SKU Kategori A agar omzet utama tidak terganggu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setAbcFilter(abcFilter === 'A' ? 'all' : 'A')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              abcFilter === 'A'
                ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Kategori A (Paling Kritis)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ~80% Omzet
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Top 20% SKU penyumbang terbesar kas. Jangan sampai terjadi kehabisan stok (*stockout*).
            </p>
          </button>

          <button
            onClick={() => setAbcFilter(abcFilter === 'B' ? 'all' : 'B')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              abcFilter === 'B'
                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Kategori B (Penjualan Stabil)
              </span>
              <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                ~15% Omzet
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              30% SKU dengan permintaan reguler mingguan. Restock dengan siklus standar.
            </p>
          </button>

          <button
            onClick={() => setAbcFilter(abcFilter === 'C' ? 'all' : 'C')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              abcFilter === 'C'
                ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-500'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Kategori C (Slow Moving)
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                ~5% Omzet
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              50% SKU dengan perputaran lambat. Hindari penumpukan modal berlebih (*deadstock*).
            </p>
          </button>
        </div>
      </div>

      {/* Product Catalog & Velocity Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Katalog SKU & Kecepatan Perputaran Stok
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredProducts.length} Produk
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs w-44"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            >
              <option value="all">Semua Status Stok</option>
              <option value="critical">Kritis (&lt; 7 Hari)</option>
              <option value="optimal">Optimal (15-45 Hari)</option>
              <option value="overstock">Overstock (&gt; 60 Hari)</option>
              <option value="out_of_stock">Habis (0 Unit)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">SKU & Nama Produk</th>
                <th className="py-3 px-3 font-semibold text-center">Kelas ABC</th>
                <th className="py-3 px-3 font-semibold text-right">Harga / HPP</th>
                <th className="py-3 px-3 font-semibold text-right">Stok Fisik</th>
                <th className="py-3 px-3 font-semibold text-right">Kecepatan Terjual</th>
                <th className="py-3 px-3 font-semibold text-right">Sisa Hari Stok</th>
                <th className="py-3 px-3 font-semibold text-right">Margin Laba</th>
                <th className="py-3 px-3 font-semibold">Tautan Pendorong Utama</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* SKU & Name */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {prod.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{prod.sku}</span>
                      <span>·</span>
                      <span>{prod.category}</span>
                    </div>
                  </td>

                  {/* ABC Class */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        prod.abcClass === 'A'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : prod.abcClass === 'B'
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      Kelas {prod.abcClass}
                    </span>
                  </td>

                  {/* Price & COGS */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      HPP: Rp {prod.cogs.toLocaleString('id-ID')}
                    </div>
                  </td>

                  {/* Current Stock */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-sm">
                    <span
                      className={
                        prod.currentStock <= prod.safetyStock
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-white'
                      }
                    >
                      {prod.currentStock} unit
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Buffer: {prod.safetyStock}
                    </div>
                  </td>

                  {/* Daily Burn Rate */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                    {prod.dailyBurnRate} unit/hr
                  </td>

                  {/* Days of Inventory */}
                  <td className="py-3.5 px-3 text-right">
                    <div
                      className={`font-mono font-bold ${
                        prod.daysOfInventory <= 7
                          ? 'text-rose-600 dark:text-rose-400'
                          : prod.daysOfInventory <= 30
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {prod.daysOfInventory > 0 ? `${prod.daysOfInventory} hari` : 'HABIS (0)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Lead: {prod.leadTimeDays} hari
                    </div>
                  </td>

                  {/* Margin % */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {prod.grossMarginPercent}%
                  </td>

                  {/* Top referral tracked link */}
                  <td className="py-3.5 px-3">
                    {prod.topReferralLinkTitle ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                        <Link2 className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[140px] font-medium" title={prod.topReferralLinkTitle}>
                          {prod.topReferralLinkTitle}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Stock Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        prod.status === 'critical'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : prod.status === 'optimal'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : prod.status === 'out_of_stock'
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {prod.status === 'critical'
                        ? 'Segera Restock (<7d)'
                        : prod.status === 'optimal'
                        ? 'Optimal'
                        : prod.status === 'out_of_stock'
                        ? 'Habis Total'
                        : 'Overstock (>60d)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Order Calculator & Purchase Orders Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restock Order Calculator */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kalkulator Rekomendasi Restock (EOQ)
            </h3>
          </div>

          <form onSubmit={handleCreateRestockPO} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Produk untuk Dipesan:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Sisa: {p.currentStock} unit)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Cadangan Pasokan:
              </label>
              <select
                value={targetStockDays}
                onChange={(e) => setTargetStockDays(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value={15}>15 Hari Pasokan</option>
                <option value={30}>30 Hari Pasokan (Standar)</option>
                <option value={45}>45 Hari Pasokan</option>
                <option value={60}>60 Hari Pasokan (Persiapan Event)</option>
              </select>
            </div>

            {/* Calculations breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kecepatan Terjual:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {activeProductForRestock?.dailyBurnRate} unit / hari
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estimasi Hari Pengiriman:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {activeProductForRestock?.leadTimeDays} hari kerja
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Rekomendasi Jumlah Pesan:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {restockRecommendation.neededQty} Unit
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kebutuhan Modal (HPP):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  Rp {(restockRecommendation.totalCost ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {orderCreatedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs">
                {orderCreatedNotice}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Buat Purchase Order (PO) Restock</span>
            </button>
          </form>
        </div>

        {/* Purchase Orders Log */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Pesanan Restock & Pengiriman Supplier
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {restockOrders.length} Pesanan Tercatat
            </span>
          </div>

          <div className="space-y-2.5">
            {restockOrders.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                      #{order.id}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white">
                      {order.productName}
                    </h5>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>Supplier: {order.supplier}</span>
                    <span>·</span>
                    <span>Tgl Order: {order.createdAt}</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Est. Tiba: {order.estimatedArrival}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {order.orderQuantity} Unit
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Rp {order.totalCost.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      order.status === 'in_transit'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        : order.status === 'received'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                    }`}
                  >
                    {order.status === 'in_transit'
                      ? 'Sedang Dikirim 🚚'
                      : order.status === 'received'
                      ? 'Diterima Gudang ✓'
                      : 'Menunggu Pengiriman'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
