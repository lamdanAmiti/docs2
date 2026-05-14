# Hebrew fonts

Drop your `.ttf` / `.otf` files in this directory. They serve double duty:

1. **In the wrapper UI** (home page, share dialog, document titles) — loaded via
   `app/hebrew-fonts.css` `@font-face` rules pointing to `/fonts/hebrew/*.ttf`.
   The registry of filenames + display names is in `lib/fonts/hebrew-fonts.ts`.

2. **In the Collabora editor** — `docker-compose.yml` mounts this directory into
   the Collabora container at `/usr/share/fonts/truetype/velr-hebrew/`. Collabora's
   fontconfig auto-discovers them at startup, and they appear in the font picker
   alongside the bundled ones.

The repo `.gitignore` excludes `*.ttf` and `*.otf` so binary blobs stay out of git.
On deploy, the `public/fonts/hebrew/` dir on the host needs to contain the actual
font files. Two ways:

- **Local deploy / SCP**: copy your fonts into the dir before building.
- **Coolify**: use a Persistent Storage volume mount, or commit the fonts to a
  separate private branch the build pulls from.

To verify Collabora picked them up:
```
docker exec docsapi-collabora fc-list | head -20
```
