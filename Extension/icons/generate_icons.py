"""
Generate placeholder icons for the extension.
Requires: pip install pillow
"""
from PIL import Image, ImageDraw

def create_icon(size, filename):
    """Create a simple shopping cart icon."""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate dimensions
    margin = size // 8
    center = size // 2
    radius = size // 2 - margin

    # Draw gradient-like circle (purple to blue)
    for i in range(radius, 0, -1):
        color = (
            int(102 + (118 - 102) * (radius - i) / radius),
            int(126 + (75 - 126) * (radius - i) / radius),
            int(234 + (162 - 234) * (radius - i) / radius),
            255
        )
        draw.ellipse([
            center - i, center - i,
            center + i, center + i
        ], fill=color)

    # Draw shopping cart symbol (white)
    cart_color = (255, 255, 255, 255)
    stroke_width = max(2, size // 20)

    # Cart body
    cart_y = center + radius // 6
    draw.arc([
        center - radius // 2, cart_y - radius // 3,
        center + radius // 2, cart_y + radius // 3
    ], 0, 180, fill=cart_color, width=stroke_width)

    # Cart handle
    draw.line([
        center - radius // 2, cart_y,
        center - radius // 2, cart_y - radius // 2
    ], fill=cart_color, width=stroke_width)

    # Cart wheels
    wheel_radius = max(2, size // 15)
    draw.ellipse([
        center - radius // 3 - wheel_radius, cart_y + radius // 6 - wheel_radius,
        center - radius // 3 + wheel_radius, cart_y + radius // 6 + wheel_radius
    ], fill=cart_color)
    draw.ellipse([
        center + radius // 3 - wheel_radius, cart_y + radius // 6 - wheel_radius,
        center + radius // 3 + wheel_radius, cart_y + radius // 6 + wheel_radius
    ], fill=cart_color)

    # Save icon
    img.save(filename, 'PNG')
    print(f"Created {filename}")

if __name__ == '__main__':
    create_icon(16, 'icon16.png')
    create_icon(48, 'icon48.png')
    create_icon(128, 'icon128.png')
    print("All icons generated successfully!")
