<?php
// Admin configuration
define('ADMIN_PASSWORD', 'midas_admin123');

// Auto-detect project root — works whether admin/ is run from source or dist/admin/
$scriptDir = dirname(__FILE__);
$root = dirname($scriptDir);
if (basename($root) === 'dist') {
    $root = dirname($root);
}
$root = rtrim($root, DIRECTORY_SEPARATOR);
define('ABS_ROOT', $root);

// JSON data files
define('JOBS_FILE',    ABS_ROOT . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'jobs.json');
define('EVENTS_FILE',  ABS_ROOT . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'events.json');
define('CLIENTS_FILE', ABS_ROOT . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'clients.json');

// ── PHP upload limit override ──────────────────────────────────────────────
// NOTE: upload_max_filesize and post_max_size are PHP_INI_PERDIR — they CANNOT
// be changed at runtime via ini_set(). They must be set in php.ini (or .htaccess
// for Apache). On macOS with php -S, use start-server.sh which passes -c php.ini.
// These ini_set calls below only work for memory_limit and execution time.
@ini_set('memory_limit',       '256M');
@ini_set('max_execution_time', '120');

/**
 * Converts a PHP ini size string (e.g. "2M", "512K") to bytes.
 */
function php_size_to_bytes($val) {
    $val  = trim($val);
    $last = strtolower(substr($val, -1));
    $num  = (int)$val;
    switch ($last) {
        case 'g': $num *= 1024;
        case 'm': $num *= 1024;
        case 'k': $num *= 1024;
    }
    return $num;
}

/**
 * Saves JSON to source file and syncs to dist/ if it exists.
 */
function save_json($file, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        debug_log("JSON encode error: " . json_last_error_msg());
        return false;
    }

    $dir = dirname($file);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0775, true)) {
            debug_log("Cannot create data directory: $dir");
            return false;
        }
    }

    $res = file_put_contents($file, $json, LOCK_EX);
    if ($res === false) {
        debug_log("WRITE FAILED: $file — run: chmod 775 " . dirname($file));
        return false;
    }
    debug_log("Saved JSON ($res bytes) → $file");

    // Sync to dist/
    $distFile = str_replace(
        ABS_ROOT . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR,
        ABS_ROOT . DIRECTORY_SEPARATOR . 'dist'   . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR,
        $file
    );
    if ($distFile !== $file && is_dir(ABS_ROOT . DIRECTORY_SEPARATOR . 'dist')) {
        $distDir = dirname($distFile);
        if (!is_dir($distDir)) @mkdir($distDir, 0775, true);
        if (@file_put_contents($distFile, $json, LOCK_EX) !== false) {
            debug_log("Synced JSON → $distFile");
        } else {
            debug_log("WARNING: could not sync JSON to dist: $distFile");
        }
    }
    return true;
}

/**
 * Resolves a root-relative path (/assets/...) to absolute filesystem path.
 */
function resolve_path($relPath) {
    return ABS_ROOT . DIRECTORY_SEPARATOR . ltrim($relPath, '/\\');
}

/**
 * Ensures directory exists in both source and dist/.
 */
function ensure_dir($relPath) {
    $clean = ltrim($relPath, '/\\');

    $srcDir = ABS_ROOT . DIRECTORY_SEPARATOR . $clean;
    if (!is_dir($srcDir)) {
        if (mkdir($srcDir, 0775, true)) {
            debug_log("Created: $srcDir");
        } else {
            debug_log("FAILED to create: $srcDir — check parent permissions");
        }
    }

    $distBase = ABS_ROOT . DIRECTORY_SEPARATOR . 'dist';
    if (is_dir($distBase)) {
        $distDir = $distBase . DIRECTORY_SEPARATOR . $clean;
        if (!is_dir($distDir)) {
            @mkdir($distDir, 0775, true);
        }
    }
}

/**
 * Copies a file from source to dist/.
 */
function sync_file($relPath) {
    $clean = ltrim($relPath, '/\\');
    $src   = ABS_ROOT . DIRECTORY_SEPARATOR . $clean;
    $dist  = ABS_ROOT . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . $clean;

    if (!file_exists($src)) {
        debug_log("sync_file: source not found: $src");
        return;
    }
    if (!is_dir(ABS_ROOT . DIRECTORY_SEPARATOR . 'dist')) {
        debug_log("sync_file: dist folder absent, skipping");
        return;
    }
    $distDir = dirname($dist);
    if (!is_dir($distDir)) @mkdir($distDir, 0775, true);

    if (copy($src, $dist)) {
        debug_log("Synced → $dist");
    } else {
        debug_log("WARNING: sync_file failed: $src → $dist");
    }
}

/**
 * Deletes a file from source and dist/.
 */
function delete_file($relPath) {
    $clean = ltrim($relPath, '/\\');
    $src   = ABS_ROOT . DIRECTORY_SEPARATOR . $clean;
    $dist  = ABS_ROOT . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . $clean;

    $deleted = false;

    if (file_exists($src)) {
        if (unlink($src)) {
            debug_log("Deleted: $src");
            $deleted = true;
        } else {
            debug_log("DELETE FAILED (permission?): $src");
        }
    } else {
        debug_log("delete_file: not found at source: $src");
    }

    if (file_exists($dist)) {
        if (unlink($dist)) {
            debug_log("Deleted dist: $dist");
            $deleted = true;
        } else {
            debug_log("DELETE FAILED dist: $dist");
        }
    }
    return $deleted;
}

/**
 * Debug logger.
 */
function debug_log($message) {
    $logFile = ABS_ROOT . DIRECTORY_SEPARATOR . 'admin' . DIRECTORY_SEPARATOR . 'debug.log';
    @file_put_contents($logFile, '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL, FILE_APPEND | LOCK_EX);
}

/**
 * Dumps key environment info to debug.log.
 * Called once per request from event-edit.php.
 */
function debug_env() {
    $uploadLimit = ini_get('upload_max_filesize');
    $postLimit   = ini_get('post_max_size');
    $limitLow    = php_size_to_bytes($uploadLimit) < 5 * 1024 * 1024;

    debug_log("=== ENV DUMP ===");
    debug_log("ABS_ROOT             : " . ABS_ROOT);
    debug_log("EVENTS_FILE          : " . EVENTS_FILE . " [readable=" . (is_readable(EVENTS_FILE) ? 'YES' : 'NO') . " writable=" . (is_writable(EVENTS_FILE) ? 'YES' : 'NO') . "]");
    debug_log("CLIENTS_FILE         : " . CLIENTS_FILE . " [readable=" . (is_readable(CLIENTS_FILE) ? 'YES' : 'YES') . " writable=" . (is_writable(CLIENTS_FILE) ? 'YES' : 'NO') . "]");
    debug_log("PHP version          : " . PHP_VERSION);
    debug_log("SAPI                 : " . PHP_SAPI . ($limitLow && PHP_SAPI === 'cli-server' ? ' ← macOS php -S detected' : ''));
    debug_log("upload_max_filesize  : $uploadLimit" . ($limitLow ? " ← TOO LOW — start server with start-server.sh" : " ✓"));
    debug_log("post_max_size        : $postLimit");
    debug_log("GD webp support      : " . (function_exists('imagewebp') ? 'YES ✓' : 'NO — brew install php or recompile with --with-webp'));
    debug_log("assets/images dir    : " . ABS_ROOT . "/assets/images [writable=" . (is_writable(ABS_ROOT . '/assets/images') ? 'YES' : 'NO — run: chmod -R 775 assets/images') . "]");
    debug_log("=== END ENV ===");
}
?>
