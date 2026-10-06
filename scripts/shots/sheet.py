"""Contact sheet: `python3 scripts/shots/sheet.py out.jpg label1=dir1/prefix label2=dir2/prefix ...`
Rows are scene names found under the first prefix; columns are the labelled sets (e.g. before, after)."""
import glob, os, sys
from PIL import Image, ImageDraw

out, sets = sys.argv[1], [a.split('=', 1) for a in sys.argv[2:]]
names = sorted(os.path.basename(p)[len(os.path.basename(sets[0][1])) + 1:] for p in glob.glob(sets[0][1] + '-*.png'))
W, H, PAD = 480, 270, 22
sheet = Image.new('RGB', (len(sets) * W, len(names) * (H + PAD) + PAD), (20, 20, 24))
d = ImageDraw.Draw(sheet)
for j, (label, _) in enumerate(sets):
    d.text((j * W + 6, 4), label, fill=(240, 240, 240))
for i, n in enumerate(names):
    y = PAD + i * (H + PAD)
    d.text((6, y - 1), n[:-4], fill=(200, 200, 120))
    for j, (_, prefix) in enumerate(sets):
        p = f'{prefix}-{n}'
        if os.path.exists(p):
            sheet.paste(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS), (j * W, y + 12))
sheet.save(out, quality=88)
print(out, len(names), 'rows')
