"""Gameplay trailer: cinematic hook -> gameplay sections behind black title cards -> black-hole climax -> title.
usage: python3 edit2.py <out.mp4> [--silent] [--preview]   (missing clips are skipped)
Writes tl_game.json (music cues) next to this script, then muxes score_game.wav if present.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1]
silent, preview = '--silent' in sys.argv, '--preview' in sys.argv
F = f'{HERE}/fonts'
TITLE, SERIF, SANS = f'{F}/Michroma-Regular.ttf', f'{F}/Cinzel.ttf', f'{F}/Inter.ttf'
FPS, W, H = 24, 1920, 1080
C, G = f'{HERE}/test', f'{HERE}/gp'

# ('clip', file, offset, duration, [overlay cards (text, font, size, y, t_in, t_out)]) | ('card', [lines], duration)
SEQ = [
    ('clip', f'{C}/01-sky.mp4', 0.0, 5.0, [('2.75 MILLION REAL STARS', SERIF, 58, 0.5, 0.8, 2.7), ('AND YOU CAN VISIT EVERY ONE', SERIF, 52, 0.5, 2.9, 4.9)]),
    ('clip', f'{C}/02-earth.mp4', 1.0, 3.0, []),
    ('card', ['TAKE THE CONTROLS'], 1.3),
    ('clip', f'{G}/ship-a.mp4', 0.5, 4.0, []),
    ('clip', f'{G}/ship-b.mp4', 0.5, 3.0, []),
    ('clip', f'{G}/ship-c.mp4', 0.0, 4.0, []),
    ('card', ['FLY ANYWHERE'], 1.0),
    ('clip', f'{G}/rings-a.mp4', 0.5, 4.0, []),
    ('clip', f'{G}/rings-b.mp4', 0.5, 3.5, []),
    ('card', ['LAND ANYWHERE'], 1.0, f'{G}/land-a.mp4'),  # shown only once its clip exists
    ('clip', f'{G}/land-a.mp4', 0.0, 2.9, []),
    ('clip', f'{G}/land-b.mp4', 0.3, 3.5, []),
    ('clip', f'{C}/04-moon.mp4', 1.2, 3.3, []),
    ('clip', f'{C}/05-betelgeuse.mp4', 0.6, 2.5, []),
    ('clip', f'{C}/06-orion.mp4', 2.5, 2.5, []),
    ('clip', f'{C}/07-milkyway.mp4', 1.0, 2.8, [('LEAVE THE GALAXY', SERIF, 52, 0.82, 0.4, 2.7)]),
    ('card', ['OR PLAY GOD'], 1.3),
    ('clip', f'{G}/god-a.mp4', 0.5, 3.0, []),
    ('clip', f'{G}/god-b.mp4', 0.5, 3.5, []),
    ('clip', f'{G}/god-c.mp4', 0.0, 3.2, []),
    ('clip', f'{G}/god-c.mp4', 4.1, 0.9, []),
    ('card', ['REAL PHYSICS.', 'REAL CONSEQUENCES.'], 1.5),
    ('clip', f'{G}/bh-a.mp4', 0.6, 2.8, []),
    ('clip', f'{C}/09-blackhole.mp4', 2.5, 4.5, [('THEN GET TOO CLOSE', SERIF, 52, 0.82, 0.5, 3.6)]),
    ('clip', f'{G}/bh-b.mp4', 0.4, 3.4, []),
    ('clip', f'{G}/bh-c.mp4', 0.0, 2.3, []),
]
GAP, TITLE_DUR, END_DUR = 0.7, 4.6, 5.4

segs = [s for s in SEQ if (s[0] == 'card' and (len(s) < 4 or os.path.exists(s[3]))) or (s[0] == 'clip' and os.path.exists(s[1]))]
inputs, chains, cards, t = [], [], [], 0.0
cues = {'hits': [], 'bells': []}
n_in = 0
for i, s in enumerate(segs):
    if s[0] == 'card':
        dur = s[2]
        chains.append(f'color=c=black:s={W}x{H}:r={FPS}:d={dur}[v{i}]')
        lines = s[1]
        for k, line in enumerate(lines):
            y = 0.5 + (k - (len(lines) - 1) / 2) * 0.085
            cards.append((line, SERIF, 84, y, t + 0.08, t + dur - 0.05, 'white', 0.18, 0.25))
        cues['hits'].append(round(t, 3))
    else:
        _, path, off, dur, over = s
        inputs += ['-ss', f'{off}', '-t', f'{dur}', '-i', path]
        first = i == 0
        fade = f'fade=t=in:st=0:d={2.0 if first else 0.06},fade=t=out:st={dur - 0.08:.2f}:d=0.08'
        chains.append(f'[{n_in}:v]fps={FPS},scale={W}:{H}:flags=lanczos,setsar=1,{fade},trim=duration={dur},setpts=PTS-STARTPTS[v{i}]')
        n_in += 1
        for (txt, font, size, y, a, b) in over:
            cards.append((txt, font, size, y, t + a, t + b, 'white', 0.5, 0.6))
        climax_end = t + s[3]
    t += s[3] if s[0] == 'clip' else s[2]
cut = t
title_t = cut + GAP
end_t = title_t + TITLE_DUR
END = end_t + END_DUR
chains.append(f'color=c=black:s={W}x{H}:r={FPS}:d={END - cut}[vt]')
cat = ''.join(f'[v{i}]' for i in range(len(segs))) + '[vt]'
chains.append(f'{cat}concat=n={len(segs) + 1}:v=1:a=0[cat]')

cards += [
    ('SPACE EXPLORER', TITLE, 118, 0.47, title_t, end_t, 'white', 0.06, 0.6),
    ('A REAL-SCALE UNIVERSE YOU CAN FLY, LAND IN AND REWRITE', SANS, 28, 0.60, title_t + 1.2, end_t, '0xbfc6d4', 0.5, 0.6),
    ('SUPPORT IT ON KICKSTARTER', TITLE, 60, 0.43, end_t + 0.3, END, 'white', 0.5, 0.01),
    ('Free to play in your browser  ·  Made for Meta Quest 3', SANS, 30, 0.55, end_t + 0.9, END, '0xbfc6d4', 0.5, 0.01),
    ('space-explorer-1vx.pages.dev', SANS, 26, 0.62, end_t + 1.3, END, '0x8f99ab', 0.5, 0.01),
]

look = 'eq=contrast=1.05:saturation=1.08:gamma=0.98,colorbalance=rs=-0.02:bs=0.03:rh=0.02:bh=-0.02,vignette=angle=PI/5'
texts = []
for (txt, font, size, y, t0, t1, col, fi, fo) in cards:
    a = f"if(lt(t,{t0:.3f}),0,if(lt(t,{t0 + fi:.3f}),(t-{t0:.3f})/{fi},if(lt(t,{t1 - fo:.3f}),1,if(lt(t,{t1:.3f}),({t1:.3f}-t)/{fo},0))))"
    if font == SERIF:  # wide trailer tracking
        txt, size = ' '.join(txt), round(size * 0.8)
    esc = txt.replace(':', r'\:').replace("'", r"\'").replace(',', r'\,').replace('.', r'.')
    texts.append(f"drawtext=fontfile={font}:text='{esc}':fontsize={size}:fontcolor={col}:"
                 f"x=(w-text_w)/2:y=h*{y}-text_h/2:alpha='{a}':shadowcolor=black@0.7:shadowx=0:shadowy=2")
chains.append(f'[cat]{look},{",".join(texts)},format=yuv420p[vout]')

# music cues: hits on every section card, riser from the last card into the cut, pulse through the gameplay
cards_t = cues['hits']
cues.update({'len': round(END, 3), 'key': 38, 'bar': 4.0, 'cut': round(cut, 3), 'braam': round(title_t, 3),
             'riser': [cards_t[-1] if cards_t else max(0, cut - 8), round(cut, 3)],
             'pulse': [cards_t[0] if cards_t else 0, cards_t[-1] if cards_t else cut, 112],
             'bells': [0.8, 2.9, 5.2, 8.0]})
json.dump(cues, open(f'{HERE}/tl_game.json', 'w'))
print(f'segments {len(segs)}, cut at {cut:.2f}s, total {END:.2f}s, cues {cues["hits"]}')

score = f'{HERE}/score_game.wav'
cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error'] + inputs
use_audio = not silent and os.path.exists(score)
if use_audio:
    cmd += ['-i', score]
cmd += ['-filter_complex', ';'.join(chains), '-map', '[vout]']
if use_audio:
    cmd += ['-map', f'{n_in}:a', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000']
enc = ['-preset', 'veryfast', '-crf', '22'] if preview else ['-preset', 'slow', '-crf', '19', '-profile:v', 'high']
cmd += ['-c:v', 'libx264', *enc, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', f'{END:.3f}', out]
subprocess.run(cmd, check=True)
print('wrote', out)
