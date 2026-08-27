from app.modules.ocr import mrz_parser


def test_mrz_parser_module_imports() -> None:
    assert mrz_parser is not None
