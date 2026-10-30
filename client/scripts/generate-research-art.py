"""
Makes the pictures for the Research & Book page:
  - 9 data-visualisation hero images  -> public/assets/research/<name>-480|800|1200.(webp|avif)
  - 10 book covers (SVG, sharp at any size) -> public/assets/research/covers/<id>.svg

Run from the client folder:   python scripts/generate-research-art.py
Needs: pip install matplotlib numpy pillow
Everything is drawn from maths (no stock photos), so there are no licences to worry about
and you can re-run it after changing a colour.
"""
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "research"
COVERS = OUT / "covers"
OUT.mkdir(parents=True, exist_ok=True)
COVERS.mkdir(parents=True, exist_ok=True)

PAPER, INK, YELLOW, RED, BLUE, GREEN = "#f2f9ff", "#12263f", "#bfe4ff", "#ff8f88", "#0f6dbb", "#8fe0c1"  # sky blue, light red, navy ink
rng = np.random.default_rng(7)


def new_fig():
    fig = plt.figure(figsize=(16, 9), dpi=100, facecolor=PAPER)
    ax = fig.add_axes([0.04, 0.06, 0.92, 0.88], facecolor=PAPER)
    for s in ax.spines.values():
        s.set_linewidth(4)
        s.set_color(INK)
    ax.tick_params(colors=INK, width=3, length=8, labelsize=16)
    return fig, ax


def save(fig, name):
    png = OUT / f"_{name}.png"
    fig.savefig(png, facecolor=PAPER)
    plt.close(fig)
    img = Image.open(png).convert("RGB")
    for w in (480, 800, 1200):
        h = round(img.height * w / img.width)
        small = img.resize((w, h), Image.LANCZOS)
        small.save(OUT / f"{name}-{w}.webp", "WEBP", quality=82, method=6)
        small.save(OUT / f"{name}-{w}.avif", "AVIF", quality=55)
    png.unlink()
    print("image", name)


