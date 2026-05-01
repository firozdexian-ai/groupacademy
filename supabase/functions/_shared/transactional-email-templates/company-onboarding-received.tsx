import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"

interface Props {
  name?: string
  company?: string
}

const Email = ({ name, company }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your application for {company || 'your company'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application received</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>
          Thanks for applying for company access on {SITE_NAME}{company ? ` for ${company}` : ''}. Our team will review your application and get back to you within 1 business day.
        </Text>
        <Text style={text}>
          In the meantime, feel free to explore our talent network and AI agents at our website.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: `Your ${SITE_NAME} application is being reviewed`,
  displayName: 'Company onboarding received',
  previewData: { name: 'Alex', company: 'Acme Corp' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
