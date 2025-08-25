import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quote, Customer } from '../types';


export interface PDFTemplate {
  id: string;
  name: string;
  termsAndConditions: string;
  footerText: string;
  useCompanyDefaults: boolean;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  companyId: string;
  createdAt: string;
  updatedAt: string;
}
export interface QuotePreviewOptions {
  showPDF?: boolean;
  showHTML?: boolean;
}

export const defaultTemplate: PDFTemplate = {
  id: 'default',
  name: 'Default Quote Template',
  termsAndConditions: `TERMS AND CONDITIONS

1. ACCEPTANCE: This quote is valid for 30 days from the date of issue.

2. PAYMENT TERMS: 50% deposit required upon acceptance, balance due upon completion.

3. SCOPE OF WORK: Work will be performed as outlined in the scope of work section above.

4. CHANGES: Any changes to the original scope may result in additional charges.

5. TIMELINE: Project timeline is estimated and may vary based on client feedback and revisions.

6. INTELLECTUAL PROPERTY: All source code and deliverables become property of the client upon final payment.

7. WARRANTY: We provide a 30-day warranty on all delivered work for bug fixes and minor adjustments.

8. LIMITATION OF LIABILITY: Our liability is limited to the total amount paid for services.`,
  footerText: 'Thank you for choosing our services. We look forward to working with you!',
  useCompanyDefaults: true,
  companyInfo: {
    name: 'Your Company Name',
    address: '123 Business Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@yourcompany.com',
    website: 'www.yourcompany.com'
  },
  companyId: 'default-company',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const generateQuotePDF = async (
  quote: Quote,
  customer: Customer,
  template: PDFTemplate = defaultTemplate
): Promise<void> => {
  // Get the preview first
  const preview = await previewQuotePDF(quote, customer, template, { showPDF: true });
  
  if (!preview.pdfUrl) {
    throw new Error('Failed to generate PDF preview');
  }

  // Create PDF from the preview
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm

  // Create an image from the preview URL
  const img = new Image();
  img.src = preview.pdfUrl;
  
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const imgHeight = (img.height * imgWidth) / img.width;
  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(preview.pdfUrl, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add additional pages if needed
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(preview.pdfUrl, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Download the PDF
  const fileName = `Quote_${customer.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${quote.id}.pdf`;
  pdf.save(fileName);
};


// Preview either HTML or PDF
export const previewQuotePDF = async (
  quote: Quote,
  customer: Customer,
  template: PDFTemplate = defaultTemplate,
  options: QuotePreviewOptions = { showPDF: true }
): Promise<{ pdfUrl?: string; htmlContent?: string }> => {
  // Create a temporary container for the content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.padding = '20mm';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.4';
  container.style.color = '#000';
  container.style.backgroundColor = '#fff';

  // Generate HTML content using the same template
  container.innerHTML = `
    <div style="max-width: 170mm; margin: 0 auto;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #4285F4; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="color: #4285F4; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">
              ${template.companyInfo.name}
            </h1>
            <div style="color: #666; font-size: 11px; line-height: 1.6;">
              ${template.companyInfo.address}<br>
              ${template.companyInfo.phone}<br>
              ${template.companyInfo.email}
              ${template.companyInfo.website ? `<br>${template.companyInfo.website}` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="color: #333; font-size: 24px; margin: 0 0 10px 0;">QUOTE</h2>
            <div style="color: #666; font-size: 11px;">
              Quote: ${quote.displayId}<br>
              Date: ${new Date(quote.createdAt).toLocaleDateString()}<br>
              Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Information -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          BILL TO
        </h3>
        <div style="color: #666; font-size: 12px; line-height: 1.6;">
          <strong>${customer.companyName}</strong><br>
          ${customer.contactName}<br>
          ${customer.address}<br>
          ${customer.phoneNumber}<br>
          ${customer.emailAddress}
        </div>
      </div>

      <!-- Project Overview -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          PROJECT OVERVIEW
        </h3>
        <p style="color: #666; margin: 0; line-height: 1.6;">
          ${quote.projectOverview}
        </p>
      </div>
      

      <!-- Scope of Work -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          SCOPE OF WORK
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold; color: #333;">
                Feature
              </th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #333; width: 80px;">
                Hours
              </th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; color: #333; width: 100px;">
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            ${quote.scopeOfWork.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; vertical-align: top;">
                  <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
                    ${item.feature}
                  </div>
                  <div style="color: #666; font-size: 11px; margin-bottom: 8px;">
                    ${item.description}
                  </div>
                  ${item.items && item.items.length > 0 ? `
                    <div style="margin-top: 8px;">
                      <div style="font-weight: bold; color: #333; font-size: 11px; margin-bottom: 4px;">
                        Included Items:
                      </div>
                      <ul style="margin: 0; padding-left: 16px; color: #666; font-size: 10px;">
                        ${item.items.map(subItem => `
                          <li style="margin-bottom: 2px;">
                            <strong>${subItem.itemName}:</strong> ${subItem.description}
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #666;">
                  ${item.estimatedHours}
                </td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #666;">
                  $${item.estimatedCost.toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa;">
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; color: #333;">
                TOTAL
              </td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: #333;">
                ${quote.scopeOfWork.reduce((sum, item) => sum + item.estimatedHours, 0)}
              </td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; color: #34A853; font-size: 16px;">
                $${quote.totalEstimatedCost.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${quote.mockupUrl ? `
      <!-- Application Mockup -->
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          APPLICATION MOCKUP
        </h3>
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${quote.mockupUrl}" alt="Application Mockup" style="max-width: 100%; max-height: 400px; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin: 0;">
          This mockup shows a preview of the application based on your project requirements.
        </p>
      </div>
      ` : ''}

      <!-- Terms and Conditions -->
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          TERMS AND CONDITIONS
        </h3>
        <div style="color: #666; font-size: 11px; line-height: 1.6; white-space: pre-line;">
          ${template.termsAndConditions}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 11px;">
        ${template.footerText}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const result: { pdfUrl?: string; htmlContent?: string } = {};

    // If HTML preview is requested
    if (options.showHTML) {
      // Clone the container to preserve styling
      const htmlPreview = container.cloneNode(true) as HTMLElement;
      // Remove positioning styles for preview
      htmlPreview.style.position = 'relative';
      htmlPreview.style.left = '0';
      result.htmlContent = htmlPreview.outerHTML;
    }

    // If PDF preview is requested
    if (options.showPDF) {
      const canvas = await html2canvas(container, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      result.pdfUrl = canvas.toDataURL('image/png');
    }

    return result;
  } finally {
    document.body.removeChild(container);
  }
};