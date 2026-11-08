<template>
  <div class="bg-[#000] overflow-x-hidden pt-[var(--header-height)]">
    <div class="relative min-h-screen">
      <NuxtParticles
        id="tsparticles"
        :options="options"
        class="fixed inset-0 -z-10 pointer-events-none"
      />

      <main>
         <!-- intro to muse starts here  -->
          <!-- HERO: mobile-first, balanced type, HTML-only -->

        <!-- Hero -->
     <div class="relative isolate min-h-screen">
          <div
            class="mx-auto w-[90vw] px-6 py-10 2xl:flex 2xl:items-center 2xl:gap-x-12 2xl:px-8"
          >
            <div
              class="mx-auto w-full 2xl:w-[52%] lg:mx-0 text-white lg:flex-auto"
            >
              <h1
                data-aos="fade-up"
                class="mt-6 font-extrabold tracking-tight leading-[1.05] text-center lg:text-left"
              >
                <span
                  class="relative z-10 inline-block overflow-visible pt-2 pr-2 pb-2 text-4xl md:text-7xl 2xl:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400"
                >
                  MusicBizQR
                </span>

                <span
                  v-if="!isTH"
                  class="block mt-4 text-xl md:text-2xl font-semibold text-white/90"
                >
                  Turn scans into streams, followers, and ticket clicks.
                </span>
                <span
                  v-else
                  class="block mt-4 text-xl md:text-2xl font-semibold text-white/90"
                >
                  เปลี่ยนการสแกนให้เป็นสตรีม ผู้ติดตาม และยอดคลิกตั๋ว
                </span>
              </h1>

              <p v-if="!isTH" class="mt-4 text-base md:text-lg text-white/75 leading-relaxed text-center lg:text-left">
                Create a smart link page for your band, connect your platforms, and print one QR code that you can update anytime. Track what fans do after they scan — and double down on what works.
              </p>
              <p v-else class="mt-4 text-base md:text-lg text-white/75 leading-relaxed text-center lg:text-left">
                สร้างหน้า Smart Link สำหรับวงของคุณ เชื่อมต่อแพลตฟอร์ม และพิมพ์ QR ครั้งเดียว แก้ไขปลายทางได้ตลอด พร้อมดูสถิติหลังแฟนสแกน
              </p>

              <div class="mt-6 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 p-4">
                  <div class="flex items-center gap-2 text-white/85 font-semibold">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M12 4h9" />
                      <path d="M4 9h16" />
                      <path d="M4 15h16" />
                    </svg>
                    <span v-if="!isTH">Dynamic QR</span>
                    <span v-else>QR แบบไดนามิก</span>
                  </div>
                  <div class="mt-1 text-sm text-white/70">
                    <span v-if="!isTH">Print once. Update destinations anytime.</span>
                    <span v-else>พิมพ์ครั้งเดียว เปลี่ยนปลายทางได้ตลอด</span>
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 p-4">
                  <div class="flex items-center gap-2 text-white/85 font-semibold">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-violet-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <path d="M3 10h18" />
                      <path d="M5 6h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                    </svg>
                    <span v-if="!isTH">Shows & events</span>
                    <span v-else>อีเวนต์/งานโชว์</span>
                  </div>
                  <div class="mt-1 text-sm text-white/70">
                    <span v-if="!isTH">Add ticket links + venue details.</span>
                    <span v-else>เพิ่มลิงก์ตั๋วและรายละเอียดสถานที่</span>
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 p-4">
                  <div class="flex items-center gap-2 text-white/85 font-semibold">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M4 19V5" />
                      <path d="M8 19V9" />
                      <path d="M12 19v-6" />
                      <path d="M16 19v-3" />
                      <path d="M20 19V7" />
                    </svg>
                    <span v-if="!isTH">Analytics</span>
                    <span v-else>สถิติ</span>
                  </div>
                  <div class="mt-1 text-sm text-white/70">
                    <span v-if="!isTH">See what fans do after they scan.</span>
                    <span v-else>ดูพฤติกรรมหลังแฟนสแกน</span>
                  </div>
                </div>

                <div class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 p-4">
                  <div class="flex items-center gap-2 text-white/85 font-semibold">
                    <svg viewBox="0 0 24 24" class="h-5 w-5 text-violet-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                      <path d="M4 7h2" />
                      <path d="M4 17h2" />
                    </svg>
                    <span v-if="!isTH">Music + video</span>
                    <span v-else>เพลง + วิดีโอ</span>
                  </div>
                  <div class="mt-1 text-sm text-white/70">
                    <span v-if="!isTH">Embed a featured track and your latest video.</span>
                    <span v-else>ฝังเพลงเด่นและวิดีโอล่าสุด</span>
                  </div>
                </div>
              </div>

              <div
                class="mt-10 justify-center mb-6 flex flex-col sm:flex-row lg:justify-start items-stretch sm:items-center gap-3"
              >
                <NuxtLink
                  to="/signup"
                  class="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-6 py-4 font-semibold text-white bg-gradient-to-r from-pink-500 to-violet-500 shadow-[0_18px_50px_rgba(139,92,246,0.25)] hover:opacity-95 transition"
                >
                  <span v-if="!isTH">Create Account</span>
                  <span v-else>เริ่มต้นใช้งานฟรี</span>
                </NuxtLink>
                <NuxtLink
                  to="/login"
                  class="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-6 py-4 font-semibold text-white/85 border border-white/15 bg-white/5 hover:bg-white/10 hover:text-white transition"
                >
                  <span v-if="!isTH">Member Login</span>
                  <span v-else>เข้าสู่ระบบ</span>
                </NuxtLink>
              </div>

              <div class="flex flex-wrap justify-center lg:justify-start gap-2 text-xs text-white/60">
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1">No app required</span>
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1">Mobile-first</span>
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1">Real-time insights</span>
              </div>
            </div>

            <div class="mt-10 2xl:mt-0 flex justify-center md:justify-center md:items-start lg:flex-shrink-0 lg:flex-grow">
              <div class="w-full max-w-xs sm:max-w-sm 2xl:max-w-md">
                <div class="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 shadow-[0_25px_60px_rgba(0,0,0,0.55)] p-6">
                  <div class="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"></div>
                  <div class="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl"></div>

                  <div class="flex items-center justify-between">
                    <div class="text-white font-semibold">Scan to preview</div>
                    <div class="text-white/50 text-xs">demo QR</div>
                  </div>

                  <div class="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4 flex items-center justify-center"  >
                    <img
                      src="@/assets/mbqqrcodefinaljan.png"
                      alt="Example MusicBizQR dynamic QR code linking to an artist smart link page"
                      class="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px]"
                      
                    />
                  </div>

                  <div class="mt-4 text-sm text-white/70">
                    <span v-if="!isTH">Point your phone camera at this QR to see the smart link experience.</span>
                    <span v-else>ใช้กล้องมือถือสแกนเพื่อดูตัวอย่างหน้า Smart Link</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

       
        <!-- <section
          id="muse"
          class="relative isolate overflow-hidden bg-black text-white"
        >
    
          <div
            class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(120,119,198,0.25),rgba(30,27,75,0)_70%)]"
          />
        </section> -->
    
        <!-- needs section here  -->

        <section class="relative text-white overflow-hidden">
          <!-- subtle gradient glow -->
          <!-- <div
            class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_110%_at_50%_100%,rgba(199,36,177,0.38),transparent_80%)]"
          /> -->

          <div class="container mx-auto px-6 py-16 md:py-24">
            <div
              class="grid grid-cols-1 md:grid-cols-12 items-center gap-10 md:gap-8"
            >
              <!-- Center content -->
              <div class="md:col-span-7 text-center md:text-left">
                <h1
                  class="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight"
                >
                  <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
                    One QR Code. Every Fan. Every Link.
                  </span>
                </h1>

                <p class="mt-4 text-white/80">
                  Give your audience a single QR code “Smart Link Tree”
                </p>

                <ul class="mt-6 space-y-3">
                  <li class="flex items-start gap-3">
                    <span
                      class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20"
                    >
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Your content on all platforms with 1 scan</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span
                      class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20"
                    >
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Real-time analytics (see who’s clicking what!)</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span
                      class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20"
                    >
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Showcase 1 song, 1 video</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <span
                      class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20"
                    >
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <span>Post upcoming events & ticket links</span>
                  </li>
                </ul>

                <NuxtLink
                  to="/signup"
                  class="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-violet-600/80 hover:bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg transition duration-200"
                >
                  <span> Free 30 Day Trial</span>
                  <!-- <span class="text-white/80 font-normal"
                    >No Credit Card Required</span
                  > -->
                </NuxtLink>
              </div>

              <!-- Right phones -->
              <div class="hidden md:flex md:col-span-5 justify-center gap-6">
                <SmartLinkDemoPhone />
              </div>
            </div>
          </div>
        </section>

       
            <!-- end of muse -->

        <!-- CTA block -->
        <!-- <div
          ref="parallaxRef"
          class="relative w-screen min-h-screen bg-scroll md:bg-fixed bg-center bg-cover bg-[url('/assets/aisix.webp')] z-50"
        >
          <div
            class="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div
              class="text-center h-full flex flex-col justify-center items-center md:text-left"
            >
              <h2
                class="text-4xl md:text-6xl font-bold text-white animate-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500"
              >
                <span v-if="!isTH">Create Your Profile</span>
                <span v-else>เริ่มสร้างโปรไฟล์ของคุณ</span>
              </h2>
              <div
                class="flex w-full justify-center md:justify-center px-2 gap-6 mt-10 text-white"
              >
                <NuxtLink
                  to="/signup"
                  class="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-violet-500 px-6 py-3 font-semibold text-white shadow-lg transition duration-200"
                >
                  <span>🚀 Free 30 Day Trial</span>
                  <span class="text-white/80 font-normal"
                    >No Credit Card Required</span
                  >
                </NuxtLink>
              </div>
            </div>
          </div>
        </div> -->

        <!-- Example section (unchanged content, global) -->
        <div class="flex flex-col justify-center">
          <div class="mt-10 flex items-center justify-center">
            <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85">
              <span class="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.35)]"></span>
              Smart Link Demo
            </span>
          </div>
          <h2
            class="text-4xl lg:text-4xl 2xl:text-5xl font-bold mt-4 pt-2 pb-2 leading-[1.08] text-center"
          >
            <span class="relative z-10 inline-block overflow-visible px-2 pb-2 pt-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
              Your smart link page (built for fan conversion)
            </span>
          </h2>
          <p
            class="mt-3 max-w-3xl mx-auto text-center text-white/85 text-lg leading-relaxed"
          >
            When fans scan your <strong>MusicBizQR</strong>, they land on a fast, mobile-first page that brings everything together:
            streaming links, socials, a featured track or video, plus merch and ticket buttons.
            Update it anytime — and track every tap and scan in real time.
          </p>

          <div class="w-full max-w-md md:max-w-5xl mx-auto">
            <section class="max-w-5xl mx-auto text-white my-12 overflow-hidden">
              <div class="grid md:grid-cols-1 gap-6 p-6 md:p-10 items-center">
                <SmartLinkDemoInline />
              </div>
            </section>

            <!-- Press / Featured In Section -->
              <div class="py-16 md:py-20">
                <div class="max-w-4xl mx-auto text-center">
                  <span class="text-purple-400 text-sm font-semibold uppercase tracking-widest">
                    Press
                  </span>
                  <h2 class="mt-4 text-3xl md:text-5xl font-bold text-white">
                    Featured In
                  </h2>
                  <p class="mt-4 text-white/60 text-lg">
                    MusicBizQR is helping artists turn listeners into real fans.
                  </p>
                  <div class="mt-12">
                    <a 
                      href="https://nysmusic.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="block w-full max-w-2xl mx-auto rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 md:p-14 transition-all duration-300 hover:border-white/20 hover:from-white/15 hover:to-white/10 hover:scale-[1.02] group"
                    >
                      <div class="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                        <img 
                          src="/images/nys_logo_white_transparent.png" 
                          alt="NYS Music Magazine" 
                          class="w-32 h-32 md:w-40 md:h-40 object-contain group-hover:brightness-110 transition-all"
                        />
                        <div class="text-center md:text-left">
                          <p class="text-white/50 text-sm uppercase tracking-widest mb-2">
                            As Featured In
                          </p>
                          <p class="text-white text-2xl md:text-3xl font-bold">
                            NYS Music Magazine
                          </p>
                          <p class="mt-3 text-white/60 text-sm flex items-center justify-center md:justify-start gap-2 group-hover:text-emerald-400 transition-colors">
                            Read the article
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              <div class="px-6 md:px-10">
              <div class="mt-8 flex items-center justify-center">
                <span
                  class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85"
                >
                  <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]"></span>
                  Analytics & Revenue Insights
                </span>
              </div>
              <h3
                class="mt-4 text-4xl md:text-5xl font-extrabold text-center tracking-tight"
              >
                <span
                  class="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-300 to-violet-400"
                >
                  See what fans do after they scan
                </span>
              </h3>
              <p class="mt-3 max-w-3xl mx-auto text-center text-white/80 text-lg leading-relaxed">
                Toggle between metrics, date ranges, and bar/line views to preview your band’s dashboard — track engagement after scans, YouTube performance, and payout trends so you can spot what’s working and double down.
              </p>

              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/80">
                  Post-scan journey
                </span>
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/80">
                  YouTube analytics
                </span>
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/80">
                  Tips, merch & payouts
                </span>
                <span class="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/80">
                  Top sources & devices
                </span>
              </div>
            </div>

            <AnalyticsDemoInline data-section="analytics-demo" />
          </div>
        </div>

        <!-- Momentum Engine Section -->
        <MomentumEngineSection />

        <!-- Embed section (unused) -->
        <section
          v-if="false"
          class="relative min-h-screen items-center justify-center pt-10 md:pt-24 image_gradient"
        >
          <div class="flex flex-col items-center mx-2 md:mx-20 md:flex-row">
            <div class="w-full md:w-3/5 flex flex-col justify-between px-6">
              <div class="flex-grow flex flex-col justify-start">
                <h2
                  class="text-white text-center md:text-left font-bold text-4xl mb-4 lg:text-6xl"
                >
                  Embed Music from your streaming platform
                </h2>
                <p
                  class="text-white text-lg text-center md:text-left pb-10 md:pb-0 leading-relaxed max-w-xl"
                >
                  Drop a live streaming player—<strong>Spotify</strong>,
                  <strong>Apple Music</strong>, <strong>YouTube</strong>,
                  whatever you use—directly into your MusicBizQR smart link
                  page. Fans scan at shows and tap to play, boosting streams,
                  followers &amp; pre-saves on the spot.
                  <span class="sr-only"
                    >embed music players qr code music marketing for artists and
                    bands</span
                  >
                </p>
              </div>
            </div>

            <div class="w-full mb-16 md:mb-0 md:w-2/5 flex justify-center">
              <iframe
                class="w-[90%] h-[400px] md:w-[80%] md:h-[450px] rounded-lg shadow-lg"
                src="https://open.spotify.com/embed/album/3q4BkDV5B7sczFcfrIl2a2?utm_source=generator&theme=0"
                frameborder="0"
                allowtransparency="true"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              ></iframe>
            </div>
          </div>

          <div class="left-0 w-auto">
            <div
              class="flex items-center px-6 md:px-0 pb-10 md:py-20 justify-around space-x-6"
            >
              <Icon
                v-for="icon in streamingIcons"
                :key="icon.name"
                :icon="icon.icon"
                class="w-10 h-10 text-white hover:text-green-500 transition"
              />
            </div>
          </div>
        </section>

        <!-- Video section (unchanged) removed for now -->
        <!-- <section
          class="min-h-screen flex flex-col items-center justify-center pt-10 md:py-24"
        > -->
          <!-- <div class="text-center px-6 max-w-4xl">
            <h2 class="text-white font-bold text-4xl mb-4 lg:text-6xl">
              Showcase Your Music Videos &amp; Live Clips
            </h2>
            <p class="text-white text-lg mb-10 leading-relaxed">
              Embed a new single, lyric video, rehearsal clip or full playlist
              in your MusicBizQR smart link. Fans scan a poster, merch tag or
              bio link, tap play, and share—no searching, no typing.
              <span class="sr-only"
                >music video embed qr smart link for artists bands
                musicians</span
              >
            </p>
          </div> -->

          <!-- <div class="w-full flex justify-center">
            <div class="relative w-[90vw] md:w-[80vw] max-w-4xl">
              <div
                v-if="!isPlaying"
                class="relative cursor-pointer"
                @click="isPlaying = true"
              >
                <img
                  :src="thumbnail"
                  alt="Video Thumbnail"
                  class="rounded-lg shadow-lg w-full h-auto"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <Icon
                    icon="mdi:play-circle"
                    class="text-white w-20 h-20 opacity-80 hover:opacity-100 transition"
                  />
                </div>
              </div>
              <iframe
                v-if="isPlaying"
                class="w-full h-64 md:h-96 rounded-lg shadow-lg"
                :src="videoUrl"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
          </div> -->
        <!-- </section> -->

        <!-- Analytics chart (unused) -->
        <section v-if="false" class="w-[100vw] mx-auto">
          <section
            class="bg-gradient-to-r from-purple-600 to-indigo-600 py-10 md:py-20"
          >
            <div class="container mx-auto text-center px-4">
              <h2
                class="text-4xl md:text-4xl lg:text-6xl pb-10 text-center font-extrabold text-white"
              >
                QR Scan Analytics for Musicians
              </h2>
              <p
                class="text-white text-lg lg:text-2xl mb-14 text-center leading-relaxed max-w-3xl mx-auto"
              >
                See where, when &amp; how fans engage with your QR codes. Track
                scans by city, device &amp; time, spot your hottest markets, and
                double down on campaigns that drive streams, signups, tickets
                &amp; merch.
                <span class="sr-only"
                  >music marketing analytics for artists bands qr code
                  data</span
                >
              </p>
              <BarChart />
            </div>
            <div class="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
              <!-- Header -->
              <div class="mx-auto max-w-3xl text-center">
                <h2
                  class="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl"
                >
                  One Dashboard. Every Platform.
                  <span
                    class="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-transparent"
                  >
                    Daily Intelligence.
                  </span>
                </h2>
                <p class="mt-4 text-base leading-7 text-white/70 md:text-lg">
                  Muse turns page views, link clicks, song &amp; video plays,
                  geo, devices, and YouTube (beta) into
                  <span class="text-white">actionable next steps</span>—like a
                  daily “Wrapped” for your band.
                </p>
              </div>

              <section class="max-w-4xl m-auto pt-28">
                <iframe
                src="https://musicbizqr.com/analytics/5"
                class="w-full h-[1000px] rounded-xl border border-white/10 shadow-lg"
                loading="lazy"
              ></iframe>
              </section>
            </div>
          </section>
        </section>

        <!-- Pricing (adds THB approx) -->
        <section class="relative py-14 md:py-24 text-white overflow-hidden">
          <div class="pointer-events-none absolute inset-0 -z-10">
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-violet-500/18 blur-3xl"></div>
            <div class="absolute -bottom-28 right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/12 blur-3xl"></div>
            <div class="absolute inset-0 bg-gradient-to-b from-black via-black to-black"></div>
          </div>

          <div class="max-w-6xl mx-auto px-6">
            <div class="text-center">
              <div class="flex items-center justify-center">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85">
                  <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]"></span>
                  <span v-if="!isTH">Simple pricing</span>
                  <span v-else>ราคาง่าย ๆ</span>
                </span>
              </div>

              <h2 class="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
                  <span v-if="!isTH">One plan. Everything you need.</span>
                  <span v-else>แพ็กเดียว ครบทุกอย่างที่ต้องใช้</span>
                </span>
              </h2>

              <p v-if="!isTH" class="mt-3 max-w-2xl mx-auto text-white/70 text-lg leading-relaxed">
                Start with a free trial. Print once, update anytime, and see what fans do after they scan.
              </p>
              <p v-else class="mt-3 max-w-2xl mx-auto text-white/70 text-lg leading-relaxed">
                เริ่มทดลองใช้ฟรี พิมพ์ครั้งเดียว แก้ไขปลายทางได้ตลอด และดูสถิติหลังแฟนสแกน
              </p>
            </div>

            <div class="mt-10 max-w-4xl mx-auto">
              <div class="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/6 to-black/50 shadow-[0_25px_60px_rgba(0,0,0,0.55)] overflow-hidden">
                <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                <div class="p-8 sm:p-10">
                  <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                      <div class="text-white font-semibold text-xl">MusicBizQR</div>
                      <div class="text-white/60 text-sm mt-1">
                        <span v-if="!isTH">Monthly subscription • cancel anytime</span>
                        <span v-else>รายเดือน • ยกเลิกได้ทุกเมื่อ</span>
                      </div>
                    </div>

                    <div class="text-left md:text-right">
                      <div class="text-4xl sm:text-5xl font-extrabold tabular-nums text-white">
                        ${{ USD_PRICE }}<span class="text-lg font-semibold text-white/70">/mo</span>
                      </div>
                      <div v-if="isTH" class="text-white/60 text-sm mt-1">
                        (~฿{{ approxTHB }}/เดือน)
                      </div>
                    </div>
                  </div>

                  <div class="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-white/85">
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>1 <strong>Dynamic QR Code</strong> (edit destination anytime)</div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>All scans tracked in your <strong>Analytics Dashboard</strong></div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>1 <strong>Artist Smart Link</strong> page</div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>Streaming buttons: Spotify, Apple Music, YouTube &amp; more</div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>Embed 1 featured track &amp; 1 video</div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>Merch &amp; ticket purchase links</div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>Print-ready PNG / SVG QR downloads</div>
                    </div>
                    <div class="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div>Email support</div>
                    </div>
                  </div>

                  <div class="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <NuxtLink
                      to="/signup"
                      class="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-violet-500 px-6 py-3 font-semibold text-white shadow-lg transition duration-200"
                    >
                      <span>Free 30 Day Trial</span>
                      <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </NuxtLink>

                    <div class="text-xs text-white/55">
                      <span v-if="!isTH">No credit card required</span>
                      <span v-else>ไม่ต้องใช้บัตรเครดิต</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA repeat -->
        <div
          ref="parallaxRef"
          class="relative w-screen min-h-screen bg-scroll md:bg-fixed bg-center bg-cover bg-[url('/assets/aisix.webp')] z-50"
        >
          <div
            class="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div class="w-full max-w-3xl mx-auto px-6">
              <div class="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.55)] p-8 sm:p-10 text-center">
                <div class="flex items-center justify-center">
                  <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]"></span>
                    <span v-if="!isTH">Ready in minutes</span>
                    <span v-else>พร้อมใช้งานในไม่กี่นาที</span>
                  </span>
                </div>

                <h2 class="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                  <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
                    <span v-if="!isTH">Create Your Profile</span>
                    <span v-else>เริ่มสร้างโปรไฟล์ของคุณ</span>
                  </span>
                </h2>

                <p v-if="!isTH" class="mt-4 text-white/75 text-lg leading-relaxed">
                  Start your free trial, generate your QR, and publish a smart link page fans can use at shows.
                </p>
                <p v-else class="mt-4 text-white/75 text-lg leading-relaxed">
                  เริ่มทดลองใช้ฟรี สร้าง QR และเผยแพร่หน้า Smart Link ให้แฟนใช้งานในงานโชว์
                </p>

                <div class="mt-8 flex w-full justify-center px-2 gap-6 text-white">
                  <NuxtLink
                    to="/signup"
                    class="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-violet-500 px-6 py-3 font-semibold text-white shadow-lg transition duration-200"
                  >
                    <span>Free 30 Day Trial</span>
                  </NuxtLink>
                </div>

                <div class="mt-5 text-xs text-white/60">
                  <span v-if="!isTH">No credit card required • Cancel anytime</span>
                  <span v-else>ไม่ต้องใช้บัตรเครดิต • ยกเลิกได้ทุกเมื่อ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Articles -->
        <section class="relative bg-black text-white px-4 py-16 max-w-6xl mx-auto overflow-hidden">
          <div class="pointer-events-none absolute inset-0 -z-10">
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-[460px] w-[460px] rounded-full bg-violet-500/12 blur-3xl"></div>
            <div class="absolute -bottom-28 right-[-120px] h-[460px] w-[460px] rounded-full bg-emerald-500/10 blur-3xl"></div>
          </div>

          <div class="flex items-center justify-center">
            <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85">
              <span class="h-2 w-2 rounded-full bg-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.35)]"></span>
              Featured Articles
            </span>
          </div>

          <h2 class="mt-4 text-4xl md:text-5xl font-extrabold text-center tracking-tight">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
              Learn what’s working for artists
            </span>
          </h2>

          <p class="mt-3 max-w-2xl mx-auto text-center text-white/70 text-lg leading-relaxed">
            Quick reads on QR strategy, fan conversion, and real-world show workflows.
          </p>

          <div v-if="featuredRes?.data?.length" class="mt-10 grid gap-4 md:grid-cols-3">
            <NuxtLink
              v-for="post in featuredRes.data.slice(0, 3)"
              :key="post.id"
              :to="`/article/${post.attributes.category}/${post.attributes.slug}`"
              class="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/6 to-black/40 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.45)] hover:bg-white/5 transition"
            >
              <div class="text-xs font-semibold text-white/55">
                {{ post.attributes.category }}
              </div>
              <div class="mt-2 text-lg font-semibold text-white group-hover:text-white">
                {{ post.attributes.title }}
              </div>
              <div class="mt-2 text-sm text-white/65 leading-relaxed line-clamp-3">
                {{ post.attributes.metaDescription }}
              </div>
              <div class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pink-200/90">
                Read article
                <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
            </NuxtLink>
          </div>
        </section>
        <!-- Video Tutorials - temporarily hidden
        <TutorialsSection
          id="videos"
          heading="Video Tutorials"
          :videos="[
            {
              id: 'BmdNv51ORVA',
              title: 'How to Create a QR Code in Under 2 Minutes',
            },
            {
              id: 'h7AacQWKQtc',
              title:
                'How to Create a Artist Smart Link Page in Under 2 Minutes',
            },
          ]"
        />
        -->

        <!-- FAQ (unchanged copy) -->
        <section class="relative py-16 bg-black text-white overflow-hidden">
          <div class="pointer-events-none absolute inset-0 -z-10">
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-violet-500/12 blur-3xl"></div>
            <div class="absolute -bottom-28 right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl"></div>
          </div>

          <div class="max-w-5xl mx-auto px-6">
            <div class="flex items-center justify-center">
              <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/85">
                <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]"></span>
                FAQ
              </span>
            </div>

            <h2 class="mt-4 text-4xl md:text-5xl font-extrabold text-center tracking-tight">
              <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
                Frequently Asked Questions
              </span>
            </h2>

            <p class="mt-3 max-w-2xl mx-auto text-center text-white/70 text-lg leading-relaxed">
              Clear answers on QR codes, analytics, and how MusicBizQR works.
            </p>

            <div class="mt-10">
              <FaqAccordion :faqs="faqItems" />
            </div>
          </div>
        </section>

        <section class="relative py-14 bg-black text-white overflow-hidden">
          <div class="pointer-events-none absolute inset-0 -z-10">
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-pink-500/10 blur-3xl"></div>
            <div class="absolute -bottom-28 right-[-120px] h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-3xl"></div>
          </div>

          <div class="max-w-5xl mx-auto px-6">
            <div class="rounded-3xl border border-white/10 bg-gradient-to-b from-white/6 to-black/50 shadow-[0_25px_70px_rgba(0,0,0,0.55)] p-8 sm:p-10 text-center">
              <h3 class="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400">
                  <span v-if="!isTH">Ready to launch your QR?</span>
                  <span v-else>พร้อมเริ่มใช้งาน QR แล้วหรือยัง?</span>
                </span>
              </h3>

              <p v-if="!isTH" class="mt-4 text-white/75 text-lg leading-relaxed">
                Start your free trial and publish a smart link page your fans can use tonight.
              </p>
              <p v-else class="mt-4 text-white/75 text-lg leading-relaxed">
                เริ่มทดลองใช้ฟรีและเผยแพร่หน้า Smart Link ให้แฟนใช้งานได้ทันที
              </p>

              <div class="mt-8 flex justify-center">
                <NuxtLink
                  to="/signup"
                  class="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-violet-500 px-6 py-3 font-semibold text-white shadow-lg transition duration-200"
                >
                  <span v-if="!isTH">Free 30 Day Trial</span>
                  <span v-else>ทดลองใช้ฟรี 30 วัน</span>
                </NuxtLink>
              </div>

              <div class="mt-5 text-xs text-white/60">
                <span v-if="!isTH">No credit card required • Cancel anytime</span>
                <span v-else>ไม่ต้องใช้บัตรเครดิต • ยกเลิกได้ทุกเมื่อ</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div class="h-40 flex flex-col justify-center items-center">
        <NuxtLink to="/"
          ><img src="@/assets/musicbizlogo.png" class="h-12"
        /></NuxtLink>
      </div>
      <div class="flex justify-center pb-10">
        <NuxtLink class="text-white pr-4" to="/privacypolicy"
          >Privacy Policy
        </NuxtLink>
        <NuxtLink class="text-white" to="/termsofservice"
          >Terms of service
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from "swiper/vue";
import { Thumbs } from "swiper/modules";
import { EffectCards } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Icon } from "@iconify/vue";
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  useRuntimeConfig,
  navigateTo,
} from "#imports";

