import * as functions from 'firebase-functions';

import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
// import { VertexAI } from '@google-cloud/vertexai'; // Not currently used
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';


// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS
const corsHandler = cors({ origin: true });

// Initialize VertexAI (commented out - not currently used)
// const vertexAI = new VertexAI({
//   project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
//   location: 'us-central1',
// });

// const model = 'gemini-2.5-flash';

interface QuoteRequest {
  companyName: string;
  projectDescription: string;
  hourlyRate?: number;
}

interface QuoteResponse {
  ProjectOverview: string;
  TimeFrame: {
    RequirementsClarificationPhase: string;
    Stage1Development: string;
    Stage2FinalDraft: string;
    Stage3Signoff: string;
  };
  ScopeOfWork: Array<{
    FeatureName: string;
    Description: string;
    Items: Array<{
      ItemName: string;
      Description: string;
    }>;
    EstimatedHours: number;
    EstimatedCost: number;
  }>;
  HourlyRate: number;
  TotalEstimatedCost: number;
}

interface PromptGenerationRequest {
  quoteResponse: QuoteResponse;
  companyName: string;
  additionalContext?: string;
}

interface StatementOfWorkRequest {
  companyName: string;
  projectDescription: string;
  industry?: string;
  targetAudience?: string;
  model?: string;
}

interface StatementOfWorkResponse {
  ExecutiveSummary: string;
  ProjectObjectives: string[];
  SolutionOverview: {
    PrimaryBenefits: string[];
    KeyCapabilities: string[];
  };
  CoreComponents: Array<{
    ComponentName: string;
    Purpose: string;
    Benefits: string[];
    KeyFeatures: string[];
  }>;
}

interface InviteUserRequest {
  email: string;
  role: 'admin' | 'standard';
  companyId?: string;
}
// Microsoft Graph API configuration
const createGraphClient = async (): Promise<Client> => {
  const clientConfig = {
    auth: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    },
  };

  const cca = new ConfidentialClientApplication(clientConfig);
  
  const clientCredentialRequest = {
    scopes: ['https://graph.microsoft.com/.default'],
  };

  try {
    const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
    
    if (!response?.accessToken) {
      throw new Error('Failed to acquire access token');
    }

    const graphClient = Client.init({
      authProvider: async (done) => {
        done(null, response.accessToken);
      },
    });

    return graphClient;
  } catch (error) {
    console.error('Error creating Graph client:', error);
    throw new Error('Failed to authenticate with Microsoft Graph API');
  }
};

