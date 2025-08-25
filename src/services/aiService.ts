import { QuoteGenerationRequest, QuoteGenerationResponse } from '../types';


// Configuration
const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
const USE_EMULATOR = IS_DEVELOPMENT && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Function to get the base URL for Firebase Functions
const getBaseFunctionUrl = (): string => {
  if (USE_EMULATOR) {
    const EMULATOR_HOST = 'localhost';
    const EMULATOR_PORT = 5001;
    const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    return `http://${EMULATOR_HOST}:${EMULATOR_PORT}/${PROJECT_ID}/us-central1`;
  }
  return import.meta.env.VITE_FIREBASE_FUNCTION_URL || 'https://your-region-your-project.cloudfunctions.net';
};



// Base Firebase Functions URL from environment
const FIREBASE_FUNCTIONS_BASE_URL = getBaseFunctionUrl();

// Construct function URLs using base URL
const FIREBASE_FUNCTION_URL = `${FIREBASE_FUNCTIONS_BASE_URL}/generateQuote`;
const BOLT_PROMPT_FUNCTION_URL = `${FIREBASE_FUNCTIONS_BASE_URL}/generateBoltPrompt`;
const INVITE_USER_FUNCTION_URL = `${FIREBASE_FUNCTIONS_BASE_URL}/inviteUser`;

export const generateQuote = async (request: QuoteGenerationRequest): Promise<QuoteGenerationResponse> => {
  try {
    const response = await fetch(FIREBASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyName: request.companyName,
        projectDescription: request.projectDescription,
        hourlyRate: request.hourlyRate || 100
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to generate quote');
    }

    const aiData = result.data;

    // Transform the Firebase function response to match our frontend interface
    const scopeOfWork = aiData.ScopeOfWork.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      feature: item.FeatureName,
      description: item.Description,
      items: item.Items?.map((subItem: any) => ({
        itemName: subItem.ItemName,
        description: subItem.Description
      })) || [],
      estimatedHours: Number(item.EstimatedHours),
      estimatedCost: Number(item.EstimatedCost)
    }));

    // Create a simple timeFrame string from the structured TimeFrame object
    const timeFramePhases = aiData.TimeFrame;
    const totalDays = Object.values(timeFramePhases).reduce((sum: number, days: any) => {
      return sum + parseInt(days.toString().replace(/\D/g, '')) || 0;
    }, 0);
    const timeFrame = `${totalDays} days (${Math.ceil(totalDays / 5)} weeks)`;

    return {
      projectOverview: aiData.ProjectOverview,
      timeFrame,
      scopeOfWork,
      hourlyRate: Number(aiData.HourlyRate),
      totalEstimatedCost: Number(aiData.TotalEstimatedCost)
    };

  } catch (error) {
    console.error('Error generating quote:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate quote');
  }
};

export interface BoltPromptRequest {
  quoteResponse: any; // The full quote response from generateQuote
  companyName: string;
  additionalContext?: string;
}

export interface BoltPromptResponse {
  prompt: string;
  metadata: {
    generatedAt: string;
    model: string;
    companyName: string;
    featuresCount: number;
    estimatedCost: number;
  };
}

export const generateBoltPrompt = async (request: BoltPromptRequest): Promise<BoltPromptResponse> => {
  try {
    const response = await fetch(BOLT_PROMPT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to generate Bolt.New prompt');
    }

    return result.data;
  } catch (error) {
    console.error('Error generating Bolt.New prompt:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate Bolt.New prompt');
  }
};

export const generateMockup = async (
  quoteData: any, 
  quoteId: string, 
  companyName: string
): Promise<{ mockupUrl: string }> => {
  try {
    const MOCKUP_FUNCTION_URL = `${FIREBASE_FUNCTIONS_BASE_URL}/generateMockup`;
    
    const response = await fetch(MOCKUP_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteData,
        quoteId,
        companyName
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to generate mockup');
    }

    return { mockupUrl: result.mockupUrl };

  } catch (error) {
    console.error('Error generating mockup:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate mockup'
    );
  }
};

export interface InviteUserRequest {
  email: string;
  role: 'admin' | 'standard';
  companyId: string;
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  invitationId: string;
}

export interface AcceptInvitationRequest {
  token: string;
  name: string;
  password: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  userId: string;
  message: string;
}

export const inviteUser = async (
  request: InviteUserRequest,
  authToken: string
): Promise<InviteUserResponse> => {
  try {
    const response = await fetch(INVITE_USER_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invitation');
    }

    return result;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to invite user');
  }
};

export const resendInvitation = async (
  email: string,
  role: 'admin' | 'standard',
  companyId: string,
  authToken: string
): Promise<InviteUserResponse> => {
  try {
    const response = await fetch(INVITE_USER_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        email,
        role,
        companyId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to resend invitation');
    }

    return result;
  } catch (error) {
    console.error('Error resending invitation:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to resend invitation');
  }
};

export const acceptInvitation = async (
  request: AcceptInvitationRequest
): Promise<AcceptInvitationResponse> => {
  try {
    const response = await fetch('https://us-central1-insytifycms.cloudfunctions.net/acceptInvitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to accept invitation');
    }

    return result;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to accept invitation');
  }
};