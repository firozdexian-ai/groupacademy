import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const SITE_URL = "https://groupacademy.lovable.app"

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your career journey starts now!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {SITE_NAME}! 🎉</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          You've just joined a community of ambitious professionals building world-class careers.
          You've been credited with <strong>250 free credits</strong> to explore our AI-powered career tools.
        </Text>
        <Text style={text}>
          Here's what you can do right away:
        </Text>
        <Text style={listItem}>🎯 Take a Career Readiness Assessment</Text>
        <Text style={listItem}>📄 Get your CV professionally reviewed by AI</Text>
        <Text style={listItem}>💼 Browse curated job opportunities</Text>
        <Text style={listItem}>📚 Enroll in industry-aligned courses</Text>
        <Button style={button} href={SITE_URL + "/app/feed"}>
          Explore Your Dashboard
        </Button>
        <Text style={footer}>
          Welcome aboard — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welcome to ${SITE_NAME}! 🎉`,
  displayName: 'Welcome email',
  previewData: { name: 'Sarah' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '8px' }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
