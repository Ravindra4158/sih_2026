# Manual Testing Checklist

Use only synthetic or legally approved samples. Record actual result, PASS/FAIL, and notes beside each case.

| Area | Case | Expected result | Actual result | PASS/FAIL | Notes |
|---|---|---|---|---|---|
| Valid | Clear synthetic document | Accepted; type/OCR/validation shown |  |  |  |
| Valid | Low resolution | Accepted or useful OCR limitation |  |  |  |
| Valid | Rotated | EXIF/orientation preprocessing attempted |  |  |  |
| Valid | Cropped | Partial fields and limitations shown |  |  |  |
| Valid | PDF | Pages rendered and processed |  |  |  |
| Valid | Image | PNG/JPEG processed |  |  |  |
| Invalid | Random image | Unknown or incomplete, no crash |  |  |  |
| Invalid | Blank image | Useful OCR/type limitation |  |  |  |
| Invalid | Corrupt file | Rejected with actionable error |  |  |  |
| Invalid | Unsupported format | 415 response |  |  |  |
| Invalid | Oversized file | 413 response |  |  |  |
| Tampering | Altered text | Synthetic manipulation signal/limitation shown |  |  |  |
| Tampering | Replaced photo | Face/model evidence shown where available |  |  |  |
| Tampering | Modified number | Format/field failure shown |  |  |  |
| Tampering | Copy/paste region | ELA evidence shown as non-calibrated signal |  |  |  |
| Tampering | Changed expiry | Expiry failure and elevated decision |  |  |  |
| Tampering | Altered layout | Classification/validation limitation shown |  |  |  |
| OCR | Clear, blurry, rotated, low contrast text | Status and confidence/limitation are visible |  |  |  |
| OCR | Multi-page PDF | All pages represented |  |  |  |
| Face | Matching, non-matching, no face, multiple faces, low quality | Explicit match/mismatch/skipped/error state |  |  |  |
| Failure | Model unavailable | Other stages continue; incomplete decision is explicit |  |  |  |
| Failure | OCR/preprocessing failure | Incomplete result and reason, no raw file retained |  |  |  |
| Failure | Timeout/backend disconnect | Actionable frontend error and retry path |  |  |  |

Synthetic tampering must be created from generated/sample assets only; never alter real identity documents.
