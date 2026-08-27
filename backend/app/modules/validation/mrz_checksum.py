"""ICAO 9303 MRZ check-digit helper."""


def calculate_check_digit(value: str) -> int:
    """Calculate the standard MRZ check digit for permitted MRZ characters."""
    weights = (7, 3, 1)
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<"
    try:
        return sum(alphabet.index(char) * weights[index % 3] for index, char in enumerate(value)) % 10
    except ValueError as error:
        raise ValueError("MRZ value contains an unsupported character") from error


def is_valid_check_digit(value: str, check_digit: str) -> bool:
    """Return whether a single supplied MRZ check digit matches `value`."""
    return len(check_digit) == 1 and check_digit.isdigit() and calculate_check_digit(value) == int(check_digit)