// Send email using Microsoft Graph API
const sendEmailWithGraph = async (
  to: string,
  subject: string,
  htmlContent: string,
  fromEmail?: string
): Promise<void> => {
  try {
    const graphClient = await createGraphClient();
    const senderEmail = fromEmail || process.env.MICROSOFT_SENDER_EMAIL || process.env.EMAIL_FROM;
    
    if (!senderEmail) {
      throw new Error('Sender email not configured');
    }

    const message = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML' as const,
          content: htmlContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
        from: {
          emailAddress: {
            address: senderEmail,
          },
        },
      },
    };

    await graphClient.api(`/users/${senderEmail}/sendMail`).post(message);
    functions.logger.info('Email sent successfully via Microsoft Graph', {
      to,
      subject,
      from: senderEmail
    });
  } catch (error) {
    console.error('Error sending email via Microsoft Graph:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const inviteUser = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Verify the requesting user is authenticated and is an admin
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Get the requesting user's role from Firestore
      const requestingUserDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!requestingUserDoc.exists || requestingUserDoc.data()?.role !== 'admin') {
        response.status(403).json({ error: 'Admin access required' });
        return;
      }

      const { email, role, companyId }: InviteUserRequest = request.body;

      if (!email || !role) {
        response.status(400).json({ 
          error: 'Missing required fields: email and role' 
        });
        return;
      }

      // Check if user already exists
      try {
        await admin.auth().getUserByEmail(email);
        response.status(400).json({ error: 'User with this email already exists' });
        return;
      } catch (error) {
        const firebaseError = error as { code?: string };
        if (firebaseError.code !== 'auth/user-not-found') {
          throw error;
        }
        // User doesn't exist, which is what we want
      }

      // Generate invitation token
      const invitationToken = admin.firestore().collection('invitations').doc().id;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create invitation record
      const invitationData = {
        email,
        role,
        status: 'pending',
        invitedBy: decodedToken.uid,
        invitedByName: requestingUserDoc.data()?.name || 'Admin',
        companyId: companyId || requestingUserDoc.data()?.companyId,
        token: invitationToken,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      };

      await admin.firestore()
        .collection('invitations')
        .doc(invitationToken)
        .set(invitationData);

      // Send invitation email using Microsoft Graph API
      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}`;
      
      const emailSubject = 'You\'re invited to join Insytify CRM';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4285F4;">You're invited to join Insytify CRM</h2>
          <p>Hello,</p>
          <p>${requestingUserDoc.data()?.name || 'An admin'} has invited you to join their team on Insytify CRM.</p>
          <p><strong>Your role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
          <p>Click the button below to accept your invitation and set up your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation will expire on ${expiresAt.toLocaleDateString()}.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you can't click the button, copy and paste this link into your browser:<br>
            <a href="${invitationLink}">${invitationLink}</a>
          </p>
        </div>
      `;

      await sendEmailWithGraph(email, emailSubject, emailHtml);

      functions.logger.info('User invitation sent', {
        email,
        role,
        invitedBy: decodedToken.uid,
        invitationToken
      });

      response.status(200).json({
        success: true,
        message: 'Invitation sent successfully',
        invitationId: invitationToken
      });

    } catch (error) {
      functions.logger.error('Error inviting user:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to send invitation',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
});

export const removeUser = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow DELETE requests
      if (request.method !== 'DELETE') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Verify the requesting user is authenticated and is an admin
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Get the requesting user's role from Firestore
      const requestingUserDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!requestingUserDoc.exists || requestingUserDoc.data()?.role !== 'admin') {
        response.status(403).json({ error: 'Admin access required' });
        return;
      }

      const { userId } = request.body;

      if (!userId) {
        response.status(400).json({ error: 'Missing required field: userId' });
        return;
      }

      // Prevent admin from deleting themselves
      if (userId === decodedToken.uid) {
        response.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      // Delete user from Firebase Auth
      await admin.auth().deleteUser(userId);

      // Delete user document from Firestore
      await admin.firestore().collection('users').doc(userId).delete();

      functions.logger.info('User removed', {
        removedUserId: userId,
        removedBy: decodedToken.uid
      });

      response.status(200).json({
        success: true,
        message: 'User removed successfully'
      });

    } catch (error) {
      functions.logger.error('Error removing user:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to remove user',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
});

