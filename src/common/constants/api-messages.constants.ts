export const ApiMessages = {
  // Auth related messages
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGIN_FAILED: 'Invalid credentials',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
  },

  // Workshop related messages
  WORKSHOP: {
    CREATED: 'Workshop event created successfully',
    UPDATED: 'Workshop event updated successfully',
    DELETED: 'Workshop event deleted successfully',
    FETCHED: 'Workshop events retrieved successfully',
    NOT_FOUND: 'Workshop event not found',
    PUBLISHED: 'Workshop event published successfully',
    UNPUBLISHED: 'Workshop event unpublished successfully',
    QR_GENERATED: 'QR code generated successfully',
  },

  // Participant related messages
  PARTICIPANT: {
    SUBMISSION_CREATED: 'Submission created successfully',
    SUBMISSION_UPDATED: 'Submission updated successfully',
    SUBMISSION_FETCHED: 'Submission retrieved successfully',
    SUBMISSION_NOT_FOUND: 'Submission not found',
    WORKSHOP_FETCHED: 'Workshop event details retrieved successfully',
  },

  // AI related messages
  AI: {
    CONTENT_GENERATED: 'Canvas content generated successfully',
    FEEDBACK_GENERATED: 'Feedback generated successfully',
    FEEDBACK_REQUESTED: 'Feedback request received and is being processed',
    GENERATION_FAILED: 'Failed to generate content',
    FEEDBACK_FAILED: 'Failed to generate feedback',
    CHAT_RESPONSE_GENERATED: 'AI chat response generated successfully',
    CHAT_HISTORY_RESET: 'Chat history reset successfully',
    CHAT_FAILED: 'Failed to generate chat response',
  },

  // Tenant related messages
  TENANT: {
    FETCHED: 'Tenant information retrieved successfully',
    NOT_FOUND: 'Tenant not found',
  },

  // User related messages
  USER: {
    FETCHED: 'Users retrieved successfully',
    NOT_FOUND: 'User not found',
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
  },

  // Generic messages
  GENERIC: {
    SUCCESS: 'Operation completed successfully',
    BAD_REQUEST: 'Bad request',
    NOT_FOUND: 'Resource not found',
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
  },
};
