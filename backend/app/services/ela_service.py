"""
ela_service.py – Error Level Analysis (ELA) for document tampering detection.

Supports: JPEG (.jpg / .jpeg), PNG (.png) — PDF inputs are pre-converted to PNG
by the forensics endpoint before reaching this service.

ELA Algorithm:
    1. Load the original image.
    2. Re-save it as JPEG at a specified quality (introduces predictable compression artifacts).
    3. Compute the pixel-level difference (original vs re-compressed).
    4. High-difference regions indicate potential tampering (areas that were edited
       have already been re-compressed once, so they differ more from a fresh
       JPEG save than unmodified regions).

PNG note: PNG is lossless so ELA is less reliable, but it still exposes
    composited/spliced regions because the JPEG re-save introduces uniform
    artifacts everywhere *except* where extra processing was applied.
"""
import logging
import io
import copy
import numpy as np
import base64
from PIL import Image
from PIL.ExifTags import TAGS

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# EXIF Metadata Analysis
# ---------------------------------------------------------------------------

def analyze_exif_metadata(image_path: str) -> list:
    """Analyze EXIF metadata for signs of software manipulation."""
    flags = []
    try:
        with Image.open(image_path) as img:
            exif = img.getexif()
            if not exif:
                return flags
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag in ("Software", "ProcessingSoftware"):
                    val_str = str(value).lower()
                    if any(sw in val_str for sw in ["photoshop", "gimp", "lightroom", "paint", "canva", "affinity", "pixelmator"]):
                        flags.append(f"EDITING_SOFTWARE_DETECTED: {value}")
    except Exception as e:
        logger.warning(f"Failed to extract EXIF: {e}")
    return flags


# ---------------------------------------------------------------------------
# Image Loading Helper (format-agnostic)
# ---------------------------------------------------------------------------

