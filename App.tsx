
import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_CONFIG, IVA_RATE, AVAILABLE_PRODUCTS } from './constants';
import { ProjectConfig, QuoteResult, MaterialCategory, QuoteItem, Product } from './types';
import { 
  Calculator, Printer, RefreshCw, Tag, Clock, Briefcase, ArrowRight, Truck, AlertTriangle, 
  Info, HardHat, TrendingUp, Box, Users, ChevronDown, Plus, X, Check, Pencil, Minus, 
  Settings, Lock, LogOut, Camera, Save, ShieldCheck, Upload
} from 'lucide-react';

export default function App() {
  // Persistence logic
  const loadSavedConfig = () => {
    const saved = localStorage.getItem('rk_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_CONFIG, ...parsed, branding: { ...INITIAL_CONFIG.branding, ...parsed.branding } };
      } catch (e) {
        return INITIAL_CONFIG;
      }
    }
    return INITIAL_CONFIG;
  };

  const [config, setConfig] = useState<ProjectConfig>(loadSavedConfig());
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('rk_custom_products');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formProduct, setFormProduct] = useState({
    name: '',
    price: '',
    yield: '34',
    brand: ''
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('rk_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('rk_custom_products', JSON.stringify(customProducts));
  }, [customProducts]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Credenciales restauradas: admin / Renueva2024
    if (loginData.user.toLowerCase() === 'admin' && loginData.pass === 'Renueva2024') {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginData({ user: '', pass: '' });
    } else {
      alert("Credenciales incorrectas");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({
          ...prev,
          branding: { ...prev.branding, logoUrl: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateWorkDays = (m2: number) => Math.max(1, Math.ceil(m2 / 33.3));

  const allProducts = useMemo(() => {
    const customIds = new Set(customProducts.map(p => p.id));
    const filteredBase = AVAILABLE_PRODUCTS.filter(p => !customIds.has(p.id));
    return [...filteredBase, ...customProducts];
  }, [customProducts]);

  const currentProduct = useMemo(() => {
    return allProducts.find(p => p.id === config.selectedProductId) || allProducts[0];
  }, [config.selectedProductId, allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => p.category === config.selectedCategory);
  }, [config.selectedCategory, allProducts]);

  const result: QuoteResult = useMemo(() => {
    const sealerMaterial = config.materials['Sellador'];
    const m2 = config.m2;
    const items: QuoteItem[] = [];

    // 1. Principal
    const baseBuckets = Math.ceil(m2 / currentProduct.yield);
    const finalBuckets = Math.max(0, baseBuckets + config.extraBuckets);
    items.push({
      concept: config.selectedCategory,
      detail: `${currentProduct.name} - Cobertura para ${m2} m²`,
      quantity: `${finalBuckets} Cub.`,
      unitPrice: currentProduct.price,
      total: finalBuckets * currentProduct.price,
      brand: currentProduct.brand,
      yieldDisplay: `${currentProduct.yield} m²/c`,
      isAdjustable: true 
    });

    // 2. Sellador
    const baseSealerBuckets = Math.ceil(m2 / sealerMaterial.yield);
    const finalSealerBuckets = Math.max(0, baseSealerBuckets + config.extraSealerBuckets);
    items.push({
      concept: 'Sellador Primario',
      detail: 'Base de adherencia obligatoria',
      quantity: `${finalSealerBuckets} Cub.`,
      unitPrice: sealerMaterial.price,
      total: finalSealerBuckets * sealerMaterial.price,
      brand: sealerMaterial.brand,
      yieldDisplay: `${sealerMaterial.yield} m²/c`,
      isAdjustable: true 
    });

    // 3. Auxiliar
    items.push({
      concept: 'Material Auxiliar',
      detail: 'Rodillos, brochas, cintas y masking',
      quantity: 'Global',
      unitPrice: config.auxMaterialTotal,
      total: config.auxMaterialTotal,
      brand: 'Varios',
      yieldDisplay: 'N/A'
    });

    // 4. Andamios
    const hasScaffold = config.scaffoldCount > 0;
    const scaffoldTotal = hasScaffold ? (config.scaffoldDays * config.scaffoldDailyRate) : 0;
    
    items.push({
      concept: 'Renta de andamio',
      detail: hasScaffold ? 'Torres certificadas de trabajo' : 'No solicitado',
      quantity: hasScaffold ? `${config.scaffoldDays} Días` : '0',
      unitPrice: hasScaffold ? config.scaffoldDailyRate : 0,
      total: scaffoldTotal,
      brand: hasScaffold ? 'KOBA' : 'N/A',
      yieldDisplay: hasScaffold ? `${config.scaffoldDays} D` : '0 D'
    });

    // 5. Mano de Obra
    const workerTotal = config.numWorkers * config.workerDailyRate * config.workDays;
    items.push({
      concept: 'Mano de Obra Especializada',
      detail: 'Ejecución técnica de aplicación',
      quantity: `${config.numWorkers * config.workDays} Jorn.`,
      unitPrice: config.workerDailyRate,
      total: workerTotal,
      brand: `${config.numWorkers} Trab.`,
      yieldDisplay: `${config.workDays} Días`
    });

    // 6. Albañilería
    if (config.masonryRepairEnabled) {
      items.push({
        concept: 'Gastos por reparaciones albañilería',
        detail: 'DAÑO ESTRUCTURAL: Reparación de paredes rotas y parches.',
        quantity: '1 Serv.',
        unitPrice: config.masonryRepairCost,
        total: config.masonryRepairCost,
        brand: 'URGENTE',
        yieldDisplay: 'Pre-Obra',
        isWarning: true
      });
    }

    // 7. Utilidad
    items.push({
      concept: 'Supervisión y Administración',
      detail: 'Dirección técnica Mauro y Omar',
      quantity: `${m2} m²`,
      unitPrice: config.profitRate,
      total: m2 * config.profitRate,
      brand: 'Ingeniería',
      yieldDisplay: 'N/A'
    });

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    return { items, subtotal, iva: subtotal * IVA_RATE, total: subtotal * (1 + IVA_RATE) };
  }, [config, currentProduct]);

  const scaffoldTotalValue = config.scaffoldCount > 0 ? (config.scaffoldDays * config.scaffoldDailyRate) : 0;
  const laborMetric = (config.numWorkers * config.workerDailyRate * config.workDays) + scaffoldTotalValue;
  const utility = config.m2 * config.profitRate;
  const materialCost = result.subtotal - laborMetric - utility - (config.masonryRepairEnabled ? config.masonryRepairCost : 0);

  // Rangos para los selectores
  const dailyScaffoldRates = Array.from({ length: 10 }, (_, i) => (i + 1) * 100);
  const laborDailyRates = [500, 600, 700, 800, 900, 1000, 1100, 1200];

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-6 relative">
      {/* Login Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-[#005C69] p-3 rounded-2xl text-white mb-3 shadow-lg"><Lock className="w-6 h-6" /></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tighter">ACCESO ADMINISTRADOR</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuración de marca KOBA</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Usuario</label>
                <input type="text" value={loginData.user} onChange={e => setLoginData(p => ({ ...p, user: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#005C69]/10" placeholder="admin" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Contraseña</label>
                <input type="password" value={loginData.pass} onChange={e => setLoginData(p => ({ ...p, pass: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#005C69]/10" placeholder="••••••••" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#005C69] text-white rounded-xl font-black text-xs uppercase hover:opacity-90 transition-all shadow-md">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 no-print relative z-[100]">
        <div className="flex items-center gap-4">
          <div className="relative z-[200]">
            <input 
              type="file" 
              id="header-logo-upload" 
              className="hidden" 
              accept=".png,.jpg,.jpeg,.svg" 
              onChange={handleLogoUpload}
            />
            <label htmlFor="header-logo-upload" className="cursor-pointer group block">
              {config.branding.logoUrl ? (
                <div className="bg-white p-1 rounded-xl shadow-md flex items-center justify-center overflow-visible border border-slate-100 hover:border-[#005C69]/30 transition-all relative">
                  <img src={config.branding.logoUrl} alt="Logo KOBA" className="w-16 h-16 object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex flex-col items-center justify-center transition-opacity">
                    <Upload className="w-4 h-4 text-white mb-1" />
                    <span className="text-[7px] text-white font-black uppercase tracking-tighter">Subir logo</span>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-[#005C69]/20 transition-all">
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[7px] font-black uppercase text-center leading-none px-1">Subir logo</span>
                </div>
              )}
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#005C69] tracking-tighter leading-none">{config.branding.companyName}</h1>
            <p className="text-[10px] font-bold text-[#FF914D] uppercase tracking-widest">{config.branding.subName}</p>
          </div>
        </div>
        <div className="flex gap-2 relative z-[150]">
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-[#005C69] rounded-lg font-bold text-xs hover:bg-slate-100 transition-all border border-slate-100">
              <ShieldCheck className="w-4 h-4" /> Panel Admin
            </button>
          ) : (
            <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg font-bold text-xs hover:bg-rose-100 transition-all">
              <LogOut className="w-4 h-4" /> Salir Admin
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-sm transition-all shadow-md">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </header>

      <main className="space-y-6 relative z-10">
        <section id="printable-quote" className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-50 relative overflow-visible print:shadow-none print:border-none print:p-0">
          {isAdmin && (
            <div className="absolute top-4 right-4 no-print flex gap-2 z-[300]">
              <label className="cursor-pointer bg-white p-2 rounded-full shadow-lg border border-slate-100 text-[#005C69] hover:bg-slate-50 transition-colors" title="Cambiar Logo">
                <Camera className="w-5 h-5" />
                <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg" onChange={handleLogoUpload} />
              </label>
              <button onClick={() => alert("Cambios guardados localmente")} className="bg-white p-2 rounded-full shadow-lg border border-slate-100 text-emerald-600 hover:bg-emerald-50">
                <Save className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900 relative z-[100]">
            <div className="space-y-2">
              <div className="bg-[#005C69] text-white px-2 py-1 rounded text-[8px] font-black uppercase inline-block">KOBA-OFFICIAL</div>
              {isAdmin ? (
                <input 
                  value={config.branding.quoteTitle} 
                  onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, quoteTitle: e.target.value } }))}
                  className="block text-3xl font-black text-slate-900 tracking-tighter uppercase border-b-2 border-[#005C69]/10 outline-none w-full"
                />
              ) : (
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{config.branding.quoteTitle}</h2>
              )}
              <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> ID: #RK-{Math.floor(Math.random() * 1000)}</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date().toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end relative z-[250]">
              <div className="relative group cursor-pointer no-print">
                <input 
                  type="file" 
                  id="quote-logo-upload" 
                  className="hidden" 
                  accept=".png,.jpg,.jpeg,.svg" 
                  onChange={handleLogoUpload}
                />
                <label htmlFor="quote-logo-upload" className="cursor-pointer block">
                  {config.branding.logoUrl ? (
                    <div className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-50 mb-4 flex items-center justify-center relative overflow-visible transform hover:scale-105 transition-transform duration-300">
                      <img src={config.branding.logoUrl} alt="Logo Cotización" className="w-48 h-48 object-contain" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center transition-opacity">
                         <Upload className="w-8 h-8 text-white mb-2" />
                         <span className="text-xs text-white font-black uppercase tracking-widest">Subir logo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-slate-50 border-4 border-dashed border-slate-200 rounded-3xl mb-4 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-[#005C69]/20 transition-all">
                      <Camera className="w-12 h-12 mb-3" />
                      <span className="text-sm font-black uppercase tracking-widest">Subir logo</span>
                      <span className="text-[10px] font-bold mt-1 opacity-60">PNG, JPG, SVG (1:1)</span>
                    </div>
                  )}
                </label>
              </div>
              {config.branding.logoUrl && (
                <div className="hidden print:flex bg-white p-2 mb-4 items-center justify-center">
                  <img src={config.branding.logoUrl} alt="Logo Cotización" className="w-48 h-48 object-contain" />
                </div>
              )}

              {isAdmin ? (
                <>
                  <input value={config.branding.companyName} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, companyName: e.target.value } }))} className="text-3xl font-black text-[#005C69] text-right border-b border-[#005C69]/10 outline-none block w-64 ml-auto" />
                  <input value={config.branding.subName} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, subName: e.target.value } }))} className="text-[12px] font-black text-[#FF914D] tracking-widest uppercase italic text-right border-b border-[#FF914D]/10 outline-none block w-64 ml-auto mt-1" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-black text-[#005C69] tracking-tighter leading-none">{config.branding.companyName}</div>
                  <div className="text-[12px] font-black text-[#FF914D] tracking-widest uppercase italic">{config.branding.subName}</div>
                </>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto relative z-10">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                  <th className="p-4 rounded-l-xl">Concepto</th>
                  <th className="p-4">Detalle / Marca</th>
                  <th className="p-4">Plazo / Rend.</th>
                  <th className="p-4 text-center">Cant.</th>
                  <th className="p-4 text-right">Unitario</th>
                  <th className="p-4 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.items.map((item, idx) => (
                  <tr key={idx} className={`group transition-colors ${item.isWarning ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 align-top">
                      <p className={`font-black text-xs ${item.isWarning ? 'text-rose-600' : 'text-slate-900'}`}>{item.concept}</p>
                      <p className={`text-[8px] font-bold leading-tight uppercase ${item.isWarning ? 'text-rose-500 italic' : 'text-slate-400'}`}>{item.detail}</p>
                    </td>
                    <td className="p-4 align-top">
                      <div className={`px-2 py-1 rounded-lg border inline-block ${item.isWarning ? 'bg-rose-100 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                         <p className={`text-[9px] font-black uppercase ${item.isWarning ? 'text-rose-700' : 'text-[#005C69]'}`}>{item.brand}</p>
                      </div>
                    </td>
                    <td className="p-4 align-top whitespace-nowrap">
                      <p className={`text-[10px] font-black italic ${item.isWarning ? 'text-rose-600' : 'text-slate-500'}`}>{item.yieldDisplay}</p>
                    </td>
                    <td className="p-4 text-center align-top whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {item.isAdjustable && (
                          <button onClick={() => item.concept === 'Sellador Primario' ? setConfig(p => ({ ...p, extraSealerBuckets: p.extraSealerBuckets - 1 })) : setConfig(p => ({ ...p, extraBuckets: p.extraBuckets - 1 }))}
                            className="no-print p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-rose-500 hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                        )}
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${item.isWarning ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>{item.quantity}</span>
                        {item.isAdjustable && (
                          <button onClick={() => item.concept === 'Sellador Primario' ? setConfig(p => ({ ...p, extraSealerBuckets: p.extraSealerBuckets + 1 })) : setConfig(p => ({ ...p, extraBuckets: p.extraBuckets + 1 }))}
                            className="no-print p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-[#FF914D] hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right align-top whitespace-nowrap">
                      <p className="text-[10px] font-bold text-slate-600">${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-4 text-right align-top whitespace-nowrap">
                      <p className={`text-xs font-black ${item.isWarning ? 'text-rose-700' : 'text-slate-900'}`}>${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end mt-12 gap-8 print:mt-6 relative z-10">
            <div className="w-full md:max-w-[45%] p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-none">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Info className="w-3 h-3 text-[#005C69]" /> Condiciones KOBA</p>
              <ul className="text-[8px] font-bold text-slate-500 space-y-1">
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-[#FF914D]" /> Precios sujetos a cambios según mercado actual.</li>
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-[#FF914D]" /> Anticipo obligatorio del 50% para programar inicio.</li>
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-[#FF914D]" /> Garantía certificada de aplicación por escrito.</li>
              </ul>
            </div>
            <div className="min-w-[320px] space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <span>Subtotal Neto</span>
                <span className="text-slate-900">${result.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                <span>IVA Trasladado (16%)</span>
                <span>${result.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-1 bg-[#005C69] my-4 rounded-full print:bg-slate-300"></div>
              <div className="flex justify-between items-baseline px-1 gap-4">
                <span className="text-sm font-black italic uppercase text-slate-900">Total con iva + garantía</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                  <span className="text-[10px] font-black text-slate-400 ml-1">MXN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-100 flex justify-around items-center opacity-60 print:mt-10 relative z-10">
            <div className="text-center">
              <div className="h-px bg-slate-300 w-40 mb-3 mx-auto"></div>
              {isAdmin ? (
                <input value={config.branding.adminNames} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, adminNames: e.target.value } }))} className="text-[9px] font-black text-slate-900 uppercase text-center border-b border-[#005C69]/10 outline-none block mx-auto" />
              ) : (
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{config.branding.adminNames}</p>
              )}
              {isAdmin ? (
                <input value={config.branding.adminRole} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, adminRole: e.target.value } }))} className="text-[7px] font-bold text-slate-400 uppercase text-center border-b border-[#005C69]/10 outline-none block mx-auto" />
              ) : (
                <p className="text-[7px] font-bold text-slate-400 uppercase">{config.branding.adminRole}</p>
              )}
            </div>
            <div className="text-center">
              <div className="h-px bg-slate-300 w-40 mb-3 mx-auto"></div>
              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">ACEPTACIÓN CLIENTE</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">FIRMA DE CONFORMIDAD</p>
            </div>
          </div>

          {/* Panel de Ajustes Rápidos */}
          <div className="no-print mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-100 relative z-[100]">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                <Calculator className="w-3 h-3 text-[#005C69]" /> Centro de Ajustes Operativos
              </h3>
              {isAdmin && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-200">ADMINISTRADOR ACTIVO</span>}
            </div>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider">Dimensiones</h2>
              <div className="relative">
                <input 
                  type="number" 
                  value={config.m2} 
                  onChange={e => setConfig(p => ({ ...p, m2: Number(e.target.value), workDays: calculateWorkDays(Number(e.target.value)) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl focus:ring-2 focus:ring-[#005C69]/20 outline-none" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">M²</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Impermeabilizante', 'Pintura'] as MaterialCategory[]).map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setConfig(p => ({ ...p, selectedCategory: cat, selectedProductId: allProducts.find(x => x.category === cat)?.id || p.selectedProductId, extraBuckets: 0, extraSealerBuckets: 0 }))}
                    className={`py-2 rounded-xl border-2 font-black text-[10px] transition-all ${config.selectedCategory === cat ? 'bg-[#005C69] border-[#005C69] text-white shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-[#005C69]/30'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider">
                <HardHat className="w-3 h-3 text-[#FF914D]" /> Renta de Andamio
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">¿Aplica renta de andamio?</label>
                  <select 
                    value={config.scaffoldCount > 0 ? "si" : "no"} 
                    onChange={e => setConfig(p => ({ ...p, scaffoldCount: e.target.value === "si" ? 1 : 0 }))}
                    className={`w-full p-2 border-2 rounded-xl font-bold text-xs outline-none transition-colors ${config.scaffoldCount > 0 ? 'bg-orange-50 border-[#FF914D]/30' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                  </select>
                </div>
                
                {config.scaffoldCount > 0 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Días de renta</label>
                        <select 
                          value={config.scaffoldDays} 
                          onChange={e => setConfig(p => ({ ...p, scaffoldDays: Number(e.target.value) }))}
                          className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:border-[#FF914D]"
                        >
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d} Días</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Costo por día</label>
                        <select 
                          value={config.scaffoldDailyRate} 
                          onChange={e => setConfig(p => ({ ...p, scaffoldDailyRate: Number(e.target.value) }))}
                          className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:border-[#FF914D]"
                        >
                          {dailyScaffoldRates.map(rate => <option key={rate} value={rate}>${rate} MXN</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider">
                <Settings className="w-3 h-3 text-[#FF914D]" /> Mat. Auxiliar
              </h2>
              <div className="relative">
                <input 
                  type="number" 
                  value={config.auxMaterialTotal} 
                  onChange={e => setConfig(p => ({ ...p, auxMaterialTotal: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl outline-none" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
              </div>
              <p className="text-[7px] font-black text-slate-400 uppercase leading-tight italic">Global (Brochas, cintas...)</p>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><Users className="w-3 h-3 text-[#005C69]" /> Mano de Obra</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Trab.</label>
                  <select 
                    value={config.numWorkers} 
                    onChange={e => setConfig(p => ({ ...p, numWorkers: Number(e.target.value) }))} 
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none"
                  >
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Días</label>
                  <select 
                    value={config.workDays} 
                    onChange={e => setConfig(p => ({ ...p, workDays: Number(e.target.value) }))} 
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none"
                  >
                    {Array.from({length: 30}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Pago Diario ($)</label>
                <select 
                  value={config.workerDailyRate} 
                  onChange={e => setConfig(p => ({ ...p, workerDailyRate: Number(e.target.value) }))}
                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none focus:ring-1 focus:ring-[#005C69]/30 appearance-none"
                >
                  {laborDailyRates.map(rate => (
                    <option key={rate} value={rate}>${rate.toLocaleString()} MXN</option>
                  ))}
                </select>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className="no-print bg-slate-900/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center sticky bottom-4 z-[400] ring-1 ring-white/10 max-w-6xl mx-auto shadow-2xl border border-white/5 gap-4 md:gap-0">
        <div className="flex flex-wrap items-center gap-6 px-4 text-white">
          <div className="flex items-center gap-2">
             <div className="bg-[#FF914D]/20 p-2 rounded-lg"><HardHat className="w-4 h-4 text-[#FF914D]" /></div>
             <div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Obra + Andamios</p><p className="text-sm font-black">${laborMetric.toLocaleString()}</p></div>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-[#005C69]/20 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-[#005C69]" /></div>
             <div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Utilidad</p><p className="text-sm font-black">${utility.toLocaleString()}</p></div>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-emerald-500/20 p-2 rounded-lg"><Box className="w-4 h-4 text-emerald-400" /></div>
             <div><p className="text-[8px] font-black text-slate-400 uppercase leading-none">Materiales</p><p className="text-sm font-black">${materialCost.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p></div>
          </div>
        </div>
        <div className="pr-4 text-right border-l border-white/10 pl-8">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Liquidación Final</p>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-500 font-bold ml-1">MXN</span></p>
        </div>
      </footer>
    </div>
  );
}
