import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">URL Shortener</h1>
        <div className="grid gap-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
