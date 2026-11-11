export type FarmType = "pig" | "poultry";

export type Farm = {
  id: string;
  name: string;
  type: FarmType;
  accessRole: string;
};

export type PortalUser = {
  id: string;
  name: string;
  email: string;
};

export type ChecklistStatus = "done" | "follow_up" | "not_applicable";

export type AssessmentResponse = {
  itemId: string;
  label: string;
  status: ChecklistStatus;
  note: string;
};

export type Assessment = {
  id: string;
  farmId: string;
  farmName: string;
  farmType: FarmType;
  assessedOn: string;
  responses: AssessmentResponse[];
  createdAt: string;
  createdBy: string;
};
