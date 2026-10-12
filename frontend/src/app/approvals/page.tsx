import Link from "next/link";

export default function Approvals() {
  return (
    <main className="min-h-screen p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Approvals</h1>
      <p className="text-gray-600 mb-8">Approvals page — prop renderer placeholder</p>
      <nav className="flex gap-4">
        <Link href="/orders" className="text-blue-600 hover:underline">← Orders</Link>
        <Link href="/audit" className="text-blue-600 hover:underline">Audit →</Link>
      </nav>
    </main>
  );
}