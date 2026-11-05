import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Class Pilot | Smart SRM Attendance Tracker',
  description: 'Track and simulate your SRMIST attendance, calculate margins, and view internal marks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
