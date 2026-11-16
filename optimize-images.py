# Shrinks every picture in projects.json to 2400px on its long side at most, saves it as WebP (quality 80),
# moves the original to originals/ (outside the site, in .gitignore), and updates projects.json and the pages.
# A picture that's already WebP and small enough stays as it is.
# "lazy": false in projects.json = the picture is at the top of its page (or shows on hover), so it loads right away.
# Run: python3 optimize-images.py
import json, re, shutil, urllib.parse
from pathlib import Path
from PIL import Image

MAX_SIDE = 2400
QUALITY = 80
root = Path(__file__).parent
data = json.loads((root / "projects.json").read_text())
rows = []

def set_attr(tag, name, value):
    if value is None:
        return re.sub(rf'\s{name}="[^"]*"', "", tag)
    if re.search(rf'\s{name}="', tag):
        return re.sub(rf'(\s{name}=")[^"]*"', rf'\g<1>{value}"', tag)
    return tag.replace(">", f' {name}="{value}">', 1) if not tag.endswith("/>") else tag[:-2] + f' {name}="{value}"/>'

for project in data.values():
    page = root / project["page"]
    html = page.read_text()
    for image in project["images"]:
        old = root / image["src"]
        new = old.with_suffix(".webp")
        before = old.stat().st_size
        with Image.open(old) as picture:
            if old.suffix.lower() == ".webp" and max(picture.size) <= MAX_SIDE:
                new = old
            else:
                picture.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)  # never enlarges
                picture.save(new, "WEBP", quality=QUALITY, method=6)
            with Image.open(new) as result:
                width, height = result.size

        # The page: this picture's <img> gets the new file, its size and loading="lazy" (unless it's at the top)
        def update(match):
            tag = set_attr(match.group(0), "src", urllib.parse.quote(str(new.relative_to(root))))
            tag = set_attr(tag, "width", width)
            tag = set_attr(tag, "height", height)
            return set_attr(tag, "loading", "lazy" if image.get("lazy", True) else None)
        html = re.sub(rf'<img\b[^>]*src="{re.escape(urllib.parse.quote(image["src"]))}"[^>]*>', update, html)

        rows.append((image["src"], before, new.stat().st_size, new != old))
        image.update(src=str(new.relative_to(root)), width=width, height=height)
    page.write_text(html)

# The originals go to originals/, keeping their folders. One another page still uses is copied instead, so it keeps working
for src, _, _, converted in rows:
    if not converted:
        continue  # left as it was
    old = root / src
    target = root / "originals" / src
    target.parent.mkdir(parents=True, exist_ok=True)
    still_used = any(urllib.parse.quote(src) in p.read_text() for p in root.glob("*.html"))
    (shutil.copy2 if still_used else shutil.move)(old, target)

(root / "projects.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

kb = lambda n: f"{n / 1024:,.0f} KB"
print(f"| Picture | Before | After | Saved |\n|---|---|---|---|")
for src, before, after, _ in rows:
    print(f"| {src} | {kb(before)} | {kb(after)} | {100 - after * 100 // before}% |")
total_before, total_after = sum(r[1] for r in rows), sum(r[2] for r in rows)
print(f"| **Total** | **{kb(total_before)}** | **{kb(total_after)}** | **{100 - total_after * 100 // total_before}%** |")
