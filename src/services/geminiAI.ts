import { MembershipData } from "@/types/membership";

// --- Best Practice: Use Environment Variables for API Keys ---
// Your API key should be stored in a `.env.local` file at the root of your project:
// GEMINI_API_KEY="AIzaSy...your...real...api...key"
// This prevents exposing your secret key in the source code.
const GEMINI_API_KEY = "AIzaSyDlV6HeHWQLcuecrTLXCpdhqTb-FM8uC1w";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export const AI_TAGS = [
  "Lack of visible results",
  "Workout plateau or repetition fatigue",
  "Mismatch of class style",
  "Instructor connection issues",
  "Studio environment concerns",
  "Inconvenient class timings",
  "Location accessibility challenges",
  "Difficulty booking classes",
  "Cost concerns",
  "Perceived value gap",
  "Life changes",
  "Time constraints",
  "Health or injury issues",
  "Seasonal drop in motivation",
  "Preference for alternative fitness options",
  "Unresponsive",
  "Needs additional discounts",
  "Miscellaneous"
] as const;

export type AITag = typeof AI_TAGS[number];

interface AIAnalysisResult {
  memberId: string;
  suggestedTags: AITag[];
  confidence: number;
  reasoning: string;
}

// Updated interface to include potential feedback for blocked prompts
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason: string;
    // other fields can be added if needed
  };
}


class GeminiAIService {
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  // Method to list available models for debugging
  async listAvailableModels(): Promise<any> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Available Gemini models:', data);
      return data;
    } catch (error) {
      console.error('Error listing models:', error);
      throw error;
    }
  }

  private async makeRequest(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY as an environment variable.");
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }

    // Try different model names that are available in v1beta
    const modelNames = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    let lastError: Error | null = null;

    for (const modelName of modelNames) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        
        // Use the correct v1beta request format
        const requestBody = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        };
        
        const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        this.lastRequestTime = Date.now();

        if (response.ok) {
          const data: GeminiResponse = await response.json();
          
          if (data.promptFeedback) {
            throw new Error(`Request was blocked by Gemini. Reason: ${data.promptFeedback.blockReason}`);
          }

          if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No response candidates from Gemini API. The prompt might have been filtered.');
          }

          console.log(`Successfully used model: ${modelName}`);
          return data.candidates[0].content.parts[0].text;
        } else {
          const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
          lastError = new Error(`Model ${modelName} failed: ${errorBody.error?.message || 'Unknown error'}`);
          console.warn(`Model ${modelName} not available:`, errorBody.error?.message);
          continue;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`Unknown error with model ${modelName}`);
        console.warn(`Error with model ${modelName}:`, error);
        continue;
      }
    }

    // If we get here, all models failed
    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private createAnalysisPrompt(member: MembershipData, allText: string): string {
    return `
You are a fitness membership analyst. Analyze the following member feedback and assign the most appropriate tags from the predefined list.

Member Information:
- Name: ${member.firstName} ${member.lastName}
- Membership: ${member.membershipName}
- Status: ${member.status}
- Location: ${member.location}

Combined Feedback Text:
"${allText}"

Available Tags (choose 1-3 most relevant):
${AI_TAGS.map((tag, index) => `${index + 1}. ${tag}`).join('\n')}

Instructions:
- Analyze the sentiment and content of the feedback.
- Select 1-3 most relevant tags that best describe the member's situation or concerns.
- Provide a confidence level (0-100).
- Give brief reasoning for your choices.

Respond in this exact JSON format:
{
  "tags": ["tag1", "tag2"],
  "confidence": 85,
  "reasoning": "Brief explanation of why these tags were chosen."
}
`;
  }

  private extractTextFromMember(member: MembershipData): string {
    const texts: string[] = [];
    
    if (member.comments && member.comments.trim()) {
      texts.push(`Member Comment: ${member.comments}`);
    }
    
    if (member.notes && member.notes.trim()) {
      texts.push(`Internal Note: ${member.notes}`);
    }
    
    return texts.join('\n\n').trim();
  }

  private parseAIResponse(response: string): { tags: AITag[]; confidence: number; reasoning: string } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in the AI response.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const validTags = parsed.tags?.filter((tag: string) => 
        AI_TAGS.includes(tag as AITag)
      ) || [];

      return {
        tags: validTags,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: parsed.reasoning || 'AI analysis completed without detailed reasoning.'
      };
    } catch (error) {
      console.error("Failed to parse AI response:", response, "Error:", error);
      return {
        tags: ['Miscellaneous'],
        confidence: 30,
        reasoning: 'Error: Unable to parse the AI response, defaulted to miscellaneous.'
      };
    }
  }

  async analyzeMember(member: MembershipData): Promise<AIAnalysisResult> {
    const textContent = this.extractTextFromMember(member);
    
    if (!textContent) {
      return {
        memberId: member.memberId,
        suggestedTags: [],
        confidence: 0,
        reasoning: 'No text content available to analyze.'
      };
    }

    try {
      const prompt = this.createAnalysisPrompt(member, textContent);
      const response = await this.makeRequest(prompt);
      const analysis = this.parseAIResponse(response);

      return {
        memberId: member.memberId,
        suggestedTags: analysis.tags,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning
      };
    } catch (error) {
      return {
        memberId: member.memberId,
        suggestedTags: ['Miscellaneous'],
        confidence: 0,
        reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async analyzeMembersBatch(members: MembershipData[]): Promise<AIAnalysisResult[]> {
    const membersWithContent = members.filter(member => {
      const hasComments = member.comments && member.comments.trim();
      const hasNotes = member.notes && member.notes.trim();
      return hasComments || hasNotes;
    });

    const results: AIAnalysisResult[] = [];
    
    for (const member of membersWithContent) {
        const result = await this.analyzeMember(member);
        results.push(result);
    }

    return results;
  }

  getAvailableTags(): readonly AITag[] {
    return AI_TAGS;
  }
}

export const geminiAIService = new GeminiAIService();