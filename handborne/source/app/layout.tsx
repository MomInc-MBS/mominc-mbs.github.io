import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Helping Hand — The Custom Shop',
  description:
    'Customize your Helping Hand with twenty-three creature styles, six joined sections and eight nail shapes. Your hand. Your way.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
