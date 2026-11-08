<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 md:px-8">
    <!-- Page header -->
    <header class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">SEO Article Upgrade Dashboard</h1>
        <p class="mt-1 text-sm text-slate-400">
          See all SEO articles by category, prioritize upgrades, and track freshness vs your 90-day target.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Category filter -->
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-xs uppercase tracking-wide text-slate-400">
            Category
          </label>
          <select
            id="category-filter"
            v-model="selectedCategorySlug"
            class="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All categories</option>
            <option
              v-for="cat in categoryOptions"
              :key="cat.slug"
              :value="cat.slug"
            >
              {{ cat.name }} ({{ cat.count }})
            </option>
          </select>
        </div>

        <!-- Only show items older than 90 days -->
        <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            v-model="onlyNeedsUpgrade"
            class="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
          <span>Show only articles older than 90 days</span>
        </label>
      </div>
    </header>

    <!-- Top-level stats -->
    <section class="mb-8 grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Total articles</p>
        <p class="mt-1 text-2xl font-semibold">{{ totalArticles }}</p>
      </div>

      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Updated in last 90 days</p>
        <p class="mt-1 text-2xl font-semibold text-emerald-400">
          {{ totalRecentlyUpdated }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Needs upgrade (&gt; 90 days)</p>
        <p class="mt-1 text-2xl font-semibold text-amber-400">
          {{ totalNeedsUpgrade }}
        </p>
      </div>
    </section>

    <!-- Loading / error states -->
    <div v-if="loading" class="text-sm text-slate-400">
      Loading articles…
    </div>
    <div v-else-if="error" class="text-sm text-red-400">
      Failed to load articles. Check the console for details.
    </div>

    <!-- Category groups -->
    <section v-else class="space-y-8">
      <div
        v-for="group in filteredGroups"
        :key="group.slug"
        class="rounded-xl border border-slate-800 bg-slate-900/60"
      >
        <!-- Category header -->
        <div class="flex flex-col gap-2 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              {{ group.name }}
            </h2>
            <p class="text-xs text-slate-400">
              {{ group.articles.length }} articles •
              <span class="text-emerald-400">
                {{ group.recentCount }} updated &lt;= 90 days
              </span>
              •
              <span class="text-amber-400">
                {{ group.needsUpgradeCount }} need upgrade
              </span>
            </p>
          </div>

          <!-- Quick filter hint -->
          <p class="text-xs text-slate-500">
            Sorted by oldest updated first. Work from the top down.
          </p>
        </div>

        <!-- Article table -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th class="px-4 py-2">Title</th>
                <th class="px-4 py-2">URL</th>
                <th class="px-4 py-2 whitespace-nowrap">Updated</th>
                <th class="px-4 py-2 whitespace-nowrap">Age</th>
                <th class="px-4 py-2 whitespace-nowrap">90-day status</th>
                <th class="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="article in group.filteredArticles"
                :key="article.id"
                class="border-t border-slate-800 hover:bg-slate-900/80"
              >
                <!-- Title -->
                <td class="px-4 py-2 align-top">
                  <div class="max-w-xs">
                    <div class="font-medium text-slate-100">
                      {{ article.title }}
                    </div>
                    <div class="mt-0.5 text-xs text-slate-500">
                      Slug: {{ article.slug }}
                    </div>
                  </div>
                </td>

                <!-- URL -->
                <td class="px-4 py-2 align-top">
                  <a
                    :href="article.url"
                    target="_blank"
                    class="break-all text-xs text-emerald-400 hover:underline"
                  >
                    {{ article.url }}
                  </a>
                </td>

                <!-- Updated -->
                <td class="px-4 py-2 align-top whitespace-nowrap">
                  <span>{{ article.updatedFormatted || 'N/A' }}</span>
                </td>

                <!-- Age -->
                <td class="px-4 py-2 align-top whitespace-nowrap">
                  <span class="text-xs text-slate-300">
                    {{ article.daysSinceUpdate !== null ? article.daysSinceUpdate + ' days ago' : 'N/A' }}
                  </span>
                </td>

                <!-- 90-day flag -->
                <td class="px-4 py-2 align-top whitespace-nowrap">
                  <span
                    v-if="article.updatedRecently"
                    class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40"
                  >
                    ✅ Updated &lt;= 90 days
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/40"
                  >
                    ⚠ Needs upgrade
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-4 py-2 align-top">
                  <div class="flex justify-end gap-2">
                    <a
                      :href="article.url"
                      target="_blank"
                      class="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
                    >
                      View live
                    </a>
                    <a
                      :href="article.strapiEditUrl"
                      target="_blank"
                      class="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-600/20"
                    >
                      Edit in Strapi
                    </a>
                  </div>
                </td>
              </tr>

              <tr v-if="!group.filteredArticles.length">
                <td colspan="6" class="px-4 py-4 text-center text-xs text-slate-500">
                  No articles in this category match the current filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!filteredGroups.length" class="text-sm text-slate-400">
        No articles match the current filters.
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'

const BASE_URL = 'https://musicbizqr.com'
// Adjust this if your Strapi admin URL differs in prod
const STRAPI_ADMIN_BASE = 'https://qrserver-production.up.railway.app/admin'

interface RawCategoryRelation {
  data?: {
    id: number
    attributes: {
      name?: string
      slug?: string
    }
  } | null
}

interface RawArticle {
  id: number
  attributes: {
    title: string
    slug: string
    category?: RawCategoryRelation | string | null
    updatedAt?: string | null
  }
}

interface NormalizedArticle {
  id: number
  title: string
  slug: string
  categoryName: string
  categorySlug: string
  url: string
  updatedAt: string | null
  updatedFormatted: string | null
  daysSinceUpdate: number | null
  updatedRecently: boolean
  strapiEditUrl: string
}

interface CategoryGroup {
  slug: string
  name: string
  articles: NormalizedArticle[]
  filteredArticles: NormalizedArticle[]
  recentCount: number
  needsUpgradeCount: number
}

// State
const rawArticles = ref<RawArticle[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

// Filters
const selectedCategorySlug = ref<string>('')
const onlyNeedsUpgrade = ref<boolean>(false)

// Helpers
const formatDate = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const diffInDays = (isoString: string | null | undefined): number | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return null

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

const isUpdatedWithinDays = (isoString: string | null | undefined, days = 90): boolean => {
  const d = diffInDays(isoString)
  if (d === null) return false
  return d <= days
}

// Fetch data
onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const res = await fetch(
      'https://qrserver-production.up.railway.app/api/seo-pages?populate=category&pagination[pageSize]=200'
    )

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()
    rawArticles.value = (json.data || []) as RawArticle[]
  } catch (err: any) {
    console.error('❌ Failed to fetch articles:', err)
    error.value = 'Failed to fetch articles'
  } finally {
    loading.value = false
  }
})

