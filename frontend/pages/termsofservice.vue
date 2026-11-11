<template>
  <div class="legal bg-black min-h-screen py-16 px-4">
    <div class="max-w-3xl mx-auto text-white leading-relaxed">
      <header class="mb-10 border-b border-white/10 pb-6">
        <h1 class="text-4xl md:text-5xl font-extrabold mb-2">Terms of Service</h1>
        <p class="text-white/60" data-testid="legal-effective-date">
          {{ info.effectiveDate ? `Effective ${info.effectiveDate}` : 'Draft, not yet in effect' }}
        </p>
      </header>

      <p v-if="!published" class="legal-draft" data-testid="legal-draft-notice" role="note">
        Draft for review. Items marked “to confirm” must be filled in before these terms are published.
      </p>

      <p class="mb-10">
        These terms explain how Faneqo works and what you and we agree to when you use it. We’ve
        tried to keep them short and plain. Please read them, especially the parts about
        Faneqo Pro billing and fan payments.
      </p>

      <section class="mb-10">
        <h2 class="section-title">1. Who we are</h2>
        <p>
          Faneqo (formerly {{ info.formerName }}) is a platform that helps artists share their music,
          shows and updates with fans, and lets fans support the artists they love.
        </p>
        <p class="mt-4">
          Faneqo is operated by
          <span v-if="info.operatorLegalName">{{ info.operatorLegalName }}</span>
          <span v-else class="legal-tbc">[to confirm: owner’s legal name]</span>,
          {{ info.operatorStructure }}. Faneqo is not a corporation or an LLC. “Faneqo”, “we” and
          “us” in these terms mean that operator.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">2. Agreeing to these terms</h2>
        <p>
          By creating an account or using Faneqo, you agree to these terms and to our
          <NuxtLink to="/privacypolicy" class="legal-link">Privacy Policy</NuxtLink>. If you don’t agree,
          please don’t use Faneqo.
        </p>
        <p class="mt-4">
          We may update these terms as Faneqo changes. When we do, we’ll post the new version here and
          update the date above. If a change significantly affects your paid subscription, we’ll tell you
          before it applies to you. Using Faneqo after an update means you accept the updated terms.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">3. Your account</h2>
        <ul class="legal-list">
          <li>Give accurate information and keep it up to date.</li>
          <li>Keep your login private. You’re responsible for what happens in your account.</li>
          <li>Tell us right away if you think someone else has accessed your account.</li>
          <li>
            If you manage an artist page for someone else, or invite teammates, make sure you have the
            artist’s permission to do so.
          </li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">4. Using Faneqo responsibly</h2>
        <p>Please don’t use Faneqo to:</p>
        <ul class="legal-list">
          <li>break the law, or help anyone else break it;</li>
          <li>pretend to be an artist, person or business you don’t represent;</li>
          <li>post content you don’t have the rights to, or that is hateful, harassing, sexually exploitative or violent;</li>
          <li>send spam, or message people who haven’t agreed to hear from you;</li>
          <li>collect payments by fraud, test stolen cards, or move money for anyone else;</li>
          <li>interfere with Faneqo, scrape it, or try to get around its security or limits.</li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">5. Your content</h2>
        <p>
          You own the music, photos, videos, text and other content you upload (“your content”).
          Faneqo doesn’t claim ownership of it.
        </p>
        <p class="mt-4">
          So that Faneqo can work, you give us permission to host, store, copy, resize and display your
          content, and to show it on your artist page, event pages, galleries, QR links and messages you
          send through Faneqo. This permission is worldwide and free of charge. It ends when you remove
          the content or close your account, except for copies we need to keep for legal, security or
          backup reasons.
        </p>
        <p class="mt-4">
          You’re responsible for your content. Only upload things you created or have permission to use,
          including permission from people who appear in your photos and videos where that’s needed.
          We may remove content that breaks these terms or the law.
        </p>
        <p class="mt-4">
          The Faneqo name, logo, design and software belong to us. You can’t copy or reuse them except as
          Faneqo allows.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">6. Faneqo Pro and the free trial</h2>
        <ul class="legal-list">
          <li>
            New artist accounts start with a {{ info.trialDays }}-day free trial of Faneqo Pro. You don’t
            need a card to start it.
          </li>
          <li>
            Faneqo Pro currently costs {{ info.proPrice }}. You’re only billed once you add a card. If the
            trial ends without a card on file, nothing is charged and Pro simply ends.
          </li>
          <li>
            Before you’re asked to authorize recurring billing, we show you the price, when the first charge
            happens, how often it renews, and how to cancel.
          </li>
          <li>
            If you add a card during the trial, your first charge happens when the trial ends. If you choose
            to start Pro early, the rest of your trial ends and you’re charged that day.
          </li>
          <li>
            If you already subscribe at an earlier price (for example $7/month), you keep that price while
            your subscription stays active. If you cancel and later restart, the current price applies, and
            we’ll show it to you before you pay.
          </li>
          <li>
            If we ever change the price of an active subscription, we’ll tell you in advance, and you can
            cancel before the new price applies.
          </li>
          <li>Paying for Pro does not by itself turn on fan payments (see section 9).</li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">7. Renewals and cancelling</h2>
        <p>
          Faneqo Pro renews automatically every month, charged to your saved card, until you cancel.
        </p>
        <p class="mt-4">
          You can cancel anytime from <strong>{{ info.cancelPath }}</strong>. When you cancel, future
          renewals stop and Pro stays on until the end of the period you’ve already paid for. You won’t be
          charged again unless you restart.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">8. Subscription refunds</h2>
        <p>
          Faneqo Pro charges are generally not refundable once you’ve been billed, including for the unused
          part of a month after you cancel. We will refund:
        </p>
        <ul class="legal-list">
          <li>charges we made by mistake;</li>
          <li>duplicate charges;</li>
          <li>anything the law requires us to refund.</li>
        </ul>
        <p class="mt-4">
          We may also give a refund or credit as a one-off goodwill gesture. That’s our choice and doesn’t
          create a right to future refunds. To ask about a charge, contact us (section 14).
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">9. Fan payments and the platform fee</h2>
        <p>
          Artists can let fans support them with payments through Faneqo. Here’s how that works:
        </p>
        <ul class="legal-list">
          <li>
            <strong>Stripe processes the payments.</strong> To accept fan payments, an artist connects a
            Stripe account and agrees to Stripe’s terms, including the Stripe Connected Account Agreement.
            Stripe verifies the artist’s identity and bank details. Faneqo never sees or stores card numbers.
          </li>
          <li>
            <strong>The money goes to the artist.</strong> Fan payments are made to the artist’s own Stripe
            account. The artist is responsible for what they offer fans and for their own taxes.
          </li>
          <li>
            <strong>Faneqo’s fee is {{ info.platformFeePercent }}%.</strong> On eligible fan payments,
            Faneqo collects a {{ info.platformFeePercent }}% platform fee. It comes out of the artist’s
            proceeds, so the fan pays the price shown. Stripe also charges its own processing fees, which
            are separate from Faneqo’s fee.
          </li>
          <li>
            <strong>Approval.</strong> Fan payments go live only after Stripe setup is complete and the
            Faneqo team approves the account. We may pause, limit or turn off fan payments for any account
            to protect fans and artists, for example if we see signs of fraud or a breach of these terms.
          </li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">10. Fan payment refunds, disputes and chargebacks</h2>
        <ul class="legal-list">
          <li>
            Fans should contact the artist about refunds. Artists decide whether to refund a fan payment,
            and a refund is paid back from the artist’s Stripe balance.
          </li>
          <li>
            When an artist refunds a payment, Faneqo generally keeps its {{ info.platformFeePercent }}%
            platform fee. We return it when a refund is caused by Faneqo’s own error, and we may return it in
            other cases at our discretion. Stripe’s own fees on refunded payments are set by Stripe.
          </li>
          <li>
            If a fan disputes a payment with their bank (a chargeback), the fan’s bank decides the outcome,
            not Faneqo or the artist. While a dispute is open, Stripe takes the disputed amount and its
            dispute fee from the artist’s Stripe balance, and returns the disputed amount if the dispute is
            decided in the artist’s favor. We may ask the artist for information to help respond.
          </li>
          <li>
            If an artist’s Stripe balance can’t cover a refund or dispute, the artist remains responsible for
            the amount, and it may be taken from the artist’s future payouts.
          </li>
        </ul>
      </section>

      <section class="mb-10">
        <h2 class="section-title">11. Messaging fans</h2>
        <p>
          Artists can send updates to fans who have shared their contact details with them through Faneqo.
          If you’re an artist, only message fans who agreed to hear from you, keep messages honest and
          relevant, and follow anti-spam laws. Every fan email includes a way to unsubscribe, and we may
          stop messages that look like spam or abuse.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">12. Suspension and closing accounts</h2>
        <p>
          You can stop using Faneqo at any time. If you have an active subscription, cancel it first (section 7).
          To close your account, contact us.
        </p>
        <p class="mt-4">
          We may suspend or close an account, remove content, or pause payments if we reasonably believe
          the account breaks these terms or the law, creates a risk of fraud or harm to fans, artists or
          Faneqo, or if we’re required to by law or by Stripe. Where it’s safe and practical, we’ll tell you
          why and give you a chance to respond.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">13. The legal fine print</h2>
        <p>
          We work hard to keep Faneqo running well, but we provide it “as is”, without promises that it will
          always be available or error-free, to the extent the law allows.
        </p>
        <p class="mt-4">
          To the extent the law allows, Faneqo isn’t liable for indirect or consequential losses, such as
          lost profits, lost data or lost goodwill, and our total liability to you for any claim is limited
          to the amount you paid Faneqo in the 12 months before the claim. Nothing in these terms limits
          rights you have under laws that can’t be waived.
        </p>
        <p class="mt-4">
          These terms are governed by the laws of the State of {{ info.governingLaw }}, USA, except where the
          law of the place you live says otherwise.
        </p>
      </section>

      <section class="mb-10">
        <h2 class="section-title">14. Contact and support</h2>
        <p>Questions about these terms, a charge, or your account? Contact us:</p>
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

useHead({ title: 'Terms of Service' })
</script>

<style scoped>
.section-title {
  @apply text-2xl font-semibold mb-4;
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
