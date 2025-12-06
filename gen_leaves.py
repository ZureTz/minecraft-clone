#!/usr/bin/env python3
"""
Generate pixel-style oak leaves texture with uniformly distributed transparency
"""
from PIL import Image
import random

def generate_pixel_leaves_uniform_transparency():
    """Generate pixel-style leaves with uniformly distributed transparency"""
    size = 16
    target_size = 128
    
    # Create base image
    img = Image.new('RGBA', (size, size))
    pixels = img.load()
    
    # Base grayscale values (will be tinted green in-game)
    dark_leaf = 80
    mid_leaf = 120
    light_leaf = 160
    
    random.seed(42)  # Reproducible pattern
    
    # Create pixel grid with ~70% opacity, ~30% transparency
    # We'll distribute transparent pixels uniformly across the texture
    total_pixels = size * size
    transparent_count = int(total_pixels * 0.30)  # 30% transparent
    
    # Create list of all pixel positions
    all_positions = [(x, y) for x in range(size) for y in range(size)]
    # Randomly select which pixels should be transparent
    transparent_positions = set(random.sample(all_positions, transparent_count))
    
    # Fill the image
    for y in range(size):
        for x in range(size):
            if (x, y) in transparent_positions:
                # Transparent pixel
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Opaque leaf pixel with color variation
                rand = random.random()
                if rand < 0.2:
                    color = dark_leaf
                elif rand < 0.7:
                    color = mid_leaf
                else:
                    color = light_leaf
                
                # Add slight noise
                color += random.randint(-10, 10)
                color = max(0, min(255, color))
                
                pixels[x, y] = (color, color, color, 255)
    
    # Upscale using nearest neighbor
    img = img.resize((target_size, target_size), Image.NEAREST)
    
    # Save
    img.save('src/renderer/src/assets/textures/oak_leaves.png')
    print(f"Generated pixel-style oak_leaves.png with uniform transparency ({target_size}x{target_size})")
    print(f"Transparent pixels: {transparent_count}/{total_pixels} (~30%)")

if __name__ == "__main__":
    generate_pixel_leaves_uniform_transparency()
