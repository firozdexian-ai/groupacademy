

# GroUp Academy — Build Progress

## Schools

| School | Programs | Courses | Modules | Status |
|---|---|---|---|---|
| Social Media | 4 | 56 | 252 | ✅ |
| Personal Branding | 4 | 56 | 249 | ✅ |
| Content Creation | 4 | 56 | 248 | ✅ |

**Influencing Academy: 100% COMPLETE ✅**

## Certificates

- `certificates` table with unique verify codes, RLS policies
- `CertificatePDFTemplate` - branded landscape PDF with verification URL
- `/verify/:code` - public verification page
- Auto-issue on quiz pass from ReportCard page
- Copy shareable verification link
- **Email notification on certificate issuance** ✅

## Public SEO & OpenGraph

- `/blog` - Public blog index with JSON-LD Blog schema, category filters, search
- `/blog/:slug` - Public blog post with Article JSON-LD, dynamic OG meta tags
- `/courses/:slug` - Course JSON-LD structured data + dynamic OG meta tags
- `/courses` - Public courses listing with JSON-LD ItemList schema
- `/services/:slug` - Service landing pages with OG meta, Twitter cards, JSON-LD Service schema ✅