def _load_as_rgb_array(image_path: str) -> np.ndarray:
    """
    Load any supported image (JPEG, PNG, BMP, TIFF, WEBP, …) as a uint8 RGB
    NumPy array.  Handles:
    - Grayscale → converts to RGB
    - RGBA / LA (transparent PNG) → flattens alpha onto white background
    - Palette-mode (P) → converts to RGB
    Raises ValueError if the file cannot be read.
    """
    try:
        with Image.open(image_path) as img:
            img.load()  # force full read before the file handle closes

            # Palette → RGBA first so alpha is handled below
            if img.mode == "P":
                img = img.convert("RGBA")

            # Flatten transparency onto a white background
            if img.mode in ("RGBA", "LA"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                # paste using alpha channel as mask
                alpha = img.split()[-1]
                background.paste(img.convert("RGB"), mask=alpha)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            return np.array(img, dtype=np.uint8)
    except Exception as e:
        raise ValueError(f"Cannot load image '{image_path}': {e}") from e


# ---------------------------------------------------------------------------
# Core ELA Pipeline
# ---------------------------------------------------------------------------

async def analyze_ela_image(image_path: str, jpeg_quality: int = 90) -> dict:
    """
    Perform Error Level Analysis (ELA) on an image to detect tampering.
    Automatically segments the image into grids to find anomaly regions.

    Parameters
    ----------
    image_path : str
        Path to the input image.
    jpeg_quality : int
        JPEG quality used for re-compression (default 90).

    Returns
    -------
    dict with ELA results, flags, and bounding boxes.
    """
    try:
        original_rgb = _load_as_rgb_array(image_path)
    except ValueError as e:
        logger.error(str(e))
        return {
            "tampering_probability": 0.0,
            "suspicious_regions": [],
            "flags_raised": ["IMAGE_LOAD_ERROR"],
            "ela_heatmap_url": None,
        }

    try:
        # --- Re-compress as JPEG in memory ----------------------------------
        pil_original = Image.fromarray(original_rgb)
        H, W, _ = original_rgb.shape

        buffer = io.BytesIO()
        pil_original.save(buffer, format="JPEG", quality=jpeg_quality)
        buffer.seek(0)
        pil_recompressed = Image.open(buffer)
        pil_recompressed.load()
        recompressed_rgb = np.array(pil_recompressed, dtype=np.float32)

        # --- Pixel-level difference -----------------------------------------
        original_f = original_rgb.astype(np.float32)
        diff = np.abs(original_f - recompressed_rgb)           # shape (H, W, 3)

        # Scale difference for visibility (amplify ×10 so subtle artifacts show)
        diff_amplified = np.clip(diff * 12.0, 0, 255).astype(np.uint8)

        # --- Grid-based Anomaly Region Detection -----------------------------
        max_diff_per_pixel = diff.max(axis=2)                  # (H, W)
        global_mean = float(np.mean(max_diff_per_pixel))
        global_std = float(np.std(max_diff_per_pixel))

        # Size of block
        B = 32
        num_rows = H // B
        num_cols = W // B

        # Create binary grid of flagged blocks
        flagged_grid = np.zeros((num_rows, num_cols), dtype=np.uint8)
        block_variances = {}

        threshold = max(global_mean + 2.5 * global_std, 4.0)

        for r in range(num_rows):
            for c in range(num_cols):
                y_start, y_end = r * B, (r + 1) * B
                x_start, x_end = c * B, (c + 1) * B
                block_data = max_diff_per_pixel[y_start:y_end, x_start:x_end]
                if block_data.size > 0:
                    b_mean = float(np.mean(block_data))
                    b_var = float(np.var(block_data))
                    block_variances[(r, c)] = b_var
                    if b_mean > threshold:
                        flagged_grid[r, c] = 1

        # CONTIGUOUS BLOCK GROUPING (Connected Components on Grid)
        visited = np.zeros((num_rows, num_cols), dtype=bool)
        suspicious_regions = []

        def get_neighbors(r, c):
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < num_rows and 0 <= nc < num_cols:
                    yield nr, nc

        region_id = 1
        for r in range(num_rows):
            for c in range(num_cols):
                if flagged_grid[r, c] == 1 and not visited[r, c]:
                    # Start BFS/DFS to find all contiguous flagged blocks
                    queue = [(r, c)]
                    visited[r, c] = True
                    component = []
                    
                    head = 0
                    while head < len(queue):
                        curr_r, curr_c = queue[head]
                        head += 1
                        component.append((curr_r, curr_c))
                        for nr, nc in get_neighbors(curr_r, curr_c):
                            if flagged_grid[nr, nc] == 1 and not visited[nr, nc]:
                                visited[nr, nc] = True
                                queue.append((nr, nc))

                    # Build bounding box for this component
                    rows_in_comp = [p[0] for p in component]
                    cols_in_comp = [p[1] for p in component]
                    min_r, max_r = min(rows_in_comp), max(rows_in_comp)
                    min_c, max_c = min(cols_in_comp), max(cols_in_comp)

                    # Pixel coords
                    x = min_c * B
                    y = min_r * B
                    width = (max_c - min_c + 1) * B
                    height = (max_r - min_r + 1) * B

                    # Average variance in this component
                    avg_var = float(np.mean([block_variances.get((pr, pc), 0.0) for pr, pc in component]))

                    suspicious_regions.append({
                        "region_label": f"Forensic Anomaly Region #{region_id} (High ELA Variance)",
                        "bounding_box": {
                            "x": x,
                            "y": y,
                            "width": width,
                            "height": height
                        },
                        "error_variance": round(avg_var, 2)
                    })
                    region_id += 1

        # --- Tampering Probability Calculation -------------------------------
        num_flagged = int(np.sum(flagged_grid))
        p99 = float(np.percentile(max_diff_per_pixel, 99))
        
        if num_flagged > 0:
            # Scale probability by count of flagged blocks and highest ELA variance
            max_var = max(block_variances.values()) if block_variances else 0.0
            tampering_probability = min(0.35 + (num_flagged * 0.03) + (max_var * 0.005), 0.98)
        else:
            tampering_probability = min(p99 / 40.0, 0.22)

        # --- ELA heatmap as base64 data-URI (PNG for lossless quality) ------
        heatmap_img = Image.fromarray(diff_amplified)
        heatmap_buffer = io.BytesIO()
        heatmap_img.save(heatmap_buffer, format="PNG")
        heatmap_b64 = base64.b64encode(heatmap_buffer.getvalue()).decode("utf-8")
        ela_heatmap_url = f"data:image/png;base64,{heatmap_b64}"

        # --- EXIF analysis --------------------------------------------------
        exif_flags = analyze_exif_metadata(image_path)
        flags = list(exif_flags)
        if tampering_probability > 0.4:
            flags.append("HIGH_ELA_DIFFERENTIAL")
        if len(suspicious_regions) > 0:
            flags.append("COMPRESSION_ANOMALIES_DETECTED")

        return {
            "tampering_probability": round(tampering_probability, 4),
            "suspicious_regions": suspicious_regions,
            "flags_raised": flags,
            "ela_heatmap_url": ela_heatmap_url,
        }

    except Exception as e:
        logger.error(f"ELA processing failed: {e}", exc_info=True)
        return {
            "tampering_probability": 0.0,
            "suspicious_regions": [],
            "flags_raised": ["ELA_PROCESSING_ERROR"],
            "ela_heatmap_url": None,
        }
