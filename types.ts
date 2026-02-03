export interface User {
  id: string;
  username: string;
  logoUrl: string;
  companyName: string;
  admin?: number;
  coef?: number;
  agenceId?: string;
}

// Corresponds to 'forme_pier' table
export interface StoneShape {
  id: number;
  description: string;
  typ_dim: number;
}

// Corresponds to 'type_pier' table
export interface StoneType {
  id: number;
  description: string;
}

// Raw JSON item from the backend query
export interface RawProductItem {
  ref: string;
  id_centre: number;
  label: string;
  prix: number;
  description: string; // Type of product (BAGUE, etc.)
  id_typ_prod: number;
  prenom_ligne: string;
  nom_ligne: string;
  img_cv: string;
  img: string;
  id_cv: number;
  formes: number[] | string; // Array or CSV string "1016,1005"
  types: number[] | string; // Array or CSV string "1003,1009"
  gallery: string[];
  id_typ_pier?: number; 
}

// For the frontend, we group variations under a single Model
export interface ProductModel {
  ref: string;
  category: string; // derived from description
  line: string; // derived from prenom_ligne
  thumbnail: string;
  minPrice: number;
  maxPrice: number;
  variations: ProductVariation[];
  
  // Aggregated metadata for filtering
  availableShapeIds: number[];
  availableTypeIds: number[];
}

export interface ProductVariation extends RawProductItem {
  resolvedShape?: string;
  resolvedType?: string;
}

export interface FilterState {
  reference: string | null;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  shapeIds: number[];
  stoneTypeIds: number[];
  line: string | null;
}