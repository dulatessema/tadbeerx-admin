export interface User {
  id: string;
  email: string;
  role: 'admin' | 'support_specialist';
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'support_specialist';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface Worker {
  id: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    age?: number;
    nationalityId?: string;
    phoneNumber?: string;
    email?: string;
  };
  professionalInfo: {
    skillIds?: string[];
    languageIds?: string[];
    experience?: number;
    additionalInfo?: string;
  };
  fieldVisibility: {
    personalInfo?: {
      firstName?: boolean;
      lastName?: boolean;
      age?: boolean;
      nationality?: boolean;
      phone?: boolean;
      email?: boolean;
    };
    professionalInfo?: {
      skills?: boolean;
      languages?: boolean;
      experience?: boolean;
      additionalInfo?: boolean;
    };
  };
  status: 'available' | 'hired' | 'inactive';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  profileCompletionScore: number;
  viewCount: number;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Inquiry {
  id: string;
  workerId: string;
  clientInfo: {
    name: string;
    email: string;
    phone: string;
  };
  preferredContactMethod: 'whatsapp' | 'phone' | 'email';
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'new' | 'in_progress' | 'responded' | 'closed' | 'spam';
  assignedTo?: string;
  communicationLog: Array<{
    type: string;
    message: string;
    userId: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  worker?: Worker;
  assignedUser?: User;
}

export interface Nationality {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Language {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryStats {
  total: number;
  new: number;
  inProgress: number;
  responded: number;
  closed: number;
  spam: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  avgResponseTime: number;
}

export interface DashboardStats {
  workers: {
    total: number;
    available: number;
    hired: number;
    inactive: number;
    pending: number;
    approved: number;
    rejected: number;
    featured: number;
  };
  inquiries: InquiryStats;
}