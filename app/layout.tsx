export const metadata = {
  title: 'VoiceBridge SD',
  description: 'Speak or type what you need — free food, shelter, and clinics in San Diego, read out loud.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#eef7f8' }}>{children}</body>
    </html>
  );
}
