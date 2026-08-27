from app.modules.validation.mrz_checksum import calculate_check_digit, is_valid_check_digit


def test_mrz_check_digit() -> None:
    assert calculate_check_digit("123456789") == 7
    assert is_valid_check_digit("123456789", "7")
