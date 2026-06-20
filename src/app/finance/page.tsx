"use client";

import AppShell from "@/components/AppShell";

export default function FinancePage() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Финансовый трекер</h1>
        <p className="text-sm text-gray-400">Отслеживайте доходы, расходы и бюджет.</p>
      </div>
    </AppShell>
  );
}
