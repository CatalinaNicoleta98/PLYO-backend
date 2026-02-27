export interface Application {
  _id: string;

  // Required
  companyName: string;
  roleTitle: string;
  status: "draft" | "planned" | "applied" | "interview" | "assignment" | "offer" | "rejected" | "withdrawn";

  // Optional details
  companyWebsite?: string;
  jobPostUrl?: string;
  applicationUrl?: string;

  location?: string;
  workType?: "onsite" | "hybrid" | "remote";
  priority?: "low" | "medium" | "high";

  dateApplied?: Date;
  deadline?: Date;
  nextFollowUpAt?: Date;

  notes?: string;
  tags?: string[];

  // Documents, keep simple for v1
  cvUrl?: string;
  coverLetterUrl?: string;
  otherDocUrls?: string[]; // anything else, portfolio, certificates, etc.

  // Ownership
  createdBy: string;

  createdAt?: Date;
  updatedAt?: Date;
}