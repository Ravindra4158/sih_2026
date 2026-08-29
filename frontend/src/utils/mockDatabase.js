const INITIAL_CASES = [
  {
    id: "BR-2026-00125",
    date: "25 Aug 2026, 10:25 AM",
    name: "Kumar Sandeep",
    docType: "Aadhaar Card",
    docNo: "1234 5678 9012",
    riskLevel: "Low",
    status: "Approved",
    officer: "Rajesh K.",
    reviewNotes: "Document validated successfully. Details align with registration database.",
    details: {
      dob: "15/08/1990",
      nationality: "Indian",
      gender: "Male",
      issueDate: "12/04/2018",
      expiryDate: "N/A"
    },
    iqa: {
      blurScore: 0.04,
      glareDetected: false,
      passQualityCheck: true
    },
    ocr: {
      rawText: "GOVERNMENT OF INDIA\nKumar Sandeep\nDOB: 15/08/1990\nMALE\n1234 5678 9012\nHELPING HANDS ROAD\nNEW DELHI",
      parsedFields: {
        "Document Type": "Aadhaar Card",
        "Document Number": "1234 5678 9012",
        "Full Name": "Kumar Sandeep",
        "Date of Birth": "15/08/1990",
        "Gender": "Male",
        "Address": "Helping Hands Road, New Delhi"
      },
      confidenceScores: {
        "Document Number": 99.4,
        "Full Name": 98.2,
        "Date of Birth": 97.8,
        "Gender": 99.1
      }
    },
    forensics: {
      tamperDetected: false,
      tamperConfidenceScore: 0.05,
      anomalyRegions: [],
      elaHeatmapBase64: null
    },
    biometrics: {
      faceMatchScore: 94.6,
      verificationStatus: "MATCH_CONFIRMED",
      livenessCheck: {
        isLive: true,
        blinkDetected: true,
        minimumEar: 0.18,
        padScore: 0.96
      },
      earFrameSeries: [0.32, 0.31, 0.33, 0.18, 0.16, 0.32, 0.33, 0.32]
    },
    warnings: []
  },
  {
    id: "BR-2026-00124",
    date: "25 Aug 2026, 10:18 AM",
    name: "Ramesh Yadav",
    docType: "PAN Card",
    docNo: "ABCDE1234F",
    riskLevel: "Medium",
    status: "Pending",
    officer: "Rajesh K.",
    reviewNotes: "",
    details: {
      dob: "22/11/1985",
      nationality: "Indian",
      gender: "Male",
      issueDate: "10/06/2015",
      expiryDate: "N/A"
    },
    iqa: {
      blurScore: 0.11,
      glareDetected: true,
      passQualityCheck: true
    },
    ocr: {
      rawText: "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nRAMESH YADAV\nFATHER: SH. SUBHASH YADAV\nDOB: 22/11/1985\nABCDE1234F\nSIGNATURE",
      parsedFields: {
        "Document Type": "PAN Card",
        "Document Number": "ABCDE1234F",
        "Full Name": "Ramesh Yadav",
        "Father's Name": "Subhash Yadav",
        "Date of Birth": "22/11/1985"
      },
      confidenceScores: {
        "Document Number": 96.1,
        "Full Name": 95.5,
        "Date of Birth": 92.0
      }
    },
    forensics: {
      tamperDetected: false,
      tamperConfidenceScore: 0.15,
      anomalyRegions: [],
      elaHeatmapBase64: null
    },
    biometrics: {
      faceMatchScore: 78.4,
      verificationStatus: "MANUAL_REVIEW_REQUIRED",
      livenessCheck: {
        isLive: true,
        blinkDetected: false,
        minimumEar: 0.28,
        padScore: 0.72
      },
      earFrameSeries: [0.30, 0.29, 0.30, 0.28, 0.29, 0.30, 0.29, 0.30]
    },
    warnings: [
      "GLARE_DETECTED: Optical reflection found near document signature zone.",
      "BIOMETRIC_BORDERLINE: Face matching score is 78.4% (threshold: 80%).",
      "LIVENESS_WARNING: Blink detection was not confirmed (no eye closure observed)."
    ]
  },
  {
    id: "BR-2026-00123",
    date: "25 Aug 2026, 10:10 AM",
    name: "Mohd. Arif",
    docType: "Passport",
    docNo: "P9876543",
    riskLevel: "High",
    status: "Rejected",
    officer: "Rajesh K.",
    reviewNotes: "Document exhibits clear structural alteration under Error Level Analysis. Photo does not match standard passport grid alignment.",
    details: {
      dob: "05/04/1993",
      nationality: "Indian",
      gender: "Male",
      issueDate: "15/01/2016",
      expiryDate: "14/01/2026"
    },
    iqa: {
      blurScore: 0.02,
      glareDetected: false,
      passQualityCheck: true
    },
    ocr: {
      rawText: "REPUBLIC OF INDIA\nPASSPORT\nType: P  Country Code: IND  Passport No: P9876543\nSurname: ARIF\nGiven Names: MOHAMMED\nNationality: INDIAN\nDate of birth: 05 APR 1993\nDate of issue: 15 JAN 2016  Date of expiry: 14 JAN 2026\nP<INDARIFF<<MOHAMMED<<<<<<<<<<<<<<<<<<<<<<<<\nP9876543<3IND9304051M2601148<<<<<<<<<<<<<<<08",
      parsedFields: {
        "Document Type": "Passport (TD3)",
        "Passport Number": "P9876543",
        "Surname": "ARIF",
        "Given Names": "MOHAMMED",
        "Nationality": "INDIAN",
        "Date of Birth": "05/04/1993",
        "Date of Issue": "15/01/2016",
        "Date of Expiry": "14/01/2026",
        "Gender": "Male"
      },
      confidenceScores: {
        "Passport Number": 99.8,
        "Full Name": 99.5,
        "MRZ Text": 98.7
      }
    },
    forensics: {
      tamperDetected: true,
      tamperConfidenceScore: 91.2,
      anomalyRegions: [
        {
          region_label: "Photo Alteration Region",
          bounding_box: { x: 45, y: 80, width: 110, height: 135 },
          error_variance: 64.2
        },
        {
          region_label: "Text Alteration (Expiry Date)",
          bounding_box: { x: 280, y: 190, width: 120, height: 25 },
          error_variance: 48.7
        }
      ],
      elaHeatmapBase64: "MOCK_ELA_HEATMAP_DATA"
    },
    biometrics: {
      faceMatchScore: 42.1,
      verificationStatus: "MISMATCH",
      livenessCheck: {
        isLive: false,
        blinkDetected: false,
        minimumEar: 0.31,
        padScore: 0.34
      },
      earFrameSeries: [0.33, 0.32, 0.33, 0.33, 0.32, 0.31, 0.33, 0.32]
    },
    warnings: [
      "DOCUMENT_EXPIRED: Expiry date 14/01/2026 is in the past.",
      "ELA_TAMPERING_DETECTED: High digital re-compression variance in candidate photograph and date areas.",
      "BIOMETRIC_MISMATCH: Face comparison score is 42.1% (fails identity threshold).",
      "MRZ_CHECK_DIGIT_FAILURE: MRZ check digit for expiry date (8) does not compute properly."
    ]
  },
  {
    id: "BR-2026-00122",
    date: "25 Aug 2026, 10:02 AM",
    name: "Pooja Sharma",
    docType: "Driving Licence",
    docNo: "DL-1220150034",
    riskLevel: "Low",
    status: "Approved",
    officer: "Rajesh K.",
    reviewNotes: "Driver license matches credentials.",
    details: {
      dob: "18/02/1995",
      nationality: "Indian",
      gender: "Female",
      issueDate: "20/03/2015",
      expiryDate: "19/03/2035"
    },
    iqa: {
      blurScore: 0.05,
      glareDetected: false,
      passQualityCheck: true
    },
    ocr: {
      rawText: "INDIAN UNION DRIVING LICENCE\nDL-1220150034\nPOOJA SHARMA\nW/O / D/O: SUNIL SHARMA\nDOB: 18/02/1995\nCOV: LMV, MCWG\nVALID TILL: 19/03/2035",
      parsedFields: {
        "Document Type": "Driving Licence",
        "Document Number": "DL-1220150034",
        "Full Name": "Pooja Sharma",
        "Date of Birth": "18/02/1995",
        "Valid Till": "19/03/2035"
      },
      confidenceScores: {
        "Document Number": 98.9,
        "Full Name": 98.4,
        "Date of Birth": 97.2
      }
    },
    forensics: {
      tamperDetected: false,
      tamperConfidenceScore: 0.08,
      anomalyRegions: [],
      elaHeatmapBase64: null
    },
    biometrics: {
      faceMatchScore: 91.2,
      verificationStatus: "MATCH_CONFIRMED",
      livenessCheck: {
        isLive: true,
        blinkDetected: true,
        minimumEar: 0.15,
        padScore: 0.94
      },
      earFrameSeries: [0.31, 0.32, 0.15, 0.16, 0.32, 0.32, 0.31, 0.32]
    },
    warnings: []
  }
];