export const generateQuote = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Validate request body
      const { companyName, projectDescription, hourlyRate = 100 }: QuoteRequest = request.body;

      if (!companyName || !projectDescription) {
        response.status(400).json({ 
          error: 'Missing required fields: companyName and projectDescription' 
        });
        return;
      }

      // Construct the prompt
      const prompt = `
      You are a professional software consultant. Generate a detailed software development quotation in JSON format based on the following input:
      
      Company Name: "${companyName}"
      Project Description: "${projectDescription}"
      Hourly Rate: ${hourlyRate}
      
      OUTPUT:
      IMPORTANT:
      - Return ONLY a valid JSON object.
      - Do NOT include markdown, backticks, code fences, or additional text.
      - The response must start with '{' and end with '}'.
      
      STRUCTURE:
      {
        "ProjectOverview": "A concise paragraph summarizing the project, including the company name and purpose.",
        "TimeFrame": {
          "RequirementsClarificationPhase": "Estimated time in days",
          "Stage1Development": "Estimated time in days",
          "Stage2FinalDraft": "Estimated time in days",
          "Stage3Signoff": "Estimated time in days"
        },
        "ScopeOfWork": [
          {
            "FeatureName": "Feature name",
            "Description": "Detailed explanation of what this feature does and why it's needed",
            "Items": [
              { "ItemName": "Specific component name", "Description": "Detailed functionality description" }
            ],
            "EstimatedHours": number,
            "EstimatedCost": number
          }
        ],
        "HourlyRate": number,
        "TotalEstimatedCost": number
      }
      
      Guidelines:
      - Break down ALL functional requirements from the description into detailed features.
      - Include core features even if not explicitly stated:
        - User authentication (email/password + Google OAuth)
        - Role-based authorization (Admin, Standard User)
      - Assign realistic EstimatedHours per feature group:
        - Small feature: 4–8 hours
        - Medium feature: 8–12 hours
        - Large feature: 12–18 hours    
      - For each feature:
        - Provide multiple items (sub-components, workflows, integrations).
        - Calculate EstimatedCost = EstimatedHours * HourlyRate.
      - Add features for automation, dashboards, and reporting if implied.
      - At least 5 features for moderately complex projects.
      - Ensure HourlyRate and TotalEstimatedCost are numeric values.
      - Output only the JSON object, no explanations.
      `;
      

      // Call OpenAI API
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.key,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional software consultant who generates accurate project quotes in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = completion.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let quoteData: QuoteResponse;
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedResponse = aiResponse.trim().replace(/```json\n?|\n?```/g, '');
        quoteData = JSON.parse(cleanedResponse);
      } catch {
        functions.logger.error('Failed to parse AI response as JSON:', aiResponse);
        throw new Error('Invalid JSON response from AI');
      }

      // Validate the response structure
      if (!quoteData.ProjectOverview || !quoteData.ScopeOfWork || !Array.isArray(quoteData.ScopeOfWork)) {
        throw new Error('Invalid quote structure received from AI');
      }

      // Ensure numeric values are properly typed
      quoteData.HourlyRate = Number(quoteData.HourlyRate) || hourlyRate;
      quoteData.TotalEstimatedCost = Number(quoteData.TotalEstimatedCost) || 0;
      
      quoteData.ScopeOfWork = quoteData.ScopeOfWork.map(item => ({
        ...item,
        EstimatedHours: Number(item.EstimatedHours) || 0,
        EstimatedCost: Number(item.EstimatedCost) || 0,
      }));

      // Log successful generation
      functions.logger.info('Quote generated successfully', {
        companyName,
        totalCost: quoteData.TotalEstimatedCost,
        featuresCount: quoteData.ScopeOfWork.length
      });

      // Return the structured quote
      response.status(200).json({
        success: true,
        data: quoteData,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gpt-4',
          companyName,
          hourlyRate
        }
      });

    } catch (error) {
      functions.logger.error('Error generating quote:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to generate quote',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
});

