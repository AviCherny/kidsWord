from PIL import Image, ImageDraw, ImageFont
import os

def make_icon(size, path, transparent_bg=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if not transparent_bg:
        margin = int(size * 0.05)
        radius = int(size * 0.22)
        draw.rounded_rectangle([margin, margin, size - margin, size - margin],
                                radius=radius, fill=(100, 200, 255, 255))

    font_size = int(size * 0.62)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/seguiemj.ttf", font_size)
    except:
        font = ImageFont.load_default()

    emoji = "🐘"
    bbox = draw.textbbox((0, 0), emoji, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1]
    draw.text((x, y), emoji, font=font, embedded_color=True)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print(f"Saved {path}")

android_base = "c:/Claude projects/Kids word/big-vs-small/android/app/src/main/res"

# Standard launcher icons (used on older Android + fallback)
standard_sizes = {
    "mipmap-mdpi/ic_launcher.png": 48,
    "mipmap-hdpi/ic_launcher.png": 72,
    "mipmap-xhdpi/ic_launcher.png": 96,
    "mipmap-xxhdpi/ic_launcher.png": 144,
    "mipmap-xxxhdpi/ic_launcher.png": 192,
    "mipmap-mdpi/ic_launcher_round.png": 48,
    "mipmap-hdpi/ic_launcher_round.png": 72,
    "mipmap-xhdpi/ic_launcher_round.png": 96,
    "mipmap-xxhdpi/ic_launcher_round.png": 144,
    "mipmap-xxxhdpi/ic_launcher_round.png": 192,
}

# Adaptive icon foreground (Android 8+ — transparent background, elephant centered)
foreground_sizes = {
    "mipmap-mdpi/ic_launcher_foreground.png": 48,
    "mipmap-hdpi/ic_launcher_foreground.png": 72,
    "mipmap-xhdpi/ic_launcher_foreground.png": 96,
    "mipmap-xxhdpi/ic_launcher_foreground.png": 144,
    "mipmap-xxxhdpi/ic_launcher_foreground.png": 192,
}

for rel_path, size in standard_sizes.items():
    make_icon(size, f"{android_base}/{rel_path}", transparent_bg=False)

for rel_path, size in foreground_sizes.items():
    make_icon(size, f"{android_base}/{rel_path}", transparent_bg=True)

print("All icons generated!")
