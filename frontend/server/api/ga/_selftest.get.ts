export default defineEventHandler(() => {
  return {
    propertyId: process.env.GA4_PROPERTY_ID || null,
    hasB64: !!process.env.GA_SERVICE_ACCOUNT_JSON_B64,
    hasRaw: !!process.env.GA_SERVICE_ACCOUNT_JSON,
    iebaStart: process.env.IEBA_START || null,
    nodeVersion: process.version,
    dev: process.dev === true,
  }
})
