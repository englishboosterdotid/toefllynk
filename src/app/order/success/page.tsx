import { Suspense } from "react";
import OrderSuccessClient from "./success-client";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
          </div>
        </main>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}