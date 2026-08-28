# Integrated model repositories

This application preserves and calls the following locally cloned repositories through adapters. Their outputs are displayed as separate signals and are not combined into a risk score.

## `killerzman/Python-ELA` — Model 1

- Repository: <https://github.com/killerzman/Python-ELA>
- Purpose: Error Level Analysis (ELA) visualisation; it is not a trained tampering/authenticity classifier.
- Input: a raster image. The adapter uses the already preprocessed first document page, recompresses it as JPEG at quality 90, and calculates the image difference as in `ELA.py`.
- Output: `ela_signal_generated`, a `mean_error_level` metric, and no score/confidence. The metric is explicitly not a probability of tampering.
- Weights/runtime: no model weights and no GPU; CPU-only Pillow/NumPy implementation. The original repo lists scikit-image, imageio, matplotlib, and Tk for its GUI, but the adapter only implements the repository's non-GUI ELA core.
- Execution: adapter call `ElaAdapter.predict(processed_page_bytes)`.

## `SerdarHelli/MRZ_Passport_Reader_From_Image` — Model 2

- Repository: <https://github.com/SerdarHelli/MRZ_Passport_Reader_From_Image>
- Purpose: passport MRZ segmentation, MRZ OCR, and optional passport-face detection. It does not establish document authenticity.
- Input: a clear whole-passport raster image; only runs when the rule-based type detector identifies `passport`.
- Output: MRZ detected/not-detected, `face_detected`, and (when OCR returns values) the mean EasyOCR recognition confidence. This score is OCR recognition confidence, not authenticity confidence.
- Weights/runtime: bundled TFLite MRZ segmentation model and Caffe face-detector weights. Requires CPU OpenCV, TensorFlow/TFLite, EasyOCR and its PyTorch runtime; GPU is optional and disabled by the adapter.
- Execution: `MRZReader.predict(image, do_facedetect=True, preprocess_config={})`. If the optional ML stack is not installed, the result reports `status: error` while the rest of the pipeline continues.

## `serengil/deepface` — Model 3

- Repository: <https://github.com/serengil/deepface>
- Purpose: face verification between the portrait found by Model 2 and an optional user-provided selfie. It is neither a document-authenticity nor liveness decision in this integration.
- Input: an extracted passport face plus JPEG/PNG selfie. It is skipped for a missing selfie, non-passport/incompatible document, or no detected document face. DeepFace itself reports detection failures, including unusable/multiple-face cases, as an adapter error without ending the request.
- Output: `same_face`/`different_face`, DeepFace's embedding `distance`, and its model threshold. Lower distance means greater embedding similarity; distance is not a probability.
- Weights/runtime: DeepFace downloads/loads the selected `Facenet512` recognition weights on first successful execution. TensorFlow/Keras and OpenCV are required; CPU works, and GPU is optional depending on the installed TensorFlow runtime.
- Execution: `DeepFace.verify(..., model_name="Facenet512", detector_backend="opencv", enforce_detection=True)`.

All adapters expose `load()`, `predict(...)`, and `health_check()`. No adapter changes the source repositories.