export const generateStatementOfWork = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Validate request body
      const { companyName, projectDescription, industry, targetAudience, model: requestedModel }: StatementOfWorkRequest = request.body;

      if (!companyName || !projectDescription) {
        response.status(400).json({ 
          error: 'Missing required fields: companyName and projectDescription' 
        });
        return;
      }

      // Construct the prompt for Statement of Work
      const prompt = `
      You are a professional business consultant who creates customer-focused Statement of Work documents. Generate a comprehensive statement of work in JSON format that emphasizes business value, user benefits, and solution components.
      
      Company Name: "${companyName}"
      Project Description: "${projectDescription}"
      Industry: "${industry || 'General Business'}"
      Target Audience: "${targetAudience || 'Business users and stakeholders'}"
      
      OUTPUT:
      IMPORTANT:
      - Return ONLY a valid JSON object.
      - Do NOT include markdown, backticks, code fences, or additional text.
      - The response must start with '{' and end with '}'.
      - Focus on business benefits, user value, and solution outcomes rather than technical implementation details.
      
      STRUCTURE:
      {
        "ExecutiveSummary": "A compelling 2-3 sentence summary of the project's business value and expected outcomes for ${companyName}.",
        "ProjectObjectives": [
          "Primary business objective 1",
          "Primary business objective 2",
          "Primary business objective 3"
        ],
        "SolutionOverview": {
          "PrimaryBenefits": [
            "Key business benefit 1",
            "Key business benefit 2", 
            "Key business benefit 3"
          ],
          "KeyCapabilities": [
            "Core capability 1",
            "Core capability 2",
            "Core capability 3"
          ]
        },
        "CoreComponents": [
          {
            "ComponentName": "User Authentication & Access Management",
            "Purpose": "Business-focused description of why this component is needed",
            "Benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
            "KeyFeatures": ["Feature 1", "Feature 2", "Feature 3"]
          }
        ]
      }
      
      Guidelines:
      - Write from the customer's perspective, emphasizing business value and user benefits
      - Use business language rather than technical jargon
      - Include standard components like authentication, user management, dashboard, reporting
      - Focus on how each component solves business problems or improves efficiency
      - Include 3-5 core components based on the project description
      - Make the document compelling and professional for executive audiences
      - Emphasize security, performance, and user experience benefits within the core components
      `;

      // Call OpenRouter API (with fallback to OpenAI)
      const openai = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || functions.config().openai?.key,
        baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
      });

      // Choose model: 1) requested model, 2) environment variable, 3) default based on API key
      const model = requestedModel || 
        (process.env.OPENROUTER_API_KEY ? 
          (process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct') : 
          'gpt-4o-mini');

      functions.logger.info('Using AI model:', model);

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional business consultant who creates compelling Statement of Work documents that emphasize business value and customer benefits.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = completion.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      // Parse the JSON response
      let statementData: StatementOfWorkResponse;
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedResponse = aiResponse.trim().replace(/```json\n?|\n?```/g, '');
        statementData = JSON.parse(cleanedResponse);
      } catch {
        functions.logger.error('Failed to parse AI response as JSON:', aiResponse);
        throw new Error('Invalid JSON response from AI');
      }

      // Validate the response structure
      if (!statementData.ExecutiveSummary || !statementData.CoreComponents || !Array.isArray(statementData.CoreComponents)) {
        throw new Error('Invalid statement of work structure received from AI');
      }

      // Log successful generation
      functions.logger.info('Statement of Work generated successfully', {
        companyName,
        componentsCount: statementData.CoreComponents.length,
        industry: industry || 'General Business'
      });

      // Return the structured statement of work
      response.status(200).json({
        success: true,
        data: statementData,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: model,
          companyName,
          industry: industry || 'General Business',
          targetAudience: targetAudience || 'Business users and stakeholders'
        }
      });

    } catch (error) {
      functions.logger.error('Error generating statement of work:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to generate statement of work',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
});

