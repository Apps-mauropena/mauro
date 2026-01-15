
import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_CONFIG, IVA_RATE, AVAILABLE_PRODUCTS } from './constants';
import { ProjectConfig, QuoteResult, MaterialCategory, QuoteItem, Product } from './types';
import { 
  Calculator, Printer, RefreshCw, Tag, Clock, Briefcase, ArrowRight, Truck, AlertTriangle, 
  Info, HardHat, TrendingUp, Box, Users, ChevronDown, Plus, X, Check, Pencil, Minus, 
  Settings, Lock, LogOut, Camera, Save, Trash2, ShieldCheck
} from 'lucide-react';

export default function App() {
  // Persistence logic
  const loadSavedConfig = () => {
    const saved = localStorage.getItem('rk_config');
    if (saved) {
      try {
        return { ...INITIAL_CONFIG, ...JSON.parse(saved) };
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
    // Simulación de autenticación (Admin / Renueva2024)
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
    const scaffoldTotal = hasScaffold ? (config.scaffoldCount * config.scaffoldDailyRate * config.scaffoldDays) : 0;
    items.push({
      concept: 'Renta de andamio',
      detail: 'Torres certificadas para altura',
      quantity: hasScaffold ? `${config.scaffoldCount} Und.` : '0',
      unitPrice: config.scaffoldDailyRate,
      total: scaffoldTotal,
      brand: hasScaffold ? 'SÍ' : 'NO',
      yieldDisplay: hasScaffold ? `${config.scaffoldDays} Días` : '0 D'
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

  const handleSaveProduct = () => {
    const priceNum = parseFloat(formProduct.price);
    const yieldNum = parseFloat(formProduct.yield);
    if (!formProduct.name || isNaN(priceNum) || priceNum <= 0) return;

    if (editingProductId) {
      setCustomProducts(prev => prev.map(p => p.id === editingProductId ? {
        ...p, name: formProduct.name, price: priceNum, yield: isNaN(yieldNum) ? 34 : yieldNum,
        brand: formProduct.brand || 'Personalizada'
      } : p));
    } else {
      const id = `custom-${Date.now()}`;
      setCustomProducts(prev => [...prev, {
        id, name: formProduct.name, category: config.selectedCategory, 
        yield: isNaN(yieldNum) ? 34 : yieldNum, price: priceNum, brand: formProduct.brand || 'Personalizada'
      }]);
      setConfig(p => ({ ...p, selectedProductId: id, extraBuckets: 0 }));
    }
    setIsFormOpen(false);
    setEditingProductId(null);
  };

  const laborMetric = (config.numWorkers * config.workerDailyRate * config.workDays) + (config.scaffoldCount * config.scaffoldDailyRate * config.scaffoldDays);
  const utility = config.m2 * config.profitRate;
  const materialCost = result.subtotal - laborMetric - utility - (config.masonryRepairEnabled ? config.masonryRepairCost : 0);

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-6 relative">
      {/* Login Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white mb-3 shadow-lg"><Lock className="w-6 h-6" /></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tighter">ACCESO ADMINISTRADOR</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresa para editar configuración</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Usuario</label>
                <input type="text" value={loginData.user} onChange={e => setLoginData(p => ({ ...p, user: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-100" placeholder="admin" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Contraseña</label>
                <input type="password" value={loginData.pass} onChange={e => setLoginData(p => ({ ...p, pass: e.target.value }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-100" placeholder="••••••••" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 no-print">
        <div className="flex items-center gap-3">
          {config.branding.logoUrl ? (
            <img src={config.branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
          ) : (
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100"><Briefcase className="w-6 h-6" /></div>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{config.branding.companyName}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.branding.subName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-all">
              <ShieldCheck className="w-4 h-4" /> Modo Admin
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

      <main className="space-y-6">
        <section id="printable-quote" className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-50 relative overflow-hidden print:shadow-none print:border-none print:p-0">
          {/* Admin Edit Overlay for Branding */}
          {isAdmin && (
            <div className="absolute top-0 right-0 p-4 no-print flex gap-2">
              <label className="cursor-pointer bg-white p-2 rounded-full shadow-lg border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
              <button onClick={() => alert("Cambios guardados localmente")} className="bg-white p-2 rounded-full shadow-lg border border-slate-100 text-emerald-600 hover:bg-emerald-50">
                <Save className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900">
            <div className="space-y-2">
              <div className="bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-black uppercase inline-block">RK-OFFICIAL</div>
              {isAdmin ? (
                <input 
                  value={config.branding.quoteTitle} 
                  onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, quoteTitle: e.target.value } }))}
                  className="block text-3xl font-black text-slate-900 tracking-tighter uppercase border-b-2 border-indigo-100 outline-none w-full"
                />
              ) : (
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{config.branding.quoteTitle}</h2>
              )}
              <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> ID: #RK-{Math.floor(Math.random() * 1000)}</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date().toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            <div className="text-right">
              {isAdmin ? (
                <>
                  <input value={config.branding.companyName} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, companyName: e.target.value } }))} className="text-3xl font-black text-indigo-600 text-right border-b border-indigo-100 outline-none block w-48 ml-auto" />
                  <input value={config.branding.subName} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, subName: e.target.value } }))} className="text-[10px] font-black text-slate-900 tracking-widest uppercase italic text-right border-b border-indigo-100 outline-none block w-48 ml-auto mt-1" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">{config.branding.companyName}</div>
                  <div className="text-[10px] font-black text-slate-900 tracking-widest uppercase italic">{config.branding.subName}</div>
                </>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
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
                         <p className={`text-[9px] font-black uppercase ${item.isWarning ? 'text-rose-700' : 'text-slate-600'}`}>{item.brand}</p>
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
                            className="no-print p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-emerald-500 hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
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

          <div className="flex flex-col md:flex-row justify-between items-end mt-12 gap-8 print:mt-6">
            <div className="w-full md:max-w-[45%] p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-none">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Info className="w-3 h-3 text-indigo-500" /> Condiciones Generales</p>
              <ul className="text-[8px] font-bold text-slate-500 space-y-1">
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-indigo-500" /> Precios sujetos a cambios según mercado.</li>
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-indigo-500" /> Anticipo del 50% para inicio de obra.</li>
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-indigo-500" /> Garantía certificada según material.</li>
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
              <div className="h-1 bg-slate-900 my-4 rounded-full print:bg-slate-300"></div>
              <div className="flex justify-between items-baseline px-1 gap-4">
                <span className="text-sm font-black italic uppercase text-slate-900">Total con iva + garantía</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                  <span className="text-[10px] font-black text-slate-400 ml-1">MXN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-100 flex justify-around items-center opacity-60 print:mt-10">
            <div className="text-center">
              <div className="h-px bg-slate-300 w-40 mb-3 mx-auto"></div>
              {isAdmin ? (
                <input value={config.branding.adminNames} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, adminNames: e.target.value } }))} className="text-[9px] font-black text-slate-900 uppercase text-center border-b border-indigo-100 outline-none block mx-auto" />
              ) : (
                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{config.branding.adminNames}</p>
              )}
              {isAdmin ? (
                <input value={config.branding.adminRole} onChange={e => setConfig(p => ({ ...p, branding: { ...p.branding, adminRole: e.target.value } }))} className="text-[7px] font-bold text-slate-400 uppercase text-center border-b border-indigo-100 outline-none block mx-auto" />
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

          {/* Settings Panel only in Admin Mode */}
          <div className="no-print mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                <Calculator className="w-3 h-3 text-indigo-500" /> Panel de Ajustes
              </h3>
              {isAdmin && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-200 animate-pulse">ADMINISTRADOR ACTIVO</span>}
            </div>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider">Dimensiones</h2>
              <div className="relative">
                <input type="number" value={config.m2} onChange={e => setConfig(p => ({ ...p, m2: Number(e.target.value), workDays: calculateWorkDays(Number(e.target.value)) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">M²</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Impermeabilizante', 'Pintura'] as MaterialCategory[]).map(cat => (
                  <button key={cat} onClick={() => setConfig(p => ({ ...p, selectedCategory: cat, selectedProductId: allProducts.find(x => x.category === cat)?.id || p.selectedProductId, extraBuckets: 0, extraSealerBuckets: 0 }))}
                    className={`py-2 rounded-xl border-2 font-black text-[10px] transition-all ${config.selectedCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}>{cat}</button>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><Box className="w-3 h-3 text-indigo-500" /> Material Base</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar</label>
                   <button onClick={() => { setEditingProductId(null); setFormProduct({ name: '', price: '', yield: '34', brand: '' }); setIsFormOpen(true); }} className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
                </div>
                {isFormOpen ? (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                    <input value={formProduct.name} onChange={e => setFormProduct(p => ({ ...p, name: e.target.value }))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" placeholder="Nombre" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={formProduct.price} onChange={e => setFormProduct(p => ({ ...p, price: e.target.value }))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none" placeholder="Precio ($)" />
                      <input value={formProduct.yield} onChange={e => setFormProduct(p => ({ ...p, yield: e.target.value }))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none" placeholder="Rendimiento" />
                    </div>
                    <button onClick={handleSaveProduct} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase"><Check className="w-3 h-3 inline mr-1" /> Guardar</button>
                  </div>
                ) : (
                  <div className="relative">
                    <select value={config.selectedProductId} onChange={e => setConfig(p => ({ ...p, selectedProductId: e.target.value, extraBuckets: 0 }))} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs appearance-none outline-none pr-10">
                      {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><Settings className="w-3 h-3 text-indigo-500" /> Mat. Auxiliar</h2>
              <div className="relative">
                <input type="number" value={config.auxMaterialTotal} onChange={e => setConfig(p => ({ ...p, auxMaterialTotal: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
              </div>
              <p className="text-[7px] font-black text-slate-400 uppercase leading-tight italic">Costo global manual</p>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><Users className="w-3 h-3 text-indigo-500" /> Mano de Obra</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Trab.</label>
                  <select value={config.numWorkers} onChange={e => setConfig(p => ({ ...p, numWorkers: Number(e.target.value) }))} className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Días</label>
                  <select value={config.workDays} onChange={e => setConfig(p => ({ ...p, workDays: Number(e.target.value) }))} className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none">
                    {Array.from({length: 30}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pago Diario ($)</label>
                <input type="number" value={config.workerDailyRate} onChange={e => setConfig(p => ({ ...p, workerDailyRate: Number(e.target.value) }))} className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none" />
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className="no-print bg-slate-900/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center sticky bottom-4 z-50 ring-1 ring-white/10 max-w-6xl mx-auto shadow-2xl border border-white/5 gap-4 md:gap-0">
        <div className="flex flex-wrap items-center gap-6 px-4 text-white">
          <div className="flex items-center gap-2">
             <div className="bg-amber-500/20 p-2 rounded-lg"><HardHat className="w-4 h-4 text-amber-400" /></div>
             <div><p className="text-[8px] font-black text-slate-400 uppercase">Obra + Andamios</p><p className="text-sm font-black">${laborMetric.toLocaleString()}</p></div>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-indigo-500/20 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-indigo-400" /></div>
             <div><p className="text-[8px] font-black text-slate-400 uppercase">Utilidad</p><p className="text-sm font-black">${utility.toLocaleString()}</p></div>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-emerald-500/20 p-2 rounded-lg"><Box className="w-4 h-4 text-emerald-400" /></div>
             <div><p className="text-[8px] font-black text-slate-400 uppercase">Materiales</p><p className="text-sm font-black">${materialCost.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p></div>
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
