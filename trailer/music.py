"""Original trailer score, synthesized from scratch with numpy (no samples).
usage: python3 music.py <timeline.json> <out.wav>
timeline: {"len": 60, "hits": [t...], "riser": [t0, t1], "cut": t, "braam": t, "outro": t, "key": 38}
"""
import json, sys
import numpy as np

SR = 48000
cfg = json.load(open(sys.argv[1]))
L = cfg["len"]
N = int(L * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
key = cfg.get("key", 38)  # D2


def env(times, pts):
    """piecewise-linear envelope from (time, value) points"""
    xs, ys = zip(*pts)
    return np.interp(times, xs, ys)


def saw(f, n=14, detune=0.0, phase=0.0):
    out = np.zeros(N)
    for k in range(1, n + 1):
        out += np.sin(2 * np.pi * k * f * (1 + detune) * t + phase * k) / k * (0.86 ** k)
    return out


def lowpass_fft(x, cutoff):
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (fr / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def reverb(x, secs=4.0, seed=1, wet=0.35):
    n = int(secs * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.9 / secs)
    ir = lowpass_fft(ir, 3500)
    ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n
    size = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - wet) + y * wet * 3.0


L_ch = np.zeros(N)
R_ch = np.zeros(N)
end_fade = env(t, [(0, 1), (L - 3.5, 1), (L, 0)])

# 1. sub drone: D + A, slow breathing, swells through the piece, gone during the pre-title cut
cut = cfg.get("cut", L)
braam_t = cfg.get("braam", L)
drone_amp = env(t, [(0, 0), (3, 0.5), (cut - 8, 0.8), (cut - 0.05, 1.0), (cut, 0), (braam_t + 0.2, 0), (braam_t + 2, 0.7), (L, 0.7)])
breath = 0.75 + 0.25 * np.sin(2 * np.pi * t / 7.3)
drone = (np.sin(2 * np.pi * mtof(key - 12) * t) * 0.9 + np.sin(2 * np.pi * mtof(key - 5) * t) * 0.35
         + lowpass_fft(saw(mtof(key), 10, 0.002), 300) * 0.25)
L_ch += drone * drone_amp * breath * 0.2
R_ch += drone * drone_amp * breath * 0.2

# 2. pads: i - VI - III - VII in D minor, wide detuned saws, filter opens over time
prog = [[0, 3, 7, 12], [-4, 0, 3, 8], [3, 7, 10, 15], [-2, 2, 5, 10]]  # Dm, Bb, F, C (relative to key+12)
bar = cfg.get("bar", 6.0)
pad_amp = env(t, [(0, 0), (2.5, 0), (6, 0.5), (cut - 6, 0.9), (cut - 0.05, 1.0), (cut, 0), (braam_t + 1, 0), (braam_t + 3, 0.6), (L, 0.6)])
padL = np.zeros(N)
padR = np.zeros(N)
nbars = int(np.ceil(L / bar)) + 1
for i in range(nbars):
    t0 = i * bar
    chord = prog[i % 4]
    gate = env(t, [(t0 - 1.2, 0), (t0 + 0.8, 1), (t0 + bar, 1), (t0 + bar + 1.5, 0)])
    if gate.max() == 0:
        continue
    seg = slice(max(0, int((t0 - 1.3) * SR)), min(N, int((t0 + bar + 1.6) * SR)))
    for j, iv in enumerate(chord):
        f = mtof(key + 12 + iv)
        for d, side in ((-0.004, 0), (0.0, 2), (0.0045, 1)):
            w = np.zeros(N)
            tt = t[seg]
            for k in range(1, 9):
                w[seg] += np.sin(2 * np.pi * k * f * (1 + d) * tt + rng.uniform(0, 6.28)) / k * (0.7 ** k)
            w *= gate
            if side in (0, 2):
                padL += w * (1.0 if side == 0 else 0.6)
            if side in (1, 2):
                padR += w * (1.0 if side == 1 else 0.6)
cut_open = 600 + 1800 * np.clip(t / max(cut, 1), 0, 1)
padL = lowpass_fft(padL, 1500)
padR = lowpass_fft(padR, 1500)
L_ch += padL * pad_amp * 0.05
R_ch += padR * pad_amp * 0.05

# 3. high shimmer: sparse bell tones (A, D, F, E) with long tails
bells = cfg.get("bells", [])
for i, bt in enumerate(bells):
    f = mtof(key + 36 + [7, 12, 15, 14, 19][i % 5])
    i0 = int(bt * SR)
    n = min(N - i0, int(5 * SR))
    if n <= 0:
        continue
    tt = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 2)) * np.exp(-tt * 0.9) * np.minimum(tt / 0.005, 1)
    pan = 0.5 + 0.35 * np.sin(i * 2.1)
    L_ch[i0:i0 + n] += tone * 0.07 * (1 - pan)
    R_ch[i0:i0 + n] += tone * 0.07 * pan

