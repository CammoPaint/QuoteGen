import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { PDFTemplate } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

const COLLECTION_NAME = 'pdfTemplates';

const createDefaultTemplate = (companyId: string): PDFTemplate => ({
  id: 'new', // Use 'new' to indicate it should be created
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
  companyId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const useTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<PDFTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId || 'default-company';

  const loadTemplates = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedTemplates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as PDFTemplate[];

      // If no templates exist, create default template
      if (fetchedTemplates.length === 0) {
        const defaultTemplate = createDefaultTemplate(companyId);
        await saveTemplate(defaultTemplate);
        setTemplates([defaultTemplate]);
        setActiveTemplate(defaultTemplate);
      } else {
        setTemplates(fetchedTemplates);
        // Set first template as active if none is set
        if (!activeTemplate) {
          setActiveTemplate(fetchedTemplates[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user?.id, companyId]);

  const saveTemplate = async (template: PDFTemplate): Promise<PDFTemplate> => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const templateData = {
        ...template,
        companyId,
        updatedAt: serverTimestamp()
      };

      if (template.id && template.id !== 'new') {
        // Update existing template
        await updateDoc(doc(db, COLLECTION_NAME, template.id), templateData);
        
        const updated: PDFTemplate = { ...template, updatedAt: new Date().toISOString() };
        setTemplates(prev => prev.map(t => (t.id === template.id ? updated : t)));
        if (activeTemplate?.id === template.id) {
          setActiveTemplate(updated);
        }
        return updated;
      } else {
        // Create new template
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...templateData,
          createdAt: serverTimestamp()
        });
        
        const newTemplate: PDFTemplate = {
          ...template,
          id: docRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        return newTemplate;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const setActiveTemplateById = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setActiveTemplate(template);
    }
  };

  const createNewTemplate = (): PDFTemplate => {
    return {
      id: 'new',
      name: 'New Template',
      termsAndConditions: createDefaultTemplate(companyId).termsAndConditions,
      footerText: createDefaultTemplate(companyId).footerText,
      useCompanyDefaults: true,
      companyInfo: { ...createDefaultTemplate(companyId).companyInfo },
      companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const deleteTemplate = async (templateId: string) => {
    if (templateId === 'default') {
      throw new Error('Cannot delete default template');
    }

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, templateId));
      
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);

      // If the deleted template was active, switch to first available
      if (activeTemplate?.id === templateId) {
        const newActive = updatedTemplates[0] || null;
        setActiveTemplate(newActive);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    templates,
    activeTemplate: activeTemplate || createDefaultTemplate(companyId),
    loading,
    error,
    saveTemplate,
    setActiveTemplateById,
    createNewTemplate,
    deleteTemplate,
    refetch: loadTemplates,
  };
};