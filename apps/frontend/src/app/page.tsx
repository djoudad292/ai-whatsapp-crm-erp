import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 font-sans">
      <h1 className="text-4xl font-bold tracking-tight">
        AI WhatsApp - CRM - ERP
      </h1>
      <p className="mt-4 max-w-xl text-center text-lg text-gray-600">
        Phase 1 scaffold. Next.js frontend, NestJS backend, Odoo ERP.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/health"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Backend health
        </Link>
      </div>
    </main>
  );
}