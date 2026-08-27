"""Unit tests use only synthetic text, never real identity records."""
from app.modules.ocr.field_extractor import DocumentFieldExtractor
from app.modules.validation.document_validator import DocumentValidator


def test_aadhaar_extraction_and_format_validation() -> None:
    fields = DocumentFieldExtractor().extract("aadhaar", "UIDAI Aadhaar Name: TEST USER 1234 5678 9012")

    assert fields["aadhaar_number"]["value"] == "1234 5678 9012"
    assert DocumentValidator().validate("aadhaar", fields)["aadhaar_number_format"]["status"] == "passed"


def test_passport_extraction_and_expiry_validation() -> None:
    text = "PASSPORT Republic of India Passport Number: A1234567 Date of Expiry: 01/01/2099"
    fields = DocumentFieldExtractor().extract("passport", text)

    assert fields["passport_number"]["value"] == "A1234567"
    assert DocumentValidator().validate("passport", fields)["expiry_date"]["status"] == "passed"


def test_pan_extraction_and_number_validation() -> None:
    fields = DocumentFieldExtractor().extract("pan", "PAN CARD Name: TEST USER ABCDE1234F")

    assert fields["pan_number"]["value"] == "ABCDE1234F"
    assert DocumentValidator().validate("pan", fields)["pan_number_format"]["status"] == "passed"


def test_driving_licence_extraction_and_number_validation() -> None:
    text = "DRIVING LICENCE Licence No: DL-0420110012345 Valid Till: 01/01/2099"
    fields = DocumentFieldExtractor().extract("driving_licence", text)

    assert fields["licence_number"]["value"] == "DL-0420110012345"
    assert DocumentValidator().validate("driving_licence", fields)["licence_number_format"]["status"] == "passed"


def test_invalid_date_is_a_validation_signal() -> None:
    fields = {"date_of_birth": {"value": "31/31/2020"}, "pan_number": {"value": "ABCDE1234F"}}

    assert DocumentValidator().validate("pan", fields)["date_of_birth"]["status"] == "failed"