const user = useStrapiUser()

import SmartLinkDemoPhone from "@/components/demo/SmartLinkDemoPhone.vue";
import SmartLinkDemoInline from "@/components/demo/SmartLinkDemoInline.vue";
import AnalyticsDemoInline from "@/components/demo/AnalyticsDemoInline.vue";
import MomentumEngineSection from "@/components/demo/MomentumEngineSection.vue";

import deezer from "@/assets/dezzer.svg";

const insights = [
  "Your fans in Nashville are up +26% — add venue tags to tonight’s post.",
  "7–9pm CT = 2× engagement — schedule your reel for 7:30pm.",
  "YouTube Shorts drove 41% of plays — republish the chorus cut.",
  "Mobile users bounced on long pages — put the ticket link in the top 400px.",
];

const index = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Redirect logged-in users to dashboard
  if (user.value) {
    navigateTo('/dashboard')
    return
  }
  
  timer = setInterval(() => {
    index.value = (index.value + 1) % insights.length;
  }, 5000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const currentInsight = computed(() => insights[index.value]);

// Placeholder image: served from /public, so the runtime path is "/screenshotappnovideo.png"
const resolvedImageSrc = "/screenshotappnovideo.png";

const isTH = ref(false);
const USD_PRICE = 7;
const FX_THB_PER_USD = 36; // simple, stable approx for marketing display
const approxTHB = computed(
  () => Math.round((USD_PRICE * FX_THB_PER_USD) / 10) * 10
); // round to nearest ฿10

/**
 * Props let you pass in the screenshot images for the phone mockups.
 * Use high-res PNG/JPG. The image will be contained within a 19.5:9 screen.
 */
/**
 * Pass your screenshot images via props (optional).
 * Defaults are safe placeholders—replace with your own assets.
 */
onMounted(() => {
  const locale = (
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    ""
  ).toLowerCase();
  if (locale.startsWith("th")) {
    isTH.value = true;
    document.documentElement.classList.add("th-font");
  }
});

const parallaxBg = ref<HTMLElement | null>(null);
const faqItems = ref([
  {
    question: "❓ What is a “dynamic QR code”?",
    answer:
      "A dynamic QR code points to a short redirect URL on our server. You can update its destination at any time without reprinting the QR. All scans are tracked, and you can edit or delete it from your dashboard.",
  },
  {
    question: "🔄 Can I create and delete QR codes as I like?",
    answer:
      "Yes. You can generate unlimited dynamic QR codes. At any point, delete any existing QR and create a fresh one. Old scans remain in analytics, but new scans use the new QR link.",
  },
  {
    question: "📈 How many scans can a dynamic QR code handle?",
    answer:
      "Unlimited. Every scan (regardless of volume) gets logged. You’ll see real-time counts of total scans, location data, and device types on your analytics page.",
  },
  {
    question: "📊 What analytics are provided?",
    answer:
      "You get a full post-scan analytics dashboard: page views, QR scans, link clicks, song plays, video plays, top sources, devices, and trends by day/week/month/year. If you connect YouTube (beta), we also surface channel-level performance. On top of the raw numbers, Muse is our intelligent insight generator — it turns your data into clear next steps (what to feature, what to move higher on the page, and when to post).",
  },
  {
    question: "🔒 Is my data private?",
    answer:
      "Absolutely. Only you (and team members you invite) can view your QR code analytics. We do not share your scan data with third parties, and all connections are encrypted.",
  },
  {
    question: "💳 How do I cancel my subscription?",
    answer:
      "You can cancel at any time by visiting your Account page > Subscription > Cancel. Once canceled, you retain dashboard access until the end of your billing cycle. No additional charges apply.",
  },
  {
    question: "🔧 How do I update the destination URL of a QR code?",
    answer:
      "Go to Dashboard > My QR Codes, click “Edit” beside the QR you want to change, enter the new destination URL, and save. The code’s design stays the same—only the redirect target updates.",
  },
]);

const handleScroll = () => {
  const scrollPosition = window.scrollY;
  if (parallaxBg.value) {
    parallaxBg.value.style.transform = `translateY(${scrollPosition * 0.4}px)`;
  }
};

const isPlaying = ref(false);
const videoUrl =
  "https://www.youtube.com/embed/cUR4LFl_UME?si=n91skAv82Us3YZkY";
const thumbnail = "https://img.youtube.com/vi/cUR4LFl_UME/maxresdefault.jpg";

// mockups/assets (unchanged)
import videoMobilePage from "@/assets/mainbainwithvideo.webp";
import streamLinksPage from "@/assets/demoband.png";
import albumDeskPage from "@/assets/mainbainwithvideo.webp";
import socialDeskPage from "@/assets/mainbainwithvideo.webp";
import bandDeskPage from "@/assets/dannydemo.png";
import evnetsDesk from "@/assets/mainbainwithvideo.webp";
import videoDesk from "@/assets/mainbandtwo.webp";

import "swiper/css";
import "swiper/css/thumbs";
import "swiper/css/effect-cards";

const slides = [
  { image: videoDesk, thumbnail: streamLinksPage },
  { image: evnetsDesk, thumbnail: streamLinksPage },
  { image: streamLinksPage, thumbnail: streamLinksPage },
];

const streamingIcons = [
  { name: "Spotify", icon: "mdi:spotify" },
  { name: "Apple Music", icon: "mdi:apple" },
  { name: "YouTube Music", icon: "mdi:youtube" },
  { name: "SoundCloud", icon: "mdi:soundcloud" },
];

const thumbsSwiper = ref<SwiperInstance | null>(null);
const setThumbsSwiper = (swiper: SwiperInstance) => {
  thumbsSwiper.value = swiper;
};

import musicSvg from "@/assets/music.svg";
import microphoneSvg from "@/assets/microphone.svg";
import recordSvg from "@/assets/record.svg";
import streamingSvg from "@/assets/streaming.svg";
import facebookSvg from "@/assets/facebook-icon-white.svg";
import websiteSvg from "@/assets/website.svg";
import videoSvg from "@/assets/video.svg";

import bandScreen from "@/assets/newbandhome.jpg";
import albumScreen from "@/assets/albumnewpage.jpg";
import streamScreen from "@/assets/laststreampage.jpg";
import socialScreen from "@/assets/socialnewpage.jpg";
import externalScreen from "@/assets/newbandhome.jpg";
import videoScreen from "@/assets/vidgrid.jpg";
import aisix from "@/assets/aisix.webp";

import {
  Dialog,
  DialogPanel,
  RadioGroup,
  RadioGroupOption,
} from "@headlessui/vue";
import {
  Bars3Icon,
  XMarkIcon as XMarkIconOutline,
} from "@heroicons/vue/24/outline";
import { CheckIcon, XMarkIcon as XMarkIconMini } from "@heroicons/vue/20/solid";
import {
  ChevronRightIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
} from "@heroicons/vue/20/solid";

import { loadFull } from "tsparticles";
import { tsParticles } from "@tsparticles/engine";

const { mode } = useRuntimeConfig().public.particles;
const imageToRender = ref(bandScreen);

const config = useRuntimeConfig();

const { data: featuredRes, error: featuredError } = await useAsyncData<any>(
  "featured-articles",
  () =>
    $fetch(`${config.public.strapiUrl}/api/seo-pages`, {
      params: {
        populate: "*",
        sort: ["publishedAt:desc"],
        "filters[featured][$eq]": true,
      },
    })
);

if (featuredError.value) {
  console.error("❌ Failed to load featured articles:", featuredError.value);
}

// Structured data (unchanged)
const socialLinks: string[] = [].filter(Boolean);
const orgId = "https://musicbizqr.com/#organization";
const appId = "https://musicbizqr.com/#software";
const siteId = "https://musicbizqr.com/#website";

const webSiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": siteId,
  url: "https://musicbizqr.com",
  name: "MusicBizQR",
  description:
    "Create dynamic QR codes, artist splash pages, and embed music and video with advanced analytics.",
  publisher: { "@id": orgId },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://musicbizqr.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": orgId,
  name: "MusicBizQR",
  url: "https://musicbizqr.com",
  logo: "https://musicbizqr.com/musicbizlogo.png",
  ...(socialLinks.length ? { sameAs: socialLinks } : {}),
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": appId,
  name: "MusicBizQR",
  url: "https://musicbizqr.com",
  applicationCategory: "MarketingApplication",
  applicationSubCategory: "MusicMarketing",
  operatingSystem: "Web",
  image: "https://musicbizqr.com/og-image.jpg",
  description:
    "Dynamic QR code & smart link platform for musicians. Create trackable QR campaigns, embed streaming & video, sell merch & tickets, and view scan analytics.",
  publisher: { "@id": orgId },
  offers: {
    "@type": "Offer",
    url: "https://musicbizqr.com/signup",
    price: "7.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    category: "subscription",
    eligibleDuration: "P30D",
  },
  isAccessibleForFree: false,
};

