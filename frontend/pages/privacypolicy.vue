<template>
  <div class="legal bg-black min-h-screen py-16 px-4">
    <div class="max-w-3xl mx-auto text-white leading-relaxed">
      <header class="mb-10 border-b border-white/10 pb-6">
        <h1 class="text-4xl md:text-5xl font-extrabold mb-2">Privacy Policy</h1>
        <p class="text-white/60" data-testid="legal-effective-date">
          {{ info.effectiveDate ? `Effective ${info.effectiveDate}` : 'Draft, not yet in effect' }}
        </p>
      </header>

      <p v-if="!published" class="legal-draft" data-testid="legal-draft-notice" role="note">
        Draft for review. Items marked “to confirm” must be filled in before this policy is published.
      </p>

      <p class="mb-10">
        This policy explains what information Faneqo collects, why, who we share it with, and the choices
        you have. It covers artists and their teams, and fans who visit artist pages, follow artists,
        check in at shows or make payments.
      </p>

      <section class="mb-10">
        <h2 class="section-title">1. Who we are</h2>
        <p>
          Faneqo (formerly {{ info.formerName }}) is operated by
          <span v-if="info.operatorLegalName">{{ info.operatorLegalName }}</span>
          <span v-else class="legal-tbc">[to confirm: owner’s legal name]</span>,
          {{ info.operatorStructure }}. Faneqo is not a corporation or an LLC. You can reach us using the
          details in section 11.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">2. What we collect</h2>

        <h3 class="sub-title">If you’re an artist or team member</h3>
        <ul class="legal-list">
          <li><strong>Account details:</strong> your email address and password (stored in hashed form), or your name and email from Google if you sign in with Google.</li>
          <li><strong>Artist page content:</strong> the artist name, bio, photos, videos, music links, events, galleries and updates you add.</li>
          <li><strong>Billing:</strong> your Faneqo Pro subscription status, price and dates. Card details are entered on Stripe’s pages and held by Stripe, not by Faneqo.</li>
          <li><strong>Payouts:</strong> if you set up fan payments, Stripe collects your identity and bank details. We keep the ID of your Stripe account and its setup status.</li>
          <li><strong>Messages you send:</strong> updates you send to fans and conversations you have through Faneqo.</li>
        </ul>

        <h3 class="sub-title mt-6">If you’re a fan</h3>
        <ul class="legal-list">
          <li><strong>Details you share with an artist:</strong> your email (and name, if you give it) when you join an artist’s list, follow them, check in at a show, or create a Fan Passport.</li>
          <li><strong>Show check-ins:</strong> which show you checked in to, when, and the show’s location.</li>
          <li><strong>Payments:</strong> your name, email, the amount, and any message you add, plus whether you chose to appear on the artist’s supporter wall. Card details are handled by Stripe; Faneqo never sees your card number.</li>
          <li><strong>Unsubscribes and preferences:</strong> whether you’ve unsubscribed or unfollowed.</li>
        </ul>

        <h3 class="sub-title mt-6">Collected automatically when anyone visits</h3>
        <p>When you open an artist page, event page or scan a Faneqo QR code, we record:</p>
        <ul class="legal-list">
          <li>your IP address and the approximate location it suggests (city, region, country);</li>
          <li>device type, operating system, browser, screen size, language and time zone;</li>
          <li>how you arrived (the referring site, QR code, and campaign or ad tags in the link);</li>
          <li>random identifiers stored in your browser so we can count visits and sessions;</li>
          <li>basic page speed measurements.</li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">3. Cookies and similar tools</h2>
        <p>We use cookies and browser storage to keep you signed in and to count visits. We also use:</p>
        <ul class="legal-list">
          <li><strong>Google Analytics</strong>, to understand how people use Faneqo;</li>
          <li><strong>Meta Pixel</strong> (Facebook), to measure our own ads;</li>
          <li><strong>Cloudflare</strong>, which delivers and protects the site and measures its performance.</li>
        </ul>
        <p class="mt-4">
          You can block or delete cookies in your browser settings. Some parts of Faneqo, like staying signed
          in, won’t work without them.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">4. How we use information</h2>
        <ul class="legal-list">
          <li>to run Faneqo: accounts, artist pages, QR codes, events, galleries and messaging;</li>
          <li>to show artists analytics about their page, such as visits, scans, clicks and where fans are;</li>
          <li>to deliver the messages artists choose to send to their fans;</li>
          <li>to process Faneqo Pro billing and fan payments, provide receipts, and handle refunds;</li>
          <li>to keep Faneqo safe, including reviewing payment accounts and preventing fraud and abuse;</li>
          <li>to answer support requests and tell you about important changes to your account or these policies;</li>
          <li>to understand and improve Faneqo, and to measure our own marketing.</li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">5. What artists can see about fans</h2>
        <p>
          When a fan shares their details with an artist through Faneqo, that artist (and the teammates they
          invite) can see them, for example the fan’s email, name, rough location, show check-ins and
          payments to that artist. Artists can use these details to message fans through Faneqo.
        </p>
        <p class="mt-4">
          Every fan email from Faneqo includes an unsubscribe link. Artists are responsible for how they use
          fan information and must follow our
          <NuxtLink to="/termsofservice" class="legal-link">Terms of Service</NuxtLink> and the law.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">6. Who we share information with</h2>
        <p>We do not sell personal information for money. Analytics and advertising tools, including Meta Pixel, may share browser information with their providers. Some laws treat this as sharing for targeted advertising. We also share information:</p>
        <ul class="legal-list">
          <li>
            <strong>With service providers who run Faneqo for us:</strong> Stripe (payments and payouts),
            Railway (hosting), Amazon Web Services (file storage), Cloudflare (delivery and security),
            Resend (email delivery), Google (sign-in and analytics) and Meta (ad measurement).
          </li>
          <li><strong>With artists</strong>, as described in section 5.</li>
          <li><strong>Publicly</strong>, when you choose it, such as appearing on a supporter wall or posting on an artist page.</li>
          <li><strong>For legal reasons</strong>, when the law requires it, or to protect people, Faneqo, or the rights of others.</li>
          <li><strong>If Faneqo is sold or reorganized</strong>, to the new owner, who must follow this policy.</li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">7. How long we keep information</h2>
        <p>
          We keep information while your account is active and for as long as we need it to run Faneqo,
          keep records of payments, resolve disputes, prevent fraud and meet legal obligations.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">8. Your choices</h2>
        <ul class="legal-list">
          <li><strong>Unsubscribe</strong> from an artist’s emails using the link in any email.</li>
          <li><strong>Unfollow</strong> an artist from their page.</li>
          <li><strong>Update</strong> your account details in your account settings.</li>
          <li>
            <strong>Ask for a copy, a correction, or deletion</strong> of your information by contacting us.
            We may need to confirm it’s you, and we may keep some information where the law requires it or to
            prevent fraud.
          </li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">9. Security</h2>
        <p>
          We use reasonable safeguards, such as encrypted connections and limited access, to protect your
          information. No system is perfectly secure, so we can’t guarantee it.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">10. Children and changes</h2>
        <p>
          Faneqo is not directed to children under 13, and we do not knowingly ask them to provide personal information.
          If you believe a child has given us information, contact us and we’ll look into it.
        </p>
        <p class="mt-4">
          We may update this policy. We’ll post the new version here and change the date above, and tell you
          about significant changes.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">11. Contact us</h2>
        <p>Questions or requests about your information? Contact us:</p>
        <address class="not-italic mt-2">
          Faneqo<br />
          Email:
          <a v-if="info.supportEmail" :href="`mailto:${info.supportEmail}`" class="legal-link">{{ info.supportEmail }}</a>
          <span v-else class="legal-tbc">[to confirm: support email]</span>
          <template v-if="info.mailingAddress"><br />Mail: {{ info.mailingAddress }}</template>
        </address>
      </section>
    </div>
  </div>
</template>

<script setup>
import { LEGAL_INFO, legalReadyToPublish } from '~/utils/legal/legalInfo'

const info = LEGAL_INFO
const published = legalReadyToPublish(info)

useHead({ title: 'Privacy Policy' })
</script>

<style scoped>
.section-title {
  @apply text-2xl font-semibold mb-4;
}
.sub-title {
  @apply text-xl font-semibold mt-4 mb-2;
}
.legal-list {
  @apply list-disc ml-6 space-y-2 mt-2 text-white/90;
}
.legal-link {
  @apply underline underline-offset-2 text-white;
}
.legal-tbc {
  @apply rounded px-1 bg-amber-300/15 text-amber-200;
}
.legal-draft {
  @apply mb-10 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100;
}
</style>