export const generateBoltPrompt = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Validate request body
      const { quoteResponse, companyName, additionalContext }: PromptGenerationRequest = request.body;

      if (!quoteResponse || !companyName) {
        response.status(400).json({ 
          error: 'Missing required fields: quoteResponse and companyName' 
        });
        return;
      }

      // Validate quoteResponse structure
      if (!quoteResponse.ProjectOverview || !quoteResponse.ScopeOfWork || !Array.isArray(quoteResponse.ScopeOfWork)) {
        response.status(400).json({ 
          error: 'Invalid quoteResponse structure' 
        });
        return;
      }

      // Construct the system prompt
      const systemPrompt = `You are an expert in app architecture and no-code development. Generate a detailed Bolt.New prompt for creating a web application based on the given JSON input.

INPUT:
The input will be a JSON object containing:
- ProjectOverview
- TimeFrame
- ScopeOfWork (with FeatureName, Description, Items)
- HourlyRate
- TotalEstimatedCost
- (Optional) Any additional context provided by the Quote Generator, such as tech stack assumptions.

OUTPUT:
Return a single string containing a detailed Bolt.New prompt that includes the following:

1. **Introduction**:
   - Describe the application purpose and its main features in clear language.
   - Mention the company name and reference the ProjectOverview for context.

2. **Core Features & Components**:
   - For each feature in ScopeOfWork:
     - List the feature name as a heading.
     - Describe the UI elements required (pages, forms, modals, filters, dashboards, etc.).
     - Outline CRUD operations (if relevant).
     - Specify interactions such as sorting, filtering, and search.
     - Include any special notes from the Items array.

3. **Authentication & Authorization**:
   - Explicitly state the app must include:
     - User authentication (email/password + Google OAuth).
     - Role-based authorization (Admin, Standard User).

4. **Database Schema (Supabase)**:
   - Suggest tables for all features and relationships between them.
   - Include columns for common fields (id, timestamps, foreign keys).

5. **UI Structure & Navigation**:
   - Describe all major pages (Dashboard, Customer List, Customer Details, Quotes, Tasks, Reports, etc.).
   - Provide navigation flow and layout recommendations.
   - Include responsive design requirements.

6. **Design & Styling Guidelines**:
   - State that the app should have a clean, modern, Google-style UI.
   - Use Tailwind CSS.
   - Color palette:
     - Primary: #4285F4
     - Secondary: #34A853
     - Accent: #FBBC05
     - Neutral: #F1F3F4

7. **Tech Stack & Deployment**:
   - React for frontend
   - Supabase for authentication, database, and file storage
   - Ensure secure data handling and mobile responsiveness.

8. **Special Instructions**:
   - Do NOT include pricing or time estimates.
   - Make the instructions clear, structured, and ready for direct use in Bolt.New.`;

      // Construct the user prompt with the quote data
      const userPrompt = `Generate a Bolt.New prompt for "${companyName}" based on this quote:

${JSON.stringify(quoteResponse, null, 2)}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Please create a comprehensive Bolt.New prompt that covers all the features and requirements outlined in the quote.`;

      // Call OpenAI API
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.key,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const generatedPrompt = completion.choices[0]?.message?.content;

      if (!generatedPrompt) {
        throw new Error('No response from OpenAI');
      }

      // Log successful generation
      functions.logger.info('Bolt.New prompt generated successfully', {
        companyName,
        featuresCount: quoteResponse.ScopeOfWork.length,
        promptLength: generatedPrompt.length
      });

      // Return the generated prompt
      response.status(200).json({
        success: true,
        data: {
          prompt: generatedPrompt,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'gpt-4',
            companyName,
            featuresCount: quoteResponse.ScopeOfWork.length,
            estimatedCost: quoteResponse.TotalEstimatedCost
          }
        }
      });

    } catch (error) {
      functions.logger.error('Error generating Bolt.New prompt:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to generate Bolt.New prompt',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
});

// Health check endpoint
export const healthCheck = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    response.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'quote-generator'
    });
  });
});

// Test function to test the deployed generateQuote function
export const testQuoteGeneration = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow GET requests for testing
      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed. Use GET for testing.' });
        return;
      }

      // Sample test data
      const testData = {
        companyName: "Test Company Inc.",
        projectDescription: "We need a customer management system with user authentication, dashboard, customer CRUD operations, and reporting features. The system should support multiple user roles and include email notifications.",
        hourlyRate: 120
      };

      // Get the function URL (you'll need to replace this with your actual deployed function URL)
      const functionUrl = `https://${process.env.GCLOUD_PROJECT || 'your-project-id'}.cloudfunctions.net/generateQuote`;
      
            // Make a request to the generateQuote function
      const { default: fetch } = await import('node-fetch');
      const testResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const result = await testResponse.json();

      // Return the test results
      response.status(200).json({
        success: true,
        testData,
        functionUrl,
        response: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      functions.logger.error('Error testing quote generation:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to test quote generation',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    }
  });
});

