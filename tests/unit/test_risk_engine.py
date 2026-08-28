from app.risk import RiskEngine, SignalNormalizer


def assess(models=None, validation=None, document_type="passport"):
    signals = SignalNormalizer().normalize(models or {}, validation or {}, {"status": "success"})
    return RiskEngine().assess(signals, document_type)[0]


def test_face_mismatch_is_suspicious_but_not_an_authenticity_claim() -> None:
    result = assess({"deepface": {"status": "success", "prediction": "different_face", "score": 0.7}})
    assert result["score"] == 45
    assert result["decision"] == "SUSPICIOUS"


def test_expiry_is_a_controlled_override() -> None:
    result = assess(validation={"expiry_date": {"status": "failed"}})
    assert result["decision"] == "EXPIRED"
    assert result["override"] is True


def test_unavailable_model_makes_verification_incomplete() -> None:
    result = assess({"mrz_passport_reader": {"status": "error", "error": "unavailable"}})
    assert result["decision"] == "VERIFICATION_INCOMPLETE"


def test_genuine_like_available_signals_pass_at_low_risk() -> None:
    result = assess({"python_ela": {"status": "success", "prediction": "ela_signal_generated"}})
    assert result["score"] == 0
    assert result["decision"] == "PASS"


def test_combined_identity_and_validation_signals_are_high_risk() -> None:
    result = assess({"deepface": {"status": "success", "prediction": "different_face"}}, {"passport_number_format": {"status": "failed"}})
    assert result["score"] == 60
    assert result["level"] == "HIGH"
