import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"

interface JobApplicationEmployerProps {
  job_title?: string
  company_name?: string
  applicant_name?: string
  cover_letter?: string
  cv_url?: string
  match_score?: number
}

const JobApplicationEmployerEmail = ({ job_title, company_name, applicant_name, cover_letter, cv_url, match_score }: JobApplicationEmployerProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New application for {job_title || 'your position'} via {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Application Received 📩</Heading>
        <Text style={text}>
          Hi {company_name || 'Hiring Manager'},
        </Text>
        <Text style={text}>
          A new candidate has applied for <strong>{job_title || 'your position'}</strong> through {SITE_NAME}.
        </Text>
        {applicant_name ? (
          <Text style={text}>
            <strong>Applicant:</strong> {applicant_name}
          </Text>
        ) : null}
        {match_score ? (
          <Text style={matchBadge}>
            🎯 AI Match Score: <strong>{match_score}%</strong>
          </Text>
        ) : null}
        {cover_letter ? (
          <Container style={coverLetterBox}>
            <Text style={coverLetterLabel}>Cover Letter:</Text>
            <Text style={coverLetterText}>{cover_letter}</Text>
          </Container>
        ) : null}
        {cv_url ? (
          <Button style={button} href={cv_url}>
            Download CV
          </Button>
        ) : null}
        <Text style={footer}>
          Sent via {SITE_NAME} — Connecting talent with opportunity
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JobApplicationEmployerEmail,
  subject: (data: Record<string, any>) => `New application for ${data.job_title || 'your position'}`,
  displayName: 'Job application (employer copy)',
  previewData: { job_title: 'Senior Developer', company_name: 'TechCorp', applicant_name: 'Sarah Khan', match_score: 85, cover_letter: 'I am excited to apply...' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const matchBadge = { fontSize: '15px', color: '#2A7DDE', lineHeight: '1.6', margin: '0 0 16px', padding: '12px 16px', backgroundColor: '#f0f7ff', borderRadius: '8px', textAlign: 'center' as const }
const coverLetterBox = { padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', margin: '0 0 20px' }
const coverLetterLabel = { fontSize: '12px', fontWeight: 'bold' as const, color: '#999999', margin: '0 0 8px', textTransform: 'uppercase' as const }
const coverLetterText = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0' }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
