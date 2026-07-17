import './globals.css';
import '../fonts.css';
import '../styles.css';

export const metadata = {
  title: 'Dental PMS',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
        <div id="boot"><div className="spin"></div></div>
      </body>
    </html>
  );
}
