# Haverly Consulting website

Static website for [haverlyconsulting.co.uk](https://www.haverlyconsulting.co.uk), hosted on GitHub Pages.

## Editing content

All wording lives in `_build/`:

- `_build/content.py`: contact details, services, testimonials, team bios, the blog post list, and the service page text
- `_build/posts/<slug>.html`: the body of each blog post

After editing, rebuild the pages and commit:

```
python3 _build/build.py
```

(Folders starting with `_` are not published by GitHub Pages.)

## Adding a blog post

1. Save the article body as `_build/posts/your-post-slug.html` (plain `<p>`, `<h2>`, `<ul>` markup).
2. Add an entry at the top of `POSTS` in `_build/content.py` with the slug, title, date, tag and a one-sentence description.
3. Run the build. The post, blog index, homepage and sitemap update automatically.

## Team photos

Put square-ish JPEG headshots at `assets/img/team/nick.jpg`, `richard.jpg`, `pepa.jpg` and `owen.jpg`. Until a photo exists, the person's initials are shown instead.

## Contact form

The form uses [Formspree](https://formspree.io). Set `formspree_id` in `_build/content.py` to your form ID and rebuild.

## Tools

- `pwlb-premium/discount-calculator`: PWLB early repayment premium/discount (`assets/js/pwlb-repayment.js`)
- `pwlb-v-il`: PWLB vs index-linked NPV comparison (`assets/js/pwlb-vs-il.js`), reading daily rates from the `rates.json` gist
