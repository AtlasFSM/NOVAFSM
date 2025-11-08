import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'fr';

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-preference',
    }
  )
);

// Translation type
export interface Translations {
  [key: string]: string | Translations;
}

// Get nested translation
export function getTranslation(
  translations: Translations,
  key: string,
  fallback: string | Translations = key
): string | Translations {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return fallback;
    }
  }

  return value;
}

// Hook to use translations
export function useTranslation(namespace?: string) {
  const { language } = useI18n();

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const translations = getTranslations(language, namespace);
    const value = getTranslation(translations, key, key);
    let text = typeof value === 'string' ? value : String(key);

    // Replace variables in translation
    if (vars) {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varValue));
      });
    }

    return text;
  };

  return { t, language };
}

// Get translations for a specific namespace
function getTranslations(language: Language, namespace?: string): Translations {
  const allTranslations = language === 'fr' ? translationsFr : translationsEn;

  if (!namespace) {
    return allTranslations;
  }

  const result = getTranslation(allTranslations, namespace, {});
  return (typeof result === 'object' ? result : {}) as Translations;
}

// English translations
const translationsEn: Translations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    search: 'Search',
    loading: 'Loading...',
    total: 'Total',
    subtotal: 'Subtotal',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    amount: 'Amount',
    description: 'Description',
    unit: 'Unit',
    category: 'Category',
    status: 'Status',
    actions: 'Actions',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    other: 'Other',
    viewDetails: 'View Details',
  },
  invoice: {
    title: 'Invoice',
    items: 'Items',
    addItem: 'an item',
    addTitle: 'a title',
    addPageBreak: 'a page break',
    addTemplate: 'Add a template',
    addLabel: 'Add:',
    deleteLabel: 'Delete:',
    clearAll: 'clear all content',
    clearItems: 'clear items',
    saveTemplate: 'Save a template',
    templateName: 'Template name',
    selectTemplate: 'Select a template',
    categorySummary: 'Summary by category',
    totalBeforeTax: 'Total before taxes:',
    provinceTaxes: 'Provincial taxes:',
    createInvoice: 'Create Invoice',
    updateInvoice: 'Update Invoice',
    saving: 'Saving...',
    noItems: 'No items added yet',
    useOptionsBelow: 'Use the options below to add items',
    noTemplates: 'No saved templates',
    noPriceItems: 'No items in price list',
    confirmClearAll: 'Are you sure you want to clear all content?',
    confirmClearItems: 'Are you sure you want to clear items?',
    templateSaved: 'Template "{name}" saved',
    enterTemplateName: 'Please enter a template name',
    addAtLeastOneItem: 'Please add at least one item',
    invoiceCreated: 'Invoice created successfully',
    invoiceUpdated: 'Invoice updated successfully',
    failedToSave: 'Failed to save invoice',
    pageBreak: '--- Page break ---',
    newTitle: 'New title',
    sectionTitle: 'Section title',
    invoiceForCompleted: 'Invoices can only be created for completed jobs',
    currentStatus: 'Current status:',
    noInvoiceYet: 'No invoice has been created for this job yet',
  },
  provinces: {
    QC: 'Quebec',
    ON: 'Ontario',
    BC: 'British Columbia',
    AB: 'Alberta',
    MB: 'Manitoba',
    SK: 'Saskatchewan',
    NS: 'Nova Scotia',
    NB: 'New Brunswick',
    PE: 'Prince Edward Island',
    NL: 'Newfoundland and Labrador',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    selectLanguage: 'Select language',
    english: 'English',
    french: 'Français',
    preferences: 'Preferences',
    languagePreference: 'Language Preference',
    changeLanguage: 'Change the language for the entire application',
  },
};

// French translations
const translationsFr: Translations = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    remove: 'Retirer',
    search: 'Rechercher',
    loading: 'Chargement...',
    total: 'Total',
    subtotal: 'Sous-total',
    quantity: 'Qté',
    unitPrice: 'PU',
    amount: 'Montant',
    description: 'Description',
    unit: 'Unité',
    category: 'Catégorie',
    status: 'Statut',
    actions: 'Actions',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    back: 'Retour',
    other: 'Autre',
    viewDetails: 'Voir détails',
  },
  invoice: {
    title: 'Facture',
    items: 'Items',
    addItem: 'un item',
    addTitle: 'un titre',
    addPageBreak: 'un saut de page',
    addTemplate: 'Ajouter un modèle',
    addLabel: 'Ajouter :',
    deleteLabel: 'Effacer :',
    clearAll: 'effacer tout le contenu',
    clearItems: 'effacer les items',
    saveTemplate: 'Sauvegarder un modèle',
    templateName: 'Nom du modèle',
    selectTemplate: 'Sélectionner un modèle',
    categorySummary: 'Sommaire par catégorie',
    totalBeforeTax: 'Total avant taxes :',
    provinceTaxes: 'Taxes de la province :',
    createInvoice: 'Créer la facture',
    updateInvoice: 'Mettre à jour la facture',
    saving: 'Sauvegarde...',
    noItems: 'Aucun item ajouté',
    useOptionsBelow: 'Utilisez les options ci-dessous pour ajouter des items',
    noTemplates: 'Aucun modèle sauvegardé',
    noPriceItems: 'Aucun item dans la liste de prix',
    confirmClearAll: 'Êtes-vous sûr de vouloir effacer tout le contenu?',
    confirmClearItems: 'Êtes-vous sûr de vouloir effacer les items?',
    templateSaved: 'Modèle "{name}" sauvegardé',
    enterTemplateName: 'Veuillez entrer un nom de modèle',
    addAtLeastOneItem: 'Veuillez ajouter au moins un item',
    invoiceCreated: 'Facture créée avec succès',
    invoiceUpdated: 'Facture mise à jour avec succès',
    failedToSave: 'Échec de la sauvegarde de la facture',
    pageBreak: '--- Saut de page ---',
    newTitle: 'Nouveau titre',
    sectionTitle: 'Titre de section',
    invoiceForCompleted: 'Les factures ne peuvent être créées que pour les jobs complétés',
    currentStatus: 'Statut actuel :',
    noInvoiceYet: 'Aucune facture n\'a été créée pour ce job',
  },
  provinces: {
    QC: 'Québec',
    ON: 'Ontario',
    BC: 'Colombie-Britannique',
    AB: 'Alberta',
    MB: 'Manitoba',
    SK: 'Saskatchewan',
    NS: 'Nouvelle-Écosse',
    NB: 'Nouveau-Brunswick',
    PE: 'Île-du-Prince-Édouard',
    NL: 'Terre-Neuve-et-Labrador',
  },
  settings: {
    title: 'Paramètres',
    language: 'Langue',
    selectLanguage: 'Sélectionner la langue',
    english: 'English',
    french: 'Français',
    preferences: 'Préférences',
    languagePreference: 'Préférence de langue',
    changeLanguage: 'Changer la langue pour toute l\'application',
  },
};
