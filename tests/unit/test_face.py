from app.modules.biometrics import face_verifier


def test_face_module_imports() -> None:
    assert face_verifier is not None
