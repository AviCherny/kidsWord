"""
Generate social-skills app icon at all required Android mipmap densities.
Design: two friendly cartoon faces on a warm purple background, with a heart.
"""
from PIL import Image, ImageDraw
import os
import math

SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

RES_DIR = os.path.join(
    os.path.dirname(__file__),
    "android", "app", "src", "main", "res"
)

BG_COLOR = (103, 58, 183)       # deep purple
FACE_COLOR = (255, 224, 178)    # warm peach skin
HAIR_COLOR = (90, 55, 30)       # dark brown hair
EYE_COLOR = (50, 30, 10)        # dark brown eyes
SMILE_COLOR = (180, 80, 60)     # warm red smile
HEART_COLOR = (233, 30, 99)     # pink heart
CHEEK_COLOR = (255, 160, 120, 120)  # blush (with alpha)


def draw_face(draw, cx, cy, r, facing_right=True):
    """Draw a simple cartoon face centered at (cx, cy) with radius r."""
    # head circle
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=FACE_COLOR)

    # hair (semi-circle on top)
    hair_r = r * 1.0
    draw.chord(
        [cx - hair_r, cy - hair_r * 1.1, cx + hair_r, cy + hair_r * 0.2],
        start=200 if facing_right else 340,
        end=340 if facing_right else 560,
        fill=HAIR_COLOR,
    )
    # re-draw head to cover lower hair
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=FACE_COLOR)

    # eyes
    eye_offset_x = r * 0.28
    eye_offset_y = r * 0.15
    eye_r = r * 0.12
    for dx in [-eye_offset_x, eye_offset_x]:
        ex, ey = cx + dx, cy + eye_offset_y
        draw.ellipse([ex - eye_r, ey - eye_r, ex + eye_r, ey + eye_r], fill=EYE_COLOR)

    # smile arc
    sm_margin = r * 0.3
    sm_top = cy + r * 0.3
    sm_bottom = cy + r * 0.65
    draw.arc(
        [cx - sm_margin, sm_top, cx + sm_margin, sm_bottom],
        start=0, end=180,
        fill=SMILE_COLOR,
        width=max(1, int(r * 0.08)),
    )

    # blush
    blush_r = r * 0.18
    blush_y = cy + r * 0.3
    for dx in [-r * 0.42, r * 0.42]:
        bx = cx + dx
        draw.ellipse(
            [bx - blush_r, blush_y - blush_r * 0.6, bx + blush_r, blush_y + blush_r * 0.6],
            fill=CHEEK_COLOR,
        )


def draw_heart(draw, cx, cy, size):
    """Draw a simple heart centered roughly at (cx, cy) of given size."""
    # Heart built from two circles + a triangle
    r = size / 2
    # left circle
    draw.ellipse([cx - r, cy - r, cx, cy], fill=HEART_COLOR)
    # right circle
    draw.ellipse([cx, cy - r, cx + r, cy], fill=HEART_COLOR)
    # triangle bottom
    draw.polygon(
        [(cx - r, cy - r * 0.3), (cx + r, cy - r * 0.3), (cx, cy + r * 1.1)],
        fill=HEART_COLOR,
    )


def make_icon(size):
    img = Image.new("RGBA", (size, size), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img, "RGBA")

    # Rounded background
    padding = size * 0.05
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=size * 0.22,
        fill=BG_COLOR + (255,),
    )

    face_r = size * 0.22
    gap = size * 0.04

    # Left face
    lx = size * 0.5 - face_r - gap
    ly = size * 0.52
    draw_face(draw, lx, ly, face_r, facing_right=True)

    # Right face
    rx = size * 0.5 + face_r + gap
    ry = size * 0.52
    draw_face(draw, rx, ry, face_r, facing_right=False)

    # Heart between them (top center)
    heart_size = size * 0.18
    draw_heart(draw, size * 0.5, size * 0.22, heart_size)

    return img


def main():
    for folder, size in SIZES.items():
        out_dir = os.path.join(RES_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)

        img = make_icon(size)

        for fname in ("ic_launcher.png", "ic_launcher_round.png"):
            path = os.path.join(out_dir, fname)
            # Round icon: crop to circle
            if "round" in fname:
                mask = Image.new("L", (size, size), 0)
                ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)
                result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
                result.paste(img, mask=mask)
                result.save(path)
            else:
                img.save(path)
            print(f"  Wrote {path}")

        # foreground (ic_launcher_foreground.png) — faces only, transparent bg
        fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_fg = ImageDraw.Draw(fg, "RGBA")
        face_r = size * 0.22
        gap = size * 0.04
        draw_face(draw_fg, size * 0.5 - face_r - gap, size * 0.52, face_r, True)
        draw_face(draw_fg, size * 0.5 + face_r + gap, size * 0.52, face_r, False)
        heart_size = size * 0.18
        draw_heart(draw_fg, size * 0.5, size * 0.22, heart_size)
        fg.save(os.path.join(out_dir, "ic_launcher_foreground.png"))
        print(f"  Wrote {os.path.join(out_dir, 'ic_launcher_foreground.png')}")

    print("Done.")


if __name__ == "__main__":
    main()