# 4. trailer hits: sub boom with pitch drop + noise transient + low tom
def boom(at, gain=1.0, length=3.0):
    i0 = int(at * SR)
    n = min(N - i0, int(length * SR))
    if n <= 0:
        return
    tt = np.arange(n) / SR
    f = 30 + 70 * np.exp(-tt * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt * 1.4)
    click = lowpass_fft(rng.standard_normal(n), 2500) * np.exp(-tt * 28) * 0.6
    tom = np.sin(2 * np.pi * np.cumsum(110 * np.exp(-tt * 3) + 55) / SR) * np.exp(-tt * 5) * 0.4
    s = np.tanh((body + click + tom) * 1.6) * gain * np.minimum(tt / 0.002, 1)
    L_ch[i0:i0 + n] += s * 0.55
    R_ch[i0:i0 + n] += s * 0.55

for h in cfg.get("hits", []):
    boom(h, 0.45 + 0.35 * h / cfg.get("cut", L))

# 4b. action pulse: driving low eighth notes through the gameplay, louder as it goes
if "pulse" in cfg:
    p0, p1, bpm = cfg["pulse"]
    step = 60.0 / bpm / 2
    k, tb = 0, p0
    while tb < p1 - 0.05:
        i0 = int(tb * SR)
        n = min(N - i0, int(0.35 * SR))
        tt = np.arange(n) / SR
        prog_ = (tb - p0) / max(p1 - p0, 1e-6)
        f = mtof(key - 12 + (7 if k % 8 in (6, 7) else 0))
        tone = sum(np.sin(2 * np.pi * h * f * tt) / h * 0.8 ** h for h in range(1, 7))
        s = np.tanh(tone * 1.4) * np.exp(-tt * 14) * np.minimum(tt / 0.004, 1) * (1.0 if k % 2 == 0 else 0.6) * (0.4 + 0.5 * prog_)
        L_ch[i0:i0 + n] += s * 0.2
        R_ch[i0:i0 + n] += s * 0.2
        k += 1
        tb = p0 + k * step

# 5. riser: noise sweep + rising Shepard-ish tones into the cut (the black hole pull)
if "riser" in cfg:
    r0, r1 = cfg["riser"]
    i0, i1 = int(r0 * SR), int(r1 * SR)
    n = i1 - i0
    tt = np.arange(n) / SR
    x = tt / (r1 - r0)
    noise = rng.standard_normal(n)
    # sweep a band from 200 Hz to 8 kHz by blending progressively brighter copies
    lo, mid, hi = lowpass_fft(noise, 300), lowpass_fft(noise, 1800), lowpass_fft(noise, 9000)
    sweep = np.where(x < 0.5, lo * (1 - 2 * x) + mid * 2 * x, mid * (2 - 2 * x) + hi * (2 * x - 1))
    tones = np.zeros(n)
    for k, base in enumerate([key, key + 7, key + 12, key + 19]):
        f = mtof(base) * 2 ** (x * 1.0)  # up an octave
        tones += np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 if k < 2 else 0.35)
    tremolo = 0.7 + 0.3 * np.sin(2 * np.pi * np.cumsum(2 + 14 * x ** 2) / SR)
    rs = (sweep * 0.5 + lowpass_fft(np.tanh(tones * 1.5), 3000) * 0.5) * (x ** 2.2) * tremolo
    L_ch[i0:i1] += rs * 0.85
    R_ch[i0:i1] += rs * 0.85
    # heartbeat: accelerating double thumps
    beat, p = r0, 1.2
    while beat < r1 - 0.25:
        for off, g in ((0, 0.55), (0.22, 0.35)):
            boom(beat + off, g * (0.4 + 0.6 * (beat - r0) / (r1 - r0)), 1.0)
        beat += p
        p = max(0.42, p * 0.86)

# 6. BRAAM on the title: low brass-like stack, saturated, with a sub boom
if braam_t < L:
    i0 = int(braam_t * SR)
    n = N - i0
    tt = np.arange(n) / SR
    stack = np.zeros(n)
    for iv, g in ((-12, 1.0), (-5, 0.8), (0, 0.9), (3, 0.6), (7, 0.5), (12, 0.35)):
        f = mtof(key + iv)
        for d in (-0.006, 0, 0.006):
            for k in range(1, 18):
                stack += np.sin(2 * np.pi * k * f * (1 + d) * tt) / k * g * (0.9 ** k)
    stack = np.tanh(stack * 0.6)
    braam_env = np.minimum(tt / 0.04, 1) * (0.35 + 0.65 * np.exp(-tt * 0.55)) * env(tt, [(0, 1), (L - braam_t - 3.5, 0.8), (L - braam_t, 0)])
    stack = lowpass_fft(stack, 2200) * braam_env
    L_ch[i0:] += stack * 0.5
    R_ch[i0:] += np.roll(stack, 180) * 0.5
    boom(braam_t, 1.8, 5.0)
    for k, ot in enumerate(cfg.get("outro_bells", [])):
        pass

L_ch = reverb(L_ch, 4.5, 1, 0.38) * end_fade
R_ch = reverb(R_ch, 4.5, 2, 0.38) * end_fade
# hard silence right at the cut (trailer "suck-out") except the reverb tail of the riser
if cut < L:
    m = env(t, [(cut - 0.02, 1), (cut, 0.0), (braam_t - 0.01, 0.0), (braam_t, 1)])
    L_ch *= m
    R_ch *= m
st = np.stack([L_ch, R_ch], 1)
st = np.tanh(st / (np.abs(st).max() * 0.55)) * 0.89  # glue + limit, about -1 dBFS peak
pcm = (st * 32767).astype("<i2")
import wave
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[2], f"{L}s")
