// app/layout.js
export const metadata = {
  title: 'Task Bazar - Earn & Promote',
  description: 'The Premium Micro-Task Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <meta name="monetag" content="dcd7e7734d48860871c0aa74d53e2fff">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}
