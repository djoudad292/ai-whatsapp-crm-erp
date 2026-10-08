import Link from "next/link";

export default function Conversations() {
  return (
    <main className="min-h-screen p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Conversations</h1>
      <p className="text-gray-600 mb-8">Conversations page — prop renderer placeholder</p>
      <nav className="flex gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">← Dashboard</Link>
        <Link href="/orders" className="text-blue-600 hover:underline">Orders →</Link>
      </nav>
    </main>
  );
}