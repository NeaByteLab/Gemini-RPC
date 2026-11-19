import type * as Types from '@app/types.ts'

/** Model type constants for RPC */
const ModelType = {
  Image: 4,
  TTS: 5,
  Text: 1
} as const

/**
 * Gemini RPC client.
 * @description Provides methods for text, image, audio generation.
 */
export class GeminiRPC {
  /** Gemini batch execute endpoint URL */
  private static readonly endpoint = 'https://gemini.google.com/_/BardChatUi/data/batchexecute'
  /** Standard browser headers for simulation */
  private static readonly headers = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  }

  /**
   * Fetch content from URL.
   * @description Executes instruction on remote URL content.
   * @param instruction - Task to perform on content
   * @param url - Remote resource location
   * @returns Extracted text response
   */
  static async fetch(instruction: string, url: string): Promise<string> {
    const response = await this.callRPC({
      contents: [{
        parts: [
          { fileData: { mimeType: 'text/plain', fileUri: url } },
          { text: instruction }
        ]
      }]
    }, ModelType.Text)
    return response.data.candidates[0]?.content.parts.find((part) => part.text)?.text || ''
  }

  /**
   * Generate audio from text.
   * @description Converts prompt to speech with specified voice.
   * @param prompt - Text to convert to speech
   * @param voiceName - Voice preset to use
   * @returns Base64 encoded audio data
   */
  static async generateAudio(prompt: string, voiceName = 'Kore'): Promise<string> {
    const response = await this.callRPC({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    }, ModelType.TTS)
    return response.data.candidates[0]?.content.parts[0]?.inlineData?.data || ''
  }

  /**
   * Generate image from prompt.
   * @description Creates image based on text description.
   * @param prompt - Image description text
   * @returns Base64 encoded image or text fallback
   */
  static async generateImage(prompt: string): Promise<string> {
    const response = await this.callRPC({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    }, ModelType.Image)
    const part = response.data.candidates[0]?.content.parts[0]
    return part?.inlineData?.data || part?.text || ''
  }

  /**
   * Generate structured JSON output.
   * @description Returns JSON matching provided schema.
   * @template T - Expected JSON structure type
   * @param prompt - JSON generation instruction
   * @param schema - JSON schema for validation
   * @returns Parsed JSON matching schema
   */
  static async generateJSON<T = unknown>(
    prompt: string,
    schema: Record<string, unknown>
  ): Promise<T> {
    const response = await this.callRPC({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    }, ModelType.Text)
    return JSON.parse(response.data.candidates[0]?.content.parts[0]?.text || '') as T
  }

  /**
   * Generate plain text response.
   * @description Simple text generation from prompt.
   * @param prompt - Input text instruction
   * @returns Generated text content
   */
  static async generateText(prompt: string): Promise<string> {
    const response = await this.callRPC({
      contents: [{ parts: [{ text: prompt }] }]
    }, ModelType.Text)
    return response.data.candidates[0]?.content.parts[0]?.text || ''
  }

  /**
   * Invoke function declarations.
   * @description Calls model to select and invoke functions.
   * @param prompt - Function invocation instruction
   * @param functions - Available function declarations
   * @returns Function call data or null
   */
  static async invoke(
    prompt: string,
    functions: Types.GeminiFunctionDeclaration[]
  ): Promise<Types.GeminiFunctionCall | null> {
    const response = await this.callRPC({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ functionDeclarations: functions }]
    }, ModelType.Text)
    return response.data.candidates[0]?.content.parts[0]?.functionCall || null
  }

  /**
   * Execute code in sandbox.
   * @description Runs code with instruction in isolated environment.
   * @param instruction - Execution instruction
   * @param code - Source code to execute
   * @returns Execution output or text fallback
   */
  static async sandbox(instruction: string, code: string): Promise<string> {
    const response = await this.callRPC({
      contents: [{
        parts: [{ text: `Execute this code:\n${code}\n\nInstruction: ${instruction}` }]
      }],
      tools: [{ codeExecution: {} }]
    }, ModelType.Text)
    const parts = response.data.candidates[0]?.content.parts ?? []
    return parts.find((part) => part.codeExecutionResult)?.codeExecutionResult?.output ||
      parts.find((part) => part.text)?.text ||
      ''
  }

  /**
   * Search with Google.
   * @description Performs web search and returns results.
   * @param query - Search query string
   * @returns Search result text content
   */
  static async search(query: string): Promise<string> {
    const response = await this.callRPC({
      contents: [{ parts: [{ text: query }] }],
      tools: [{ googleSearch: {} }]
    }, ModelType.Text)
    return response.data.candidates[0]?.content.parts[0]?.text || ''
  }

  /**
   * Execute RPC call to Gemini.
   * @description Sends batch execute request with payload.
   * @param request - Content request payload
   * @param modelType - Model type identifier
   * @returns Parsed RPC response data
   * @throws TypeError When HTTP response indicates failure
   * @throws SyntaxError When response JSON parsing fails
   */
  private static async callRPC(
    request: Types.GeminiContentRequest,
    modelType: Types.GeminiModelType = ModelType.Text
  ): Promise<Types.GeminiRPCResponse> {
    const rpc = JSON.stringify([[[
      'q4uTj',
      JSON.stringify([null, JSON.stringify(request), modelType]),
      null,
      'generic'
    ]]])
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: new URLSearchParams({ 'f.req': rpc }).toString()
    })
    if (!response.ok) {
      throw new TypeError(`HTTP ${response.status} ${response.statusText}`)
    }
    const lines = (await response.text()).split('\n').filter((line) => line.startsWith('[['))
    if (lines.length === 0) {
      throw new TypeError('Invalid RPC response format')
    }
    let parsed
    try {
      parsed = JSON.parse(lines[0]!)
    } catch {
      throw new SyntaxError('Invalid JSON response')
    }
    const entry = parsed[0]
    if (!Array.isArray(entry) || entry.length < 3) {
      throw new TypeError('Malformed RPC response structure')
    }
    const [type, methodName, dataStr] = entry
    let data: Types.GeminiContentResponse
    try {
      data = JSON.parse(JSON.parse(dataStr)[0])
    } catch {
      throw new SyntaxError('Invalid nested JSON response')
    }
    return { type, methodName, data }
  }
}

/** Extended GeminiRPC class alias */
export default class RPC extends GeminiRPC {}
