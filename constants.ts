
import { ProjectConfig, Product } from './types';

export const AVAILABLE_PRODUCTS: Product[] = [
  { id: 'fester-v-10', name: 'Fester Vester 10 Años', category: 'Impermeabilizante', yield: 34, price: 1639, brand: 'Fester' },
  { id: 'comex-pro-100', name: 'Comex Pro 100', category: 'Impermeabilizante', yield: 35, price: 1850, brand: 'Comex' },
  { id: 'acuario-5', name: 'Acuario 5 Años', category: 'Impermeabilizante', yield: 30, price: 1450, brand: 'Acuario' },
  { id: 'vinimex-total', name: 'Vinimex Total Antiviral', category: 'Pintura', yield: 120, price: 2100, brand: 'Comex' },
  { id: 'acuario-vinil', name: 'Acuario Vinil-Acrílica', category: 'Pintura', yield: 110, price: 1750, brand: 'Acuario' }
];

export const INITIAL_CONFIG: ProjectConfig = {
  m2: 100,
  selectedCategory: 'Impermeabilizante',
  selectedProductId: 'fester-v-10',
  auxMaterialTotal: 1805,
  profitRate: 70,
  numWorkers: 2,
  workerDailyRate: 600,
  workDays: 3,
  scaffoldCount: 0,
  scaffoldDailyRate: 100,
  scaffoldDays: 1,
  masonryRepairEnabled: false,
  masonryRepairCost: 0,
  extraBuckets: 0, 
  extraSealerBuckets: 0, 
  branding: {
    companyName: 'KOBA',
    subName: 'RENUEVA TU HOGAR',
    logoUrl: null, 
    adminNames: 'ING. MAURO / OMAR',
    adminRole: 'DIRECCIÓN TÉCNICA - RENUEVA',
    quoteTitle: 'PRESUPUESTO DE SERVICIO'
  },
  materials: {
    'Sellador': {
      name: 'Sellador Primario',
      yield: 50,
      price: 1200,
      brand: 'Sayer'
    }
  },
  workers: []
};

export const IVA_RATE = 0.16;
