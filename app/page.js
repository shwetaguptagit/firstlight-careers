'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function UploadIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function SunIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const isSubmitting = useRef(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('theme') === 'dark';
  });
  const [themeOverride, setThemeOverride] = useState(null);
  const [jdMode, setJdMode] = useState('text');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [jdError, setJdError] = useState('');
  const [cvError, setCvError] = useState('');
  const [loading, setLoading] = useState(false);

  const jdFileRef = useRef(null);
  const cvFileRef = useRef(null);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    sessionStorage.setItem('theme', next ? 'dark' : 'light');
  }

  const c = isDark ? {
    pageBg:        '#05080f',
    cardBg:        '#0c1220',
    cardBorder:    '#16223a',
    inputBg:       '#0a0f1a',
    inputBorder:   '#16223a',
    toggleBg:      '#0a0f1a',
    toggleBorder:  '#16223a',
    activeBtn:     '#142035',
    activeShadow:  '0 1px 4px rgba(0,0,0,0.5)',
    textPrimary:   '#c8d4e8',
    textSecondary: '#7888a4',
    textMuted:     '#3d506a',
    badgeBg:       '#0e1828',
    badgeBorder:   '#162638',
    ctaBg:         '#c8d4e8',
    ctaHover:      '#aec0d8',
    ctaText:       '#05080f',
    uploadBorder:  '#1a2840',
    uploadBg:      '#0a0f1a',
    uploadIcon:    '#3d506a',
    successBorder: '#163028',
    successBg:     '#0a1a18',
    successText:   '#c8d4e8',
    errorText:     '#c08080',
    themeBtnBg:    '#0c1220',
    themeBtnBorder:'#16223a',
    themeBtnColor: '#50708a',
  } : {
    pageBg:        '#f9fafb',
    cardBg:        '#ffffff',
    cardBorder:    '#e5e7eb',
    inputBg:       '#f9fafb',
    inputBorder:   '#e5e7eb',
    toggleBg:      '#f3f4f6',
    toggleBorder:  '#e5e7eb',
    activeBtn:     '#ffffff',
    activeShadow:  '0 1px 3px rgba(0,0,0,0.1)',
    textPrimary:   '#111827',
    textSecondary: '#4b5563',
    textMuted:     '#6b7280',
    badgeBg:       '#f3f4f6',
    badgeBorder:   '#e5e7eb',
    ctaBg:         '#111827',
    ctaHover:      '#374151',
    ctaText:       '#ffffff',
    uploadBorder:  '#d1d5db',
    uploadBg:      '#f9fafb',
    uploadIcon:    '#6b7280',
    successBorder: '#d1d5db',
    successBg:     '#f3f4f6',
    successText:   '#111827',
    errorText:     '#ef4444',
    themeBtnBg:    '#f3f4f6',
    themeBtnBorder:'#e5e7eb',
    themeBtnColor: '#4b5563',
  };

  function validateFile(file) {
    const ok = file.name.endsWith('.pdf') || file.name.endsWith('.docx');
    return ok ? null : 'Unsupported format — please upload a PDF or DOCX file.';
  }

  function handleJdFile(file) {
    const err = validateFile(file);
    if (err) { setJdError(err); return; }
    setJdFile(file); setJdError('');
  }

  function handleCvFile(file) {
    const err = validateFile(file);
    if (err) { setCvError(err); return; }
    setCvFile(file); setCvError('');
  }

  async function handleSubmit() {
    if (isSubmitting.current) return; 
    isSubmitting.current = true; 
    let valid = true;

    if (jdMode === 'text' && !jdText.trim()) {
      setJdError('Please paste the job description text.'); valid = false;
    } else if (jdMode === 'file' && !jdFile) {
      setJdError('Please upload a job description file.'); valid = false;
    } else { setJdError(''); }

    if (!cvFile) {
      setCvError('Please upload your CV.'); valid = false;
    } else { setCvError(''); }

    if (!valid) return;

    const jdSignature = jdMode === 'text'
      ? `text:${jdText.length}:${jdText.slice(0, 100)}`
      : `file:${jdFile.name}:${jdFile.size}`;
    const cvSignature = `${cvFile.name}:${cvFile.size}`;
    const fingerprint = `${jdSignature}|${cvSignature}`;

    const cachedResult = sessionStorage.getItem('analysisResult');
    const cachedFingerprint = sessionStorage.getItem('analysisFingerprint');

    if (cachedResult && cachedFingerprint === fingerprint) {
      router.push('/results');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('jdMode', jdMode);
      if (jdMode === 'text') formData.append('jdText', jdText);
      else formData.append('jdFile', jdFile);
      formData.append('cvFile', cvFile);

      const res = await fetch('/api/analyse', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      const { jdText: extractedJd, cvText: extractedCv, ...analysisResult } = data;
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      sessionStorage.setItem('analysisFingerprint', fingerprint);
      sessionStorage.setItem('jobDescription', extractedJd || '');
      sessionStorage.setItem('cvText', extractedCv || '');
      router.push('/results');
    } catch {
      setJdError('Something went wrong. Please try again.');
      setLoading(false);
      isSubmitting.current = false; 
    }
  }

  function uploadZoneStyle(hasFile) {
    return {
      border: `1px dashed ${hasFile ? c.successBorder : c.uploadBorder}`,
      borderRadius: '10px',
      padding: '28px 24px',
      textAlign: 'center',
      cursor: 'pointer',
      background: hasFile ? c.successBg : c.uploadBg,
      transition: 'background 0.15s',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    };
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: c.pageBg, padding: '64px 16px', fontFamily: 'var(--font-geist-sans, sans-serif)', transition: 'background-color 0.2s' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Logo + theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, margin: 0 }}>
            <span style={{ color: c.textPrimary }}>FirstLight</span> Careers
          </p>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: c.themeBtnColor,
              background: c.themeBtnBg,
              border: `1px solid ${c.themeBtnBorder}`,
              borderRadius: '8px', padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isDark ? <SunIcon color={c.themeBtnColor} /> : <MoonIcon color={c.themeBtnColor} />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* JD section */}
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: c.textPrimary }}>Job description</span>

            <div style={{ display: 'flex', gap: '4px', background: c.toggleBg, border: `1px solid ${c.toggleBorder}`, borderRadius: '8px', padding: '3px' }}>
              {['text', 'file'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setJdMode(mode); setJdError(''); }}
                  style={{
                    padding: '5px 14px', fontSize: '13px', border: 'none',
                    borderRadius: '6px', cursor: 'pointer',
                    fontWeight: jdMode === mode ? 500 : 400,
                    background: jdMode === mode ? c.activeBtn : 'transparent',
                    color: jdMode === mode ? c.textPrimary : c.textSecondary,
                    boxShadow: jdMode === mode ? c.activeShadow : 'none',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >
                  {mode === 'text' ? 'Paste text' : 'Upload file'}
                </button>
              ))}
            </div>
          </div>

          {jdMode === 'text' && (
            <textarea
              style={{
                width: '100%', minHeight: '160px', resize: 'vertical',
                background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                borderRadius: '10px', padding: '12px', fontSize: '14px',
                color: c.textPrimary, lineHeight: 1.6, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          )}

          {jdMode === 'file' && (
            <>
              <input type="file" accept=".pdf,.docx" ref={jdFileRef} style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleJdFile(e.target.files[0])} />
              <div style={uploadZoneStyle(!!jdFile)}
                onClick={() => jdFileRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleJdFile(f); }}>
                {jdFile ? (
                  <>
                    <CheckIcon color={c.successText} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: c.successText, margin: 0 }}>{jdFile.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setJdFile(null); jdFileRef.current.value = ''; }}
                      style={{ marginTop: '8px', fontSize: '12px', color: c.errorText, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <UploadIcon color={c.uploadIcon} />
                    <p style={{ fontSize: '14px', color: c.textSecondary, margin: 0 }}>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '12px', color: c.textMuted, marginTop: '4px', marginBottom: 0 }}>PDF or DOCX</p>
                  </>
                )}
              </div>
            </>
          )}

          {jdError && <p style={{ marginTop: '8px', fontSize: '12px', color: c.errorText }}>⚠ {jdError}</p>}
        </div>

        {/* CV section */}
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: c.textPrimary }}>Your CV</span>
            <span style={{ fontSize: '11px', color: c.textMuted, background: c.badgeBg, border: `1px solid ${c.badgeBorder}`, borderRadius: '6px', padding: '3px 8px' }}>
              PDF or DOCX
            </span>
          </div>

          <input type="file" accept=".pdf,.docx" ref={cvFileRef} style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleCvFile(e.target.files[0])} />
          <div style={uploadZoneStyle(!!cvFile)}
            onClick={() => cvFileRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCvFile(f); }}>
            {cvFile ? (
              <>
                <CheckIcon color={c.successText} />
                <p style={{ fontSize: '14px', fontWeight: 500, color: c.successText, margin: 0 }}>{cvFile.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setCvFile(null); cvFileRef.current.value = ''; }}
                  style={{ marginTop: '8px', fontSize: '12px', color: c.errorText, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Remove
                </button>
              </>
            ) : (
              <>
                <UploadIcon color={c.uploadIcon} />
                <p style={{ fontSize: '14px', color: c.textSecondary, margin: 0 }}>Click to upload or drag and drop</p>
                <p style={{ fontSize: '12px', color: c.textMuted, marginTop: '4px', marginBottom: 0 }}>PDF or DOCX</p>
              </>
            )}
          </div>

          {cvError && <p style={{ marginTop: '8px', fontSize: '12px', color: c.errorText }}>⚠ {cvError}</p>}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = c.ctaHover; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = c.ctaBg; }}
          style={{
            width: '100%', padding: '14px', fontSize: '15px', fontWeight: 500,
            color: c.ctaText, backgroundColor: c.ctaBg,
            border: 'none', borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background-color 0.15s', fontFamily: 'inherit',
          }}
        >
          {loading ? 'Analysing…' : '✦ Analyse fit'}
        </button>

      </div>
    </main>
  );
}
