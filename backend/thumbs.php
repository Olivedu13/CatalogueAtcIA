<?php
/**
 * thumbs.php
 * Service de génération de miniatures avec cache et ETag
 * 
 * GET /thumbs.php?image=<filename>&size=<pixels>
 * Response: Image optimisée ou 404
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$image = $_GET['image'] ?? '';
$size = (int)($_GET['size'] ?? 500);

// Sécurité: éviter directory traversal
$image = basename($image);
if (empty($image)) {
    http_response_code(404);
    echo 'Image not specified';
    exit();
}

// URL de base pour récupérer les images depuis extensia-france.com (encodage pour espaces)
$img_base_url = 'https://extensia-france.com/imgs';
$encoded_image = rawurlencode($image);
$source_url = $img_base_url . '/' . $encoded_image;

// Répertoire de cache local
$cache_dir = __DIR__ . '/../imgs_cache';

// Créer cache dir si inexistant
if (!is_dir($cache_dir)) {
    mkdir($cache_dir, 0755, true);
}

// Générer le nom du fichier cache
$cache_filename = md5($image . '_' . $size) . '.' . pathinfo($image, PATHINFO_EXTENSION);
$cache_path = $cache_dir . '/' . $cache_filename;

// ETag basé sur l'URL et le size
$etag = md5($source_url . '_' . $size);

// Vérifier ETag depuis le client
if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
    http_response_code(304); // Not Modified
    exit();
}

// Si cache existe, le servir directement
if (file_exists($cache_path)) {
    header('Content-Type: ' . mime_content_type($cache_path));
    header('ETag: ' . $etag);
    header('Cache-Control: max-age=86400, public'); // 1 jour
    header('Content-Length: ' . filesize($cache_path));
    readfile($cache_path);
    exit();
}

// Télécharger l'image depuis extensia-france.com
$temp_path = $cache_dir . '/temp_' . $cache_filename;
$image_data = @file_get_contents($source_url);

if ($image_data === false) {
    http_response_code(404);
    echo 'Image not found on remote server';
    exit();
}

file_put_contents($temp_path, $image_data);

// Créer miniature avec GD
$img_info = getimagesize($temp_path);
if ($img_info === false) {
    unlink($temp_path);
    http_response_code(500);
    echo 'Invalid image format';
    exit();
}

// Si l'extension GD n'est pas dispo, on renvoie l'image originale en cache sans redimensionnement
if (!extension_loaded('gd')) {
    rename($temp_path, $cache_path);
    header('Content-Type: ' . $img_info['mime']);
    header('ETag: ' . $etag);
    header('Cache-Control: max-age=86400, public');
    header('Content-Length: ' . filesize($cache_path));
    readfile($cache_path);
    exit();
}

// Créer image source selon le type
switch ($img_info[2]) {
    case IMAGETYPE_JPEG:
        $source_img = imagecreatefromjpeg($temp_path);
        break;
    case IMAGETYPE_PNG:
        $source_img = imagecreatefrompng($temp_path);
        break;
    case IMAGETYPE_GIF:
        $source_img = imagecreatefromgif($temp_path);
        break;
    default:
        // Type non supporté: renvoyer l'original sans resize
        rename($temp_path, $cache_path);
        header('Content-Type: ' . $img_info['mime']);
        header('ETag: ' . $etag);
        header('Cache-Control: max-age=86400, public');
        header('Content-Length: ' . filesize($cache_path));
        readfile($cache_path);
        exit();
}

$orig_width = imagesx($source_img);
$orig_height = imagesy($source_img);

// Calculer dimensions
$ratio = $orig_width / $orig_height;
if ($orig_width > $orig_height) {
    $new_width = min($size, $orig_width);
    $new_height = (int)($new_width / $ratio);
} else {
    $new_height = min($size, $orig_height);
    $new_width = (int)($new_height * $ratio);
}

// Créer image redimensionnée
$resized = imagecreatetruecolor($new_width, $new_height);

// Préserver transparence PNG
if ($img_info[2] == IMAGETYPE_PNG) {
    imagealphablending($resized, false);
    imagesavealpha($resized, true);
}

imagecopyresampled($resized, $source_img, 0, 0, 0, 0, $new_width, $new_height, $orig_width, $orig_height);

// Sauvegarder dans le cache
switch ($img_info[2]) {
    case IMAGETYPE_JPEG:
        imagejpeg($resized, $cache_path, 85);
        break;
    case IMAGETYPE_PNG:
        imagepng($resized, $cache_path, 8);
        break;
    case IMAGETYPE_GIF:
        imagegif($resized, $cache_path);
        break;
}

imagedestroy($source_img);
imagedestroy($resized);
unlink($temp_path);

// Servir l'image
header('Content-Type: ' . mime_content_type($cache_path));
header('ETag: ' . $etag);
header('Cache-Control: max-age=86400, public');
header('Content-Length: ' . filesize($cache_path));
readfile($cache_path);
?>
