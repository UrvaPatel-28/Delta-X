/**
 * Enums for the DeltaX application
 * This file contains all enums used across the application to maintain consistency
 */

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  CONSULTANT = 'consultant',
  CLIENT = 'client',
}

/**
 * Tenant status types
 */
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * Types of canvas available in the platform
 */
export enum CanvasType {
  BUSINESS_MODEL = 'business-model',
  SWOT = 'swot',
  LEAN = 'lean',
}

/**
 * Question types for workshop events
 */
export enum QuestionType {
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple-choice',
  SINGLE_CHOICE = 'single-choice',
}

/**
 * Submission status types
 */
export enum SubmissionStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
}

/**
 * Review request status
 */
export enum ReviewStatus {
  NONE = 'none',
  REQUESTED = 'requested',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

/**
 * AI feedback status
 */
export enum AiFeedbackStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
