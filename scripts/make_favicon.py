"""UYU favicon PNG üreticisi (tek seferlik yardımcı script)."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]

NAVY = (2, 6, 23, 255)
NAVY_SOFT = (16, 26, 48, 255)
GOLD = (251, 191, 36, 255)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_icon(size: int, text: str = "UYU") -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(canvas * 0.22)
    draw.rounded_rectangle([0, 0, canvas - 1, canvas - 1], radius=radius, fill=NAVY)
    inset = int(canvas * 0.035)
    draw.rounded_rectangle(
        [inset, inset, canvas - 1 - inset, canvas - 1 - inset],
        radius=int(radius * 0.85),
        fill=NAVY_SOFT,
        outline=GOLD,
        width=max(2, int(canvas * 0.045)),
    )

    font_size = int(canvas * 0.36)
    font = load_font(font_size)
    while font_size > 8:
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= canvas * 0.66:
            break
        font_size -= 4
        font = load_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tx = (canvas - (bbox[2] - bbox[0])) / 2 - bbox[0]
    ty = (canvas - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=GOLD)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    icon_512 = rounded_icon(512)
    icon_512.save(os.path.join(OUT_DIR, "favicon-512.png"))
    rounded_icon(180).save(os.path.join(OUT_DIR, "apple-touch-icon.png"))
    rounded_icon(32).save(os.path.join(OUT_DIR, "favicon-32.png"))

    icon_512.save(
        os.path.join(OUT_DIR, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    print("favicon assets written to", OUT_DIR)


if __name__ == "__main__":
    main()