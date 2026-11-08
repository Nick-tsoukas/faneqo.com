export default defineNuxtPlugin((nuxtApp) => {
    useHead({
      script: [
        {
          hid: 'ga',
          src: `https://www.googletagmanager.com/gtag/js?id=G-LRB82HECE7`,
          async: true,
        },
        {
          hid: 'ga-config',
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LRB82HECE7');
          `,
        },
      ],
      __dangerouslyDisableSanitizersByTagID: {
        'ga-config': ['innerHTML'],
      },
    })
  })
  