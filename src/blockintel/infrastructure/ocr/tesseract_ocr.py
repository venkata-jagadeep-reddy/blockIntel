import io
from pathlib import Path
from typing import Tuple, List, Dict, Any
import pytesseract
from PIL import Image
from blockintel.config import settings
from blockintel.core.logging import logger
from blockintel.core.exceptions import ProcessingFailedError

class TesseractEngine:
    def __init__(self, tesseract_cmd: str | None = None):
        self.cmd = tesseract_cmd or settings.TESSERACT_CMD
        if Path(self.cmd).exists():
            pytesseract.pytesseract.tesseract_cmd = self.cmd

    def extract_from_image_bytes(self, image_bytes: bytes) -> Tuple[str, float, List[Dict[str, Any]]]:
        """
        Runs Tesseract OCR on raw image bytes.
        Returns:
            (extracted_text, average_confidence, block_tokens)
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")

            # Extract detailed word/box data
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            blocks = []
            confidences = []
            text_tokens = []
            n_boxes = len(data["text"])
            
            for i in range(n_boxes):
                text = data["text"][i].strip()
                conf = float(data["conf"][i])
                if conf >= 0:
                    confidences.append(conf / 100.0)
                if text:
                    text_tokens.append(text)
                    blocks.append({
                        "text": text,
                        "bbox": [
                            float(data["left"][i]),
                            float(data["top"][i]),
                            float(data["left"][i] + data["width"][i]),
                            float(data["top"][i] + data["height"][i])
                        ],
                        "confidence": conf / 100.0 if conf >= 0 else None,
                        "line_num": data["line_num"][i],
                        "block_num": data["block_num"][i]
                    })

            full_text = " ".join(text_tokens)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            return full_text, round(avg_conf, 4), blocks

        except Exception as e:
            logger.error(f"OCR execution failed: {e}", exc_info=True)
            raise ProcessingFailedError(f"Tesseract OCR engine failed: {str(e)}")