export const generateUILayout = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      try {
        if (request.method !== 'POST') {
          response.status(405).send('Method Not Allowed');
          return;
        }

        const { quoteData, quoteId } = request.body;
        if (!quoteData || !quoteData.ScopeOfWork) {
          response.status(400).json({ error: 'Invalid input: Missing quoteData with ScopeOfWork' });
          return;
        }

        // Build the UI generation prompt
        const uiPrompt = buildUIPrompt(quoteData);

        // Use OpenAI instead of VertexAI for better reliability
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.key,
        });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a UI/UX expert that generates structured JSON layouts for web applications. Always return valid JSON without markdown formatting.'
            },
            {
              role: 'user',
              content: uiPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error('OpenAI did not return content.');

        const cleanedJSON = responseText.trim().replace(/```json|```/g, '');
        const uiLayout = JSON.parse(cleanedJSON);

        // Save UI layout to Firestore under the quote if quoteId is provided
        if (quoteId) {
          await admin.firestore().collection('quotes').doc(quoteId).update({ uiLayout });
        }

        functions.logger.info('UI Layout generated successfully', {
          quoteId,
          screensCount: uiLayout?.Components?.length || 0
        });

        response.status(200).json({
          success: true,
          uiLayout,
          metadata: { 
            model: 'gpt-4', 
            generatedAt: new Date().toISOString(),
            quoteId 
          }
        });
      } catch (error) {
        functions.logger.error('Error generating UI layout:', error);
        response.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
  });

function buildUIPrompt(quoteData: QuoteResponse) {
  const appName = quoteData.ProjectOverview || 'Generated App';
  const screens = quoteData.ScopeOfWork.map((f) => {
    const items = f.Items.map((i) => i.ItemName).join(', ');
    return `Screen: ${f.FeatureName} → Purpose: ${f.Description}. Components: ${items}`;
  }).join('\n');

  return `
You are a UI/UX assistant. Generate a structured UI layout for a responsive web application.

App Name: ${appName}
Style: Google Material Design, Tailwind-based layout, Primary color #4285F4.
Icon Library: Use Material Design Icons (https://fonts.google.com/icons). Common icons: home, dashboard, people, description, assignment, bar_chart, settings, calendar_today, add_circle, download, search, filter_list, etc.

Screens:
${screens}

Generate a JSON object with the following EXACT structure:

For Authentication Screens (Login/Register):
{
  "ScreenName": "Login",
  "Route": "/login",
  "Components": [
    {
      "Type": "header",
      "Title": "Welcome to ABC House Cleaning"
    },
    {
      "Type": "main",
      "Props": {
        "layout": "flex",
        "justifyContent": "center",
        "alignItems": "center"
      },
      "Components": [
        {
          "Type": "card",
          "Title": "Login to Your Account",
          "Props": {
            "width": "md"
          },
          "Components": [
            {
              "Type": "form",
              "Fields": ["Email", "Password"]
            },
            {
              "Type": "button",
              "Title": "Login",
              "Props": {
                "variant": "primary",
                "fullWidth": true
              }
            }
          ]
        }
      ]
    }
  ]
}

For Dashboard/App Screens:
{
  "ScreenName": "Dashboard",
  "Route": "/dashboard",
  "Components": [
    {
      "Type": "header",
      "Title": "Dashboard"
    },
    {
      "Type": "sidebar",
      "Props": {
        "navigationItems": [
          {
            "name": "Dashboard",
            "icon": "dashboard",
            "route": "/dashboard"
          },
          {
            "name": "Bookings",
            "icon": "assignment",
            "route": "/bookings"
          }
        ]
      }
    },
    {
      "Type": "main",
      "Props": {
        "layout": "grid",
        "gap": 16
      },
      "Components": [
        {
          "Type": "card",
          "Title": "Welcome",
          "Props": {
            "width": "full"
          }
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown or backticks
- ALWAYS include a "main" component for proper layout structure
- Use "Components" NOT "Children" for nested components
- Keep the structure simple and flat - avoid deeply nested components
- Include authentication screens (login, signup) if not already present
- Add a dashboard screen if not present
- Use semantic component types
- Include responsive design considerations
- Ensure all screens have proper navigation structure
- For buttons with icons, use Material Design icon names in Props.icon
- For sidebar navigation, use appropriate Material Design icons: home, dashboard, people, description, assignment, bar_chart, settings, etc.
- For Google sign-in buttons, use "login" icon or just text "Google" without icon
- DO NOT use "Children" property - only use "Components"
- Keep component nesting to maximum 2 levels deep
- For login/registration screens: Use main component with flex layout and center alignment
- For dashboard screens: Use main component with grid layout for card arrangements
- For screens with navigation: Include sidebar component with navigationItems
- For screens without navigation: Use only header and main components
`;
}

