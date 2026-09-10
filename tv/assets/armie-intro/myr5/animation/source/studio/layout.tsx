import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MYR5 — The Custom Shop',
  description:
    'Customize the MYR5 cyclops with twenty creature styles, six body sections, eye expressions and hologram mode.',
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