const cleanFaqText = (q: string) => q.replace(/^[^A-Za-z0-9]+/, "").trim();
const faqLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.value.map((f) => ({
    "@type": "Question",
    name: cleanFaqText(f.question),
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
}));

useHead({
  title: "MusicBizQR | Smart QR Codes & Link-in-Bio Tools for Artists",
  meta: [
    {
      name: "description",
      content:
        "Create dynamic QR codes, artist splash pages, and embed music and video with advanced analytics. Start your 30-day free trial today.",
    },
    {
      name: "keywords",
      content:
        "QR code for musicians, artist smart link, dynamic QR code, music QR, MusicBizQR, band splash page, music link tree, streaming links, music marketing tool",
    },
    { name: "robots", content: "index, follow" },
    {
      property: "og:title",
      content: "MusicBizQR | QR Codes + Smart Links for Artists",
    },
    {
      property: "og:description",
      content:
        "Build a powerful music profile with embedded songs, videos, and trackable QR codes. Perfect for touring artists and music promoters.",
    },
    {
      property: "og:image",
      content: "https://musicbizqr.com/api/og/site.png",
    },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: "https://musicbizqr.com" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "MusicBizQR | QR Codes + Smart Links for Artists",
    },
    {
      name: "twitter:description",
      content:
        "All-in-one music promo QR code tool for bands and musicians. Embed content and track engagement.",
    },
    { name: "twitter:image", content: "https://musicbizqr.com/api/og/site.png" },
  ],
  link: [
    { rel: "canonical", href: "https://musicbizqr.com" },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    // Thai font (safe to load; only applied when .th-font is present)
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(webSiteLd),
      key: "ld-website",
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(faqLd.value),
      key: "ld-faq",
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(orgLd),
      key: "ld-org",
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(appLd),
      key: "ld-app",
    },
  ],
  __dangerouslyDisableSanitizersByTagID: {
    "ld-website": ["innerHTML"],
    "ld-org": ["innerHTML"],
    "ld-app": ["innerHTML"],
    "ld-faq": ["innerHTML"],
  },
});

