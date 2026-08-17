import './globals.css';
import { TimerProvider } from '../context/timerContext';
import Header from '@/components/Header';

export const metadata = {
  title: 'Work Timer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header></Header>
        <TimerProvider>{children}</TimerProvider>
      </body>
    </html>
  );
}