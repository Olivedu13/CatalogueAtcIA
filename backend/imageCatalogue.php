<?php
/**
 * imageCatalogue.php
 * Retourne la liste des produits pour le catalogue
 * 
 * Response: JSON array of products with shapes and types
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Centralized database connection
require_once __DIR__ . '/db.php';

// Base URL for images
$IMG_BASE = 'https://extensia-france.com/imgs';

try {
    // Main query to get products
    $query = "SELECT 
        centre_vide.ref,
        centre.id_centre, 
        centre.ref AS label, 
        produit.total3 AS prix,
        type_produit.description,
        type_produit.id_typ_prod,
        centre_vide.prenom_ligne,
        centre_vide.nom_ligne,  
        centre_vide.image AS img_cv,
        IF(centre.img_centre='no_pic.jpg', centre_vide.image, centre.img_centre) AS img,
        centre_vide.id_cv,
        GROUP_CONCAT(DISTINCT IF(fp.id_form IS NOT NULL, fp.id_form, '') SEPARATOR ',') AS formes,
        GROUP_CONCAT(DISTINCT IF(tp.id_typ_pier IS NOT NULL, tp.id_typ_pier, '') SEPARATOR ',') AS types,
        (
            SELECT GROUP_CONCAT(photos.img_nom SEPARATOR ',')
            FROM centre_photos photos
            WHERE photos.id_centre = centre.id_centre
            ORDER BY photos.ordre ASC
        ) AS galerie_extra_str
    FROM centre_vide
    INNER JOIN centre ON centre_vide.id_cv = centre.id_cv
    INNER JOIN produit ON centre.id_centre = produit.id_centre
    INNER JOIN type_produit ON centre_vide.type_prod = type_produit.id_typ_prod
    LEFT JOIN centre_pierres cp ON centre.id_centre = cp.id_centre AND cp.centre = 1
    LEFT JOIN tarifs t ON cp.id_pierre = t.id_tarif
    LEFT JOIN pierre p ON t.id_pier = p.id_pier
    LEFT JOIN forme_pier fp ON p.forme = fp.id_form
    LEFT JOIN type_pier tp ON p.type_pier = tp.id_typ_pier
    WHERE centre.is_used = 1
        AND IF(centre.img_centre='no_pic.jpg', centre_vide.image, centre.img_centre) != 'no_pic.jpg'  
        AND centre_vide.photo_ok = 1
    GROUP BY centre_vide.ref, centre.id_centre, centre.ref, produit.total3, type_produit.description, 
             type_produit.id_typ_prod, centre_vide.prenom_ligne, centre_vide.nom_ligne, 
             centre_vide.image, centre_vide.id_cv, img
    ORDER BY centre_vide.ref DESC, produit.total3 ASC";

    $result = $mysqli->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $mysqli->error);
    }
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        // Build gallery array
        $gallery = [];
        
        // Add main image first
        if (!empty($row['img'])) {
            $gallery[] = $row['img'];
        }
        
        // Add extra gallery images
        if (!empty($row['galerie_extra_str'])) {
            $extras = explode(',', $row['galerie_extra_str']);
            $gallery = array_merge($gallery, array_filter($extras));
        }
        
        // Format product data
        $product = [
            'ref' => $row['ref'],
            'id_centre' => $row['id_centre'],
            'label' => $row['label'] ?? $row['ref'],
            'prix' => floatval($row['prix'] ?? 0),
            'description' => $row['description'] ?? '',
            'img' => $row['img'],
            'gallery' => $gallery,
            'formes' => !empty($row['formes']) ? array_filter(explode(',', $row['formes'])) : [],
            'types' => !empty($row['types']) ? array_filter(explode(',', $row['types'])) : [],
            'id_typ_prod' => $row['id_typ_prod'],
            'prenom_ligne' => $row['prenom_ligne'] ?? '',
            'nom_ligne' => $row['nom_ligne'] ?? '',
            'variations' => []
        ];
        
        $products[] = $product;
    }
    
    // Get shapes lookup (formes)
    $shapesQuery = "SELECT DISTINCT id_form AS id, description AS name FROM forme_pier WHERE id_form IS NOT NULL ORDER BY description";
    $shapesResult = $mysqli->query($shapesQuery);
    $shapes = [];
    if ($shapesResult) {
        while ($row = $shapesResult->fetch_assoc()) {
            $shapes[] = ['id' => intval($row['id']), 'name' => $row['name']];
        }
    }
    
    // Get types lookup (types de pierres)
    $typesQuery = "SELECT DISTINCT id_typ_pier AS id, description AS name FROM type_pier ORDER BY description";
    $typesResult = $mysqli->query($typesQuery);
    $types = [];
    if ($typesResult) {
        while ($row = $typesResult->fetch_assoc()) {
            $types[] = ['id' => intval($row['id']), 'name' => $row['name']];
        }
    }
    
    // Response format
    $response = [
        'products' => $products,
        'shapes' => $shapes,
        'types' => $types,
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

$mysqli->close();