const show = ref(false);
const splashPages = ref([
  "Artist Page",
  "Music Player",
  "Streaming Links",
  "Social Media Links",
  "Website Url",
  "Video Grid",
]);
const splashImages = ref([
  musicSvg,
  recordSvg,
  streamingSvg,
  facebookSvg,
  websiteSvg,
  videoSvg,
]);
const selectedPage = ref(0);

const pricing = {
  frequencies: [
    { value: "monthly", label: "Monthly" },
    { value: "annually", label: "Annually" },
  ],
  tiers: [
    {
      name: "Starter",
      id: "tier-starter",
      href: "#",
      featured: false,
      description: "write a descripton .",
      price: { monthly: "$15", annually: "$100" },
      mainFeatures: ["feature one", "feature one", "feature one"],
    },
    {
      name: "Pro",
      id: "tier-starter",
      href: "#",
      featured: false,
      description: "write a descripton .",
      price: { monthly: "$30", annually: "$250" },
      mainFeatures: ["feature one", "feature one", "feature one"],
    },
  ],
  sections: [
    {
      name: "Catered for business",
      features: [
        {
          name: "Tax Savings",
          tiers: { Starter: true, Scale: true, Growth: true },
        },
        {
          name: "Easy to use accounting",
          tiers: { Starter: true, Scale: true, Growth: true },
        },
        {
          name: "Multi-accounts",
          tiers: {
            Starter: "3 accounts",
            Scale: "Unlimited accounts",
            Growth: "7 accounts",
          },
        },
        {
          name: "Invoicing",
          tiers: {
            Starter: "3 invoices",
            Scale: "Unlimited invoices",
            Growth: "10 invoices",
          },
        },
        {
          name: "Exclusive offers",
          tiers: { Starter: false, Scale: true, Growth: true },
        },
        {
          name: "6 months free advisor",
          tiers: { Starter: false, Scale: true, Growth: true },
        },
        {
          name: "Mobile and web access",
          tiers: { Starter: false, Scale: true, Growth: false },
        },
      ],
    },
    {
      name: "Other perks",
      features: [
        {
          name: "24/7 customer support",
          tiers: { Starter: true, Scale: true, Growth: true },
        },
        {
          name: "Instant notifications",
          tiers: { Starter: true, Scale: true, Growth: true },
        },
        {
          name: "Budgeting tools",
          tiers: { Starter: true, Scale: true, Growth: true },
        },
        {
          name: "Digital receipts",
          tiers: { Starter: true, Scale: true, Growth: true },
        },
        {
          name: "Pots to separate money",
          tiers: { Starter: false, Scale: true, Growth: true },
        },
        {
          name: "Free bank transfers",
          tiers: { Starter: false, Scale: true, Growth: false },
        },
        {
          name: "Business debit card",
          tiers: { Starter: false, Scale: true, Growth: false },
        },
      ],
    },
  ],
};

