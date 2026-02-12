import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config'

let genAI: GoogleGenerativeAI | null = null

/**
 * Initialize Gemini AI
 */
export function getGeminiClient(): GoogleGenerativeAI {
    if (!genAI) {
        if (!config.ai.geminiApiKey) {
            throw new Error('Gemini API key not configured')
        }
        genAI = new GoogleGenerativeAI(config.ai.geminiApiKey)
    }
    return genAI
}

/**
 * Generate text with Gemini
 */
export async function generateText(
    prompt: string,
    options?: {
        temperature?: number
        maxTokens?: number
    }
): Promise<string> {
    try {
        const client = getGeminiClient()
        const model = client.getGenerativeModel({ model: config.ai.model })

        const generationConfig = {
            temperature: options?.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || config.ai.maxTokens,
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig,
        })

        const response = result.response
        return response.text()
    } catch (error) {
        console.error('Gemini AI error:', error)
        throw new Error('Failed to generate AI response')
    }
}

/**
 * Create a structured prompt for consistent formatting
 */
export function createPrompt(
    systemContext: string,
    userRequest: string,
    data?: any
): string {
    let prompt = `${systemContext}\n\n`

    if (data) {
        prompt += `Data:\n${JSON.stringify(data, null, 2)}\n\n`
    }

    prompt += `Request: ${userRequest}\n\n`
    prompt += `Important: Provide a concise, actionable response. Focus on specific insights and recommendations.`

    return prompt
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseAIJson<T>(response: string): T {
    // Remove markdown code blocks if present
    let jsonStr = response.trim()

    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    try {
        return JSON.parse(jsonStr.trim()) as T
    } catch (error) {
        console.error('Failed to parse AI JSON:', error)
        throw new Error('Invalid AI response format')
    }
}
