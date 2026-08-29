import logging
import io
import copy
import numpy as np

logger = logging.getLogger(__name__)

async def analyze_ela_image(image_path: str) -> dict:
    """
    Perform Error Level Analysis (ELA) on an image to detect tampering.
    Uses reference logic from third_party tampering_model (resaving image as JPEG
    at a specific quality and comparing diffs).
    """
    try:
        import imageio.v2 as imageio
        import skimage.io
        import skimage.filters
        import skimage.exposure
        from skimage.util import compare_images, invert
        from skimage import img_as_ubyte
    except ImportError as e:
        logger.warning(f"ELA dependencies missing: {e}. Returning mock result.")
        return {
            "tampering_probability": 0.0,
            "suspicious_regions": [],
            "flags_raised": ["ELA_DEPENDENCIES_MISSING"],
            "ela_heatmap_url": None
        }

    try:
        image = skimage.io.imread(image_path)
        original_image = copy.deepcopy(image)

        buffer = io.BytesIO()
        # Compress the image using JPEG in-memory
        imageio.imwrite(buffer, original_image, format='jpg', quality=90)
        
        buffer.seek(0)
        image_compressed = imageio.imread(buffer, format='jpg')

        # Subtract original from compressed
        image_difference = compare_images(original_image, image_compressed, 'diff')
        image_difference = img_as_ubyte(image_difference)

        max_diff = np.amax(image_difference)
        
        # Determine if it's tampered by looking at the maximum difference
        tampering_probability = float(max_diff) / 255.0
        
        flags = []
        if tampering_probability > 0.4:
            flags.append("HIGH_ELA_DIFFERENTIAL")

        return {
            "tampering_probability": tampering_probability,
            "suspicious_regions": [],
            "flags_raised": flags,
            "ela_heatmap_url": None
        }

    except Exception as e:
        logger.error(f"ELA processing failed: {e}")
        return {
            "tampering_probability": 0.0,
            "suspicious_regions": [],
            "flags_raised": ["ELA_PROCESSING_ERROR"],
            "ela_heatmap_url": None
        }
