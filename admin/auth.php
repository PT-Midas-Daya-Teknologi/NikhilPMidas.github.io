<?php
session_start();
require_once 'config.php';

function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function checkAuth() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}
?>
