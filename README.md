# SIGNAL — skill console website

A functional, interactive single-page build of the SIGNAL mockups. Plain HTML/CSS/JS — no build step.

## Run it

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8080
```

then visit `http://localhost:8080`.


```
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If the remote already exists, use `git remote set-url origin <url>` instead of `add`.

## Site
Open https://signal-ten-kappa.vercel.app/

Everything you type is stored in this browser's `localStorage` only. Nothing is sent anywhere.

## Backgrounds

The moody forest / nature photos in `assets/` are locally downloaded free stock photos (Unsplash) chosen to match the mockups. The dark overlays that keep text readable are applied in CSS, so you can swap any photo by replacing the matching file in `assets/` without touching the code.
