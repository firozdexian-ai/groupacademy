import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const SITE_URL = "https://groupacademy.lovable.app"

interface JobApplicationSentProps {
  name?: string
  job_title?: string
  company_name?: string
}

const JobApplicationSentEmail = ({ name, job_title, company_name }: JobApplicationSentProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your application for {job_title || 'a position'} has been submitted</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application Submitted ✅</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          Your application for <strong>{job_title || 'the position'}</strong>
          {company_name ? ` at ${company_name}` : ''} has been submitted successfully.
        </Text>
        <Text style={text}>
          The employer will review your application and you'll be notified of any updates.
          In the meantime, keep exploring other opportunities!
        </Text>
        <Button style={button} href={SITE_URL + "/app/my-applications"}>
          View My Applications
        </Button>
        <Text style={footer}>
          Good luck — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JobApplicationSentEmail,
  subject: 'Application submitted successfully',
  displayName: 'Job application confirmation',
  previewData: { name: 'Nadia', job_title: 'Marketing Manager', company_name: 'TechCorp' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
