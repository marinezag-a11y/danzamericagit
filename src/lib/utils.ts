export const maskBRL = (value: string | number) => {
  if (value === undefined || value === null || value === '') return 'R$ 0,00';
  
  let cleanValue = '';
  if (typeof value === 'number') {
    cleanValue = Math.round(value * 100).toString();
  } else {
    cleanValue = value.replace(/\D/g, '');
  }
  
  const numberValue = Number(cleanValue) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};

export const parseBRL = (formattedValue: string) => {
  if (!formattedValue) return 0;
  const cleanValue = formattedValue.replace(/\D/g, '');
  return Number(cleanValue) / 100;
};
