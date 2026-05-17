export const metadata = {
  title: "AskWise",
  description: "Ask smarter. Work faster."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