export const generateMockup = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB'
  })
  .https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      try {
        if (request.method !== 'POST') {
          response.status(405).send('Method Not Allowed');
          return;
        }

        const { quoteData, quoteId, companyName } = request.body;

        if (!quoteData || !quoteId || !companyName) {
          response.status(400).json({ 
            error: 'Missing required fields: quoteData, quoteId, and companyName' 
          });
          return;
        }

        // Read the template file - use the simplified version
        const templatePath = path.join(__dirname, 'templates', 'dashboard-template.html');
        const templateHTML = fs.readFileSync(templatePath, 'utf8');

        // Generate modified HTML using OpenAI
        const modifiedHTML = await generateCustomizedHTML(templateHTML, quoteData, companyName);

        // Launch headless Chrome with proper configuration for serverless
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
          ]
        });
        
        const page = await browser.newPage();

        // Sanitize filename
        const safeFileName = companyName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');

        await page.setViewport({ width: 1280, height: 720 });
        await page.setContent(modifiedHTML, { waitUntil: 'networkidle0' });

        await page.screenshot({ 
          path: `${os.tmpdir()}/${safeFileName}.png`,
          fullPage: true
        });

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const dest = `mockups/${quoteId}/${safeFileName}.png`;
        const downloadToken = admin.firestore().collection('_').doc().id;
        await bucket.upload(`${os.tmpdir()}/${safeFileName}.png`, {
          destination: dest,
          metadata: {
            contentType: 'image/png',
            metadata: {
              firebaseStorageDownloadTokens: downloadToken
            }
          }
        });

        // Construct the public URL for the uploaded mockup
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(dest)}?alt=media&token=${downloadToken}`;

        // Update the quote document in Firestore with both mockup URL and HTML
        await admin.firestore()
          .collection('quotes')
          .doc(quoteId)
          .set({
            mockupUrl: publicUrl,
            mockupHTML: modifiedHTML,
            mockupGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

        // Cleanup and response
        fs.unlinkSync(`${os.tmpdir()}/${safeFileName}.png`);
        await browser.close();

        response.status(200).json({ 
          success: true, 
          mockupUrl: publicUrl,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        functions.logger.error('Error generating mockup:', error);
        response.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
});

async function generateCustomizedHTML(templateHTML: string, quoteData: QuoteResponse, companyName: string): Promise<string> {
  // Use OpenRouter with a model that has larger context window
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || functions.config().openai?.key,
    baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
  });

  // Choose model based on available API key
  const model = process.env.OPENROUTER_API_KEY ? 'anthropic/claude-3-5-sonnet' : 'gpt-4';

  const systemPrompt = `You are an expert web developer specializing in customizing Bootstrap admin dashboards. Your task is to modify the provided HTML template to match the specific project requirements from a quote.

