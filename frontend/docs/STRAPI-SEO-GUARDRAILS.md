# Strapi SEO Guardrails

This document outlines recommended changes to the Strapi CMS to prevent invalid SEO data at the source.

## Current Issues

The following issues can occur when Strapi data is not properly validated:

1. **Null/missing category** → Produces `/article/null/<slug>` URLs
2. **Invalid slugs** → Trailing punctuation, double hyphens, uppercase, whitespace
3. **Duplicate slugs** → Same slug in different categories or duplicate entries

## Recommended Strapi Changes

### 1. Make `category` Required

In the Strapi admin, edit the `seo-page` content type:

1. Go to **Content-Type Builder** → **seo-page**
2. Click on the `category` field
3. Enable **Required field** checkbox
4. Save and restart Strapi

Alternatively, in the schema file (`api/seo-page/content-types/seo-page/schema.json`):

```json
{
  "attributes": {
    "category": {
      "type": "string",
      "required": true,
      "minLength": 1
    }
  }
}
```

### 2. Add Slug Validation

Add a lifecycle hook to validate and normalize slugs before saving.

Create or edit `src/api/seo-page/content-types/seo-page/lifecycles.js`:

```javascript
module.exports = {
  beforeCreate(event) {
    validateAndNormalize(event);
  },
  beforeUpdate(event) {
    validateAndNormalize(event);
  },
};

function validateAndNormalize(event) {
  const { data } = event.params;

  // Normalize slug
  if (data.slug) {
    data.slug = normalizeSlug(data.slug);
  }

  // Normalize category
  if (data.category) {
    data.category = normalizeSlug(data.category);
  }

  // Validate category is not null/empty
  if (!data.category || data.category === 'null' || data.category === 'undefined') {
    throw new Error('Category is required and cannot be null');
  }

  // Validate slug is not null/empty
  if (!data.slug || data.slug === 'null' || data.slug === 'undefined') {
    throw new Error('Slug is required and cannot be null');
  }
}

function normalizeSlug(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[.,!?:;/"']+$/g, '')
    .replace(/^-+|-+$/g, '');
}
```

### 3. Enforce Unique Slug per Category

Add a unique constraint to prevent duplicate slugs within the same category.

In the lifecycle hook, add:

```javascript
async function validateAndNormalize(event) {
  const { data } = event.params;
  
  // ... existing normalization code ...

  // Check for duplicate slug in same category
  const existing = await strapi.entityService.findMany('api::seo-page.seo-page', {
    filters: {
      slug: data.slug,
      category: data.category,
    },
  });

  // If updating, exclude current entry
  const currentId = event.params.where?.id;
  const duplicates = existing.filter(e => e.id !== currentId);

  if (duplicates.length > 0) {
    throw new Error(`Slug "${data.slug}" already exists in category "${data.category}"`);
  }
}
```

### 4. Add Allowed Categories Enumeration (Optional)

If you want to restrict categories to a predefined list:

```json
{
  "attributes": {
    "category": {
      "type": "enumeration",
      "enum": [
        "smart-links",
        "qr-code-strategy",
        "music-marketing",
        "fan-funnels",
        "touring-events"
      ],
      "required": true
    }
  }
}
```

## Data Cleanup Script

Run this script to identify and fix existing invalid entries:

```javascript
// scripts/fix-seo-slugs.js
// Run with: node scripts/fix-seo-slugs.js

const normalizeSlug = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[.,!?:;/"']+$/g, '')
    .replace(/^-+|-+$/g, '');
};

async function fixSlugs() {
  const pages = await strapi.entityService.findMany('api::seo-page.seo-page', {
    pagination: { limit: -1 },
  });

  for (const page of pages) {
    const updates = {};
    
    if (page.slug !== normalizeSlug(page.slug)) {
      updates.slug = normalizeSlug(page.slug);
    }
    
    if (page.category !== normalizeSlug(page.category)) {
      updates.category = normalizeSlug(page.category);
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Fixing page ${page.id}: ${JSON.stringify(updates)}`);
      await strapi.entityService.update('api::seo-page.seo-page', page.id, {
        data: updates,
      });
    }
  }
}

fixSlugs().then(() => console.log('Done'));
```

## Verification Checklist

After implementing these changes:

- [ ] Try to create a seo-page without a category → Should fail
- [ ] Try to create a seo-page with category "null" → Should fail
- [ ] Try to create a seo-page with slug "test--page." → Should normalize to "test-page"
- [ ] Try to create duplicate slug in same category → Should fail
- [ ] Existing entries with invalid slugs are fixed
