import { PDFParse } from "pdf-parse";
import {
  CandidateEducation,
  CandidateExperience,
  CandidateProfile,
  CandidateProject,
} from "../types/candidateProfile";

const SECTION_HEADINGS = [
  "summary", "professional summary", "profile", "about me", "skills", "technical skills",
  "core competencies", "experience", "work experience", "professional experience", "employment",
  "education", "projects", "certifications", "certificates", "achievements", "target roles",
];

const cleanText = (text: string): string =>
  text
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const cleanList = (value: string): string[] =>
  value
    .split(/[\n,|•·;]/)
    .map((item) => item.replace(/^[-–—*\s]+/, "").trim())
    .filter((item) => item.length >= 2 && item.length <= 60)
    .filter((item, index, items) => items.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 40);

const findMentionedSkills = (text: string, skills: string[]): string[] =>
  skills.filter((skill) => new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));

const linesFrom = (text: string): string[] => text.split("\n").map((line) => line.trim()).filter(Boolean);

const headingIndex = (lines: string[], headings: string[]): number =>
  lines.findIndex((line) => headings.includes(line.toLowerCase().replace(/:$/, "")));

const sectionLines = (lines: string[], headings: string[]): string[] => {
  const start = headingIndex(lines, headings);
  if (start === -1) return [];

  const end = lines.findIndex(
    (line, index) => index > start && SECTION_HEADINGS.includes(line.toLowerCase().replace(/:$/, "")),
  );
  return lines.slice(start + 1, end === -1 ? undefined : end);
};

const sectionText = (lines: string[], headings: string[]): string => sectionLines(lines, headings).join(" ").trim();

const findName = (lines: string[]): string => {
  const candidate = lines.slice(0, 8).find((line) => {
    const words = line.split(/\s+/);
    return words.length >= 2 && words.length <= 5
      && /^[a-z .'-]+$/i.test(line)
      && !SECTION_HEADINGS.includes(line.toLowerCase());
  });
  return candidate || "";
};

const findLocation = (text: string, lines: string[]): string => {
  const labelledLocation = text.match(/(?:location|address)\s*[:\-]\s*([^\n]+)/i)?.[1]?.trim();
  if (labelledLocation) return labelledLocation;
  return lines.slice(0, 10).find((line) => /\b(india|usa|united states|uk|canada|australia|remote)\b/i.test(line)) || "";
};

const findTotalExperience = (text: string): number => {
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/gi)];
  const values = matches.map((match) => Number(match[1])).filter((value) => !Number.isNaN(value));
  return values.length ? Math.max(...values) : 0;
};

const parseExperience = (lines: string[], knownSkills: string[]): CandidateExperience[] => {
  const entries = sectionLines(lines, ["experience", "work experience", "professional experience", "employment"]);
  if (!entries.length) return [];

  const groups = entries.join("\n").split(/\n\s*\n/).map(linesFrom).filter((group) => group.length);
  return groups.slice(0, 10).map((group) => {
    const heading = group[0] || "";
    const roleCompany = heading.match(/^(.+?)\s+(?:at|@|[-–])\s+(.+)$/i);
    const description = group.slice(1).filter((line) => !/\b(19|20)\d{2}\b/.test(line)).join(" ");
    return {
      role: roleCompany?.[1]?.trim() || heading || null,
      company: roleCompany?.[2]?.trim() || null,
      duration: group.find((line) => /\b(19|20)\d{2}\b/.test(line)) || null,
      description,
      skills: findMentionedSkills(`${heading} ${description}`, knownSkills),
    };
  });
};

const parseEducation = (lines: string[]): CandidateEducation[] => {
  const entries = sectionLines(lines, ["education"]);
  if (!entries.length) return [];

  const groups = entries.join("\n").split(/\n\s*\n/).map(linesFrom).filter((group) => group.length);
  return groups.slice(0, 5).map((group) => {
    const first = group[0] || "";
    const degree = first.match(/(b\.?tech|bachelor|master|m\.?tech|mba|b\.?sc|m\.?sc|ph\.?d)/i)?.[0] || "";
    return {
      institution: group.find((line) => line !== first) || null,
      degree: degree || null,
      field: (degree ? first.replace(degree, "").replace(/[,|-]/g, "").trim() : first) || null,
      year: group.join(" ").match(/\b(?:19|20)\d{2}\b/)?.[0] || null,
    };
  });
};

const parseProjects = (lines: string[], knownSkills: string[]): CandidateProject[] => {
  const entries = sectionLines(lines, ["projects"]);
  if (!entries.length) return [];

  const groups = entries.join("\n").split(/\n\s*\n/).map(linesFrom).filter((group) => group.length);
  return groups.slice(0, 10).map((group) => {
    const description = group.slice(1).join(" ");
    return {
      name: group[0] || null,
      description,
      technologies: findMentionedSkills(`${group[0] || ""} ${description}`, knownSkills),
    };
  });
};

export const extractTextFromPdf = async (fileBuffer: Buffer): Promise<string> => {
  if (!fileBuffer.length || !fileBuffer.subarray(0, 5).toString().startsWith("%PDF-")) {
    throw new Error("The uploaded file is not a valid PDF");
  }

  let parser: PDFParse | undefined;
  try {
    parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    const text = cleanText(result.text);

    if (text.length < 20) {
      throw new Error("No readable text could be extracted from this PDF");
    }
    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("readable text")) throw error;
    throw new Error("Unable to read the uploaded PDF");
  } finally {
    await parser?.destroy();
  }
};

export const createCandidateProfile = (extractedText: string): CandidateProfile => {
  const lines = linesFrom(extractedText);
  const email = extractedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = extractedText.match(/(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,4}\)?[ .-]?)?\d{3,5}[ .-]\d{4}/)?.[0] || "";
  const skills = cleanList(sectionText(lines, ["skills", "technical skills", "core competencies"]));

  return {
    name: findName(lines) || null,
    email: email || null,
    phone: phone || null,
    location: findLocation(extractedText, lines) || null,
    summary: sectionText(lines, ["summary", "professional summary", "profile", "about me"]) || null,
    skills,
    experience: parseExperience(lines, skills),
    education: parseEducation(lines),
    projects: parseProjects(lines, skills),
    certifications: cleanList(sectionText(lines, ["certifications", "certificates"])),
    totalExperience: findTotalExperience(extractedText),
    targetRoles: cleanList(sectionText(lines, ["target roles"])),
  };
};
