import './globals.css';
//import { TimerProvider } from './context/TimerContext';

export const metadata = {
  title: 'Work Timer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TimerProvider>{children}</TimerProvider>
      </body>
    </html>
  );
}