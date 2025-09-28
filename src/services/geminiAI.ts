import { MembershipData } from "@/types/membership";

// --- Best Practice: Use Environment Variables for API Keys ---
// Your API key should be stored in a `.env.local` file at the root of your project:
// VITE_GEMINI_API_KEY="AIzaSy...your...real...api...key"
// This prevents exposing your secret key in the source code.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export const AI_TAGS = [
  // Performance & Results
  "Lack of visible results",
  "Workout plateau or repetition fatigue",
  "Not seeing progress fast enough",
  "Physical transformation disappointment",
  
  // Class & Instruction
  "Mismatch of class style", 
  "Instructor connection issues",
  "Class too difficult/easy",
  "Lack of personalization",
  "Poor form correction",
  
  // Environment & Facilities
  "Studio environment concerns",
  "Equipment issues or availability",
  "Cleanliness concerns",
  "Overcrowded classes",
  "Noise levels",
  
  // Scheduling & Accessibility
  "Inconvenient class timings",
  "Location accessibility challenges",
  "Difficulty booking classes",
  "Limited class variety",
  "Schedule conflicts",
  
  // Financial
  "Cost concerns",
  "Perceived value gap",
  "Needs additional discounts",
  "Payment issues",
  "Competing offers elsewhere",
  
  // Life Circumstances
  "Life changes",
  "Time constraints",
  "Work schedule conflicts",
  "Family obligations",
  "Relocation",
  
  // Health & Physical
  "Health or injury issues",
  "Physical limitations",
  "Recovery concerns",
  "Age-related challenges",
  
  // Motivation & Engagement
  "Seasonal drop in motivation",
  "Lack of community feeling",
  "Missing workout buddies",
  "Boredom with routine",
  "Lost initial enthusiasm",
  
  // Alternatives & Competition
  "Preference for alternative fitness options",
  "Found better gym/studio",
  "Home workout preference",
  "Outdoor activity preference",
  
  // Communication & Service
  "Unresponsive",
  "Poor customer service",
  "Communication breakdown",
  "Billing issues",
  "Policy disagreements",
  
  // Satisfaction Levels
  "Highly satisfied",
  "Generally satisfied",
  "Neutral experience",
  "Somewhat dissatisfied",
  "Highly dissatisfied",
  
  // Behavioral Patterns
  "Frequent cancellations",
  "Irregular attendance",
  "Peak hour conflicts",
  "Social anxiety",
  
  "Miscellaneous"
] as const;

export type AITag = typeof AI_TAGS[number];

