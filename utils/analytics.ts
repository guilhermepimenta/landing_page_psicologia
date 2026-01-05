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
