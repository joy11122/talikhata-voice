import MobileFeatures from '@/components/mobile/MobileFeatures';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BookOpen, Boxes, LayoutDashboard, ReceiptText, Settings, Mic, ShieldCheck, ShoppingCart, Truck, Banknote, BarChart3, LockKeyhole } from 'lucide-react';
import VoiceControl from '@/components/VoiceControl';
import UserMenu from '@/components/UserMenu';

export default async function DashboardLayout({children}:{children:React.ReactNode}){
 const session=await auth();
 if(!session?.user?.id) redirect('/auth/signin');
 const links=[['/dashboard','Dashboard',LayoutDashboard],['/dashboard/parties','বাকির খাতা',BookOpen],['/dashboard/products','স্টক',Boxes],['/dashboard/transactions','দৈনিক হিসাব',ReceiptText],['/dashboard/sales','বিক্রি / POS',ShoppingCart],['/dashboard/purchases','ক্রয়',Truck],['/dashboard/payments','পেমেন্ট',Banknote],['/dashboard/reports','রিপোর্ট',BarChart3],['/dashboard/analytics','Analytics',BarChart3],['/dashboard/assistant','AI Assistant',Mic],['/dashboard/closing','দিন শেষ',LockKeyhole],['/dashboard/settings','Settings',Settings],['/dashboard/audit','Voice audit',ShieldCheck]] as const;
 return <div className="min-h-screen md:flex"><aside className="hidden w-64 shrink-0 border-r bg-white p-5 md:block"><Link href="/dashboard" className="text-2xl font-bold">TaliKhata<span className="text-emerald-600">.</span></Link><nav className="mt-8 space-y-2">{links.map(([href,label,Icon])=><Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"><Icon size={19}/>{label}</Link>)}</nav><div className="mt-8 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><Mic size={18}/><p className="mt-2 font-semibold">Voice ready</p><p className="mt-1 text-emerald-700">Use the floating mic to manage your shop.</p></div></aside><div className="min-w-0 flex-1"><div className="border-b bg-white px-5 py-4 md:hidden"><div className="mb-3 flex items-center justify-between"><Link href="/dashboard" className="font-bold">TaliKhata Voice</Link><UserMenu name={session.user.name} email={session.user.email}/></div><div className="mt-3 flex gap-2 overflow-x-auto">{links.map(([href,label])=><Link key={href} href={href} className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm">{label}</Link>)}</div></div><main className="p-5 md:p-8"><div className="mb-6 hidden justify-end md:flex"><UserMenu name={session.user.name} email={session.user.email}/></div>{children}<MobileFeatures/></main><VoiceControl/></div></div>
}
