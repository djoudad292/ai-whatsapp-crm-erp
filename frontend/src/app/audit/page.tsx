import Link from "next/link";

export default function Audit() {
  return (
    <main className="min-h-screen p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>
      <p className="text-gray-600 mb-8">Audit page — prop renderer placeholder</p>
      <nav className="flex gap-4">
        <Link href="/approvals" className="text-blue-600 hover:underline">← Approvals</Link>
        <Link href="/health" className="text-blue-600 hover:underline">Health →</Link>
      </nav>
    </main>
  );
}