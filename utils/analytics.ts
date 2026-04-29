export const sendGAEvent = (action: string, category: string, label: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, {
            event_category: category,
            event_label: label,
        });
    } else {
        console.log(`[GA Dev] Event: ${action} | Category: ${category} | Label: ${label}`);
    }
};

// Dispara evento padrão do Google Ads para clique no WhatsApp.
// Alimenta audiências de remarketing e otimização de lances.
export const trackWhatsAppClick = (source: string) => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;
    (window as any).gtag('event', 'contact', {
        event_category: 'whatsapp',
        event_label: source,
        send_to: 'AW-17262838643',
    });
};

// Dispara evento padrão do Google Ads para envio de formulário.
// Alimenta audiências de remarketing e otimização de lances.
export const trackFormLead = () => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;
    (window as any).gtag('event', 'conversion', {
        send_to: 'AW-17262838643/WAogCMHf36QcEPOGyKdA',
    });
};
