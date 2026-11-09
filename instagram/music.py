"""EduCRM reklamasi uchun 24 soniyalik qo'shiq (120 BPM, Re major).

Tuzilishi (video.html sahnalari bilan bir xil):
  0–4s   intro    — pianino, "ooh" vokal, riser
  4–12s  kuplet   — vokal melodiya "na-na", baraban yengil
  12–20s naqarot  — to'liq baraban, vokal ilgak + garmoniya (ikki ovoz)
  20–24s yakun    — ilgakning so'nggi jumlasi, akkord so'nadi

Vokal — formant sintez (so'zsiz "na-na / oh" uslubida, haqiqiy qo'shiqchi emas).
Ishlatish: python music.py music.wav   (numpy + scipy kerak)
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BEAT = 0.5
BAR = 2.0
DUR = 24.0
N = int(SR * DUR)
KEY = 2  # Do → Re
rng = np.random.default_rng(11)

bus = {name: np.zeros((2, N)) for name in ('drums', 'music', 'vox', 'fx')}
rev_send = np.zeros((2, N))


def hz(m):
    return 440.0 * 2 ** ((m + KEY - 69) / 12)


def tt(dur):
    return np.arange(int(SR * dur)) / SR


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x)


def env(n, a=0.004, r=0.02):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def add(name, sig, t0, gain=1.0, pan=0.0, rev=0.0):
    i = int(round(t0 * SR))
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[name][0, i:i + len(sig)] += sig * l * 1.41
    bus[name][1, i:i + len(sig)] += sig * r * 1.41
    if rev:
        rev_send[0, i:i + len(sig)] += sig * l * rev
        rev_send[1, i:i + len(sig)] += sig * r * rev


# ---------------- cholg'ular ----------------
def piano(f, dur=1.6):
    t = tt(dur)
    s = np.zeros(len(t))
    for k in range(1, 13):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 14000:
            break
        s += np.sin(2 * np.pi * fk * t) / k ** 1.1 * np.exp(-t * (1.4 + 0.7 * k))
    s += filt(rng.standard_normal(len(t)), 'band', [1500, 5000]) * np.exp(-t * 90) * 0.15
    return s * env(len(t), 0.002, 0.08)


def pluck(f, dur=0.35):
    t = tt(dur)
    s = sum(np.sin(2 * np.pi * k * f * t) / k * np.exp(-t * (6 + 1.8 * k)) for k in range(1, 9) if k * f < 12000)
    return s * env(len(t), 0.002, 0.02)


def pad(fs, dur):
    t = tt(dur)
    s = np.zeros(len(t))
    for f in fs:
        for d in (-0.005, 0, 0.005):
            s += sum(np.sin(2 * np.pi * k * f * (1 + d) * t + rng.random() * 6) / k for k in range(1, 7))
    return filt(s, 'low', 1600) * env(len(t), 0.4, 0.4) / len(fs)


def bass(f, dur=0.45):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)
    return np.tanh(1.5 * s) * np.exp(-t * 2.5) * env(len(t), 0.004, 0.04)


def kick():
    t = tt(0.45)
    f = 48 + 125 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    s[:100] += rng.standard_normal(100) * 0.25
    return np.tanh(1.8 * s)


def clap():
    t = tt(0.35)
    n = filt(rng.standard_normal(len(t)), 'band', [900, 3500])
    e = np.exp(-t * 14) * 0.9
    for d in (0.0, 0.012, 0.024):
        e += np.exp(-np.clip(t - d, 0, None) * 150) * (t >= d)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * e * 0.55 + body)


def hat(open_=False):
    t = tt(0.3 if open_ else 0.06)
    return filt(rng.standard_normal(len(t)), 'high', 7500) * np.exp(-t * (12 if open_ else 75))


def crash(dur=2.5):
    t = tt(dur)
    return filt(rng.standard_normal(len(t)), 'high', 3500) * np.exp(-t * 2) * env(len(t), 0.002, 0.2)


def riser(dur):
    t = tt(dur)
    x = (t / dur) ** 2
    n = filt(rng.standard_normal(len(t)), 'band', [1200, 7000]) * x
    return (n + np.sin(2 * np.pi * np.cumsum(200 + 1000 * x) / SR) * x * 0.2) * env(len(t), 0.01, 0.01)


def whoosh(dur=0.5):
    t = tt(dur)
    return filt(rng.standard_normal(len(t)), 'band', [700, 5000]) * np.sin(np.pi * t / dur) ** 2


def tap(f=1900):
    t = tt(0.09)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 60)


# ---------------- vokal (formant sintez) ----------------
FORMANTS = {
    'a': [(800, 1.0, 80), (1150, .5, 90), (2900, .25, 120), (3900, .1, 130)],
    'o': [(450, 1.0, 70), (800, .45, 80), (2830, .15, 100), (3800, .06, 120)],
    'e': [(400, 1.0, 60), (1700, .45, 80), (2600, .3, 100), (3900, .1, 120)],
    'i': [(270, 1.0, 60), (2300, .4, 90), (3000, .3, 100), (3900, .1, 120)],
    'u': [(325, 1.0, 50), (700, .25, 60), (2530, .08, 90), (3500, .04, 100)],
}


def shape(src, vowel):
    out = np.zeros(len(src))
    for fc, g, bw in FORMANTS[vowel]:
        out += g * filt(src, 'band', [fc - bw, fc + bw])
    return out


def vox(f, syl, dur, det=0.0):
    t = tt(dur + 0.08)
    scoop = 2 ** (-0.7 / 12 * np.exp(-t / 0.04))                     # notaga pastdan "kirish"
    vib = 1 + 0.0055 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.18) / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * (1 + det) * scoop * vib) / SR
    src = sum(np.sin(k * ph) / k ** 1.15 for k in range(1, 48) if k * f < 7000)
    src += 0.03 * rng.standard_normal(len(t))                         # nafas
    vowel = {'na': 'a', 'ya': 'a', 'oh': 'o', 'o': 'o', 'ooh': 'u', 'ne': 'e', 'ye': 'e'}[syl]
    s = shape(src, vowel)
    n = len(t)
    if syl[0] in 'ny' and len(syl) > 1:                              # undosh boshlanishi
        c = filt(src, 'low', 380) * 0.8 if syl[0] == 'n' else shape(src, 'i')
        k1, k2 = int(0.045 * SR), int(0.085 * SR)
        mix = np.clip((np.arange(n) - k1) / (k2 - k1), 0, 1)
        s = c * (1 - mix) + s * mix
    e = env(n, 0.018, 0.07) * (1 - 0.18 * t / t[-1])
    return s * e


def sing(notes, t0, gain, harmony=False):
    for beat, ln, m, syl in notes:
        d = ln * BEAT * 0.95
        ts = t0 + beat * BEAT
        add('vox', vox(hz(m), syl, d, -0.003), ts, gain, -0.25, rev=0.35)
        add('vox', vox(hz(m), syl, d, +0.003), ts + 0.012, gain, 0.25, rev=0.35)
        if harmony:
            h = third_below(m)
            add('vox', vox(hz(h), syl, d, 0.002), ts + 0.006, gain * 0.55, 0.5, rev=0.45)
            add('vox', vox(hz(h), syl, d, -0.002), ts + 0.018, gain * 0.55, -0.5, rev=0.45)


SCALE = [0, 2, 4, 5, 7, 9, 11]


def third_below(m):
    pc, octv = m % 12, m // 12
    i = SCALE.index(pc) if pc in SCALE else 0
    j = i - 2
    return octv * 12 + SCALE[j % 7] - (12 if j < 0 else 0)


# ---------------- aranjirovka ----------------
C, G, Am, F = (36, (60, 64, 67)), (43, (59, 62, 67)), (45, (57, 60, 64)), (41, (57, 60, 65))
PROG = [C, G, Am, F, C, G, Am, F, C, G, Am, F]           # 12 takt = 24s
PROG[10], PROG[11] = F, C                                 # yakun: IV → I

VERSE_A = [(0.5, .5, 64, 'na'), (1, .5, 67, 'na'), (1.5, .5, 67, 'na'), (2, 1, 69, 'na'), (3, .5, 67, 'ya'), (3.5, .5, 64, 'o'),
           (4.5, .5, 62, 'na'), (5, .5, 64, 'na'), (5.5, .5, 67, 'na'), (6, 1.5, 62, 'oh')]
VERSE_B = [(0.5, .5, 64, 'na'), (1, .5, 67, 'na'), (1.5, .5, 69, 'na'), (2, 1, 72, 'na'), (3, .5, 71, 'ya'), (3.5, .5, 69, 'o'),
           (4.5, .5, 65, 'na'), (5, .5, 69, 'na'), (5.5, .5, 72, 'na'), (6, 1.8, 74, 'oh')]
HOOK_A = [(0, 1, 76, 'oh'), (1, .5, 74, 'o'), (1.5, .5, 72, 'o'), (2, 1.5, 74, 'oh'), (3.5, .5, 67, 'ye'),
          (4, 1, 74, 'oh'), (5, .5, 72, 'o'), (5.5, .5, 71, 'o'), (6, 1.8, 67, 'oh')]
HOOK_B = [(0, 1, 72, 'oh'), (1, .5, 76, 'o'), (1.5, .5, 76, 'o'), (2, 1.5, 76, 'oh'), (3.5, .5, 74, 'ye'),
          (4, 1, 72, 'oh'), (5, .5, 69, 'na'), (5.5, .5, 72, 'na'), (6, 1.8, 72, 'oh')]
OUTRO = [(0, 1, 76, 'oh'), (1, .5, 74, 'o'), (1.5, .5, 72, 'o'), (2, 1.5, 74, 'oh'), (3.5, .5, 71, 'o'), (4, 3.5, 72, 'oh')]

kicks = []
for bar, (root, tones) in enumerate(PROG):
    t0 = bar * BAR
    sec = 'intro' if bar < 2 else 'verse' if bar < 6 else 'chorus' if bar < 10 else 'outro'
    last = bar == 11

    add('music', pad([hz(m) for m in tones], BAR + 0.1 if not last else 2.2), t0, 0.10 if sec != 'chorus' else 0.14, rev=0.3)

    # pianino: intro/kupletda sinkopali ritm, naqarotda har zarbda
    hits = [0, 1.5, 3] if sec in ('intro', 'verse') else [0, 1, 1.5, 2, 3, 3.5] if sec == 'chorus' else [0]
    for b in hits:
        for m in tones:
            add('music', piano(hz(m + 12), 1.8 if last else 1.2), t0 + b * BEAT, 0.075, rev=0.25, pan=(m - 62) / 20)
        if b == 0:
            add('music', piano(hz(root + 24), 1.6), t0, 0.07, rev=0.2)

    if sec in ('verse', 'chorus'):
        for i in range(8):
            if sec == 'verse' and i % 2:
                continue
            m = tones[[0, 1, 2, 1][i % 4]] + 24
            add('music', pluck(hz(m)), t0 + i * 0.25, 0.07, pan=-0.4 if i % 2 else 0.4, rev=0.3)

    if last:
        add('music', bass(hz(root), 2.0), t0, 0.5)
        add('drums', kick(), t0, 0.9)
        add('drums', crash(), t0, 0.22, rev=0.3)
        continue
    if sec == 'intro':
        continue

    # bas
    pattern = [(0, 1.0), (1.5, 0.5), (2, .9), (3.5, .45)] if sec in ('verse', 'outro') else [(b * 0.5, .24) for b in range(8)]
    for b, ln in pattern:
        add('music', bass(hz(root), ln), t0 + b * BEAT, 0.42)

    # baraban
    kpat = [0, 2.5, 2] if sec == 'verse' else [0, 1, 2, 3]
    for b in kpat:
        kicks.append(t0 + b * BEAT)
        add('drums', kick(), t0 + b * BEAT, 0.9)
    for b in (1, 3):
        add('drums', clap(), t0 + b * BEAT, 0.5, rev=0.2)
    for i in range(8):
        add('drums', hat(open_=(sec == 'chorus' and i % 2 == 1)), t0 + i * 0.25, 0.07 if i % 2 else 0.05, pan=0.25)

kicks.sort()

# vokal
sing([(b, l, m, 'ooh') for b, l, m in [(0, 3.5, 76), (4, 3.5, 74)]], 0.0, 0.11)   # intro "ooh"
sing(VERSE_A, 4.0, 0.16)
sing(VERSE_B, 8.0, 0.16)
sing(HOOK_A, 12.0, 0.17, harmony=True)
sing(HOOK_B, 16.0, 0.17, harmony=True)
sing(OUTRO, 20.0, 0.17, harmony=True)

# effektlar: sahna almashinuvi (whoosh), davomat belgilari (tap), riser va crash
for ts in (3.6, 7.6, 11.6, 15.6, 19.6):
    add('fx', whoosh(0.5), ts, 0.10, pan=0.3)
for ts in (9.5, 10.0, 10.5, 11.0):
    add('fx', tap(), ts, 0.12, pan=0.3, rev=0.2)
add('fx', riser(2.0), 2.0, 0.15)
add('fx', riser(1.5), 10.5, 0.25)
for ts in (4.0, 12.0, 20.0):
    add('drums', crash(), ts, 0.11 if ts != 12.0 else 0.16, rev=0.2)
for i in range(8):                                        # naqarotdan oldin "snare roll"
    add('drums', clap(), 11.0 + i * 0.125, 0.12 + 0.05 * i)

# sidechain: kick paytida musiqa va vokal biroz "nafas oladi"
duck = np.ones(N)
tn = np.arange(N) / SR
for k in kicks:
    m = (tn >= k) & (tn < k + 0.5)
    duck[m] *= 1 - 0.45 * np.exp(-(tn[m] - k) / 0.1)

# reverb: sintetik xona impulsi (1.8s) bilan konvolyutsiya
ir_t = tt(1.8)
ir = np.stack([filt(rng.standard_normal(len(ir_t)), 'low', 6000) * np.exp(-ir_t * 3.2) for _ in range(2)])
ir[:, : int(0.02 * SR)] = 0                                # pre-delay
rev = np.stack([fftconvolve(rev_send[c], ir[c])[:N] for c in range(2)])
rev = filt(rev, 'high', 250) * 0.09

vocals = filt(bus['vox'], 'high', 180)
mix = bus['drums'] + bus['music'] * duck + vocals * (0.75 + 0.25 * duck) + bus['fx'] + rev
mix = filt(mix, 'high', 30)
mix /= np.abs(mix).max()
mix = np.tanh(1.8 * mix) / np.tanh(1.8)                    # yumshoq "glue" kompressiya
fade = np.ones(N)
fo = int(1.2 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade * 0.92

out = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('yozildi:', out)
