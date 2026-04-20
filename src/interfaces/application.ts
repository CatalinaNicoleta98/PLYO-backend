export type ApplicationStatus =
  | "draft"
  | "planned"
  | "applied"
  | "interview"
  | "assignment"
  | "offer"
  | "rejected"
  | "withdrawn";

export type JobType =
  | "full_time"
  | "part_time"
  | "student_job"
  | "internship"
  | "contract"
  | "temporary"
  | "freelance"
  | "other";

export type DocumentCategory = "cv" | "cover_letter" | "portfolio" | "other";

export interface ApplicationDocument {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: DocumentCategory;
  uploadedAt?: Date;
}

export interface ContactPerson {
  name: string;
  role: string;
  email: string;
}

export interface Application {
  _id: string;
  companyName: string;
  roleTitle: string;
  status: ApplicationStatus;
  jobType?: JobType;
  location?: string;
  jobUrl?: string;
  isRemote?: boolean;
  appliedDate?: Date;
  endedDate?: Date;
  followUpDate?: Date;
  interviewContactName?: string;
  interviewContactRole?: string;
  interviewContactEmail?: string;
  otherContacts?: ContactPerson[];
  notes?: string;
  documents?: ApplicationDocument[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}