interface AIAnalysisResult {
  memberId: string;
  suggestedTags: AITag[];
  confidence: number;
  reasoning: string;
  sentiment?: string;
  churnRisk?: string;
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
You are an expert fitness membership analyst specializing in deep sentiment analysis and member retention psychology. Analyze the following member data comprehensively.

Member Profile:
- Name: ${member.firstName} ${member.lastName}
- Email: ${member.email}
- Membership Type: ${member.membershipName || 'Unknown'}
- Status: ${member.status || 'Unknown'}
- Location: ${member.location || 'Unknown'}
- Current Usage: ${member.currentUsage || 'Unknown'}

Member Data & Feedback:
"${allText}"

Available Analysis Tags (select 2-5 most relevant):
${AI_TAGS.map((tag, index) => `${index + 1}. ${tag}`).join('\n')}

Analysis Instructions:
1. **Sentiment Analysis**: Determine the overall emotional tone (positive, neutral, negative, mixed)
2. **Root Cause Analysis**: Identify underlying issues beyond surface complaints
3. **Behavioral Patterns**: Look for usage patterns, engagement levels, and lifecycle stage
4. **Risk Assessment**: Evaluate churn probability and retention factors
5. **Contextual Factors**: Consider membership type, location, usage patterns, and account status
6. **Multiple Dimensions**: A member may have multiple valid concerns/satisfactions

Provide your analysis in this exact JSON format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 85,
  "sentiment": "negative|neutral|positive|mixed",
  "churnRisk": "low|medium|high",
  "reasoning": "Detailed analysis explaining the sentiment, selected tags, behavioral patterns, and recommended actions based on member context and feedback."
}
`;
  }

  private extractTextFromMember(member: MembershipData): string {
    const texts: string[] = [];
    
    // Add member comments and notes
    if (member.comments && member.comments.trim()) {
      texts.push(`Member Comments: ${member.comments}`);
    }
    
    if (member.notes && member.notes.trim()) {
      texts.push(`Internal Notes: ${member.notes}`);
    }
    
    // Add contextual member information for deeper analysis
    const contextInfo: string[] = [];
    
    if (member.status) {
      contextInfo.push(`Current Status: ${member.status}`);
    }
    
    if (member.membershipName) {
      contextInfo.push(`Membership Type: ${member.membershipName}`);
    }
    
    if (member.location) {
      contextInfo.push(`Home Location: ${member.location}`);
    }
    
    if (member.endDate) {
      const endDate = new Date(member.endDate);
      const now = new Date();
      const daysToExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToExpiry < 0) {
        contextInfo.push(`Membership Status: Expired ${Math.abs(daysToExpiry)} days ago`);
      } else if (daysToExpiry <= 30) {
        contextInfo.push(`Membership Status: Expiring in ${daysToExpiry} days`);
      } else {
        contextInfo.push(`Membership Status: Active, expires in ${daysToExpiry} days`);
      }
    }
    
    if (member.currentUsage) {
      contextInfo.push(`Usage Pattern: ${member.currentUsage}`);
    }
    
    if (member.frozen && member.frozen.trim()) {
      contextInfo.push(`Account Status: ${member.frozen}`);
    }
    
    if (contextInfo.length > 0) {
      texts.push(`Member Context: ${contextInfo.join('; ')}`);
    }
    
    return texts.join('\n\n').trim();
  }

  private parseAIResponse(response: string): { tags: AITag[]; confidence: number; reasoning: string; sentiment?: string; churnRisk?: string } {
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
        reasoning: parsed.reasoning || 'AI analysis completed without detailed reasoning.',
        sentiment: parsed.sentiment || 'neutral',
        churnRisk: parsed.churnRisk || 'medium'
      };
    } catch (error) {
      console.error("Failed to parse AI response:", response, "Error:", error);
      return {
        tags: ['Miscellaneous'],
        confidence: 30,
        reasoning: 'Error: Unable to parse the AI response, defaulted to miscellaneous.',
        sentiment: 'neutral',
        churnRisk: 'medium'
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
        reasoning: 'No text content available to analyze.',
        sentiment: 'neutral',
        churnRisk: 'medium'
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
        reasoning: analysis.reasoning,
        sentiment: analysis.sentiment || 'neutral',
        churnRisk: analysis.churnRisk || 'medium'
      };
    } catch (error) {
      return {
        memberId: member.memberId,
        suggestedTags: ['Miscellaneous'],
        confidence: 0,
        reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sentiment: 'neutral',
        churnRisk: 'high'  // Failed analysis suggests potential risk
      };
    }
  }

  async analyzeMembersBatch(members: MembershipData[]): Promise<AIAnalysisResult[]> {
    // Filter members that have comments/notes but don't already have AI tags
    const membersWithContent = members.filter(member => {
      const hasComments = member.comments && member.comments.trim();
      const hasNotes = member.notes && member.notes.trim();
      const hasContent = hasComments || hasNotes;
      
      // Skip if already has AI tags (don't re-process)
      const alreadyProcessed = member.aiTags && member.aiTags.length > 0;
      
      return hasContent && !alreadyProcessed;
    });

    const results: AIAnalysisResult[] = [];
    
    console.log(`Processing ${membersWithContent.length} members for AI analysis (${members.length - membersWithContent.length} already processed or no content)`);
    
    for (const member of membersWithContent) {
        const result = await this.analyzeMember(member);
        results.push(result);
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  getAvailableTags(): readonly AITag[] {
    return AI_TAGS;
  }
}

export const geminiAIService = new GeminiAIService();