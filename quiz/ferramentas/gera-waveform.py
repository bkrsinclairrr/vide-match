"""Gera a forma de onda real do áudio da mãe (48 barras) e a versão mono de 64 kbps pra 4G.

Uso (na pasta quiz/ do vide-match):
  uv run --python 3.12 --no-project --with soundfile --with numpy --with imageio-ffmpeg python -I ferramentas/gera-waveform.py

Lê public/quiz/assets/audio/depoimento-mae.mp3, divide em 48 janelas, calcula o RMS de cada uma, normaliza de 0 a 1 com gama 0,6
e grava public/quiz/assets/audio/waveform.json (barras, duração em segundos e o tamanho de cada arquivo). Se o ffmpeg do
imageio-ffmpeg existir, grava também depoimento-mae-64k.mp3 (mono, 64 kbps) na mesma pasta.
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

AQUI = os.path.dirname(os.path.abspath(__file__))
PASTA = os.path.join(AQUI, '..', '..', 'public', 'quiz', 'assets', 'audio')
ORIGINAL = os.path.join(PASTA, 'depoimento-mae.mp3')
LEVE = os.path.join(PASTA, 'depoimento-mae-64k.mp3')
BARRAS = 48

dados, taxa = sf.read(ORIGINAL, always_2d=True)
mono = dados.mean(axis=1)
duracao = len(mono) / taxa
janelas = np.array_split(mono, BARRAS)
rms = np.array([float(np.sqrt(np.mean(j ** 2))) if len(j) else 0.0 for j in janelas])
topo = rms.max() or 1.0
barras = np.clip((rms / topo) ** 0.6, 0.0, 1.0)
# nenhuma barra some de todo: o mínimo visível é 0,08
barras = np.maximum(barras, 0.08)

try:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', ORIGINAL, '-ac', '1', '-b:a', '64k', '-ar', '44100', LEVE], check=True)
except Exception as erro:  # sem ffmpeg, o original serve
    print('sem versão leve:', erro, file=sys.stderr)

saida = {
    'barras': [round(float(b), 3) for b in barras],
    'duracao': round(duracao, 2),
    'arquivos': {n: os.path.getsize(os.path.join(PASTA, n)) for n in os.listdir(PASTA) if n.endswith('.mp3')},
}
with open(os.path.join(PASTA, 'waveform.json'), 'w', encoding='utf-8') as f:
    json.dump(saida, f, ensure_ascii=False)
print(json.dumps(saida, ensure_ascii=False))
