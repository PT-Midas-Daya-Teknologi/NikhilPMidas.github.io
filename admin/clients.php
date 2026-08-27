<?php
require_once 'auth.php';
checkAuth();

function convertToWebP_withSVG($srcPath, $destPath, $ext) {
    if ($ext === 'svg') {
        $srcEsc = escapeshellarg($srcPath);
        $dstEsc = escapeshellarg($destPath);
        $nodeScript = "const sharp = require('sharp'); sharp($srcEsc).webp({quality: 90}).toFile($dstEsc).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });";
        $cmd = "node -e " . escapeshellarg($nodeScript) . " 2>&1";
        exec($cmd, $output, $code);
        if ($code !== 0) {
            debug_log("SVG to WebP conversion failed: " . implode("\n", $output));
            return false;
        }
        return true;
    }

    if (!extension_loaded('gd')) { debug_log("GD not loaded"); return false; }
    $info = @getimagesize($srcPath);
    if (!$info) { debug_log("getimagesize failed: $srcPath"); return false; }
    switch ($info['mime']) {
        case 'image/jpeg': $img = @imagecreatefromjpeg($srcPath); break;
        case 'image/gif':  $img = @imagecreatefromgif($srcPath);  break;
        case 'image/png':  $img = @imagecreatefrompng($srcPath);  break;
        case 'image/webp': $img = @imagecreatefromwebp($srcPath); break;
        default: debug_log("Unsupported mime: " . $info['mime']); return false;
    }
    if (!$img) { debug_log("imagecreatefrom* failed: $srcPath"); return false; }
    imagepalettetotruecolor($img);
    imagealphablending($img, true);
    imagesavealpha($img, true);
    if (!function_exists('imagewebp')) { debug_log("imagewebp() missing"); imagedestroy($img); return false; }
    $ok = imagewebp($img, $destPath, 82);
    imagedestroy($img);
    return $ok;
}

$rawData     = @file_get_contents(CLIENTS_FILE);
$clientsData = json_decode($rawData, true);

if ($clientsData === null) {
    debug_log("CRITICAL: Could not read/parse CLIENTS_FILE: " . CLIENTS_FILE);
    $clientsData = [];
}

$message = '';
$error   = '';

if (isset($_GET['success'])) {
    if ($_GET['success'] === 'add') {
        $message = 'Client logo added successfully.';
    } elseif ($_GET['success'] === 'delete') {
        $message = 'Client logo deleted successfully.';
    }
}
if (isset($_GET['error'])) {
    $error = $_GET['error'];
}

