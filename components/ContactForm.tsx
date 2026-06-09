'use client'

import { useState, FormEvent } from 'react'

/*
 ── Google Apps Script setup ──────────────────────────────────────────────────
  1. Create a new Google Sheet
  2. Extensions → Apps Script → replace default code with:

  function doPost(e) {
    const sheet = SpreadsheetApp
      .openById('YOUR_SPREADSHEET_ID')
      .getSheets()[0]
    const p = e.parameter
    sheet.appendRow([
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      p.name, p.email, p.phone, p.type, p.message
    ])
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  3. Deploy → New deployment → Web app
     Execute as: Me  |  Who has access: Anyone
  4. Authorise the app, copy the deployment URL
  5. Replace GOOGLE_SCRIPT_URL below with that URL
 ────────────────────────────────────────────────────────────────────────────*/

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/REPLACE_WITH_YOUR_SCRIPT_ID/exec'

const INK   = 'oklch(8.5% 0.007 72)'
const SOFT  = 'oklch(44% 0.008 75)'
const FAINT = 'oklch(62% 0.006 74)'
const LINE  = 'oklch(88% 0.006 76)'
const BG    = 'oklch(97.2% 0.006 78)'

const PROJECT_TYPES = [
  'Residential',
  'Commercial',
  'Institutional',
  'Interior Design',
  'Landscape',
  'Other',
]

type Status = 'idle' | 'sending' | 'sent' | 'error'

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderBottom: `1px solid ${LINE}`,
  background: 'transparent',
  padding: '0.65rem 0',
  fontFamily: 'var(--font-sans), sans-serif',
  fontWeight: 300,
  fontSize: '0.88rem',
  color: INK,
  outline: 'none',
  borderRadius: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans), sans-serif',
  fontWeight: 500,
  fontSize: '0.52rem',
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: FAINT,
  marginBottom: '0.25rem',
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const fd = new FormData(e.currentTarget)
    const body = new URLSearchParams()
    fd.forEach((v, k) => body.append(k, v.toString()))

    try {
      /* no-cors: response is opaque but the request reaches Google Sheets */
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ padding: '2rem 0' }}>
        <p style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 300,
          fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
          lineHeight: 1.1,
          color: INK,
          marginBottom: '1rem',
        }}>
          Thank you.
        </p>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 300,
          fontSize: '0.88rem',
          color: SOFT,
          lineHeight: 1.8,
        }}>
          Your enquiry has been received.<br />
          We will be in touch shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

      {/* Name + Email row */}
      <div className="form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label htmlFor="cf-name" style={labelStyle}>Full Name</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            style={{ ...inputStyle, '::placeholder': { color: FAINT } } as React.CSSProperties}
          />
        </div>
        <div>
          <label htmlFor="cf-email" style={labelStyle}>Email</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Phone + Project type row */}
      <div className="form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label htmlFor="cf-phone" style={labelStyle}>Phone</label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 00000 00000"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="cf-type" style={labelStyle}>Project Type</label>
          <select
            id="cf-type"
            name="type"
            style={{ ...inputStyle, cursor: 'pointer', color: SOFT }}
            defaultValue=""
          >
            <option value="" disabled>Select type</option>
            {PROJECT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="cf-message" style={labelStyle}>Brief</label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={4}
          placeholder="Describe your project, site, and timeline"
          style={{
            ...inputStyle,
            resize: 'none',
            paddingTop: '0.65rem',
            lineHeight: 1.7,
          }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button
          type="submit"
          disabled={status === 'sending'}
          style={{
            background: INK,
            color: BG,
            border: 'none',
            padding: '0.75rem 2rem',
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 400,
            fontSize: '0.6rem',
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            cursor: status === 'sending' ? 'wait' : 'pointer',
            opacity: status === 'sending' ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
        </button>

        {status === 'error' && (
          <span style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 300,
            fontSize: '0.75rem',
            color: 'oklch(50% 0.15 25)',
          }}>
            Something went wrong — please try again.
          </span>
        )}
      </div>
    </form>
  )
}
