<?php
/**
 * login.php
 * Gère l'authentification et les logs utilisateurs
 * 
 * Actions:
 * - ?action=login   → POST { user, password } → retourne user data
 * - ?action=log     → POST { id_user } → crée log entry, retourne insertId
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Centralized database connection
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    // POST /login.php?action=login
    // Body: { user: string, password: string }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $data['user'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($user) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing user or password']);
        exit();
    }

    // Query Core_users table with JOIN to Agences for logo
    $stmt = $mysqli->prepare("SELECT 
            Core_users.*,
            Agences.logo, Agences.coef
        FROM Core_users 
        JOIN Agences ON Agences.Num_agence = Core_users.Num_agence 
        WHERE userLogin = ? 
        AND MD5(userPassword) = ?");
    $stmt->bind_param('ss', $user, $password);
    $stmt->execute();
    $queryResult = $stmt->get_result();
    
    if ($queryResult->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit();
    }
    
    $userData = $queryResult->fetch_assoc();
        // Build logo URL from extensia-france.com
        $logoUrl = 'https://via.placeholder.com/200/667eea/ffffff?text=' . urlencode($userData['Nom']);
        if (!empty($userData['logo'])) {
            $logoUrl = 'https://extensia-france.com/imgs/logo/' . $userData['logo'];
        }
    
    
    // Return user data (format compatible with frontend)
    $result = [[
        'id' => $userData['id_user'],
        'username' => $userData['userLogin'],
        'Nom_agence' => $userData['Nom'] . ' ' . $userData['Prenom'],
        'logo' => $logoUrl,
        'email' => $userData['Email'],
        'groupe' => $userData['groupe'],
        'role' => $userData['role'],
        'coef' => $userData['coef'],
        'admin' => $userData['admin'],
        'agenceId' => $userData['Num_agence']
    ]];

    echo json_encode($result);
    $stmt->close();
    exit();

} elseif ($action === 'saveLog') {
    // POST /login.php?action=saveLog
    // Body: { id_user: int }
    $data = json_decode(file_get_contents('php://input'), true);
    $id_user = isset($data['id_user']) ? intval($data['id_user']) : 0;

    if ($id_user === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID utilisateur invalide']);
        exit();
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $stmt = $mysqli->prepare("INSERT INTO log (user_id, ip) VALUES (?, ?)");
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['error' => 'DB prepare failed']);
        exit();
    }
    $stmt->bind_param('is', $id_user, $ip);
    $ok = $stmt->execute();
    if ($ok) {
        echo json_encode(['insertId' => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'insertion']);
    }
    $stmt->close();
    exit();

} elseif ($action === 'logProduct') {
    // POST /login.php?action=logProduct
    // Body: { ref: string, id_user: int }
    $data = json_decode(file_get_contents('php://input'), true);
    $ref = $data['ref'] ?? '';
    $id_user = isset($data['id_user']) ? intval($data['id_user']) : 0;

    if ($id_user === 0 || empty($ref)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ref or id_user']);
        exit();
    }

    $stmt = $mysqli->prepare("INSERT INTO log_produit (ref, id_user) VALUES (?, ?)");
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(['error' => 'DB prepare failed']);
        exit();
    }
    $stmt->bind_param('si', $ref, $id_user);
    $ok = $stmt->execute();
    if ($ok) {
        echo json_encode(['insertId' => $stmt->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'insertion']);
    }
    $stmt->close();
    exit();

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown action']);
    exit();
}

$mysqli->close();
?>
