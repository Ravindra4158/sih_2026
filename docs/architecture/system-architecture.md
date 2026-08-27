# System architecture

The future system separates the officer dashboard, FastAPI API, domain modules, and persistence/integration boundaries. The backend routes delegate to services; services will coordinate modules for OCR, validation, tampering, biometrics, and explainable risk scoring. No external or government integration is currently implemented.
