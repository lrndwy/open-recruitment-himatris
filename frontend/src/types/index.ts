export type SelectionStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type RegistrationStatus = "UPCOMING" | "OPEN" | "CLOSED";

export type RegistrationPeriod = {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  status: RegistrationStatus;
};

export type Division = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type ProgramStudy = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

export type Ref = { id: string; name: string };

export type ApplicantListItem = {
  id: string;
  name: string;
  nim: string;
  class: string;
  birth_date: string | null;
  program_study: Ref;
  division_1: Ref;
  division_2: Ref | null;
  selection_status: SelectionStatus;
  accepted_division?: Ref | null;
  created_at: string;
};

export type ApplicantDetail = {
  id: string;
  name: string;
  nim: string;
  class: string;
  program_study: Ref;
  birth_date: string | null;
  portfolio: {
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
  } | null;
  division_1: Ref;
  division_2: Ref | null;
  cv: {
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
  } | null;
  poster: {
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
  } | null;
  selection_status: SelectionStatus;
  accepted_division?: Ref | null;
  created_at: string;
  updated_at: string;
};

export type AdminStatus = "ACTIVE" | "INACTIVE";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  status: AdminStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};
