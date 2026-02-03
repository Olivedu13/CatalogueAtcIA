import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProductModel, ProductVariation } from '../types';
import { X, Printer, ZoomIn, Info } from 'lucide-react';
import { Button } from './Button';
import { jsPDF } from 'jspdf';

interface ProductModalProps {
  product: ProductModel | null;
  onClose: () => void;
  userLogo: string;
  userIsAdmin: boolean;
  userCoef: number;
  userId?: string;
  agenceId?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  onClose, 
  userLogo, 
  userIsAdmin, 
  userCoef,
  userId,
  agenceId 
}) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const [zoom, setZoom] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Galerie agrégée: images des variations + galeries supplémentaires (centre_photos)
  const aggregatedGallery = useMemo(() => {
    if (!product) return [] as string[];
    const seen = new Set<string>();
    const imgs: string[] = [];
    for (const v of product.variations) {
      if (v.img && !seen.has(v.img)) {
        seen.add(v.img);
        imgs.push(v.img);
      }
      if (Array.isArray(v.gallery)) {
        for (const g of v.gallery) {
          if (g && !seen.has(g)) {
            seen.add(g);
            imgs.push(g);
          }
        }
      }
    }
    return imgs;
  }, [product]);

  useEffect(() => {
    if (product) {
      const first = aggregatedGallery[0] || product.thumbnail || '';
      setActiveImage(first);
      setZoom(false);
    }
  }, [product, aggregatedGallery]);

  const uniqueVariationImages = useMemo(() => {
    if (!product) return [] as { src: string; label: string }[];
    const seen = new Set<string>();
    const imgs: { src: string; label: string }[] = [];
    // Pour chaque déclinaison, on ajoute d'abord l'image principale puis sa galerie
    for (const v of product.variations) {
      // 1) Image principale de la variation
      const src = v.img;
      if (src && !seen.has(src)) {
        seen.add(src);
        imgs.push({ src, label: v.label });
      }
      // 2) Galerie de cette variation (centre_photos)
      if (Array.isArray(v.gallery)) {
        for (const g of v.gallery) {
          if (g && !seen.has(g)) {
            seen.add(g);
            imgs.push({ src: g, label: v.label });
          }
        }
      }
    }
    return imgs;
  }, [product]);

  const handlePrint = async () => {
    if (!product) return;
    
    const pdf = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const startY = 25;
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);

    // Helper: charge une image en dataURL avec la hauteur cible (pour éviter CORS/taint)
    const loadImageData = async (
      src: string,
      targetHeight: number,
      format: 'JPEG' | 'PNG'
    ): Promise<{ dataUrl: string; width: number; height: number } | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const ratio = img.width / img.height;
            const targetWidth = targetHeight * ratio;
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            // Fond blanc pour éviter le noir transparent
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mime, 0.95);
            resolve({ dataUrl, width: targetWidth, height: targetHeight });
          } catch (e) {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const returnXPos = (imgWidth: number): number => {
      return (pageWidth - imgWidth) / 2;
    };

    // Cache des images pour éviter re-chargement à chaque page
    let logoDataUrl: string | null = null;
    let logoWidth = 0;
    let prodImgDataUrl: string | null = null;
    let prodImgWidth = 0;

    // 1. Image du produit - convertie en dataURL
    if (product.thumbnail) {
      const result = await loadImageData(product.thumbnail, 45, 'JPEG');
      if (result) {
        prodImgDataUrl = result.dataUrl;
        prodImgWidth = result.width;
      }
    }

    // 2. Logo - converti en dataURL
    if (userLogo) {
      try {
        const logoUrl = userLogo.startsWith('http') ? userLogo : `https://atcjoaillerie.com/imgs/logo/${userLogo}`;
        const result = await loadImageData(logoUrl, 15, 'PNG');
        if (result) {
          logoDataUrl = result.dataUrl;
          logoWidth = result.width;
        }
      } catch (e) {
        console.error('Error loading logo:', e);
      }
    }

    // Fonction pour dessiner l'en-tête de page (logo, image, ref)
    const drawPageHeader = () => {
      let currentY = 10;
      
      // Logo - centré
      if (logoDataUrl) {
        const logoX = (pageWidth - logoWidth) / 2;
        pdf.addImage(logoDataUrl, 'PNG', logoX, currentY, logoWidth, 15);
        currentY += 20;
      }
      
      // Image produit - centrée
      if (prodImgDataUrl) {
        const imgX = (pageWidth - prodImgWidth) / 2;
        pdf.addImage(prodImgDataUrl, 'JPEG', imgX, currentY, prodImgWidth, 45);
        currentY += 48;
      }
      
      // Ligne du produit - centrée
      pdf.setFont('times', 'normal');
      pdf.setFontSize(14);
      pdf.text(product.line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
      
      // Référence - centrée
      let refText = product.ref;
      if (agenceId === '496' && !userIsAdmin) {
        refText = `${Math.floor(Math.random() * 10)}${product.ref}${Math.floor(Math.random() * 10)}`;
      }
      pdf.text(refText, pageWidth / 2, currentY, { align: 'center' });
    };

    // Variables pour le tableau - centrage
    const tailleDefaut = '';
    // Calcul de la largeur du tableau selon le rôle utilisateur
    let tableWidth = 130; // Admin et users réguliers
    if (userId === '143') tableWidth = 130; // User 143 (1 colonne)
    else if (userIsAdmin) tableWidth = 130; // Admin (3 colonnes)
    else tableWidth = 130; // Regular users (2 colonnes)
    
    const startX = (pageWidth - tableWidth) / 2;
    let currentX = startX;
    let currentY = startY + 55;

    // Fonction pour imprimer une cellule (mimique FPDF Cell())
    const cell = (x: number, y: number, w: number, h: number, text: string, border: number, ln: number, align: string): number => {
      // Dessiner la bordure
      pdf.setDrawColor(204, 204, 204);
      if (border === 1) {
        pdf.rect(x, y, w, h);
      }
      
      let textX = x + 2;
      let textAlign: 'left' | 'center' | 'right' = 'left';
      
      if (align === 'C') {
        textX = x + w / 2;
        textAlign = 'center';
      } else if (align === 'R') {
        textX = x + w - 2;
        textAlign = 'right';
      }
      
      const textY = y + h / 2 + 1.5;
      pdf.text(text, textX, textY, { align: textAlign });
      
      if (ln === 1) {
        return startX;
      } else {
        return x + w;
      }
    };

    // En-tête de la première page
    drawPageHeader();

    const drawHeader = () => {
      pdf.setFont('times', 'normal');
      pdf.setFontSize(14);
      currentX = startX;
      if (userIsAdmin) {
        currentX = cell(currentX, currentY, 80, 7, `Désignation${tailleDefaut}`, 1, 0, 'L');
        currentX = cell(currentX, currentY, 25, 7, 'Prix', 1, 0, 'C');
        cell(currentX, currentY, 25, 7, 'Prix Vente', 1, 1, 'C');
      } else if (userId === '143') {
        cell(currentX, currentY, 130, 7, `Désignation${tailleDefaut}`, 1, 1, 'C');
      } else {
        currentX = cell(currentX, currentY, 100, 7, `Désignation${tailleDefaut}`, 1, 0, 'L');
        cell(currentX, currentY, 30, 7, 'Prix TTC', 1, 1, 'C');
      }
    };

    // En-tête initial
    drawHeader();

    // 7. Lignes du tableau - PHP: for loop avec $pdf->SetX(40)
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    
    for (const variation of product.variations) {
      const footerSpace = 40; // espace pour footer
      if (currentY + 7 > pageHeight - footerSpace) {
        pdf.addPage();
        drawPageHeader();
        currentY = startY + 55;
        drawHeader();
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
      }

      currentY += 7;
      currentX = startX;
      
      let coefPrix = userCoef;
      if (variation.id_cv === 1026 || variation.id_cv === 666) {
        if (variation.prix >= 2600) coefPrix = 2.4;
        if (variation.prix >= 6600) coefPrix = 2.2;
      }
      const labelPrix = Math.ceil((variation.prix * coefPrix) / 10) * 10;
      const designation = variation.label || variation.description || '';

      if (userIsAdmin) {
        currentX = cell(currentX, currentY, 80, 7, designation, 1, 0, 'L');
        currentX = cell(currentX, currentY, 25, 7, variation.prix.toString(), 1, 0, 'C');
        cell(currentX, currentY, 25, 7, `${Math.floor(labelPrix)} €`, 1, 1, 'C');
      } else if (userId === '143') {
        cell(currentX, currentY, 130, 7, designation, 1, 1, 'C');
      } else {
        currentX = cell(currentX, currentY, 100, 7, designation, 1, 0, 'L');
        cell(currentX, currentY, 30, 7, `${Math.floor(labelPrix)} €`, 1, 1, 'C');
      }
    }

    // 8. Footer - PHP: $pdf->SetY(-34)
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.text(`Édité le : ${today}`, pageWidth / 2, pageHeight - 34, { align: 'center' });
    
    if (userId !== '143') {
      pdf.setFontSize(14);
      pdf.text('Les prix sont donnés à titre indicatif et doivent être confirmés.', pageWidth / 2, pageHeight - 28, { align: 'center' });
    }

    // 9. Télécharger et afficher le PDF (équivalent de Output('I'))
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    // Format du nom: Tarifs_{ref}_au_{date}.pdf
    const fileName = `Tarifs_${product.ref}_au_${today}.pdf`;
    
    // Créer un élément <a> pour télécharger et ouvrir dans nouvel onglet
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Ouvrir aussi dans un nouvel onglet après un délai
    setTimeout(() => window.open(url, '_blank'), 100);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom || !imgRef.current) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    imgRef.current.style.transformOrigin = `${x}% ${y}%`;
  };

  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Screen view (hidden in print) */}
      <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl relative flex flex-col md:flex-row print:hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
        >
          <X size={24} className="text-slate-800" />
        </button>

        {/* --- LEFT: Image Gallery --- */}
        <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col items-center justify-center">
            <div 
              className="relative w-full aspect-square max-w-md overflow-hidden cursor-zoom-in rounded-lg shadow-sm"
              onClick={() => setZoom(!zoom)}
              onMouseMove={handleImageMouseMove}
              onMouseLeave={() => setZoom(false)}
            >
              <img 
                ref={imgRef}
                src={activeImage} 
                alt={product.ref} 
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-contain transition-transform duration-200 ${zoom ? 'scale-[2.5]' : 'scale-100'}`}
              />
              <div className="absolute bottom-2 right-2 bg-white/70 p-1 rounded text-xs text-slate-500 flex items-center gap-1 pointer-events-none">
                <ZoomIn size={14}/> {zoom ? 'Click to out' : 'Click to zoom'}
              </div>
            </div>

            {/* Thumbnails: images des déclinaisons + centre_photos */}
            <div className={`grid gap-2 mt-4 w-full px-2 py-2 ${uniqueVariationImages.length > 4 ? 'grid-cols-4' : 'grid-cols-' + (uniqueVariationImages.length || 1)}`}>
              {uniqueVariationImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img.src)}
                  className={`w-16 h-16 border-2 rounded overflow-hidden transition-colors ${activeImage === img.src ? 'border-gold-500' : 'border-transparent'}`}
                >
                  <img src={img.src} className="w-full h-full object-cover" alt={product.ref} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
        </div>

        {/* --- RIGHT: Details & Table (screen) --- */}
        <div className="w-full md:w-1/2 p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-sm uppercase tracking-widest text-gold-600 mb-1 font-bold">{product.line}</h2>
            <h1 className="text-4xl font-serif text-slate-900 mb-2">{product.category} <span className="text-slate-400 font-light">#{product.ref}</span></h1>
            <p className="text-slate-500 text-sm italic">Découvrez les déclinaisons de ce modèle d'exception.</p>
          </div>

          {/* Action Bar */}
          <div className="flex gap-3 mb-6">
            <Button onClick={handlePrint} variant="secondary" className="flex items-center gap-2">
              <Printer size={16} /> Télécharger PDF
            </Button>
          </div>

          {/* Variations Table */}
          <div className="overflow-x-auto flex-1 border border-slate-100 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gold-50 text-gold-800 border-b border-gold-100">
                <tr>
                  <th className="p-3 font-semibold">Label</th>
                  <th className="p-3 font-semibold hidden sm:table-cell">Détails</th>
                  {userIsAdmin && <th className="p-3 font-semibold text-right">Prix achat</th>}
                  <th className="p-3 font-semibold text-right">Prix vente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {product.variations.map((v, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setActiveImage(v.img)}
                  >
                    <td className="p-3 font-medium text-slate-700">
                      {v.label}
                    </td>
                    <td className="p-3 text-slate-600 hidden sm:table-cell">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {v.resolvedShape}
                      </span>
                    </td>
                    {userIsAdmin && (
                      <td className="p-3 text-right text-slate-700">
                        {Number(v.prix || 0).toLocaleString('fr-FR')} €
                      </td>
                    )}
                    <td className="p-3 text-right font-bold text-slate-900">
                      {(Number(v.prix || 0) * (userCoef || 1)).toLocaleString('fr-FR')} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500 flex items-start gap-2">
             <Info size={16} className="shrink-0 mt-0.5" />
             <p>Cliquez sur une ligne pour voir l'image correspondante. Utilisez le bouton "Imprimer" pour générer une fiche produit client.</p>
          </div>

        </div>
      </div>

      {/* Print-only minimal template */}
      <div id="print-area" className="hidden print:block bg-white w-full max-w-[210mm] mx-auto text-slate-900">
        <div className="flex flex-col items-center text-center mb-6">
          {userLogo && <img src={userLogo} alt="Logo" style={{ maxHeight: '40mm', width: 'auto' }} />}
          <h1 className="mt-2 text-2xl font-bold font-serif">Référence : {product.ref}</h1>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Désignation</th>
              {userIsAdmin && <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Prix achat</th>}
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Prix vente</th>
            </tr>
          </thead>
          <tbody>
            {product.variations.map((v, i) => {
              const achat = Number(v.prix || 0);
              const vente = achat * (userCoef || 1);
              return (
                <tr key={i}>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{v.label || v.ref}</td>
                  {userIsAdmin && <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{achat.toLocaleString('fr-FR')} €</td>}
                  <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{vente.toLocaleString('fr-FR')} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '12mm', textAlign: 'center', fontSize: '10pt' }}>
          <span>{new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    </div>
  );
};