/* ═══════════════════════════════════════════════════════════════════
   POST handler
═══════════════════════════════════════════════════════════════════ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    debug_log("clients.php POST: action='$action'");

    /* ── Add client logo ── */
    if ($action === 'add_client') {
        $clientAlt = trim($_POST['alt'] ?? '');

        if ($clientAlt === '') {
            $error = 'Client name is required.';
            debug_log("add_client: missing alt/name");
        } elseif (empty($_FILES['logo']['name'])) {
            $error = 'Please select a logo file.';
            debug_log("add_client: no file uploaded");
        } else {
            $file      = $_FILES['logo'];
            $fileError = $file['error'];
            $fileExt   = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            debug_log("add_client: name='$clientAlt' file='{$file['name']}' size={$file['size']} error=$fileError ext=$fileExt");

            if ($fileError !== UPLOAD_ERR_OK) {
                $phpErrors = [
                    UPLOAD_ERR_INI_SIZE   => "File exceeds PHP upload_max_filesize (" . ini_get('upload_max_filesize') . "). Start your server with start-server.sh (uses php -c php.ini) to raise this to 50M.",
                    UPLOAD_ERR_FORM_SIZE  => "File exceeds form MAX_FILE_SIZE.",
                    UPLOAD_ERR_PARTIAL    => "File only partially uploaded — try again.",
                    UPLOAD_ERR_NO_FILE    => "No file was received.",
                    UPLOAD_ERR_NO_TMP_DIR => "PHP has no temporary upload directory.",
                    UPLOAD_ERR_CANT_WRITE => "PHP could not write the file to disk.",
                    UPLOAD_ERR_EXTENSION  => "A PHP extension blocked the upload.",
                ];
                $error = $phpErrors[$fileError] ?? "Upload error code $fileError.";
                debug_log("Upload error: $error");
            } else {
                $relDir   = '/assets/images/clients/';
                ensure_dir($relDir);
                $uploadDir = resolve_path($relDir);

                debug_log("Upload dir: $uploadDir (exists=" . (is_dir($uploadDir) ? 'YES' : 'NO') . " writable=" . (is_writable($uploadDir) ? 'YES' : 'NO') . ")");

                $sanitizedName = strtolower($clientAlt);
                $sanitizedName = preg_replace('/\s+/', '_', $sanitizedName);
                $sanitizedName = preg_replace('/[^a-z0-9_]/', '', $sanitizedName);
                $fileName = $sanitizedName . '.webp';

                $destPath = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
                $relPath  = rtrim($relDir, '/') . '/' . $fileName;

                if (convertToWebP_withSVG($file['tmp_name'], $destPath, $fileExt)) {
                    $existingIndex = -1;
                    $oldFileSrc = null;
                    foreach ($clientsData as $idx => $c) {
                        if (strtolower($c['alt']) === strtolower($clientAlt) || $c['src'] === $relPath) {
                            $existingIndex = $idx;
                            $oldFileSrc = $c['src'];
                            break;
                        }
                    }

                    if ($existingIndex !== -1 && $oldFileSrc && $oldFileSrc !== $relPath) {
                        delete_file($oldFileSrc);
                    }

                    if ($existingIndex === -1) {
                        $clientsData[] = [
                            'src' => $relPath,
                            'alt' => $clientAlt
                        ];
                    } else {
                        $clientsData[$existingIndex]['src'] = $relPath;
                        $clientsData[$existingIndex]['alt'] = $clientAlt;
                    }
                    sync_file($relPath);
                    debug_log("Client logo saved: $destPath");

                    if (save_json(CLIENTS_FILE, $clientsData)) {
                        header('Location: clients.php?success=add');
                        exit;
                    } else {
                        // File is on disk but JSON failed — remove the file to avoid orphan
                        @unlink($destPath);
                        if ($existingIndex === -1) {
                            array_pop($clientsData); // rollback in-memory
                        } else {
                            if ($oldFileSrc) $clientsData[$existingIndex]['src'] = $oldFileSrc;
                        }
                        $error = 'Logo uploaded but failed to save clients.json. Check permissions on ' . CLIENTS_FILE;
                        debug_log("save_json FAILED after uploading $fileName — rolled back file");
                    }
                } else {
                    $error = "Failed to convert or save the uploaded file. Check write permissions on: $uploadDir or valid file format.";
                    debug_log("convertToWebP_withSVG FAILED: {$file['tmp_name']} → $destPath");
                }
            }
        }
        if ($error) {
            header('Location: clients.php?error=' . urlencode($error));
            exit;
        }
    }

    /* ── Delete client logo ── */
    if ($action === 'delete_client') {
        $src = $_POST['src'] ?? '';
        debug_log("delete_client: src='$src'");

        if ($src === '') {
            $error = 'No source path received.';
        } else {
            // Find the entry (strict string match on src)
            $found     = false;
            $newData   = [];
            foreach ($clientsData as $c) {
                if ($c['src'] === $src) {
                    $found = true;
                    // Do NOT add to newData — this removes it
                } else {
                    $newData[] = $c;
                }
            }

            if (!$found) {
                $error = "Client logo not found in data (src='$src'). It may have already been deleted.";
                debug_log("delete_client: src not found in JSON: $src");
            } else {
                $fileOk      = delete_file($src);
                debug_log("Physical delete '$src': " . ($fileOk ? 'OK' : 'NOT FOUND on disk'));
                $clientsData = array_values($newData);

                if (save_json(CLIENTS_FILE, $clientsData)) {
                    header('Location: clients.php?success=delete');
                    exit;
                } else {
                    // JSON save failed — restore in-memory (file already deleted, nothing we can do about it)
                    $error = 'Logo removed but failed to save clients.json. Check permissions on ' . CLIENTS_FILE;
                    debug_log("save_json FAILED after deleting $src");
                }
            }
        }
        if ($error) {
            header('Location: clients.php?error=' . urlencode($error));
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Clients - Midas Admin</title>
    <link rel="stylesheet" href="./assets/css/bootstrap.css">
    <link rel="stylesheet" href="./assets/css/font-awesome-all.css">
    <style>
        :root { --midas-orange: #ff6a00; }
        body { background: #f8f9fa; }
        .navbar { background-color: var(--midas-orange); margin-bottom: 2rem; }
        .navbar-brand { color: #fff !important; font-weight: 700; }
        .btn-orange { background: #fff; border-color: #000; color: #000; }
        .btn-orange:hover { background: #e55f00 !important; border-color: #e55f00 !important; color: #fff !important; }
        .card { border: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,.07); margin-bottom: 20px; }
        .client-logo-preview { width: 120px; height: 80px; object-fit: contain; background: #fff; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
        .upload-hint { font-size: .8rem; color: #6c757d; }
        .limit-badge { font-size: .75rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 2px 6px; }
    </style>
</head>
<body>
<nav class="navbar navbar-expand-lg">
    <div class="container">
        <a class="navbar-brand" href="dashboard.php">Midas Admin</a>
        <div class="ms-auto">
            <a href="dashboard.php" class="btn btn-outline-light btn-sm me-2">Jobs</a>
            <a href="events.php" class="btn btn-outline-light btn-sm me-2">Events</a>
            <a href="clients.php" class="btn btn-light btn-sm me-2">Clients</a>
            <a href="logout.php" class="btn btn-outline-light btn-sm">Logout</a>
        </div>
    </div>
</nav>

<div class="container">
    <?php if ($message): ?>
        <div class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle me-2"></i><?php echo htmlspecialchars($message); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <i class="fas fa-exclamation-triangle me-2"></i><?php echo htmlspecialchars($error); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <div class="row">
        <!-- Add form -->
        <div class="col-md-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3">Add New Client Logo</h5>
                    <form method="POST" enctype="multipart/form-data" id="add-client-form">
                        <input type="hidden" name="action" value="add_client">
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Client Name <span class="text-danger">*</span></label>
                            <input type="text" name="alt" id="client-name" class="form-control"
                                   value=""
                                   placeholder="e.g. Acme Corp" required>
                            <div class="invalid-feedback">Client name is required.</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Logo File <span class="text-danger">*</span></label>
                            <input type="file" name="logo" id="logo-file" class="form-control"
                                   accept="image/*" required>
                            <div class="upload-hint mt-1">
                                Any image format accepted.<br>
                                PHP limit:
                                <span class="limit-badge"><?php echo ini_get('upload_max_filesize'); ?> per file</span>
                                <?php if (php_size_to_bytes(ini_get('upload_max_filesize')) < 2 * 1024 * 1024): ?>
                                    <span class="badge bg-danger ms-1">⚠ Limit too low</span>
                                <?php endif; ?>
                            </div>
                            <!-- Preview -->
                            <div id="logo-preview" class="mt-2" style="display:none;">
                                <img id="logo-preview-img" src="" alt="preview"
                                     style="max-width:160px;max-height:100px;object-fit:contain;border:1px solid #dee2e6;border-radius:5px;padding:8px;background:#fff;">
                            </div>
                        </div>
                        <button type="submit" id="submitBtn" class="btn btn-orange w-100">
                            <i class="fas fa-plus me-2"></i>Add Client
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Existing clients -->
        <div class="col-md-8">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3">
                        Existing Clients
                        <span class="badge bg-secondary ms-1"><?php echo count($clientsData); ?></span>
                    </h5>
                    <?php if (empty($clientsData)): ?>
                        <p class="text-muted">No clients yet.</p>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table align-middle">
                                <thead>
                                    <tr>
                                        <th>Logo</th>
                                        <th>Name</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($clientsData as $client): ?>
                                        <?php
                                        $rawSrc     = $client['src'];
                                        $previewSrc = (strpos($rawSrc, '/') === 0) ? '..' . $rawSrc : $rawSrc;
                                        ?>
                                        <tr>
                                            <td>
                                                <img src="<?php echo htmlspecialchars($previewSrc); ?>"
                                                     class="client-logo-preview"
                                                     alt="<?php echo htmlspecialchars($client['alt']); ?>"
                                                     loading="lazy"
                                                     onerror="this.style.opacity='.25'; this.title='Not found: <?php echo htmlspecialchars($previewSrc); ?>';">
                                            </td>
                                            <td><?php echo htmlspecialchars($client['alt']); ?></td>
                                            <td>
                                                <form method="POST" class="del-form"
                                                      data-confirm="Delete logo for '<?php echo htmlspecialchars($client['alt']); ?>'?">
                                                    <input type="hidden" name="action" value="delete_client">
                                                    <input type="hidden" name="src"    value="<?php echo htmlspecialchars($rawSrc); ?>">
                                                    <button type="submit" class="btn btn-sm btn-danger delete-btn" title="Delete">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="./assets/js/jquery.js"></script>
<script src="./assets/js/bootstrap.min.js"></script>
<script src="admin.js"></script>
<script>
(function () {
    /* Logo file preview */
    document.getElementById('logo-file').addEventListener('change', function () {
        var preview    = document.getElementById('logo-preview');
        var previewImg = document.getElementById('logo-preview-img');
        if (this.files && this.files[0]) {
            previewImg.src = URL.createObjectURL(this.files[0]);
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    });

    /* Client-side validation & submit prevention */
    document.getElementById('add-client-form').addEventListener('submit', function (e) {
        var nameEl = document.getElementById('client-name');
        if (!nameEl.value.trim()) {
            nameEl.classList.add('is-invalid');
            e.preventDefault();
        } else {
            nameEl.classList.remove('is-invalid');
            var btn = document.getElementById('submitBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
            // We use setTimeout so the form still submits before disabling the button
            setTimeout(function() {
                btn.disabled = true;
            }, 0);
        }
    });
    
    document.querySelectorAll('.del-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            var btn = form.querySelector('.delete-btn');
            // We use setTimeout so the form still submits before disabling the button
            setTimeout(function() {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }, 0);
        });
    });
})();
</script>
</body>
</html>