IMPORTANT RULES:
1. Return ONLY the complete modified HTML - no explanations, no markdown, no code fences
2. Preserve all Bootstrap classes, CSS, and JavaScript functionality
3. Only modify content, titles, navigation items, and dashboard cards to match the project
4. Keep the same structure and layout
5. Use appropriate Font Awesome icons for navigation items
6. Make the dashboard relevant to the specific project type and features

MODIFICATION GUIDELINES:
- Update the page title and sidebar brand to reflect the company name
- Modify sidebar navigation items based on the project features
- Update dashboard stat cards to show relevant metrics for the project
- Change chart titles and data to be project-specific
- Update table headers and sample data to match the project requirements
- Modify the page heading and action buttons
- Keep all Bootstrap classes and styling intact`;

  const userPrompt = `Please customize this Bootstrap admin dashboard template for the following project:

COMPANY: ${companyName}

PROJECT OVERVIEW: ${quoteData.ProjectOverview}

PROJECT FEATURES:
${quoteData.ScopeOfWork.map((feature, index) => 
  `${index + 1}. ${feature.FeatureName}: ${feature.Description}`
).join('\n')}

TOTAL ESTIMATED COST: $${quoteData.TotalEstimatedCost}
HOURLY RATE: $${quoteData.HourlyRate}

Please modify the HTML template to:
1. Change the title and brand to "${companyName}"
2. Update sidebar navigation to include relevant sections based on the features
3. Modify dashboard stat cards to show project-relevant metrics
4. Update chart titles and sample data to be project-specific
5. Change table headers and data to match the project type
6. Update the page heading to reflect the project

Here's the template HTML to modify:

${templateHTML}`;

  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    temperature: 0.3,
    max_tokens: 8000, // Increased for larger models
  });

  const modifiedHTML = completion.choices[0]?.message?.content;

  if (!modifiedHTML) {
    throw new Error('No response from AI model');
  }

  // Clean the response to ensure it's valid HTML
  const cleanedHTML = modifiedHTML.trim().replace(/```html\n?|\n?```/g, '');

  return cleanedHTML;
}

export const acceptInvitation = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { token, name, password } = request.body;
      
      if (!token || !name || !password) {
        response.status(400).json({ error: 'Missing required fields' });
        return;
      }

             // Get invitation by token
       const invitationsSnapshot = await admin.firestore()
         .collection('invitations')
         .where('token', '==', token)
         .where('status', '==', 'pending')
         .limit(1)
         .get();

      if (invitationsSnapshot.empty) {
        response.status(404).json({ error: 'Invalid or expired invitation' });
        return;
      }

      const invitationDoc = invitationsSnapshot.docs[0];
      const invitation = invitationDoc.data();

      // Check if invitation is expired
      const expiresAt = invitation.expiresAt.toDate();
      if (expiresAt < new Date()) {
        response.status(400).json({ error: 'Invitation has expired' });
        return;
      }

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: invitation.email,
        password: password,
        displayName: name,
        emailVerified: true, // Since they were invited, we can mark as verified
      });

      // Create user document in Firestore
      const userDocRef = admin.firestore().collection('users').doc(userRecord.uid);
      await userDocRef.set({
        email: invitation.email,
        name: name,
        role: invitation.role,
        companyId: invitation.companyId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update invitation status to accepted
      await invitationDoc.ref.update({
        status: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptedByUserId: userRecord.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('User created successfully', { 
        userId: userRecord.uid, 
        email: invitation.email,
        companyId: invitation.companyId
      });

      response.status(200).json({
        success: true,
        userId: userRecord.uid,
        message: 'Account created successfully'
      });

    } catch (error) {
      functions.logger.error('Error accepting invitation:', error);
      
      response.status(500).json({
        success: false,
        error: 'Failed to accept invitation',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
});