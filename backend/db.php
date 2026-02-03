<?php
/**
 * db.php
 * Centralize database connection
 * 
 * Usage:
 *   require_once __DIR__ . '/db.php';
 *   // $mysqli is now available
 */

// Database credentials (hardcoded for production - from .env.local)
define('DB_HOST', 'db764389948.hosting-data.io');
define('DB_USER', 'dbo764389948');
define('DB_PASS', 'Atc13001!');
define('DB_NAME', 'db764389948');
define('DB_PORT', 3306);

// Connect to database - essayer mysqli d'abord (plus performant)
try {
    // Vérifier si mysqli est disponible
    if (extension_loaded('mysqli')) {
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
        
        if ($mysqli->connect_error) {
            throw new Exception("mysqli failed: " . $mysqli->connect_error);
        }
        
        // Set charset to utf8mb4
        if (!$mysqli->set_charset('utf8mb4')) {
            throw new Exception("Error loading character set utf8mb4: " . $mysqli->error);
        }
    }
    // Fallback sur PDO si mysqli n'est pas disponible
    elseif (extension_loaded('PDO')) {
        $mysqli = new PDO(
            "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS
        );
        $mysqli->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    else {
        throw new Exception("Aucune extension de base de données disponible (mysqli ou PDO mysql requise)");
    }
    
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

/**
 * Helper function: Execute prepared statement
 * @param string $query SQL query with ? placeholders
 * @param string $types Parameter types (e.g., "ss" for two strings)
 * @param array $params Parameter values
 * @return mysqli_result|false
 */
function execute_query($query, $types, $params = []) {
    global $mysqli;
    
    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $mysqli->error);
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    return $stmt->get_result();
}

/**
 * Helper function: Get insert ID
 * @return int Last inserted ID
 */
function get_insert_id() {
    global $mysqli;
    return $mysqli->insert_id;
}

?>
