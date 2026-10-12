import Link from "next/link";

export default function Health() {
  return (
    <main className="min-h-screen p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Health</h1>
      <p className="text-gray-600 mb-8">Health page — prop renderer placeholder</p>
      <nav className="flex gap-4">
        <Link href="/audit" className="text-blue-600 hover:underline">← Audit</Link>
        <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard →</Link>
      </nav>
    </main>
  );
}