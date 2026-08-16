from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SIZE = (1464, 732)
WORLD_IMAGE_SIZE = (732, 732)
WORLD_SIZE = 732


def terrain_type(red, green, blue):
    if green > red + 45 and green > blue + 45:
        return 2  # Grass / open World 1 terrain.
    if red > blue + 55 and green > blue + 35:
        return 1  # Sand / open World 2 terrain.
    return 0  # Underground rock.


def encode_rows(image):
    rows = []
    for y in range(WORLD_SIZE):
        runs = []
        previous = None
        for x in range(WORLD_SIZE):
            value = terrain_type(*image.getpixel((x, y)))
            if value == previous:
                continue
            runs.extend((x, value))
            previous = value
        rows.append(runs)
    return rows


def build_distinct_world2(source):
    """Replace the copied World 1 silhouette with a dedicated desert layout."""
    rock_mask = Image.new("L", (WORLD_SIZE, WORLD_SIZE), 0)
    draw = ImageDraw.Draw(rock_mask)

    # Large, smooth underground masses unique to World 2.
    draw.polygon([
        (70, 0), (285, 0), (315, 48), (288, 108), (233, 127),
        (198, 179), (126, 170), (89, 118), (48, 85),
    ], fill=255)
    draw.polygon([
        (545, 0), (732, 0), (732, 165), (685, 185), (623, 162),
        (597, 116), (521, 83),
    ], fill=255)
    draw.polygon([
        (18, 272), (79, 225), (171, 230), (213, 278), (191, 328),
        (132, 348), (75, 330), (31, 361), (0, 346),
    ], fill=255)
    draw.polygon([
        (526, 230), (612, 205), (700, 244), (732, 291), (711, 344),
        (645, 371), (580, 342), (540, 303),
    ], fill=255)
    draw.polygon([
        (0, 542), (74, 510), (144, 523), (203, 574), (189, 649),
        (235, 704), (223, 732), (0, 732),
    ], fill=255)
    draw.polygon([
        (430, 586), (492, 535), (566, 547), (599, 602), (671, 624),
        (732, 690), (732, 732), (538, 732), (506, 680), (446, 654),
    ], fill=255)

    # The central sinkhole is a broken ring rather than another copied island.
    draw.ellipse((253, 238, 493, 478), fill=255)
    draw.ellipse((310, 293, 445, 429), fill=0)
    draw.polygon([(242, 352), (335, 332), (353, 389), (250, 420)], fill=0)

    # Smaller shelves keep the desert from reading as one empty rectangle.
    draw.polygon([(316, 92), (404, 73), (466, 110), (449, 151), (361, 164), (303, 137)], fill=255)
    draw.polygon([(265, 505), (327, 470), (396, 489), (421, 541), (379, 572), (298, 558)], fill=255)
    draw.ellipse((92, 401, 171, 451), fill=255)
    draw.ellipse((605, 441, 684, 500), fill=255)

    rock_mask = rock_mask.filter(ImageFilter.GaussianBlur(8))
    rock_mask = rock_mask.point(lambda value: 255 if value >= 128 else 0)

    pixels = source.load()
    mask_pixels = rock_mask.load()
    output = Image.new("RGB", source.size)
    output_pixels = output.load()
    for y in range(WORLD_SIZE):
        for x in range(WORLD_SIZE):
            red, green, blue = pixels[x, y]
            grain = ((red * 3 + green * 5 + blue * 2 + x * 17 + y * 29) % 17) - 8
            if mask_pixels[x, y]:
                shade = max(118, min(165, 145 + grain))
                output_pixels[x, y] = (shade, shade + 1, shade + 2)
            else:
                output_pixels[x, y] = (
                    max(190, min(238, 220 + grain)),
                    max(160, min(215, 190 + grain)),
                    max(85, min(145, 112 + grain)),
                )

    # Preserve the hand-drawn World 1-to-World 2 entrances at the seam.
    for y in range(WORLD_SIZE):
        for x in range(16):
            red, green, blue = pixels[x, y]
            if green > red + 45 and green > blue + 45:
                output_pixels[x, y] = (red, green, blue)

    return output


def rows_source(rows):
    return "[\n" + ",\n".join(
        "    [" + ",".join(str(value) for value in row) + "]"
        for row in rows
    ) + "\n]"


def write_modules(world1_rows, world2_rows):
    data = (
        f"const WORLD1_TERRAIN_ROWS = {rows_source(world1_rows)};\n"
        f"const WORLD2_TERRAIN_ROWS = {rows_source(world2_rows)};\n\n"
        "function getTerrainType(rows, x, y) {\n"
        "    const row = rows[y | 0];\n"
        "    if (!row || x < 0 || x >= 732) return 0;\n"
        "    let value = row[1] || 0;\n"
        "    for (let index = 2; index < row.length && x >= row[index]; index += 2) value = row[index + 1];\n"
        "    return value;\n"
        "}\n\n"
        "function getWorldTerrainType(world, x, y) {\n"
        "    return getTerrainType(world === 2 ? WORLD2_TERRAIN_ROWS : WORLD1_TERRAIN_ROWS, x, y);\n"
        "}\n"
    )
    server_source = data + "\nmodule.exports = { getWorldTerrainType };\n"
    public_source = data + "\nexport { getWorldTerrainType };\n"
    (ROOT / "server/game/craftras/worldTerrainMap.js").write_text(server_source, encoding="utf-8")
    (ROOT / "public/craftras-worldTerrainMap.js").write_text(public_source, encoding="utf-8")


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop/world2맵.png"
    image = Image.open(source).convert("RGB")
    if image.size == EXPECTED_SIZE:
        world1 = image.crop((0, 0, WORLD_SIZE, WORLD_SIZE))
        world2_source = image.crop((WORLD_SIZE, 0, WORLD_SIZE * 2, WORLD_SIZE))
        world2 = build_distinct_world2(world2_source)
        world1.save(ROOT / "public/img/craftras-world1-custom.png", optimize=True)
    elif image.size == WORLD_IMAGE_SIZE:
        world1 = Image.open(ROOT / "public/img/craftras-world1-custom.png").convert("RGB")
        world2 = image
    else:
        raise SystemExit(
            f"Expected {WORLD_IMAGE_SIZE[0]}x{WORLD_IMAGE_SIZE[1]} or "
            f"{EXPECTED_SIZE[0]}x{EXPECTED_SIZE[1]}, got {image.width}x{image.height}."
        )

    world2.save(ROOT / "public/img/craftras-world2-custom-v2.png", optimize=True)
    write_modules(encode_rows(world1), encode_rows(world2))
    print(f"Imported {source}")


if __name__ == "__main__":
    main()