// Normalize articles with URL + freshness info
const normalizedArticles = computed<NormalizedArticle[]>(() => {
  return rawArticles.value.map((article) => {
    const { title, slug, category, updatedAt } = article.attributes

    // Derive category slug/name
    let categorySlug = ''
    let categoryName = ''

    if (typeof category === 'string') {
      categorySlug = category
      categoryName = category
    } else if (category && category.data && category.data.attributes) {
      categorySlug = category.data.attributes.slug || ''
      categoryName = category.data.attributes.name || categorySlug || 'Uncategorized'
    } else {
      categoryName = 'Uncategorized'
      categorySlug = 'uncategorized'
    }

    // Build URL path
    let path = ''
    if (categorySlug) {
      if (slug === categorySlug) {
        // Pillar page
        path = `/article/${categorySlug}`
      } else {
        path = `/article/${categorySlug}/${slug}`
      }
    } else {
      path = `/article/${slug}`
    }

    const url = `${BASE_URL}${path}`

    const days = diffInDays(updatedAt)
    const updatedRecently = isUpdatedWithinDays(updatedAt, 90)

    // Strapi edit URL (collectionType for seo-pages)
    const strapiEditUrl = `${STRAPI_ADMIN_BASE}/content-manager/collectionType/api::seo-page.seo-page/${article.id}`

    return {
      id: article.id,
      title,
      slug,
      categoryName,
      categorySlug,
      url,
      updatedAt: updatedAt || null,
      updatedFormatted: formatDate(updatedAt),
      daysSinceUpdate: days,
      updatedRecently,
      strapiEditUrl
    }
  })
})

// Group by category, sort oldest -> newest inside each
const categoryGroups = computed<CategoryGroup[]>(() => {
  const map = new Map<string, NormalizedArticle[]>()

  for (const article of normalizedArticles.value) {
    const key = article.categorySlug || 'uncategorized'
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(article)
  }

  const groups: CategoryGroup[] = []

  for (const [slug, list] of map.entries()) {
    const sorted = [...list].sort((a, b) => {
      const aDays = a.daysSinceUpdate ?? 0
      const bDays = b.daysSinceUpdate ?? 0
      return bDays - aDays // older first (bigger daysSinceUpdate at top)
    })

    const name = sorted[0]?.categoryName || slug
    const recentCount = sorted.filter((a) => a.updatedRecently).length
    const needsUpgradeCount = sorted.length - recentCount

    groups.push({
      slug,
      name,
      articles: sorted,
      filteredArticles: sorted, // will be overwritten in filteredGroups
      recentCount,
      needsUpgradeCount
    })
  }

  // Sort categories alphabetically by name
  return groups.sort((a, b) => a.name.localeCompare(b.name))
})

// Apply filters (category + needs-upgrade toggle)
const filteredGroups = computed<CategoryGroup[]>(() => {
  return categoryGroups.value
    .map((group) => {
      let filtered = group.articles

      if (selectedCategorySlug.value && group.slug !== selectedCategorySlug.value) {
        filtered = []
      } else if (onlyNeedsUpgrade.value) {
        filtered = filtered.filter((a) => !a.updatedRecently)
      }

      return {
        ...group,
        filteredArticles: filtered
      }
    })
    .filter((group) => group.filteredArticles.length > 0)
})

// Category filter options
const categoryOptions = computed(() =>
  categoryGroups.value.map((group) => ({
    slug: group.slug,
    name: group.name,
    count: group.articles.length
  }))
)

// Global stats
const totalArticles = computed(() => normalizedArticles.value.length)

const totalRecentlyUpdated = computed(
  () => normalizedArticles.value.filter((a) => a.updatedRecently).length
)

const totalNeedsUpgrade = computed(
  () => normalizedArticles.value.filter((a) => !a.updatedRecently).length
)
</script>
