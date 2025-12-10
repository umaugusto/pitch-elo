#!/usr/bin/env python3
"""
Script para compactar imagens da apresentação Elo.
Converte PNGs grandes para JPG otimizado e redimensiona se necessário.
"""

from PIL import Image
import os
from pathlib import Path

# Configurações
MAX_WIDTH = 1920  # Largura máxima (suficiente para 1280px slides)
JPEG_QUALITY = 85  # Qualidade JPEG (85 é bom equilíbrio)
ASSETS_DIR = Path(__file__).parent / "assets"

def compress_image(input_path: Path, output_path: Path = None, max_width: int = MAX_WIDTH, quality: int = JPEG_QUALITY):
    """Comprime uma imagem, redimensiona se necessário, e salva como JPEG."""
    
    if output_path is None:
        output_path = input_path.with_suffix('.jpg')
    
    # Abrir imagem
    with Image.open(input_path) as img:
        # Converter para RGB se necessário (PNG pode ter RGBA)
        if img.mode in ('RGBA', 'P'):
            # Criar fundo branco para transparência
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar se muito grande
        original_size = img.size
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"  Redimensionado: {original_size} -> {img.size}")
        
        # Salvar como JPEG otimizado
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
    
    # Calcular economia
    original_size = input_path.stat().st_size
    new_size = output_path.stat().st_size
    savings = (1 - new_size / original_size) * 100
    
    return original_size, new_size, savings

def main():
    print("=" * 60)
    print("COMPACTAÇÃO DE IMAGENS - Apresentação Elo")
    print("=" * 60)
    
    # Imagens para processar
    images_to_compress = [
        ASSETS_DIR / "personas" / "seu-joao.png",
        ASSETS_DIR / "personas" / "celia.png",
        ASSETS_DIR / "personas" / "Ricardo.png",
        ASSETS_DIR / "personas" / "Mariana.png",
        ASSETS_DIR / "santa-rita.png",
    ]
    
    total_original = 0
    total_new = 0
    
    for img_path in images_to_compress:
        if not img_path.exists():
            print(f"[!] Arquivo nao encontrado: {img_path.name}")
            continue
        
        print(f"\n[*] Processando: {img_path.name}")
        
        try:
            original, new, savings = compress_image(img_path)
            total_original += original
            total_new += new
            
            print(f"  Original: {original / 1024 / 1024:.2f} MB")
            print(f"  Novo:     {new / 1024 / 1024:.2f} MB")
            print(f"  Economia: {savings:.1f}%")
            
        except Exception as e:
            print(f"  [X] Erro: {e}")
    
    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)
    print(f"Total original: {total_original / 1024 / 1024:.2f} MB")
    print(f"Total novo:     {total_new / 1024 / 1024:.2f} MB")
    print(f"Economia total: {(1 - total_new / total_original) * 100:.1f}%")
    print("\n[OK] Arquivos JPG criados. Atualize o HTML para usar as novas extensoes.")

if __name__ == "__main__":
    main()
