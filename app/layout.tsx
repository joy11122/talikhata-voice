import MobileSetup from '@/components/mobile/MobileSetup';
import NativeShell from '@/components/NativeShell';
import './globals.css';
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="bn"><body>
        <NativeShell />{children}<MobileSetup/></body></html>}
