<?php
require_once 'auth.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    
    if ($password === ADMIN_PASSWORD) {
        $_SESSION['logged_in'] = true;
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Invalid password.';
    }
}

if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Midas Teknologi</title>
    <link rel="stylesheet" href="./assets/css/bootstrap.css">
    <style>
        body { background: #f8f9fa; display: flex; align-items: center; height: 100vh; }
        .login-card { max-width: 400px; margin: auto; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background: #fff; }
        .btn-primary { background-color: #ff6a00; border-color: #ff6a00; }
        .btn-primary:hover { background-color: #e55f00; border-color: #e55f00; }
    </style>
</head>
<body>
    <div class="login-card w-100">
        <div class="text-center mb-4">
            <img src="./assets/images/logo.webp" alt="Midas Logo" width="150">
            <h4 class="mt-3">Admin Login</h4>
        </div>
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo $error; ?></div>
        <?php endif; ?>
        <form method="POST">
            <div class="form-group mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" name="password" id="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
        </form>
    </div>
</body>
</html>
