import pytest
import io
from PIL import Image, ImageDraw
from blockintel.infrastructure.ocr.tesseract_ocr import TesseractEngine

def test_ocr_engine_extract_from_image():
    engine = TesseractEngine()
    
    # Create image with clear black text on white background
    img = Image.new("RGB", (600, 150), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((30, 50), "BlockIntel Certified Engineer", fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    text, avg_conf, blocks = engine.extract_from_image_bytes(img_bytes)
    assert "BlockIntel" in text or "Certified" in text
    assert 0.0 <= avg_conf <= 1.0
    assert len(blocks) > 0
    assert "bbox" in blocks[0]
    assert len(blocks[0]["bbox"]) == 4
