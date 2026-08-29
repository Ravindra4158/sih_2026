import { Header, Panel } from "./DashboardLayout";
import { Bell, Upload, FileText, Camera, ArrowRight, ScanFace } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Screening() {
  const [doc1, setDoc1] = useState(null);
  const [doc2, setDoc2] = useState(null);
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    // Simulate processing
    navigate("/dashboard");
  };

  return (
    <>
      <header className="mobile-header">
        <button className="menu-btn">☰</button>
        <h2>New Screening</h2>
        <Bell className="bell-icon" size={20} />
      </header>

      <main className="content screening-content">
        <div className="screening-banner">
          <div className="banner-icon">
            <ScanFace size={24} />
          </div>
          <div className="banner-text">
            <h3>Start New Screening</h3>
            <p>Upload documents and capture live photo to begin the verification process.</p>
          </div>
        </div>

        <form onSubmit={handleStart} className="screening-form">
          <h3 className="section-title">Upload Required Documents</h3>
          
          <div className="upload-card">
            <div className="upload-icon-box blue-box">
              <FileText size={24} />
            </div>
            <div className="upload-details">
              <h4>Document 1</h4>
              <p>Upload front side of the identity document (e.g., Aadhaar, Passport, ID Card, etc.)</p>
            </div>
            <div className="upload-action">
              <label className="btn-upload">
                <Upload size={16} /> Upload File
                <input type="file" onChange={(e) => setDoc1(e.target.files[0])} accept=".jpg,.png,.pdf" hidden />
              </label>
              <div className="upload-meta">
                <span>JPG, PNG, PDF</span>
                <span>Max size 5MB</span>
              </div>
            </div>
          </div>

          <div className="upload-card">
            <div className="upload-icon-box green-box">
              <FileText size={24} />
            </div>
            <div className="upload-details">
              <h4>Document 2</h4>
              <p>Upload back side / additional document (e.g., Address Proof, Driving License, Visa, etc.)</p>
            </div>
            <div className="upload-action">
              <label className="btn-upload text-green">
                <Upload size={16} /> Upload File
                <input type="file" onChange={(e) => setDoc2(e.target.files[0])} accept=".jpg,.png,.pdf" hidden />
              </label>
              <div className="upload-meta">
                <span>JPG, PNG, PDF</span>
                <span>Max size 5MB</span>
              </div>
            </div>
          </div>

          <h3 className="section-title">Live Photo Capture</h3>
          
          <div className="upload-card">
            <div className="upload-icon-box purple-box">
              <ScanFace size={24} />
            </div>
            <div className="upload-details">
              <h4>Live Photo</h4>
              <p>Capture live photo of the person for face verification</p>
            </div>
            <div className="upload-action">
              <label className="btn-upload text-purple">
                <Camera size={16} /> Capture Photo
                <input type="file" onChange={(e) => setPhoto(e.target.files[0])} accept="image/*" capture="user" hidden />
              </label>
              <div className="upload-meta">
                <span>JPG, PNG</span>
                <span>Max size 2MB</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block btn-start-screening">
            Start Screening <ArrowRight size={18} />
          </button>
        </form>
      </main>
    </>
  );
}
