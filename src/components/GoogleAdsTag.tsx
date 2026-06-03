import Script from 'next/script'

const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim()

export default function GoogleAdsTag() {
  if (!googleAdsId || !googleAdsId.startsWith('AW-')) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${googleAdsId}');
        `}
      </Script>
    </>
  )
}
