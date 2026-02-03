import React, { useState, useEffect, useMemo } from 'react';
import { User, ProductModel, StoneShape, StoneType, FilterState } from './types';
import { loginUser, fetchCatalog, clearSession, logProductView, getStoredUser, getToken } from './services/dataService';
import { FilterBar } from './components/FilterBar';
import { ProductModal } from './components/ProductModal';
import { Button } from './components/Button';
import { Search, LogOut, Filter, Gem } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data State
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [shapes, setShapes] = useState<StoneShape[]>([]);
  const [types, setTypes] = useState<StoneType[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // UI State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductModel | null>(null);

  // Restore session if token/user present
  useEffect(() => {
    const cachedUser = getStoredUser();
    const cachedToken = getToken();
    if (cachedUser && cachedToken) {
      setUser(cachedUser);
      setLoadingData(true);
      fetchCatalog()
        .then(data => {
          setProducts(data.products);
          setShapes(data.shapes);
          setTypes(data.types);
        })
        .catch(() => setErrorMsg('Chargement catalogue impossible.'))
        .finally(() => setLoadingData(false));
    }
  }, []);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    reference: null,
    category: null,
    minPrice: null,
    maxPrice: null,
    shapeIds: [],
    stoneTypeIds: [],
    line: null,
  });

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setIsLoginLoading(true);
    setErrorMsg(null);
    try {
      const userData = await loginUser(usernameInput, passwordInput);
      setUser(userData);
      // Fetch data after login
      setLoadingData(true);
      const data = await fetchCatalog();
      setProducts(data.products);
      setShapes(data.shapes);
      setTypes(data.types);
      setLoadingData(false);
    } catch (error) {
      console.error("Login failed", error);
      setErrorMsg('Connexion ou chargement catalogue impossible. Vérifiez vos identifiants ou réessayez.');
      setLoadingData(false);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProducts([]);
    clearSession();
  };

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 0. Reference - Si une référence est recherchée, on ignore les autres filtres
      if (filters.reference) {
        return p.ref.toLowerCase().includes(filters.reference.toLowerCase());
      }

      // 1. Category
      if (filters.category && p.category !== filters.category) return false;
      
      // 2. Line
      if (filters.line && p.line !== filters.line) return false;
      
      // 3. Price
      if (filters.minPrice !== null && p.maxPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && p.minPrice > filters.maxPrice) return false;

      // 4. Shape
      if (filters.shapeIds.length > 0) {
        const hasMatchingShape = filters.shapeIds.some(id => p.availableShapeIds.includes(id));
        if (!hasMatchingShape) return false;
      }

      // 5. Type
      if (filters.stoneTypeIds.length > 0) {
        const hasMatchingType = filters.stoneTypeIds.some(id => p.availableTypeIds.includes(id));
        if (!hasMatchingType) return false;
      }

      return true;
    });
  }, [products, filters]);

  // Derived lists for filters
  const uniqueCategories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);
  const uniqueLines = useMemo(() => Array.from(new Set(products.map(p => p.line))), [products]);
  
  const minPriceGlobal = useMemo(() => products.length > 0 ? Math.min(...products.map(p => p.minPrice)) : 0, [products]);
  const maxPriceGlobal = useMemo(() => products.length > 0 ? Math.max(...products.map(p => p.maxPrice)) : 10000, [products]);


  // --- Render: Login View ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative z-10 text-center border-t-4 border-gold-500">
          <div className="mx-auto w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mb-6 text-gold-600">
            <Gem size={32} />
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">Bienvenue</h1>
          <p className="text-slate-500 mb-6">Accédez à votre catalogue joaillerie privé.</p>

          {errorMsg && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3" role="alert" aria-live="assertive">
              {errorMsg}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Identifiant</label>
              <input 
                type="text" 
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-gold-500 focus:bg-white transition-all outline-none"
                placeholder="Entrez votre nom..."
                autoFocus
                aria-label="Identifiant"
              />
            </div>
            <div className="text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Mot de passe</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:border-gold-500 focus:bg-white transition-all outline-none"
                placeholder="Entrez votre mot de passe"
                aria-label="Mot de passe"
              />
            </div>
            <Button 
              type="submit" 
              fullWidth 
              disabled={isLoginLoading}
              className="py-3 text-lg"
            >
              {isLoginLoading ? 'Connexion...' : 'Entrer'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // --- Render: Main Catalog ---
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gold-100 shadow-sm print:hidden">
        <div className="px-4 py-3 flex items-center justify-center relative">
           <img src={user.logoUrl} alt="Logo" className="w-20 h-14 object-contain" />
           <button onClick={handleLogout} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-500 transition-colors" title="Déconnexion">
             <LogOut size={20} />
           </button>
        </div>
        
        {/* Filter Trigger Bar (Mobile Sticky) */}
        <div className="border-t border-slate-50 px-4 py-2 flex justify-between items-center bg-white">
          <p className="text-sm text-slate-500" aria-live="polite">
            {filteredProducts.length} résultat{filteredProducts.length !== 1 && 's'}
          </p>
          <div className="flex gap-2">
             {/* Quick Ref Search */}
             <div className="relative flex-1 sm:flex-none">
               <input 
                 type="text" 
                 inputMode="numeric"
                 placeholder="Réf..."
                 value={filters.reference || ''}
                 onChange={(e) => setFilters({...filters, reference: e.target.value || null})}
                 className="w-full sm:w-24 pl-2 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:border-gold-500 outline-none"
               />
             </div>
             <Button variant="outline" onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 text-xs py-1.5">
               <Filter size={14} /> Filtrer
             </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gold-50 p-4">
        {errorMsg && (
          <div className="max-w-7xl mx-auto mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3" role="alert" aria-live="assertive">
            {errorMsg}
          </div>
        )}
        {loadingData ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {filteredProducts.length === 0 ? (
               <div className="text-center py-20 text-slate-400">
                 <p className="font-serif text-xl mb-2">Aucun produit trouvé</p>
                 <p className="text-sm">Essayez de modifier vos filtres.</p>
                 <button onClick={() => setFilters({reference: null, category:null, minPrice:null, maxPrice:null, shapeIds:[], stoneTypeIds:[], line:null})} className="mt-4 text-gold-600 underline">Tout effacer</button>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {filteredProducts.map(product => (
                  <div 
                    key={product.ref} 
                    onClick={() => { setSelectedProduct(product); logProductView(product.ref, user?.id ?? null); }}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100 hover:border-gold-300"
                  >
                    {/* Card Image */}
                    <div className="aspect-square bg-slate-50 overflow-hidden relative">
                       <img 
                         src={product.thumbnail} 
                         alt={product.ref} 
                         loading="lazy"
                         decoding="async"
                         className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-700"
                       />
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gold-900/40 via-gold-900/20 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <span className="text-white text-xs font-bold tracking-widest uppercase">Voir {product.variations.length} déclinaisons</span>
                       </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-4 text-center">
                      <div className="text-base md:text-xs text-gold-600 font-bold tracking-widest uppercase mb-1">{product.line}</div>
                      <h3 className="font-serif text-2xl md:text-lg text-slate-900 mb-2">{product.category} #{product.ref}</h3>
                      <div className="text-slate-700 font-semibold text-lg md:text-sm">
                        <span className="text-base md:text-xs text-slate-400 font-normal">à partir de</span> {product.minPrice.toLocaleString('fr-FR')} €
                      </div>
                      
                      {/* Chips for shapes/types preview - hidden on mobile */}
                      <div className="hidden sm:flex mt-3 flex-wrap justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {product.availableShapeIds.slice(0, 3).map(id => {
                           const shape = shapes.find(s => s.id === id);
                           return shape ? <span key={id} className="text-sm md:text-[10px] border border-slate-200 px-2 py-1 rounded text-slate-500">{shape.description}</span> : null
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile floating filter button */}
      <div className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 print:hidden">
        <Button variant="secondary" className="rounded-full shadow-lg px-4 py-3 text-sm flex items-center gap-2" onClick={() => setIsFilterOpen(true)}>
          <Filter size={16} /> Filtres
        </Button>
      </div>

      {/* Filter Drawer */}
      <FilterBar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        filters={filters} 
        setFilters={setFilters}
        shapes={shapes}
        types={types}
        categories={uniqueCategories}
        lines={uniqueLines}
        minPriceGlobal={minPriceGlobal}
        maxPriceGlobal={maxPriceGlobal}
      />

      {/* Product Detail Modal */}
      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        userLogo={user?.logoUrl || ''}
        userIsAdmin={!!user?.admin}
        userCoef={user?.coef ?? 1}
        userId={user?.id}
        agenceId={user?.agenceId}
      />

    </div>
  );
};

export default App;