const frequency = ref(pricing.frequencies[0]);

const options: any = {
  fullScreen: { enable: false },
  style: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: -1,
    pointerEvents: "none",
  },
  particles: {
    color: { value: "#fff" },
    links: { color: "#fff", enable: true },
    move: { enable: true },
    number: { value: 50 },
  },
};

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}
function changeColors() {
  const paths = document.querySelectorAll(".animated-path");
  paths.forEach((path) => {
    (path as HTMLElement).style.fill = getRandomColor();
  });
}
function animateColors() {
  setInterval(changeColors, 2000);
}

onMounted(() => {
  animateColors();
  window.addEventListener("scroll", handleScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

const primaryFeatures = [
  {
    name: "Push to deploy.",
    description:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit aute id magna.",
    icon: CloudArrowUpIcon,
  },
  {
    name: "SSL certificates.",
    description:
      "Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.",
    icon: LockClosedIcon,
  },
  {
    name: "Database backups.",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus.",
    icon: ServerIcon,
  },
];

const secondaryFeatures = [
  {
    name: "Push to deploy",
    description:
      "Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu. Phasellus praesent ligula sit faucibus.",
    href: "#",
    icon: CloudArrowUpIcon,
  },
  {
    name: "SSL certificates",
    description:
      "Pellentesque enim a commodo malesuada turpis eleifend risus. Facilisis donec placerat sapien consequat tempor fermentum nibh.",
    href: "#",
    icon: LockClosedIcon,
  },
  {
    name: "Simple queues",
    description:
      "Pellentesque sit elit congue ante nec amet. Dolor aenean curabitur viverra suspendisse iaculis eget. Nec mollis placerat ultricies euismod ut condimentum.",
    href: "#",
    icon: ServerIcon,
  },
];

const featuredTestimonial = {
  body: "Integer id nunc sit semper purus. Bibendum at lacus ut arcu blandit montes vitae auctor libero. Hac condimentum dignissim nibh vulputate ut nunc. Amet nibh orci mi venenatis blandit vel et proin. Non hendrerit in vel ac diam.",
  author: {
    name: "Brenna Goyette",
    handle: "brennagoyette",
    imageUrl:
      "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=1024&h=1024&q=80",
    logoUrl: "https://tailwindui.com/img/logos/savvycal-logo-gray-900.svg",
  },
};

const testimonials = [
  [
    [
      {
        body: "Laborum quis quam. Dolorum et ut quod quia. Voluptas numquam delectus nihil. Aut enim doloremque et ipsam.",
        author: {
          name: "Leslie Alexander",
          handle: "lesliealexander",
          imageUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        },
      },
    ],
  ],
  [
    [
      {
        body: "Aut reprehenderit voluptatem eum asperiores beatae id. Iure molestiae ipsam ut officia rem nulla blanditiis.",
        author: {
          name: "Lindsay Walton",
          handle: "lindsaywalton",
          imageUrl:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        },
      },
    ],
  ],
];
</script>

<!-- Global font toggle for Thai visitors -->
<style>
html.th-font {
  font-family:
    "Noto Sans Thai",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    "Noto Sans",
    "Liberation Sans",
    sans-serif;
}
</style>

<style scoped>
#tsparticles {
  z-index: -1;
}

@keyframes kenburns {
  0% {
    background-size: 108%;
    background-position: 50% 50%;
  }
  100% {
    background-size: 122%;
    background-position: 52% 46%;
  }
}

.kenburns-bg {
  background-size: 108%;
  background-position: 50% 50%;
  animation: kenburns 28s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .kenburns-bg {
    animation: none;
    background-size: cover;
    background-position: center;
  }
}
.relative {
  position: relative;
  z-index: 2;
}

.pricing-card {
  @apply bg-black border py-24 rounded-lg p-8 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50;
}
.premium {
  @apply bg-gradient-to-br from-indigo-700 to-purple-700 border-purple-500 shadow-purple-500/50;
}
.pricing-features {
  @apply mt-6 space-y-2 text-gray-300;
}
.pricing-button {
  @apply mt-6 w-full py-3 px-6 text-lg font-semibold rounded-lg bg-indigo-600 hover:bg-purple-600 transition-all duration-300;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 5s ease infinite;
}

.cta-button {
  @apply py-3 px-6 w-full md:w-[25%] text-center font-semibold rounded-lg shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-in-out hover:from-pink-600 hover:to-purple-600 hover:scale-105 hover:shadow-purple-500/50;
}
.cta-button-full {
  @apply py-3 px-6 w-full md:w-[100%] text-center font-semibold rounded-lg shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-in-out hover:from-pink-600 hover:to-purple-600 hover:scale-105 hover:shadow-purple-500/50;
}
.cta-button-no {
  @apply py-3 px-6 text-center font-semibold rounded-lg shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-in-out hover:from-pink-600 hover:to-purple-600 hover:scale-105 hover:shadow-purple-500/50;
}

.custom-gradient {
  background: linear-gradient(to right, #78ffd6, #a8ff78);
}

.element_scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.element_scroll::-webkit-scrollbar {
  display: none;
}
.animated-path {
  transition: fill 1s ease;
}

.bar-chart {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.image_gradient {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
}

.bar {
  width: 40px;
  background-color: #4caf50;
  height: 20%;
  animation: grow-bar 2s ease-in-out infinite;
}
@keyframes grow-bar {
  0%,
  100% {
    height: 20%;
  }
  50% {
    height: var(--bar-height);
  }
}
</style>