export const mockDatabase = {
  initialize() {
    let cases = [];
    try {
      cases = JSON.parse(localStorage.getItem("ai_border_cases")) || [];
    } catch {
      cases = [];
    }

    let updated = false;
    // Self-healing merge to guarantee default cases always exist
    INITIAL_CASES.forEach(defCase => {
      if (!cases.some(c => c.id === defCase.id)) {
        cases.push(defCase);
        updated = true;
      }
    });

    if (updated || !localStorage.getItem("ai_border_cases") || cases.length === 0) {
      localStorage.setItem("ai_border_cases", JSON.stringify(cases));
    }
  },

  getAllCases() {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem("ai_border_cases"));
    } catch {
      return INITIAL_CASES;
    }
  },

  getCaseById(id) {
    const cases = this.getAllCases();
    return cases.find(c => c.id === id) || null;
  },

  saveCase(newCase) {
    this.initialize();
    const cases = this.getAllCases();
    const index = cases.findIndex(c => c.id === newCase.id);
    if (index !== -1) {
      cases[index] = newCase;
    } else {
      cases.unshift(newCase);
    }
    localStorage.setItem("ai_border_cases", JSON.stringify(cases));
    return newCase;
  },

  updateStatus(id, status, notes = "") {
    const caseData = this.getCaseById(id);
    if (caseData) {
      caseData.status = status;
      if (notes) {
        caseData.reviewNotes = notes;
      }
      this.saveCase(caseData);
      return caseData;
    }
    return null;
  }
};
