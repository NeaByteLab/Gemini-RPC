/**
 * Candidate response from model.
 * @description Contains generated content and metadata.
 */
export interface GeminiCandidate {
  /** Generated content with role and parts */
  content: GeminiContent
  /** Reason generation finished */
  finishReason?: string
  /** Grounding metadata for citations */
  groundingMetadata?: Record<string, unknown>
  /** URL context metadata */
  urlContextMetadata?: Record<string, unknown>
}

/**
 * Content message structure.
 * @description Holds role and content parts.
 */
export interface GeminiContent {
  /** Speaker role identifier */
  role?: string
  /** Content parts array */
  parts: GeminiPart[]
}

/**
 * Request payload for generation.
 * @description Defines content and configuration for API call.
 */
export interface GeminiContentRequest {
  /** Content messages to send */
  contents: GeminiContent[]
  /** Tools available to model */
  tools?: GeminiTool[]
  /** Generation configuration options */
  generationConfig?: GeminiGenerationConfig
  /** System instruction for model */
  systemInstruction?: GeminiSystemInstruction
}

/**
 * Response from content generation.
 * @description Contains candidates and usage metadata.
 */
export interface GeminiContentResponse {
  /** Generated candidate responses */
  candidates: GeminiCandidate[]
  /** Model version used */
  modelVersion?: string
  /** Token usage metadata */
  usageMetadata?: Record<string, unknown>
}

/**
 * Function call from model.
 * @description Contains function name and arguments.
 */
export interface GeminiFunctionCall {
  /** Function name to invoke */
  name: string
  /** Function arguments */
  args: Record<string, unknown>
  /** Unique call identifier */
  id: string
}

/**
 * Function declaration for tools.
 * @description Defines function signature for model.
 */
export interface GeminiFunctionDeclaration {
  /** Function name */
  name: string
  /** Function description */
  description: string
  /** Parameter schema definition */
  parameters: {
    /** Schema type identifier */
    type: string
    /** Property definitions */
    properties: Record<string, { type: string }>
    /** Required property names */
    required?: string[]
  }
}

/**
 * Function response result.
 * @description Contains function execution result.
 */
export interface GeminiFunctionResponse {
  /** Function name */
  name: string
  /** Function response data */
  response: Record<string, unknown>
  /** Response identifier */
  id: string
}

/**
 * Generation configuration options.
 * @description Controls model generation behavior.
 */
export interface GeminiGenerationConfig {
  /** Response modalities to generate */
  responseModalities?: string[]
  /** Response MIME type */
  responseMimeType?: string
  /** JSON schema for structured output */
  responseSchema?: Record<string, unknown>
  /** Thinking configuration */
  thinkingConfig?: {
    /** Include thinking steps */
    includeThoughts?: boolean
    /** Maximum thinking tokens */
    thinkingBudget?: number
  }
  /** Speech synthesis configuration */
  speechConfig?: {
    /** Voice configuration */
    voiceConfig?: {
      /** Prebuilt voice preset */
      prebuiltVoiceConfig?: {
        /** Voice preset name */
        voiceName: string
      }
    }
  }
}

/**
 * Content part structure.
 * @description Represents one piece of content.
 */
export interface GeminiPart {
  /** Text content */
  text?: string
  /** File reference data */
  fileData?: {
    /** File MIME type */
    mimeType: string
    /** File URI location */
    fileUri: string
  }
  /** Inline base64 data */
  inlineData?: {
    /** Data MIME type */
    mimeType: string
    /** Base64 encoded data */
    data: string
  }
  /** Executable code block */
  executableCode?: {
    /** Programming language */
    language: string
    /** Source code string */
    code: string
    /** Code block identifier */
    id: string
  }
  /** Code execution result */
  codeExecutionResult?: {
    /** Execution outcome status */
    outcome: string
    /** Execution output */
    output: string
    /** Result identifier */
    id: string
  }
  /** Function call request */
  functionCall?: GeminiFunctionCall
  /** Function response data */
  functionResponse?: GeminiFunctionResponse
  /** Thought signature for reasoning */
  thoughtSignature?: string
}

/**
 * RPC response wrapper.
 * @description Contains parsed RPC response data.
 */
export interface GeminiRPCResponse {
  /** Response type identifier */
  type: string
  /** Method name from server */
  methodName: string
  /** Parsed content response */
  data: GeminiContentResponse
}

/**
 * System instruction message.
 * @description Contains system-level instructions.
 */
export interface GeminiSystemInstruction {
  /** Instruction content parts */
  parts: GeminiPart[]
}

/**
 * Tool configuration for model.
 * @description Defines available tools and capabilities.
 */
export interface GeminiTool {
  /** Enable Google search tool */
  googleSearch?: Record<string, never>
  /** Enable code execution tool */
  codeExecution?: Record<string, never>
  /** Enable URL context tool */
  urlContext?: Record<string, never>
  /** Function declarations for tool use */
  functionDeclarations?: GeminiFunctionDeclaration[]
}

/** Model type identifier: 1=Text, 4=Image, 5=TTS */
export type GeminiModelType = 1 | 4 | 5
