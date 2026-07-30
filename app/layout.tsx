import './globals.css';

export const metadata = {
  title: 'Blarki — Hiring, verified',
  description: 'Skill-verified hiring for every industry.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