# 1) attention: a token-by-token heat map with a few strong links
def attention():
    fig, ax = new_fig()
    n = 18
    m = rng.random((n, n)) ** 6
    for i in range(n):
        m[i, max(0, i - 1)] += 0.8
        m[i, i] += 0.3
    for a, b in [(3, 12), (12, 3), (5, 15), (15, 5), (8, 1), (16, 9)]:
        m[a, b] += 1.2
    m /= m.max()
    ax.imshow(m, cmap=matplotlib.colors.LinearSegmentedColormap.from_list("b", [PAPER, YELLOW, RED, INK]), aspect="auto")
    ax.set_xticks(range(0, n, 3))
    ax.set_yticks(range(0, n, 3))
    ax.set_xlabel("key position", fontsize=20, color=INK, fontweight="bold")
    ax.set_ylabel("query position", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-attention")


# 2) replication: effect sizes vs. precision, a funnel with a biased edge
def replication():
    fig, ax = new_fig()
    se = rng.uniform(0.05, 0.9, 160)
    eff = rng.normal(0.15, se)
    shown = (eff / se > 1.8) | (rng.random(160) < 0.25)
    ax.scatter(eff[shown], se[shown], s=190, c=BLUE, edgecolor=INK, linewidth=2.5, zorder=3)
    ax.scatter(eff[~shown], se[~shown], s=190, c=PAPER, edgecolor=INK, linewidth=2.5, zorder=3, hatch="///")
    y = np.linspace(0, 0.95, 50)
    ax.plot(0.15 + 1.96 * y, y, color=INK, lw=4)
    ax.plot(0.15 - 1.96 * y, y, color=INK, lw=4)
    ax.axvline(0.15, color=RED, lw=5)
    ax.invert_yaxis()
    ax.set_xlabel("estimated effect", fontsize=20, color=INK, fontweight="bold")
    ax.set_ylabel("standard error", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-replication")


# 3) information: binary entropy curve with bars underneath
def entropy():
    fig, ax = new_fig()
    p = np.linspace(0.001, 0.999, 400)
    h = -(p * np.log2(p) + (1 - p) * np.log2(1 - p))
    ax.fill_between(p, h, color=YELLOW, zorder=1)
    ax.plot(p, h, color=INK, lw=7, zorder=3)
    xs = np.linspace(0.05, 0.95, 10)
    hs = -(xs * np.log2(xs) + (1 - xs) * np.log2(1 - xs))
    ax.bar(xs, hs, width=0.06, color=BLUE, edgecolor=INK, linewidth=3, zorder=2)
    ax.axvline(0.5, color=RED, lw=5, ls=(0, (3, 2)))
    ax.set_xlabel("probability of a 1", fontsize=20, color=INK, fontweight="bold")
    ax.set_ylabel("bits per symbol", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-entropy")


# 4) dropout: a small network where random units are switched off
def dropout():
    fig, ax = new_fig()
    layers = [5, 7, 7, 4]
    pos = []
    for li, n in enumerate(layers):
        xs = np.full(n, li / (len(layers) - 1))
        ys = np.linspace(0.08, 0.92, n)
        pos.append(list(zip(xs, ys)))
    alive = [[rng.random() > 0.35 if 0 < li < len(layers) - 1 else True for _ in layer] for li, layer in enumerate(pos)]
    for li in range(len(layers) - 1):
        for i, a in enumerate(pos[li]):
            for j, b in enumerate(pos[li + 1]):
                on = alive[li][i] and alive[li + 1][j]
                ax.plot([a[0], b[0]], [a[1], b[1]], color=INK if on else "#c5d8ea", lw=2.2 if on else 1, alpha=0.9 if on else 0.6, zorder=1)
    for li, layer in enumerate(pos):
        for i, (x, y) in enumerate(layer):
            on = alive[li][i]
            ax.scatter([x], [y], s=1500, c=[YELLOW if on else PAPER], edgecolor=INK if on else "#c5d8ea", linewidth=4, zorder=3)
            if not on:
                ax.plot([x - 0.015, x + 0.015], [y - 0.03, y + 0.03], color=RED, lw=5, zorder=4)
                ax.plot([x - 0.015, x + 0.015], [y + 0.03, y - 0.03], color=RED, lw=5, zorder=4)
    ax.set_xlim(-0.06, 1.06)
    ax.set_ylim(0, 1)
    ax.set_xticks([])
    ax.set_yticks([])
    save(fig, "news-dropout")


# 5) statistics: two model families fitted to the same cloud
def cultures():
    fig, ax = new_fig()
    x = rng.uniform(0, 10, 90)
    y = 2 + 0.6 * x + 1.6 * np.sin(1.3 * x) + rng.normal(0, 0.7, 90)
    ax.scatter(x, y, s=170, c=PAPER, edgecolor=INK, linewidth=3, zorder=3)
    xx = np.linspace(0, 10, 300)
    ax.plot(xx, np.polyval(np.polyfit(x, y, 1), xx), color=BLUE, lw=7, zorder=2)
    ax.plot(xx, np.polyval(np.polyfit(x, y, 8), xx), color=RED, lw=7, zorder=2)
    ax.set_xlabel("input", fontsize=20, color=INK, fontweight="bold")
    ax.set_ylabel("outcome", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-cultures")


# 6) residual networks: loss with and without skip connections
def residual():
    fig, ax = new_fig()
    steps = np.arange(0, 200)
    plain = 2.2 * np.exp(-steps / 120) + 0.8 + rng.normal(0, 0.03, 200)
    resid = 2.2 * np.exp(-steps / 35) + 0.15 + rng.normal(0, 0.03, 200)
    ax.fill_between(steps, resid, plain, color=YELLOW, alpha=0.9)
    ax.plot(steps, plain, color=INK, lw=7, label="plain stack")
    ax.plot(steps, resid, color=RED, lw=7, label="with shortcuts")
    ax.legend(fontsize=20, frameon=True, facecolor=PAPER, edgecolor=INK, fancybox=False)
    ax.set_xlabel("training step", fontsize=20, color=INK, fontweight="bold")
    ax.set_ylabel("training error", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-residual")


# 7) reading papers: three passes as nested bars
def passes():
    fig, ax = new_fig()
    labels = ["Pass 1\nskim, 5 min", "Pass 2\nread, 1 hour", "Pass 3\nre-derive, hours"]
    widths = [0.25, 0.6, 1.0]
    cols = [YELLOW, BLUE, RED]
    for i, (w, c) in enumerate(zip(widths, cols)):
        ax.barh(2 - i, w, height=0.7, color=c, edgecolor=INK, linewidth=5)
        ax.text(0.02, 2 - i, labels[i], va="center", fontsize=22, fontweight="bold", color=INK if c != BLUE else PAPER)
    ax.set_xlim(0, 1.05)
    ax.set_yticks([])
    ax.set_xlabel("how much of the paper you understand", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-passes")


# 8) GANs: two distributions pulled together
def gan():
    fig, ax = new_fig()
    x = np.linspace(-6, 6, 500)
    real = np.exp(-(x - 1) ** 2 / 1.2) + 0.6 * np.exp(-(x + 2.2) ** 2 / 0.8)
    for shift, col, a in [(3.2, "#9aa7ff", 0.5), (1.8, "#6c80ff", 0.6), (0.6, BLUE, 0.9)]:
        fake = np.exp(-(x - 1 - shift) ** 2 / 1.5) * 1.0
        ax.fill_between(x, fake, color=col, alpha=a, zorder=1)
    ax.fill_between(x, real, color=YELLOW, alpha=0.95, zorder=2)
    ax.plot(x, real, color=INK, lw=7, zorder=3)
    ax.set_xlabel("data space", fontsize=20, color=INK, fontweight="bold")
    ax.set_ylabel("density", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-gan")


# 9) books: a level ladder of stacked bars
def books():
    fig, ax = new_fig()
    levels = ["Beginner", "Intermediate", "Advanced"]
    counts = np.array([[4, 3, 1], [2, 5, 3], [0, 3, 6]])
    cols = [GREEN, YELLOW, RED]
    bottom = np.zeros(3)
    for k in range(3):
        ax.bar(levels, counts[:, k], bottom=bottom, color=cols[k], edgecolor=INK, linewidth=5, width=0.62)
        bottom += counts[:, k]
    ax.tick_params(axis="x", labelsize=22)
    ax.set_ylabel("titles on the shelf", fontsize=20, color=INK, fontweight="bold")
    save(fig, "news-books")


# ---------------------------------------------------------------- covers
BOOKS = [
    # id, title lines, author, level, colour, motif
    ("deep-blue", ["DEEP", "BLUE"], "S. LINDQVIST", "BEGINNER", BLUE, "waves"),
    ("living-cell", ["THE", "LIVING", "CELL"], "R. ABDI", "BEGINNER", GREEN, "cells"),
    ("statistics-without-fear", ["STATS", "WITHOUT", "FEAR"], "M. ADEYEMI", "BEGINNER", YELLOW, "bars"),
    ("data-atlas", ["DATA", "ATLAS"], "L. FERRARI", "BEGINNER", RED, "grid"),
    ("writing-paper", ["WRITING", "THE", "PAPER"], "H. OKONKWO", "INTERMEDIATE", YELLOW, "lines"),
    ("methods-work", ["RESEARCH", "METHODS", "THAT WORK"], "E. PAULSEN", "INTERMEDIATE", GREEN, "scatter"),
    ("information-and-entropy", ["INFO", "AND", "ENTROPY"], "K. TANAKA", "INTERMEDIATE", BLUE, "curve"),
    ("learning-machines", ["LEARNING", "MACHINES"], "D. INNOVATOR", "ADVANCED", RED, "network"),
    ("quantum-questions", ["QUANTUM", "QUESTIONS"], "J. MORENO", "ADVANCED", BLUE, "orbits"),
    ("causal-notebook", ["CAUSAL", "NOTE", "BOOK"], "A. VOLKOV", "ADVANCED", YELLOW, "arrows"),
]


def motif(kind, col):
    s = ""
    if kind == "waves":
        for i in range(6):
            s += f'<path d="M0 {470 + i * 26} Q75 {430 + i * 26} 150 {470 + i * 26} T300 {470 + i * 26} T450 {470 + i * 26} T600 {470 + i * 26}" fill="none" stroke="#12263f" stroke-width="7"/>'
    elif kind == "cells":
        for cx, cy, r in [(150, 520, 90), (360, 600, 120), (470, 470, 60), (230, 690, 50)]:
            s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#f2f9ff" stroke="#12263f" stroke-width="8"/><circle cx="{cx + r * 0.2}" cy="{cy - r * 0.1}" r="{r * 0.35}" fill="#12263f"/>'
    elif kind == "bars":
        for i, h in enumerate([90, 170, 260, 200, 120]):
            s += f'<rect x="{50 + i * 100}" y="{720 - h}" width="80" height="{h}" fill="#f2f9ff" stroke="#12263f" stroke-width="7"/>'
    elif kind == "grid":
        for i in range(6):
            for j in range(4):
                fill = "#12263f" if (i * 3 + j * 5) % 4 == 0 else "#f2f9ff"
                s += f'<rect x="{40 + i * 90}" y="{480 + j * 70}" width="80" height="60" fill="{fill}" stroke="#12263f" stroke-width="5"/>'
    elif kind == "lines":
        for i in range(8):
            w = 500 - (i % 3) * 90
            s += f'<rect x="50" y="{480 + i * 34}" width="{w}" height="14" fill="#12263f"/>'
    elif kind == "scatter":
        pts = np.random.default_rng(3).uniform([60, 470], [540, 730], (28, 2))
        for x, y in pts:
            s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="14" fill="#f2f9ff" stroke="#12263f" stroke-width="5"/>'
        s += '<line x1="60" y1="720" x2="540" y2="480" stroke="#12263f" stroke-width="8"/>'
    elif kind == "curve":
        s += '<path d="M40 740 C 150 420, 450 420, 560 740" fill="none" stroke="#12263f" stroke-width="10"/><line x1="300" y1="470" x2="300" y2="740" stroke="#12263f" stroke-width="5" stroke-dasharray="14 10"/>'
    elif kind == "network":
        nodes = [(90, 520), (90, 640), (90, 740), (300, 480), (300, 600), (300, 720), (510, 560), (510, 680)]
        for a in nodes[:3]:
            for b in nodes[3:6]:
                s += f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#12263f" stroke-width="3"/>'
        for a in nodes[3:6]:
            for b in nodes[6:]:
                s += f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#12263f" stroke-width="3"/>'
        for x, y in nodes:
            s += f'<circle cx="{x}" cy="{y}" r="26" fill="#f2f9ff" stroke="#12263f" stroke-width="7"/>'
    elif kind == "orbits":
        for r in (60, 120, 180):
            s += f'<ellipse cx="300" cy="620" rx="{r * 1.4}" ry="{r}" fill="none" stroke="#12263f" stroke-width="6"/>'
        s += '<circle cx="300" cy="620" r="26" fill="#12263f"/><circle cx="426" cy="620" r="16" fill="#f2f9ff" stroke="#12263f" stroke-width="5"/>'
    elif kind == "arrows":
        for a, b, c, d in [(80, 520, 280, 520), (320, 520, 520, 640), (80, 720, 280, 640), (320, 640, 520, 640)]:
            s += f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="#12263f" stroke-width="9"/><circle cx="{c}" cy="{d}" r="16" fill="#12263f"/>'
        for x, y in [(60, 520), (60, 720), (300, 520), (300, 640)]:
            s += f'<rect x="{x - 10}" y="{y - 24}" width="60" height="48" fill="#f2f9ff" stroke="#12263f" stroke-width="6"/>'
    return s


def cover(book):
    cid, lines, author, level, col, kind = book
    title = ""
    for i, ln in enumerate(lines):
        size = 96 if len(ln) <= 7 else 74 if len(ln) <= 9 else 58
        title += f'<text x="40" y="{150 + i * 100}" font-family="Arial Black, Archivo Black, Impact, sans-serif" font-weight="900" font-size="{size}" fill="#12263f">{ln}</text>'
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img" aria-label="{' '.join(lines).title()} by {author.title()}">
<rect width="600" height="800" fill="{col}"/>
<rect x="8" y="8" width="584" height="784" fill="none" stroke="#12263f" stroke-width="16"/>
{title}
{motif(kind, col)}
<rect x="8" y="744" width="584" height="48" fill="#12263f"/>
<text x="40" y="777" font-family="Courier New, monospace" font-weight="700" font-size="22" fill="#f2f9ff">{author}</text>
<text x="560" y="777" text-anchor="end" font-family="Courier New, monospace" font-weight="700" font-size="22" fill="{YELLOW}">{level}</text>
</svg>"""
    (COVERS / f"{cid}.svg").write_text(svg, encoding="utf-8")
    print("cover", cid)


if __name__ == "__main__":
    for fn in (attention, replication, entropy, dropout, cultures, residual, passes, gan, books):
        fn()
    for b in BOOKS:
        cover(b)
    print("done ->", OUT)
