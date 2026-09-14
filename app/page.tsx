import Link from 'next/link';
import { ArrowRight, BookOpen, Boxes, ReceiptText, Mic, LogIn, UserPlus } from 'lucide-react';

const modules = [
  { href: '/dashboard/parties', title: 'বাকির খাতা', subtitle: 'Customers & suppliers, due and received payments.', icon: BookOpen },
  { href: '/dashboard/products', title: 'স্টক', subtitle: 'Products, stock quantity, prices and low-stock alerts.', icon: Boxes },
  { href: '/dashboard/transactions', title: 'দৈনিক হিসাব', subtitle: 'Sales, expenses and complete transaction history.', icon: ReceiptText },
];

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3"><Mic className="text-emerald-600" /><span className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Voice-first shop management</span></div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">TaliKhata Voice</h1>
            <p className="mt-3 max-w-2xl text-slate-600">বাংলা, Banglish ও English voice-controlled ledger, stock and expense management.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/signin" className="btn-secondary"><LogIn size={17} /> Sign in</Link>
            <Link href="/auth/signup" className="btn-primary"><UserPlus size={17} /> Create account</Link>
          </div>
        </header>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {modules.map(({ href, title, subtitle, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Icon /></div><ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" /></div>
              <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-slate-500">{subtitle}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-emerald-700">Open module →</span>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">🎙️ Voice commands</h2>
          <p className="mt-2 text-slate-600">Sign in and use the floating microphone to add dues, update stock, read balances, or manage entries.</p>
          <Link href="/dashboard" className="mt-4 inline-flex btn-primary">Open Dashboard <ArrowRight size={17} /></Link>
        </section>
      </div>
    </main>
  );
}
