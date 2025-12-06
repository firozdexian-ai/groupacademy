import { format } from "date-fns";

interface ProfileData {
  education: Array<{ institution: string; degree: string; fieldOfStudy: string; graduationYear: string; current: boolean }>;
  experience: Array<{ title: string; company: string; duration: string; description: string }>;
  skills: Array<{ name: string; proficiency: string }>;
  projects: Array<{ name: string; description: string; url: string }>;
  achievements: Array<{ title: string; description: string; date: string }>;
}

interface ProfileSummaryPDFTemplateProps {
  fullName: string;
  email: string;
  phone: string;
  profession: string;
  customProfession?: string | null;
  profileData: ProfileData;
  socialLinks?: Record<string, string> | null;
  achievementsText?: string | null;
}

export default function ProfileSummaryPDFTemplate({
  fullName,
  email,
  phone,
  profession,
  customProfession,
  profileData,
  socialLinks,
  achievementsText,
}: ProfileSummaryPDFTemplateProps) {
  const proficiencyColors: Record<string, string> = {
    beginner: '#fbbf24',
    intermediate: '#60a5fa',
    advanced: '#34d399',
    expert: '#a78bfa',
  };

  return (
    <div
      id="profile-summary-pdf-content"
      style={{
        width: '794px',
        padding: '40px',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '3px solid #0ea5e9', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
          {fullName}
        </h1>
        <p style={{ fontSize: '16px', color: '#0ea5e9', margin: '4px 0 0 0' }}>
          {customProfession || profession}
        </p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
          <span>📧 {email}</span>
          <span>📱 {phone}</span>
        </div>
      </div>

      {/* Education Section */}
      {profileData.education && profileData.education.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
            🎓 Education
          </h2>
          {profileData.education.map((edu, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                {edu.degree} in {edu.fieldOfStudy}
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
                {edu.institution} • {edu.current ? 'Present' : edu.graduationYear}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Experience Section */}
      {profileData.experience && profileData.experience.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
            💼 Experience
          </h2>
          {profileData.experience.map((exp, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                {exp.title}
              </p>
              <p style={{ fontSize: '13px', color: '#0ea5e9', margin: '2px 0' }}>
                {exp.company} • {exp.duration}
              </p>
              {exp.description && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills Section */}
      {profileData.skills && profileData.skills.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
            🛠️ Skills
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profileData.skills.map((skill, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  backgroundColor: proficiencyColors[skill.proficiency] || '#e5e7eb',
                  color: '#1f2937',
                }}
              >
                {skill.name} ({skill.proficiency})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {profileData.projects && profileData.projects.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
            🚀 Projects
          </h2>
          {profileData.projects.map((project, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                {project.name}
              </p>
              {project.description && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>
                  {project.description}
                </p>
              )}
              {project.url && (
                <p style={{ fontSize: '11px', color: '#0ea5e9', margin: '2px 0 0 0' }}>
                  🔗 {project.url}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Achievements Section */}
      {((profileData.achievements && profileData.achievements.length > 0) || achievementsText) && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
            🏆 Achievements
          </h2>
          {profileData.achievements && profileData.achievements.map((achievement, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
                {achievement.title}
              </p>
              {achievement.description && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                  {achievement.description}
                </p>
              )}
            </div>
          ))}
          {achievementsText && (
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
              {achievementsText}
            </p>
          )}
        </div>
      )}

      {/* Social Links Section */}
      {socialLinks && Object.keys(socialLinks).filter(k => socialLinks[k]).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
            🌐 Social Links
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(socialLinks).map(([key, url]) => (
              url && (
                <p key={key} style={{ fontSize: '12px', margin: 0 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{key}:</strong>{' '}
                  <span style={{ color: '#0ea5e9' }}>{url}</span>
                </p>
              )
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '24px' }}>
        <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
          Generated by GroUp Academy • {format(new Date(), 'MMMM d, yyyy')}
        </p>
        <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', margin: '4px 0 0 0' }}>
          This profile summary is for internal use by Talent Success Executives
        </p>
      </div>
    </div>
  );
}
