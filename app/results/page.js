'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, LevelFormat, BorderStyle
} from 'docx';

// ── Static SVG icons ──────────────────────────────────────────────────────────

function SunIcon({ color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon({ color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ChevronIcon({ color, open }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.24s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── AccordionCard: module-level to prevent remount on parent re-render ────────
function AccordionCard({ isOpen, onToggle, headerLeft, headerRight, dividerColor, cardBg, cardBorder, textMuted, children }) {
  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', marginBottom: '8px', overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 20px', gap: '12px', transition: 'opacity 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.78'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {headerLeft}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {headerRight}
          <ChevronIcon color={textMuted} open={isOpen} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.26s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ height: '1px', background: dividerColor }} />
          <div style={{ padding: '18px 20px 22px' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Results() {
  const router = useRouter();

  const [data, setData]         = useState(null);
  const [jd, setJd]             = useState('');
  const [cvText, setCvText]     = useState('');
  const [isDark, setIsDark]     = useState(false);
  const [themeOverride, setThemeOverride] = useState(null);

  const [charter, setCharter]           = useState(null);
  const [charterStatus, setCharterStatus] = useState(null);

  const [training, setTraining]           = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);

  const [cvRewrite, setCvRewrite]           = useState(null);
  const [cvRewriteStatus, setCvRewriteStatus] = useState(null);

  const [openSections, setOpenSections] = useState({ fitScore: true, strengths: false, gaps: false, prep: false });
  const [drawer, setDrawer] = useState(null); // 'charter' | 'training' | 'cvrewrite' | null

  useEffect(() => {
    const saved = sessionStorage.getItem('theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('analysisResult');
    const savedJd = sessionStorage.getItem('jobDescription');
    const savedCv = sessionStorage.getItem('cvText');
    if (!raw) { router.push('/'); return; }
    try {
      setData(JSON.parse(raw));
      setJd(savedJd || '');
      setCvText(savedCv || '');
    } catch { router.push('/'); }
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setDrawer(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (!data) return null;

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    sessionStorage.setItem('theme', next ? 'dark' : 'light');
  }
  function toggleSection(key) {
    setOpenSections(p => ({ ...p, [key]: !p[key] }));
  }

  // ── Color tokens ──────────────────────────────────────────────────────────
  const c = isDark ? {
    pageBg:'#05080f', cardBg:'#0c1220', cardBorder:'#16223a',
    inputBg:'#0a0f1a', textPrimary:'#c8d4e8', textSecondary:'#7888a4', textMuted:'#3d506a',
    ctaBg:'#c8d4e8', ctaText:'#05080f',
    errorText:'#c08080', successText:'#5a9e84',
    warnBg:'#100d00', warnBorder:'#5a3a0a', warnText:'#b8902a',
    barTrack:'#14203a', divider:'#0f1a2c',
    gapHighBg:'#110508', gapHighBorder:'#4a1818', gapHighText:'#b88888',
    gapMedBg:'#110d00',  gapMedBorder:'#5a3a0a',  gapMedText:'#b8902a',
    gapLowBg:'#041410',  gapLowBorder:'#0a4535',  gapLowText:'#4e9070',
    docCardBg:'#080d18', docCardBorder:'#0f1a2c',
    charterAccent:'#8878c0',
    riskBg:'#100508', riskBorder:'#361212',
    trainingBorder:'#0c2038', trainingAccent:'#5888b8',
    resourceBg:'#070c1a', resourceBorder:'#0f1e34',
    freeBadgeBg:'#041410', freeBadgeText:'#4e9070',
    paidBadgeBg:'#110d00', paidBadgeText:'#b8902a',
    themeBtnBg:'#0c1220', themeBtnBorder:'#16223a', themeBtnColor:'#50708a',
    badgeBg:'#0e1828', badgeBorder:'#162638',
    drawerBg:'#080e1c', drawerHeaderBg:'#0a1220',
    cvAccent:'#5a9e84', cvBg:'#041410', cvBorder:'#0a4535',
    changeLogBg:'#070c1a', changeLogBorder:'#0f1a2c',
  } : {
    pageBg:'#f5f5f5', cardBg:'#ffffff', cardBorder:'#e5e7eb',
    inputBg:'#f9fafb', textPrimary:'#111827', textSecondary:'#374151', textMuted:'#6b7280',
    ctaBg:'#111827', ctaText:'#ffffff',
    errorText:'#ef4444', successText:'#16a34a',
    warnBg:'#fffbeb', warnBorder:'#fcd34d', warnText:'#92400e',
    barTrack:'#f3f4f6', divider:'#f3f4f6',
    gapHighBg:'#fef2f2', gapHighBorder:'#fecaca', gapHighText:'#991b1b',
    gapMedBg:'#fffbeb',  gapMedBorder:'#fcd34d',  gapMedText:'#92400e',
    gapLowBg:'#f0fdf4',  gapLowBorder:'#bbf7d0',  gapLowText:'#166534',
    docCardBg:'#f9fafb', docCardBorder:'#e5e7eb',
    charterAccent:'#4f46e5',
    riskBg:'#fff5f5', riskBorder:'#fecaca',
    trainingBorder:'#a5f3fc', trainingAccent:'#0891b2',
    resourceBg:'#ffffff', resourceBorder:'#e0f2fe',
    freeBadgeBg:'#f0fdf4', freeBadgeText:'#16a34a',
    paidBadgeBg:'#fffbeb', paidBadgeText:'#92400e',
    themeBtnBg:'#f3f4f6', themeBtnBorder:'#e5e7eb', themeBtnColor:'#4b5563',
    badgeBg:'#f3f4f6', badgeBorder:'#e5e7eb',
    drawerBg:'#ffffff', drawerHeaderBg:'#fafafa',
    cvAccent:'#16a34a', cvBg:'#f0fdf4', cvBorder:'#bbf7d0',
    changeLogBg:'#f9fafb', changeLogBorder:'#e5e7eb',
  };

  const { score, companyName, scoreBreakdown, strengths, gaps, lowFit } = data;

  const scoreColor = score >= 80
    ? (isDark ? '#4ade80' : '#16a34a')
    : score >= 60
    ? (isDark ? '#fbbf24' : '#d97706')
    : (isDark ? '#f87171' : '#dc2626');

  const rubricItems = [
    { key: 'mandatorySkills',  label: 'Mandatory skills',  max: 40 },
    { key: 'experienceLevel',  label: 'Experience level',  max: 25 },
    { key: 'domainFit',        label: 'Domain / industry', max: 20 },
    { key: 'projectRelevance', label: 'Project relevance', max: 15 },
  ];

  const gapColors = {
    high:   { bg: c.gapHighBg, border: c.gapHighBorder, text: c.gapHighText, label: 'High' },
    medium: { bg: c.gapMedBg,  border: c.gapMedBorder,  text: c.gapMedText,  label: 'Medium' },
    low:    { bg: c.gapLowBg,  border: c.gapLowBorder,  text: c.gapLowText,  label: 'Low' },
  };

  // ── API calls ─────────────────────────────────────────────────────────────
  async function generateCharter() {
    if (charterStatus === 'loading') return;
    setCharterStatus('loading'); setCharter(null);
    try {
      const res = await fetch('/api/charter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysisResult: data, jobDescription: jd }) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Request failed');
      setCharter(json.charter); setCharterStatus('done');
    } catch (err) { console.error(err); setCharterStatus('error'); }
  }

  async function generateTraining() {
    if (trainingStatus === 'loading') return;
    setTrainingStatus('loading'); setTraining(null);
    try {
      const res = await fetch('/api/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysisResult: data, jobDescription: jd }) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Request failed');
      setTraining(json.training); setTrainingStatus('done');
    } catch (err) { console.error(err); setTrainingStatus('error'); }
  }

  async function generateCvRewrite() {
    if (cvRewriteStatus === 'loading') return;
    setCvRewriteStatus('loading'); setCvRewrite(null);
    try {
      const res = await fetch('/api/cvrewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysisResult: data, jobDescription: jd, cvText }) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Request failed');
      setCvRewrite(json.cvRewrite); setCvRewriteStatus('done');
    } catch (err) { console.error(err); setCvRewriteStatus('error'); }
  }

  // ── DOCX download ─────────────────────────────────────────────────────────
  async function downloadCvDocx() {
    if (!cvRewrite) return;

    const bulletConfig = {
      reference: 'cv-bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } } },
      }],
    };

    const children = [];

    if (cvRewrite.name) {
      children.push(new Paragraph({
        children: [new TextRun({ text: cvRewrite.name, bold: true, size: 32, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    }

    for (const section of cvRewrite.sections || []) {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.heading, bold: true, size: 26, font: 'Calibri', color: '1a1a1a' })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 1 } },
      }));

      const lines = (section.content || '').split('\n').filter(l => l.trim());
      for (const line of lines) {
        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
        const text = isBullet ? line.trim().replace(/^[•\-]\s*/, '') : line.trim();
        if (isBullet) {
          children.push(new Paragraph({
            numbering: { reference: 'cv-bullets', level: 0 },
            children: [new TextRun({ text, font: 'Calibri', size: 22 })],
            spacing: { after: 60 },
          }));
        } else {
          children.push(new Paragraph({
            children: [new TextRun({ text, font: 'Calibri', size: 22 })],
            spacing: { after: 80 },
          }));
        }
      }
    }

    if (cvRewrite.changes?.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Changes Made', bold: true, size: 26, font: 'Calibri', color: '1a1a1a' })],
        spacing: { before: 400, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 1 } },
      }));
      for (const change of cvRewrite.changes) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${change.section}: `, bold: true, font: 'Calibri', size: 20 }),
            new TextRun({ text: change.what, font: 'Calibri', size: 20 }),
          ],
          spacing: { after: 40 },
        }));
        children.push(new Paragraph({
          children: [new TextRun({ text: `→ ${change.why}`, font: 'Calibri', size: 20, color: '555555', italics: true })],
          spacing: { after: 100 },
        }));
      }
    }

    const doc = new Document({
      numbering: { config: [bulletConfig] },
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_${(cvRewrite.name || 'Rewrite').replace(/\s+/g, '_')}_${(companyName || 'Rewrite').replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Shared micro-components ───────────────────────────────────────────────
  function Divider() {
    return <div style={{ height: '1px', background: c.divider, margin: '18px 0' }} />;
  }
  function SectionLabel({ text }) {
    return <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: c.textMuted, margin: '0 0 14px 0' }}>{text}</p>;
  }
  function Pill({ children, color, bg, border }) {
    return (
      <span style={{ fontSize: '11px', fontWeight: 500, color, background: bg || c.badgeBg, border: `1px solid ${border || c.badgeBorder}`, borderRadius: '6px', padding: '2px 7px', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
        {children}
      </span>
    );
  }

  // ── Gap summary pills ─────────────────────────────────────────────────────
  const gapSummary = (() => {
    if (!gaps?.length) return null;
    const counts = { high: 0, medium: 0, low: 0 };
    gaps.forEach(g => { const k = g.severity?.toLowerCase(); if (k in counts) counts[k]++; });
    return counts;
  })();

  // ── Drawer meta ───────────────────────────────────────────────────────────
  const drawerMeta = {
    charter:   { title: 'Project Charter',    accent: c.charterAccent },
    training:  { title: 'Training Materials', accent: c.trainingAccent },
    cvrewrite: { title: 'CV Rewrite',         accent: c.cvAccent },
  };
  const activeDrawer = drawer ? drawerMeta[drawer] : null;

  // ── Doc card action buttons ───────────────────────────────────────────────
  function DocActionButtons({ status, onGenerate, onView, available }) {
    if (!available) return <span style={{ fontSize: '11px', color: c.textMuted, flexShrink: 0 }}>Coming soon</span>;
    const isLoading = status === 'loading';
    const isDone    = status === 'done';
    if (isDone) return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={(e) => { e.stopPropagation(); onGenerate(); }} title="Regenerate"
          style={{ fontSize: '11px', color: c.textMuted, background: 'none', border: `1px solid ${c.cardBorder}`, borderRadius: '7px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>↺</button>
        <button onClick={(e) => { e.stopPropagation(); onView(); }}
          style={{ fontSize: '11px', fontWeight: 500, color: c.ctaText, background: c.ctaBg, border: 'none', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
          View <span style={{ fontSize: '10px' }}>→</span>
        </button>
      </div>
    );
    return (
      <button onClick={onGenerate} disabled={isLoading}
        style={{ fontSize: '11px', fontWeight: 500, padding: '5px 14px', borderRadius: '7px', border: `1px solid ${c.cardBorder}`, background: isLoading ? 'transparent' : c.ctaBg, color: isLoading ? c.textMuted : c.ctaText, cursor: isLoading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {isLoading && <span style={{ display: 'inline-block', width: '12px', height: '12px', border: `1.5px solid ${c.textMuted}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle' }} />}
        {isLoading ? 'Generating…' : 'Generate'}
      </button>
    );
  }

  // ── Charter drawer content ────────────────────────────────────────────────
  function CharterDrawerContent() {
    if (!charter) return null;
    return (
      <div>
        <p style={{ fontSize: '13px', color: c.textSecondary, lineHeight: 1.65, margin: '0 0 20px 0' }}>{charter.overview}</p>
        <div style={{ marginBottom: '18px' }}>
          <SectionLabel text="Objective" />
          <p style={{ fontSize: '13px', color: c.textSecondary, margin: 0, lineHeight: 1.65 }}>{charter.objective}</p>
        </div>
        <div style={{ marginBottom: '18px' }}>
          <SectionLabel text="Fit assessment" />
          <p style={{ fontSize: '13px', color: c.textSecondary, margin: 0, lineHeight: 1.65 }}>{charter.fitSummary}</p>
        </div>
        {charter.risks?.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <SectionLabel text="Risks & mitigations" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {charter.risks.map((r, i) => (
                <div key={i} style={{ background: c.riskBg, border: `1px solid ${c.riskBorder}`, borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: c.errorText, margin: '0 0 4px 0' }}>{r.risk}</p>
                  <p style={{ fontSize: '12px', color: c.textSecondary, margin: 0, lineHeight: 1.55 }}>↳ {r.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {charter.interviewScenarios?.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <SectionLabel text="Likely interview scenarios" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {charter.interviewScenarios.map((s, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${c.charterAccent}`, paddingLeft: '12px' }}>
                  {s.type && <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.charterAccent, marginBottom: '3px', display: 'inline-block' }}>{s.type}</span>}
                  <p style={{ fontSize: '12px', fontWeight: 500, color: c.textPrimary, margin: '0 0 3px 0', lineHeight: 1.4 }}>{s.scenario}</p>
                  <p style={{ fontSize: '12px', color: c.textSecondary, margin: 0, lineHeight: 1.55 }}>{s.guidance}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {charter.companySnapshot && (
          <div style={{ marginBottom: '18px' }}>
            <SectionLabel text="Company snapshot" />
            <p style={{ fontSize: '13px', color: c.textSecondary, margin: 0, lineHeight: 1.65 }}>{charter.companySnapshot}</p>
          </div>
        )}
        {charter.successMetrics?.length > 0 && (
          <div>
            <SectionLabel text="Success metrics" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {charter.successMetrics.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: c.charterAccent, fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>◆</span>
                  <p style={{ fontSize: '12px', color: c.textSecondary, margin: 0, lineHeight: 1.55 }}>{m}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Training drawer content ───────────────────────────────────────────────
  function TrainingDrawerContent() {
    if (!training) return null;
    function CostBadge({ cost }) {
      const isFree = cost === 'free' || cost === 'freemium';
      return <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: isFree ? c.freeBadgeText : c.paidBadgeText, background: isFree ? c.freeBadgeBg : c.paidBadgeBg, borderRadius: '4px', padding: '2px 6px' }}>{cost === 'freemium' ? 'Freemium' : isFree ? 'Free' : 'Paid'}</span>;
    }
    function TypeBadge({ type }) {
      return <span style={{ fontSize: '10px', color: c.textMuted, background: c.docCardBg, borderRadius: '4px', padding: '2px 6px', border: `1px solid ${c.docCardBorder}` }}>{type}</span>;
    }
    return (
      <div>
        <p style={{ fontSize: '13px', color: c.textSecondary, lineHeight: 1.65, margin: '0 0 20px 0' }}>{training.summary}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {training.gapResources?.map((gr, gi) => {
            const sev = gr.severity?.toLowerCase();
            const col = gapColors[sev] || gapColors.low;
            return (
              <div key={gi}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: col.text, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', border: `1px solid ${col.border}`, borderRadius: '4px', padding: '2px 6px' }}>{gr.severity}</span>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: c.textPrimary, margin: 0, lineHeight: 1.4 }}>{gr.gap}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {gr.resources?.map((r, ri) => (
                    <div key={ri} style={{ background: c.resourceBg, border: `1px solid ${c.resourceBorder}`, borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: c.textPrimary, margin: 0, flex: 1, minWidth: '100px' }}>{r.title}</p>
                        <div style={{ display: 'flex', gap: '4px' }}><CostBadge cost={r.cost} /><TypeBadge type={r.type} /></div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        {r.platform && <span style={{ fontSize: '11px', color: c.textMuted }}>{r.platform}</span>}
                        {r.estimatedTime && <span style={{ fontSize: '11px', color: c.textMuted }}>⏱ {r.estimatedTime}</span>}
                      </div>
                      <p style={{ fontSize: '12px', color: c.textSecondary, margin: '0 0 6px 0', lineHeight: 1.55 }}>{r.why}</p>
                      {r.url && (r.url.startsWith('Search:')
                        ? <p style={{ fontSize: '11px', color: c.trainingAccent, margin: 0 }}>🔍 {r.url}</p>
                        : <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: c.trainingAccent, display: 'block', textDecoration: 'none', wordBreak: 'break-all' }}>→ {r.url}</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {training.quickWins?.length > 0 && (
          <div>
            <SectionLabel text="Quick wins — do today" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {training.quickWins.map((qw, i) => (
                <div key={i} style={{ background: isDark ? '#0a1a1a' : '#f0feff', border: `1px solid ${c.trainingBorder}`, borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: c.trainingAccent, fontSize: '13px', flexShrink: 0 }}>⚡</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: c.textPrimary, margin: '0 0 2px 0' }}>{qw.action}</p>
                    <p style={{ fontSize: '11px', color: c.textMuted, margin: 0 }}>Addresses: {qw.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CV Rewrite drawer content ─────────────────────────────────────────────
  function CvRewriteDrawerContent() {
    if (!cvRewrite) return null;
    return (
      <div>
        {/* Download button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: c.textSecondary, margin: 0, lineHeight: 1.5 }}>
            Rewritten to target gaps — unchanged content preserved exactly.
          </p>
          <button
            onClick={downloadCvDocx}
            style={{ flexShrink: 0, marginLeft: '12px', fontSize: '11px', fontWeight: 500, padding: '6px 14px', borderRadius: '7px', border: `1px solid ${c.cvAccent}`, background: 'transparent', color: c.cvAccent, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            ↓ Download .docx
          </button>
        </div>

        {/* CV sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
          {cvRewrite.sections?.map((section, i) => (
            <div key={i}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: c.cvAccent, margin: '0 0 8px 0', paddingBottom: '5px', borderBottom: `1px solid ${c.cvBorder}` }}>
                {section.heading}
              </p>
              <p style={{ fontSize: '12px', color: c.textSecondary, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Change log */}
        {cvRewrite.changes?.length > 0 && (
          <div>
            <SectionLabel text="Changes made" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cvRewrite.changes.map((ch, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${c.cvAccent}`, paddingLeft: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: c.textPrimary, margin: '0 0 2px 0' }}>
                    {ch.section}: <span style={{ fontWeight: 400, color: c.textSecondary }}>{ch.what}</span>
                  </p>
                  <p style={{ fontSize: '11px', color: c.textMuted, margin: 0 }}>→ {ch.why}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Doc cards config ──────────────────────────────────────────────────────
  const docCards = [
    { key: 'charter',   icon: '◈', title: 'Project Charter',    desc: 'PM-style brief with interview scenarios and company snapshot.',       available: true,  status: charterStatus,    onGenerate: generateCharter,   onView: () => setDrawer('charter')   },
    { key: 'training',  icon: '◧', title: 'Training Materials', desc: 'Curated resources per gap — free and low-cost, with time estimates.', available: true,  status: trainingStatus,   onGenerate: generateTraining,  onView: () => setDrawer('training')  },
    { key: 'cvrewrite', icon: '◩', title: 'CV Rewrite',         desc: 'Tailored CV matched to JD language, with a change log.',             available: true,  status: cvRewriteStatus,  onGenerate: generateCvRewrite, onView: () => setDrawer('cvrewrite') },
    { key: 'plan',      icon: '◫', title: 'Preparation Plan',   desc: 'Day-by-day prep schedule — coming in the next phase.',               available: false },
  ];

  const availableCount = docCards.filter(d => d.available).length;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main style={{ minHeight: '100vh', backgroundColor: c.pageBg, padding: '56px 16px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', transition: 'background-color 0.2s' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.textSecondary, margin: 0 }}>
              <span style={{ color: c.textPrimary }}>CareerPrep</span> — AI
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: c.themeBtnColor, background: c.themeBtnBg, border: `1px solid ${c.themeBtnBorder}`, borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isDark ? <SunIcon color={c.themeBtnColor} /> : <MoonIcon color={c.themeBtnColor} />}
                {isDark ? 'Light' : 'Dark'}
              </button>
              <button onClick={() => router.push('/')} style={{ fontSize: '11px', color: c.textSecondary, background: 'none', border: `1px solid ${c.cardBorder}`, borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← New analysis
              </button>
            </div>
          </div>

          {/* Low-fit warning */}
          {lowFit && (
            <div style={{ background: c.warnBg, border: `1px solid ${c.warnBorder}`, borderRadius: '12px', padding: '13px 16px', marginBottom: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: c.warnText, margin: '0 0 3px 0' }}>⚠ Low fit score</p>
              <p style={{ fontSize: '13px', color: c.warnText, margin: 0, opacity: 0.85 }}>Your score is below 60. The gap to this role is significant — consider a targeted preparation plan before applying.</p>
            </div>
          )}

          {/* Fit Score accordion */}
          <AccordionCard
            isOpen={openSections.fitScore}
            onToggle={() => toggleSection('fitScore')}
            cardBg={c.cardBg} cardBorder={c.cardBorder} dividerColor={c.divider} textMuted={c.textMuted}
            headerLeft={<span style={{ fontSize: '13px', fontWeight: 500, color: c.textPrimary }}>Fit score</span>}
            headerRight={
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: '12px', color: c.textMuted }}>/100</span>
              </div>
            }
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span style={{ fontSize: '52px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: '18px', color: c.textMuted, fontWeight: 400 }}>/100</span>
                </div>
                {companyName && <p style={{ fontSize: '12px', color: c.textSecondary, margin: '5px 0 0 0' }}>{companyName}</p>}
              </div>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: c.inputBg, border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: scoreColor }}>{score}</span>
              </div>
            </div>
            <Divider />
            <SectionLabel text="Score breakdown" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {rubricItems.map(({ key, label, max }) => {
                const item = scoreBreakdown?.[key];
                if (!item) return null;
                const pct = Math.round((item.score / max) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: c.textSecondary }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: c.textPrimary }}>
                        {item.score}<span style={{ color: c.textMuted, fontWeight: 400 }}>/{max}</span>
                      </span>
                    </div>
                    <div style={{ height: '3px', background: c.barTrack, borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: scoreColor, borderRadius: '2px', transition: 'width 0.9s ease' }} />
                    </div>
                    {item.notes && <p style={{ fontSize: '11px', color: c.textMuted, margin: '5px 0 0 0', lineHeight: 1.5 }}>{item.notes}</p>}
                  </div>
                );
              })}
            </div>
          </AccordionCard>

          {/* Strengths accordion */}
          {strengths?.length > 0 && (
            <AccordionCard
              isOpen={openSections.strengths}
              onToggle={() => toggleSection('strengths')}
              cardBg={c.cardBg} cardBorder={c.cardBorder} dividerColor={c.divider} textMuted={c.textMuted}
              headerLeft={<span style={{ fontSize: '13px', fontWeight: 500, color: c.textPrimary }}>Strengths</span>}
              headerRight={
                <Pill color={c.successText} bg={isDark ? '#0d1a0d' : '#f0fdf4'} border={isDark ? '#166534' : '#bbf7d0'}>
                  {strengths.length}
                </Pill>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: c.successText, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✦</span>
                    <p style={{ fontSize: '13px', color: c.textSecondary, margin: 0, lineHeight: 1.65 }}>{s}</p>
                  </div>
                ))}
              </div>
            </AccordionCard>
          )}

          {/* Gaps accordion */}
          {gaps?.length > 0 && (
            <AccordionCard
              isOpen={openSections.gaps}
              onToggle={() => toggleSection('gaps')}
              cardBg={c.cardBg} cardBorder={c.cardBorder} dividerColor={c.divider} textMuted={c.textMuted}
              headerLeft={<span style={{ fontSize: '13px', fontWeight: 500, color: c.textPrimary }}>Gaps</span>}
              headerRight={
                <div style={{ display: 'flex', gap: '4px' }}>
                  {gapSummary?.high   > 0 && <Pill color={c.gapHighText} bg={c.gapHighBg} border={c.gapHighBorder}>{gapSummary.high}H</Pill>}
                  {gapSummary?.medium > 0 && <Pill color={c.gapMedText}  bg={c.gapMedBg}  border={c.gapMedBorder}>{gapSummary.medium}M</Pill>}
                  {gapSummary?.low    > 0 && <Pill color={c.gapLowText}  bg={c.gapLowBg}  border={c.gapLowBorder}>{gapSummary.low}L</Pill>}
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gaps.map((g, i) => {
                  const sev = g.severity?.toLowerCase();
                  const col = gapColors[sev] || gapColors.low;
                  return (
                    <div key={i} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: '10px', padding: '11px 14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: col.text, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', border: `1px solid ${col.border}`, borderRadius: '4px', padding: '1px 5px', display: 'inline-block', marginBottom: '5px' }}>{col.label}</span>
                      <p style={{ fontSize: '13px', color: col.text, margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{g.gap}</p>
                    </div>
                  );
                })}
              </div>
            </AccordionCard>
          )}

          {/* Preparation package accordion */}
          <AccordionCard
            isOpen={openSections.prep}
            onToggle={() => toggleSection('prep')}
            cardBg={c.cardBg} cardBorder={c.cardBorder} dividerColor={c.divider} textMuted={c.textMuted}
            headerLeft={<span style={{ fontSize: '13px', fontWeight: 500, color: c.textPrimary }}>Preparation package</span>}
            headerRight={<Pill color={c.textMuted}>{availableCount} of {docCards.length} available</Pill>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {docCards.map(({ key, icon, title, desc, available, status, onGenerate, onView }) => (
                <div
                  key={key}
                  onClick={status === 'done' && onView ? onView : undefined}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: c.docCardBg, border: `1px solid ${status === 'done' ? (isDark ? '#3a3a3a' : '#d1d5db') : available ? c.cardBorder : c.docCardBorder}`, borderRadius: '10px', padding: '13px 14px', opacity: available ? 1 : 0.45, cursor: status === 'done' ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                >
                  <span style={{ fontSize: '18px', color: c.textMuted, flexShrink: 0, lineHeight: 1.2, marginTop: '1px' }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: c.textPrimary, margin: '0 0 2px 0' }}>{title}</p>
                    <p style={{ fontSize: '11px', color: c.textMuted, margin: 0, lineHeight: 1.5 }}>{desc}</p>
                    {status === 'error' && <p style={{ fontSize: '11px', color: c.errorText, margin: '3px 0 0 0' }}>Generation failed — try again.</p>}
                    {status === 'done'  && <p style={{ fontSize: '11px', color: c.successText, margin: '3px 0 0 0' }}>Ready to view</p>}
                  </div>
                  <DocActionButtons status={status} onGenerate={onGenerate} onView={onView} available={available} />
                </div>
              ))}
            </div>
          </AccordionCard>

        </div>
      </main>

      {/* Drawer overlay */}
      <div
        onClick={() => setDrawer(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', opacity: drawer ? 1 : 0, pointerEvents: drawer ? 'all' : 'none', transition: 'opacity 0.22s ease' }}
      />

      {/* Drawer panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100dvh', width: 'min(520px, 100vw)', zIndex: 201, display: 'flex', flexDirection: 'column', transform: drawer ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden', background: c.drawerBg, borderLeft: `1px solid ${c.cardBorder}` }}>
        <div style={{ position: 'sticky', top: 0, background: c.drawerHeaderBg, borderBottom: `1px solid ${c.divider}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: activeDrawer?.accent }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: c.textPrimary }}>{activeDrawer?.title}</span>
          </div>
          <button onClick={() => setDrawer(null)} style={{ width: '27px', height: '27px', borderRadius: '7px', border: `1px solid ${c.cardBorder}`, background: 'none', color: c.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {drawer === 'charter'   && <CharterDrawerContent />}
          {drawer === 'training'  && <TrainingDrawerContent />}
          {drawer === 'cvrewrite' && <CvRewriteDrawerContent />}
        </div>
      </div>

    </div>
  );
}