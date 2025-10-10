export function formatPrice(price) {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(num) {
  if (!num) return '0';
  return new Intl.NumberFormat('it-IT').format(num);
}

export function calculateTotal(components) {
  if (!components || !Array.isArray(components)) return 0;
  return components.reduce((sum, comp) => sum + (parseFloat(comp.price) || 0), 0);
}

export function truncate(str, length = 150) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getCategoryLabel(category) {
  const labels = {
    gaming: 'Gaming',
    editing: 'Editing',
    office: 'Ufficio',
    workstation: 'Workstation',
    budget: 'Budget',
    premium: 'Premium',
  };
  return labels[category] || category;
}

export function getStatusLabel(status) {
  const labels = {
    published: 'Pubblicato',
    draft: 'Bozza',
  };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    published: 'success',
    draft: 'warning',
  };
  return colors[status] || 'info';
}
