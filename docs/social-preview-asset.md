# LUTA social preview asset

## Active contract

- Public URL: `https://lutaai.com/luta-social-card-v1.jpg`
- Canvas: `1200 × 630` pixels (`1.91:1`)
- Encoding: progressive sRGB JPEG, quality 82, metadata stripped
- Transfer budget: no more than `200 KiB`; current file is `88,907` bytes
- Center-crop safety: the mark, product name, and message remain readable in the centered `630 × 630` crop used by compact link cards
- Open Graph metadata declares the absolute HTTPS URL, MIME type, width, height, and alternative text
- Cache policy: a material visual change must use a new versioned filename (`v2`, `v3`, and so on); do not overwrite the active metadata URL under the one-year immutable asset cache

`public/twitter_meta_img.png` remains only as a correctly branded compatibility fallback for historical direct links. Active Open Graph and Twitter metadata must not point to it.

## Creative provenance

The product owner delegated the visual and export decision for this repair on 2026-09-02/03. The selected composition was generated with OpenAI's built-in image generation from this production brief:

> Create a calm, premium social sharing card for 汝塔 LUTA. Use a deep pine-green editorial background with restrained paper texture, the centered LUTA mark, the exact text “汝塔 LUTA” and “从阅读经典开始” in warm antique gold, abstract rice-paper sheets at the edges, and a very subtle open-book silhouette. Keep all essential content inside a centered square-safe area. No phone mockups, screenshots, app-store buttons, people, extra copy, unrelated logos, bright gradients, or Pocket Fans imagery.

- Generated source SHA-256: `88f2ed003fa8d1f3686cbea53e27d84a698512ba545274ed505b175e5579ae47`
- Production JPEG SHA-256: `09aaef525d62a4d28fad5eb4c219ea3b226e91bc67335ccde351c8b3ef2e683b`
- Compatibility PNG SHA-256: `170c3a11543468f535744dc19e822525bc268ad2982612499b845843789f1c18`

The generated source is intentionally not committed because it is a 2.3 MB working artifact. The committed JPEG is the delivery asset; the hashes and brief provide the durable provenance needed to reproduce or supersede it.

## Verification

Run:

```bash
npm run test:attribution
npm run build
```

The marketing SEO tests fail if the active JPEG is missing, is not `1200 × 630`, or exceeds the transfer budget. After deployment, verify the public HTML and asset response, then ask Meta's Sharing Debugger to scrape the affected canonical URL again. A merged PR or successful build alone does not prove that Meta has refreshed its cached card.
