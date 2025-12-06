import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GraduationCap, Briefcase, Wrench, FolderOpen, Award } from "lucide-react";

export interface ProfileData {
  education: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
    current: boolean;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  skills: {
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }[];
  projects: {
    name: string;
    description: string;
    url?: string;
  }[];
  achievements: {
    title: string;
    description: string;
    date?: string;
  }[];
}

interface ProfileBuilderFormProps {
  value: ProfileData;
  onChange: (data: ProfileData) => void;
}

const emptyEducation = { institution: '', degree: '', fieldOfStudy: '', graduationYear: '', current: false };
const emptyExperience = { title: '', company: '', duration: '', description: '' };
const emptySkill = { name: '', proficiency: 'intermediate' as const };
const emptyProject = { name: '', description: '', url: '' };
const emptyAchievement = { title: '', description: '', date: '' };

export default function ProfileBuilderForm({ value, onChange }: ProfileBuilderFormProps) {
  const [activeSection, setActiveSection] = useState<'education' | 'experience' | 'skills' | 'projects' | 'achievements'>('education');

  const updateEducation = (index: number, field: keyof typeof emptyEducation, val: any) => {
    const updated = [...value.education];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...value, education: updated });
  };

  const updateExperience = (index: number, field: keyof typeof emptyExperience, val: string) => {
    const updated = [...value.experience];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...value, experience: updated });
  };

  const updateSkill = (index: number, field: keyof typeof emptySkill, val: string) => {
    const updated = [...value.skills];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...value, skills: updated });
  };

  const updateProject = (index: number, field: keyof typeof emptyProject, val: string) => {
    const updated = [...value.projects];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...value, projects: updated });
  };

  const updateAchievement = (index: number, field: keyof typeof emptyAchievement, val: string) => {
    const updated = [...value.achievements];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...value, achievements: updated });
  };

  const sections = [
    { id: 'education', label: 'Education', icon: GraduationCap, count: value.education.length },
    { id: 'experience', label: 'Experience', icon: Briefcase, count: value.experience.length },
    { id: 'skills', label: 'Skills', icon: Wrench, count: value.skills.length },
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: value.projects.length },
    { id: 'achievements', label: 'Achievements', icon: Award, count: value.achievements.length },
  ];

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            type="button"
            variant={activeSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection(section.id as any)}
            className="flex items-center gap-2"
          >
            <section.icon className="h-4 w-4" />
            {section.label}
            {section.count > 0 && (
              <span className="ml-1 text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                {section.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Education Section */}
      {activeSection === 'education' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <CardDescription>Add your educational background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {value.education.map((edu, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-destructive"
                  onClick={() => onChange({ ...value, education: value.education.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Institution Name *</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder="e.g., Dhaka University"
                    />
                  </div>
                  <div>
                    <Label>Degree Type</Label>
                    <Select
                      value={edu.degree}
                      onValueChange={(val) => updateEducation(index, 'degree', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="SSC">SSC</SelectItem>
                        <SelectItem value="HSC">HSC</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Bachelor's">Bachelor's Degree</SelectItem>
                        <SelectItem value="Master's">Master's Degree</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                        <SelectItem value="Certificate">Certificate Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Field of Study *</Label>
                    <Input
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g., International Relations"
                    />
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <Input
                      value={edu.graduationYear}
                      onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                      placeholder="e.g., 2025 or Expected 2026"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange({ ...value, education: [...value.education, { ...emptyEducation }] })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Experience Section */}
      {activeSection === 'experience' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
            <CardDescription>Add your work experience (optional for students)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {value.experience.map((exp, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-destructive"
                  onClick={() => onChange({ ...value, experience: value.experience.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      placeholder="e.g., Marketing Intern"
                    />
                  </div>
                  <div>
                    <Label>Company Name *</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="e.g., ABC Corporation"
                    />
                  </div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                    placeholder="e.g., Jan 2023 - Present"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange({ ...value, experience: [...value.experience, { ...emptyExperience }] })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      {activeSection === 'skills' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Skills
            </CardTitle>
            <CardDescription>Add your key skills and proficiency levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {value.skills.map((skill, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Skill Name</Label>
                  <Input
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    placeholder="e.g., Microsoft Excel"
                  />
                </div>
                <div className="w-40">
                  <Label>Proficiency</Label>
                  <Select
                    value={skill.proficiency}
                    onValueChange={(val) => updateSkill(index, 'proficiency', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive"
                  onClick={() => onChange({ ...value, skills: value.skills.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange({ ...value, skills: [...value.skills, { ...emptySkill }] })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      {activeSection === 'projects' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>Add academic or personal projects you've worked on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {value.projects.map((project, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-destructive"
                  onClick={() => onChange({ ...value, projects: value.projects.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div>
                  <Label>Project Name *</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    placeholder="e.g., Final Year Thesis"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Describe your project, your role, and the outcome..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Project URL (optional)</Label>
                  <Input
                    value={project.url || ''}
                    onChange={(e) => updateProject(index, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange({ ...value, projects: [...value.projects, { ...emptyProject }] })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Achievements Section */}
      {activeSection === 'achievements' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements & Awards
            </CardTitle>
            <CardDescription>Add your notable achievements, awards, or recognitions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {value.achievements.map((achievement, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-destructive"
                  onClick={() => onChange({ ...value, achievements: value.achievements.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={achievement.title}
                      onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                      placeholder="e.g., Dean's List"
                    />
                  </div>
                  <div>
                    <Label>Date (optional)</Label>
                    <Input
                      value={achievement.date || ''}
                      onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={achievement.description}
                    onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                    placeholder="Describe this achievement..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange({ ...value, achievements: [...value.achievements, { ...emptyAchievement }] })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="bg-muted/50 p-4 rounded-lg text-sm">
        <p className="font-medium mb-2">Profile Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-muted-foreground">
          <span>{value.education.length} Education</span>
          <span>{value.experience.length} Experience</span>
          <span>{value.skills.length} Skills</span>
          <span>{value.projects.length} Projects</span>
          <span>{value.achievements.length} Achievements</span>
        </div>
      </div>
    </div>
  );
}
