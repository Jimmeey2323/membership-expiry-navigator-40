import { MembershipData } from "@/types/membership";

// Note: This appears to be an OpenAI API key format. For Gemini AI, you'll need a Google AI Studio API key
// Get one at: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = "AIzaSyCI59uZRMF3Gvv3LQJKoYSpgpG_dZPh1E8";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

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

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

class GeminiAIService {
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;
  private demoMode = true; // Set to false when you have a valid Gemini API key

  private async makeRequest(prompt: string): Promise<string> {
    if (this.demoMode) {
      // Demo mode - return simulated responses
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return this.getDemoResponse(prompt);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        }
      })
    });

    this.lastRequestTime = Date.now();

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private getDemoResponse(prompt: string): string {
    // Simulate different responses based on content keywords
    const content = prompt.toLowerCase();
    
    if (content.includes('expensive') || content.includes('cost') || content.includes('money') || content.includes('price')) {
      return JSON.stringify({
        tags: ["Cost concerns", "Perceived value gap"],
        confidence: 85,
        reasoning: "Member expresses concerns about pricing and value for money"
      });
    } else if (content.includes('results') || content.includes('progress') || content.includes('slow')) {
      return JSON.stringify({
        tags: ["Lack of visible results", "Workout plateau or repetition fatigue"],
        confidence: 90,
        reasoning: "Member is frustrated with lack of progress or visible results"
      });
    } else if (content.includes('time') || content.includes('busy') || content.includes('schedule')) {
      return JSON.stringify({
        tags: ["Time constraints", "Inconvenient class timings"],
        confidence: 78,
        reasoning: "Member has scheduling conflicts or time management issues"
      });
    } else if (content.includes('injury') || content.includes('hurt') || content.includes('pain') || content.includes('health')) {
      return JSON.stringify({
        tags: ["Health or injury issues"],
        confidence: 95,
        reasoning: "Member has health or injury concerns affecting their fitness routine"
      });
    } else if (content.includes('instructor') || content.includes('trainer') || content.includes('staff')) {
      return JSON.stringify({
        tags: ["Instructor connection issues"],
        confidence: 82,
        reasoning: "Member has issues with instructor connection or teaching style"
      });
    } else if (content.includes('respond') || content.includes('contact') || content.includes('silent')) {
      return JSON.stringify({
        tags: ["Unresponsive"],
        confidence: 88,
        reasoning: "Member is not responding to communications or follow-up attempts"
      });
    } else {
      return JSON.stringify({
        tags: ["Miscellaneous"],
        confidence: 60,
        reasoning: "General feedback that doesn't fit specific categories"
      });
    }
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
- Analyze the sentiment and content of the feedback
- Select 1-3 most relevant tags that best describe the member's situation or concerns
- Provide confidence level (0-100)
- Give brief reasoning

Respond in this exact JSON format:
{
  "tags": ["tag1", "tag2"],
  "confidence": 85,
  "reasoning": "Brief explanation of why these tags were chosen"
}
`;
  }

  private extractTextFromMember(member: MembershipData): string {
    const texts: string[] = [];
    
    if (member.comments && member.comments.trim()) {
      texts.push(member.comments);
    }
    
    if (member.notes && member.notes.trim()) {
      texts.push(member.notes);
    }

    // TODO: Add follow-up comments when that field is available
    
    return texts.join('\n\n').trim();
  }

  private parseAIResponse(response: string): { tags: AITag[]; confidence: number; reasoning: string } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and filter tags
      const validTags = parsed.tags?.filter((tag: string) => 
        AI_TAGS.includes(tag as AITag)
      ) || [];

      return {
        tags: validTags,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: parsed.reasoning || 'AI analysis completed'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error, 'Response:', response);
      return {
        tags: ['Miscellaneous'],
        confidence: 30,
        reasoning: 'Unable to parse AI response, defaulted to miscellaneous'
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
        reasoning: 'No text content to analyze'
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
      console.error('Error analyzing member:', error);
      return {
        memberId: member.memberId,
        suggestedTags: ['Miscellaneous'],
        confidence: 0,
        reasoning: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async analyzeMembersBatch(members: MembershipData[]): Promise<AIAnalysisResult[]> {
    // Filter members that have comments/notes
    const membersWithContent = members.filter(member => {
      const hasComments = member.comments && member.comments.trim();
      const hasNotes = member.notes && member.notes.trim();
      return hasComments || hasNotes;
    });

    console.log(`Analyzing ${membersWithContent.length} members with content out of ${members.length} total members`);

    const results: AIAnalysisResult[] = [];
    
    for (const member of membersWithContent) {
      try {
        const result = await this.analyzeMember(member);
        results.push(result);
        console.log(`Analyzed ${member.firstName} ${member.lastName}: ${result.suggestedTags.join(', ')}`);
      } catch (error) {
        console.error(`Failed to analyze member ${member.memberId}:`, error);
        results.push({
          memberId: member.memberId,
          suggestedTags: ['Miscellaneous'],
          confidence: 0,
          reasoning: 'Analysis failed'
        });
      }
    }

    return results;
  }

  getAvailableTags(): readonly AITag[] {
    return AI_TAGS;
  }
}

export const geminiAIService = new GeminiAIService();