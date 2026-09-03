# LUTA social preview asset

## Active contract

- Public URL: `https://lutaai.com/luta-social-card-v1.jpg`
- Canvas: `1200 × 630` pixels (`1.91:1`)
- Encoding: progressive sRGB JPEG, quality 82, metadata stripped
- Transfer budget: no more than `200 KiB`; current file is `101,178` bytes
- Center-crop safety: the mark, product name, and message remain readable in the centered `630 × 630` crop used by compact link cards
- Open Graph metadata declares the absolute HTTPS URL, MIME type, width, height, and alternative text
- Cache policy: a material visual change must use a new versioned filename (`v2`, `v3`, and so on); do not overwrite the active metadata URL under the one-year immutable asset cache

`public/twitter_meta_img.png` remains only as a correctly branded compatibility fallback for historical direct links. Active Open Graph and Twitter metadata must not point to it.

## Creative provenance

The product owner selected the supplied LUTA product-scene image on 2026-09-03. It shows the reading, daily-practice, and assisted-understanding screens around the centered LUTA mark and the message “从阅读经典开始”. This selection supersedes the earlier abstract card from the same repair branch.

- Selected source dimensions: `1731 × 909` pixels
- Selected source size: `2,142,709` bytes
- Selected source SHA-256: `a525a6a75167d6e84f000712b5725ac44b4473c3cea113a720e625c78be93bf2`
- Production JPEG SHA-256: `f8689db383532207cff04c3da9fae85cd96afbd75cd55e0b13c83a053707f144`
- Compatibility PNG SHA-256: `5ec2dfadf0b484140c37dcf1f784829c3b79605d76d90facf24b011d17e6d0fb`

The source ratio differs from `1200 × 630` by less than `0.03%`, so the production export retains the composition without meaningful content loss. The active asset is a metadata-stripped, progressive sRGB JPEG at quality 82. The historical PNG path uses the same composition with a 256-color palette and no dithering; it is `343,606` bytes and remains below its `400 KiB` compatibility budget.

The selected source is intentionally not committed because it is a 2.1 MB working artifact already represented by the optimized delivery files. Its dimensions and SHA-256 preserve the source identity needed to verify or supersede it.

## Verification

Run:

```bash
npm run test:attribution
npm run build
```

The marketing SEO tests fail if the active JPEG is missing, is not `1200 × 630`, or exceeds the transfer budget. After deployment, verify the public HTML and asset response, then ask Meta's Sharing Debugger to scrape the affected canonical URL again. A merged PR or successful build alone does not prove that Meta has refreshed its cached card.
