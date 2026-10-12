import Link from "next/link";

import { Chat } from "./Chat";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Mock WhatsApp Gateway</h1>
            <p className="text-sm text-gray-500">
              Simulated customer chat — inbound messages POST to the backend webhook.
            </p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-6">
        <Chat />
      </div>
    </main>
  );
}