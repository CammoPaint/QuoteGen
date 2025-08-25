# Microsoft Authentication Setup Guide

This guide explains how to configure Microsoft authentication in your Firebase project for your QuoteGen application.

## Prerequisites

1. Firebase project with Authentication enabled
2. Microsoft Azure account (free tier is sufficient)

## Step 1: Create Microsoft Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: QuoteGen Firebase Auth
   - **Supported account types**: Choose based on your needs:
     - **Accounts in this organizational directory only** (Single tenant) - Most common
     - **Accounts in any organizational directory** (Multi-tenant)
     - **Accounts in any organizational directory and personal Microsoft accounts** (Multi-tenant + personal accounts)
   - **Redirect URI**: Leave blank for now
5. Click **Register**

## Step 2: Configure App Registration

1. After creation, note down the **Application (client) ID** and **Directory (tenant) ID**
2. Go to **Certificates & secrets** > **Client secrets**
3. Click **New client secret**
4. Add a description and choose expiration time
5. Click **Add** and copy the **Value** (this is your client secret)

## Step 3: Configure Firebase Authentication

1. Go to your Firebase Console
2. Navigate to **Authentication** > **Sign-in method**
3. Click on **Microsoft**
4. Toggle **Enable**
5. Fill in the configuration:
   - **Application (client) ID**: From Azure (Step 2)
   - **Application (client) secret**: From Azure (Step 2)
6. Copy the **callback URL** provided by Firebase

## Step 4: Update Azure Redirect URIs

1. Go back to Azure Portal > Your App Registration
2. Navigate to **Authentication** > **Platform configurations**
3. Click **Add a platform** > **Web**
4. Add the Firebase callback URL you copied in Step 3
5. Check **Access tokens** and **ID tokens** under **Implicit grant and hybrid flows**
6. Click **Configure**

## Step 5: Fix Tenant Configuration (IMPORTANT!)

**If you're getting the error "AADSTS50194: Application is not configured as a multi-tenant application"**, you need to match your app configuration with your Azure app registration:

### Option A: Configure for Single-Tenant (Recommended)
If your Azure app is set to "Accounts in this organizational directory only":

1. **Quick Fix** - Use organizations endpoint (current configuration):
   ```typescript
   provider.setCustomParameters({
     tenant: 'organizations' // For work/school accounts only
   });
   ```

2. **Alternative** - Use your specific tenant ID for maximum security:
   ```typescript
   provider.setCustomParameters({
     tenant: 'YOUR_TENANT_ID_HERE' // Replace with your Directory (tenant) ID from Azure
   });
   ```
   Your tenant ID from the error message appears to be part of the app ID `db3ce07c-cf12-4485-b6d4-ba4da412353e`, but you should get the correct Directory (tenant) ID from Azure Portal.

### Option B: Configure for Multi-Tenant
If you want to support multiple organizations:

1. Go to Azure Portal > Your App Registration > **Authentication**
2. Under **Supported account types**, select:
   - **Accounts in any organizational directory** (Multi-tenant), OR
   - **Accounts in any organizational directory and personal Microsoft accounts**
3. Save the changes
4. In your code, you can then use:
   ```typescript
   provider.setCustomParameters({
     tenant: 'common' // For multi-tenant + personal accounts
     // OR tenant: 'organizations' // For multi-tenant work/school accounts only
   });
   ```

## Step 6: Current Configuration

The application is currently configured for single-tenant organizations. The code uses:
- `tenant: 'organizations'` - Works with single-tenant apps that support work/school accounts

## Step 7: Optional Configuration

### Custom Scopes
The application requests these scopes by default:
- `email` - User's email address
- `profile` - Basic profile information

### Tenant Configuration Options
- `'organizations'`: Work/school accounts (single or multi-tenant)
- `'consumers'`: Personal Microsoft accounts only
- `'common'`: Multi-tenant and personal accounts (requires multi-tenant Azure app)
- `'your-tenant-id'`: Specific tenant only (most restrictive)

## Step 6: Testing

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Click "Continue with Microsoft"
4. You should be redirected to Microsoft's sign-in page
5. After successful authentication, you'll be redirected back to your app

## Troubleshooting

### Common Issues

1. **AADSTS50194: Application is not configured as a multi-tenant application**
   - **This is your current error!**
   - **Quick Fix**: Change `tenant: 'common'` to `tenant: 'organizations'` in the code
   - **Root Cause**: Your Azure app is single-tenant but code tries to use multi-tenant endpoint
   - **Solutions**:
     - **Option 1 (Recommended)**: Keep single-tenant, change code to use `tenant: 'organizations'`
     - **Option 2**: Change Azure app to multi-tenant in Azure Portal > Authentication > Supported account types

2. **AADSTS50011: The reply URL specified in the request does not match**
   - Make sure the redirect URI in Azure matches exactly with Firebase's callback URL
   - Check for trailing slashes and protocol (https vs http)

3. **AADSTS700016: Application not found**
   - Verify the Application (client) ID is correct in Firebase
   - Make sure the app registration exists in the correct Azure tenant

4. **Invalid client secret**
   - Generate a new client secret in Azure if the current one expired
   - Update Firebase with the new secret

5. **User profile missing information**
   - Check that you've requested the correct scopes (`email`, `profile`)
   - Verify the user has granted consent for these permissions

### Development vs Production

- For development, you can use `localhost` URLs
- For production, make sure to:
  - Update redirect URIs with your production domain
  - Use HTTPS for all redirect URIs
  - Consider using environment-specific Azure app registrations

## Security Best Practices

1. **Client Secret Management**:
   - Never commit client secrets to version control
   - Use environment variables for sensitive configuration
   - Rotate client secrets regularly

2. **Redirect URI Validation**:
   - Only add necessary redirect URIs
   - Use specific paths rather than wildcards
   - Regularly audit configured URIs

3. **Scope Permissions**:
   - Only request necessary permissions
   - Use least privilege principle
   - Document why each scope is needed

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/microsoft-oauth)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
