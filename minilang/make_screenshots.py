#!/usr/bin/env python3
"""
Renders a terminal-window-style PNG screenshot for a given command + output.
Used to produce the screenshots/ images for the README.
"""

import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FONT_SIZE = 16
PADDING = 20
LINE_HEIGHT = 22
TITLE_BAR_HEIGHT = 34

BG = (30, 30, 30)
TITLE_BG = (50, 50, 50)
FG = (0, 230, 120)
PROMPT_FG = (120, 180, 255)
COMMENT_FG = (150, 150, 150)


def render(title, prompt_line, output_lines, out_path):
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    bold_font = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", FONT_SIZE
    )

    all_lines = [prompt_line] + output_lines
    width = max(font.getlength(line) for line in all_lines) + PADDING * 2
    width = max(int(width), 480)
    height = TITLE_BAR_HEIGHT + PADDING * 2 + LINE_HEIGHT * len(all_lines)

    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)

    # title bar
    draw.rectangle([0, 0, width, TITLE_BAR_HEIGHT], fill=TITLE_BG)
    for idx, color in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse([14 + idx * 22, 11, 26 + idx * 22, 23], fill=color)
    draw.text((width / 2, TITLE_BAR_HEIGHT / 2), title, font=font,
               fill=(210, 210, 210), anchor="mm")

    y = TITLE_BAR_HEIGHT + PADDING
    draw.text((PADDING, y), prompt_line, font=bold_font, fill=PROMPT_FG)
    y += LINE_HEIGHT

    for line in output_lines:
        draw.text((PADDING, y), line, font=font, fill=FG)
        y += LINE_HEIGHT

    img.save(out_path)
    print(f"Wrote {out_path}  ({width}x{height})")


def run_and_capture(script_path):
    result = subprocess.run(
        ["python3", "minilang.py", script_path],
        capture_output=True, text=True, cwd="/home/claude/minilang"
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(1)
    return result.stdout.rstrip("\n").split("\n")


if __name__ == "__main__":
    jobs = [
        ("MiniLang — FizzBuzz", "$ python3 minilang.py examples/fizzbuzz.ml",
         "examples/fizzbuzz.ml", "screenshots/fizzbuzz_output.png"),
        ("MiniLang — Factorial & Fibonacci", "$ python3 minilang.py examples/factorial_fibonacci.ml",
         "examples/factorial_fibonacci.ml", "screenshots/factorial_fibonacci_output.png"),
        ("MiniLang — Prime Sieve", "$ python3 minilang.py examples/primes.ml",
         "examples/primes.ml", "screenshots/primes_output.png"),
    ]
    for title, prompt, script, out in jobs:
        lines = run_and_capture(script)
        render(title, prompt, lines, out)
