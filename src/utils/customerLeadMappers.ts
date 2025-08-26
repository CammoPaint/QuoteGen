import { Customer } from '../types';

/**
 * Build a unified updated record for either a customer or lead from form data.
 * - Ensures common fields are consistently mapped across both domains
 * - Persists lead-specific fields on customers as well (industry, source, status, website)
 * - Normalizes assignment fields consistently to avoid breaking existing logic
 */
export function buildUpdatedRecord(
  existing: Customer,
  formData: any
): Customer {
  const common: Partial<Customer> = {
    companyName: formData.companyName,
    contactName: formData.contactName,
    emailAddress: formData.emailAddress,
    phoneNumber: formData.phoneNumber,
    // Keep both address and website on both record types so the data persists through conversion
    address: formData.address,
    notes: formData.notes,
    // Persist lead/customer meta fields on both
    industry: formData.industry,
    source: formData.source,
    status: formData.status,
    // Website captured in shared form; persist for both
    website: formData.website,
    updatedAt: new Date().toISOString(),
  } as Partial<Customer>;

  // Assignment normalization: preserve previous behavior by record type
  const assignedToUserId = formData.assignedToUserId;
  const assignedToUserName = formData.assignedToUserName;

  const assignment: Partial<Customer> = {
    // Use undefined for unassigned consistently across both record types
    assignedToUserId: assignedToUserId || undefined,
    assignedToUserName: assignedToUserName || undefined,
  };

  return {
    ...existing,
    ...common,
    ...assignment,
  } as Customer;
}
