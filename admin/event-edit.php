<?php
require_once 'auth.php';
checkAuth();
debug_env();

$rawData    = @file_get_contents(EVENTS_FILE);
$eventsData = json_decode($rawData, true);
if ($eventsData === null) {
    debug_log("CRITICAL: Cannot read EVENTS_FILE: " . EVENTS_FILE);
    $eventsData = [];
}

$year = $_GET['year'] ?? '';
$id   = $_GET['id']   ?? 'new';

$currentEvent = null;
if ($id !== 'new') {
    foreach ($eventsData as $yearObj) {
        if ((string)$yearObj['year'] === (string)$year) {
            foreach ($yearObj['events'] as $ev) {
                if ($ev['id'] === $id) {
                    $currentEvent = $ev;
                    debug_log("Loaded event '$id' with " . count($ev['photos']) . " photos");
                    break 2;
                }
            }
        }
    }
    if ($currentEvent === null) {
        debug_log("WARNING: event '$id' year='$year' not found");
    }
}

$message = '';
$errors  = [];

if (isset($_GET['success'])) {
    if ($_GET['success'] === 'deleted') {
        $message = 'Photo deleted.';
    } elseif ($_GET['success'] === 'partial') {
        $message = 'Event metadata saved. Some files had errors (see below).';
    }
}
if (isset($_GET['error'])) {
    $errors = explode(' | ', $_GET['error']);
}

/* ═══════════════════════════════════════════════════════
   POST handler
═══════════════════════════════════════════════════════ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // ── FIRST: detect if PHP silently dropped the POST body ──────────
    // When the uploaded file + form data exceeds post_max_size, PHP
    // empties $_POST and $_FILES entirely. $_POST['action'] is then
    // missing, so no handler fires and the page just silently reloads.
    // We catch this here before anything else.
    $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    $postMaxBytes  = php_size_to_bytes(ini_get('post_max_size'));

    if ($contentLength > 0 && empty($_POST)) {
        // Entire POST was dropped
        debug_log("POST body dropped by PHP. CONTENT_LENGTH=$contentLength post_max_size=" . ini_get('post_max_size'));
        $errors[] = "Upload failed: your file(s) total " . round($contentLength / 1048576, 1) . " MB but PHP's post_max_size is only " . ini_get('post_max_size') . "."
                  . " Fix: run start-server.sh (php -c php.ini -S localhost:8000) instead of plain php -S.";
    } else {

        $postAction = $_POST['action'] ?? '';
        debug_log("POST action='$postAction'");

        /* ── Delete single media item ───────────────────────────── */
        if ($postAction === 'delete_media') {
            $src     = $_POST['src']      ?? '';
            $eventId = $_POST['event_id'] ?? $id;
            $evYear  = $_POST['year']     ?? $year;
            $deleted = false;
            debug_log("delete_media: src='$src' event='$eventId' year='$evYear'");

            foreach ($eventsData as &$yearObj) {
                if ((string)$yearObj['year'] === (string)$evYear) {
                    foreach ($yearObj['events'] as &$ev) {
                        if ($ev['id'] === $eventId) {
                            $before = count($ev['photos']);
                            $ev['photos'] = array_values(array_filter($ev['photos'], function($p) use ($src) {
                                return $p['src'] !== $src;
                            }));
                            if (count($ev['photos']) < $before) {
                                $fileOk = delete_file($src);
                                debug_log("delete_file '$src': " . ($fileOk ? 'OK' : 'not found on disk'));
                                usort($ev['photos'], 'sort_photos');
                                $currentEvent = $ev;
                                $deleted = true;
                            } else {
                                debug_log("src '$src' not found in photos array");
                            }
                            break 2;
                        }
                    }
                }
            }
            unset($yearObj, $ev);

            if ($deleted) {
                if (save_json(EVENTS_FILE, $eventsData)) {
                    $_SESSION['flash_message'] = 'Photo deleted.';
                    header("Location: event-edit.php?year=" . urlencode($evYear) . "&id=" . urlencode($id));
                    exit;
                } else {
                    $errors[] = 'Photo removed from memory but JSON save failed. Check permissions on ' . EVENTS_FILE;
                }
            } else {
                $errors[] = 'Photo not found — may already be deleted.';
            }

            if (!empty($errors)) {
                $_SESSION['flash_errors'] = $errors;
                header("Location: event-edit.php?year=" . urlencode($evYear) . "&id=" . urlencode($id));
                exit;
            }

            // Refresh $currentEvent
            foreach ($eventsData as $yearObj) {
                if ((string)$yearObj['year'] === (string)$year) {
                    foreach ($yearObj['events'] as $ev) {
                        if ($ev['id'] === $id) { $currentEvent = $ev; break 2; }
                    }
                }
            }

        /* ── Save / create event ────────────────────────────────── */
        } elseif ($postAction === 'save_event') {

            $eventTitle = trim($_POST['title'] ?? '');
            $eventYear  = trim($_POST['year']  ?? '');
            $eventMeta  = trim($_POST['meta']  ?? '') ?: "$eventYear · Company Event";

            debug_log("save_event: title='$eventTitle' year='$eventYear' id='$id'");

            // Validation
            if ($eventTitle === '') {
                $errors[] = 'Event Name is required.';
            }
            if ($eventYear === '' || !ctype_digit($eventYear) || strlen($eventYear) !== 4
                || (int)$eventYear < 1900 || (int)$eventYear > (int)date('Y') + 10) {
                $errors[] = 'Please enter a valid 4-digit year (e.g. ' . date('Y') . ').';
            }

            if (empty($errors)) {
                // Init or patch currentEvent
                if ($id === 'new') {
                    $id = strtolower(preg_replace('/[^a-z0-9]+/', '-', strtolower($eventTitle)))
                        . '-' . $eventYear . '-' . uniqid();
                    $currentEvent = ['id' => $id, 'title' => $eventTitle, 'meta' => $eventMeta, 'photos' => []];
                    debug_log("New event id='$id'");
                } else {
                    if ($currentEvent === null) {
                        $currentEvent = ['id' => $id, 'title' => $eventTitle, 'meta' => $eventMeta, 'photos' => []];
                    } else {
                        $currentEvent['title'] = $eventTitle;
                        $currentEvent['meta']  = $eventMeta;
                    }
                }

                // ── File uploads ──────────────────────────────────
                if (!empty($_FILES['media']['name'][0])) {
                    $total = count($_FILES['media']['name']);
                    debug_log("Files to upload: $total");

                    // Count existing videos so cap is cumulative
                    $videoCount = 0;
                    foreach ($currentEvent['photos'] as $p) {
                        if (strtolower(pathinfo($p['src'], PATHINFO_EXTENSION)) === 'mp4') $videoCount++;
                    }

                    // Pre-calculate base event name and directory for filenames
                    $baseEventName = strtolower($currentEvent['title']);
                    $baseEventName = preg_replace('/\s+/', '_', $baseEventName);
                    $baseEventName = preg_replace('/[^a-z0-9_]/', '', $baseEventName);

                    $folderName = preg_replace('/[^A-Za-z0-9_]+/', '_', $currentEvent['title']);
                    $relDir     = '/assets/images/event/' . $eventYear . '/' . $folderName . '/';
                    ensure_dir($relDir);
                    $uploadDir  = resolve_path($relDir);

                    // Collect used numbers from JSON and Disk to avoid overwriting
                    $usedNumbers = [];
                    foreach ($currentEvent['photos'] as $p) {
                        $bn = basename($p['src']);
                        if (preg_match('/_(\d+)\.(webp|mp4)$/i', $bn, $m)) {
                            $usedNumbers[] = (int)$m[1];
                        }
                    }
                    if (is_dir($uploadDir)) {
                        $dh = @opendir($uploadDir);
                        if ($dh) {
                            while (($file = readdir($dh)) !== false) {
                                if (preg_match('/_(\d+)\.(webp|mp4)$/i', $file, $m)) {
                                    $usedNumbers[] = (int)$m[1];
                                }
                            }
                            closedir($dh);
                        }
                    }
                    $usedNumbers = array_unique($usedNumbers);

                    for ($i = 0; $i < $total; $i++) {
                        $fname  = $_FILES['media']['name'][$i];
                        $ftmp   = $_FILES['media']['tmp_name'][$i];
                        $fsize  = $_FILES['media']['size'][$i];
                        $ferr   = $_FILES['media']['error'][$i];
                        $fext   = strtolower(pathinfo($fname, PATHINFO_EXTENSION));

                        debug_log("File[$i]: '$fname' size=$fsize error=$ferr ext=$fext");

                        if ($ferr !== UPLOAD_ERR_OK) {
                            $map = [
                                UPLOAD_ERR_INI_SIZE   => "'$fname' exceeds PHP upload_max_filesize (" . ini_get('upload_max_filesize') . "). Run start-server.sh to fix.",
                                UPLOAD_ERR_FORM_SIZE  => "'$fname' exceeds form size limit.",
                                UPLOAD_ERR_PARTIAL    => "'$fname' only partially uploaded — try again.",
                                UPLOAD_ERR_NO_FILE    => "No file received in slot $i.",
                                UPLOAD_ERR_NO_TMP_DIR => "PHP has no temp directory.",
                                UPLOAD_ERR_CANT_WRITE => "PHP cannot write to disk.",
                                UPLOAD_ERR_EXTENSION  => "A PHP extension blocked '$fname'.",
                            ];
                            $errors[] = $map[$ferr] ?? "Unknown upload error $ferr for '$fname'.";
                            debug_log("Upload error: " . end($errors));
                            continue;
                        }

                        debug_log("Upload dir: $uploadDir writable=" . (is_writable($uploadDir) ? 'YES' : 'NO'));

                        // Find next available sequence number
                        $nextNumber = 1;
                        sort($usedNumbers);
                        foreach ($usedNumbers as $num) {
                            if ($num == $nextNumber) {
                                $nextNumber++;
                            } elseif ($num > $nextNumber) {
                                break;
                            }
                        }
                        $usedNumbers[] = $nextNumber;

                        if (in_array($fext, ['jpg','jpeg','png','webp','gif'])) {
                            $newName  = "{$baseEventName}_{$eventYear}_{$nextNumber}.webp";
                            $destPath = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $newName;
                            $relPath  = rtrim($relDir, '/') . '/' . $newName;

                            if (convertToWebP($ftmp, $destPath)) {
                                $dims   = @getimagesize($destPath);
                                $height = ($dims && isset($dims[1])) ? (int)$dims[1] : 0;
                                $currentEvent['photos'][] = ['src' => $relPath, 'alt' => $eventTitle, 'height' => $height];
                                sync_file($relPath);
                                debug_log("Converted+saved: $newName (height=$height)");
                            } else {
                                $errors[] = "Could not convert '$fname' to WebP. Check PHP GD is installed with WebP support.";
                                debug_log("convertToWebP FAILED for '$fname'");
                            }

                        } elseif ($fext === 'mp4') {
                            if ($videoCount >= 4) {
                                $errors[] = "Max 4 videos per event — '$fname' skipped.";
                            } elseif ($fsize > 2 * 1024 * 1024) {
                                $errors[] = "'$fname' is " . round($fsize/1048576,1) . " MB — videos must be under 2 MB.";
                            } else {
                                $newName  = "{$baseEventName}_{$eventYear}_{$nextNumber}.mp4";
                                $destPath = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $newName;
                                $relPath  = rtrim($relDir, '/') . '/' . $newName;
                                if (move_uploaded_file($ftmp, $destPath)) {
                                    $currentEvent['photos'][] = ['src' => $relPath, 'alt' => $eventTitle, 'height' => 0];
                                    sync_file($relPath);
                                    $videoCount++;
                                    debug_log("Video saved: $newName");
                                } else {
                                    $errors[] = "Could not save '$fname'. Check directory permissions.";
                                    debug_log("move_uploaded_file FAILED → $destPath");
                                }
                            }
                        } else {
                            $errors[] = "Unsupported type '.$fext' ($fname). Use JPG/PNG/WebP/GIF or MP4.";
                        }
                    }
                }

                // Sort: images by height asc, videos last
                usort($currentEvent['photos'], 'sort_photos');
                debug_log("Photos after sort: " . count($currentEvent['photos']));

                // Upsert into eventsData
                $yearExists = false;
                foreach ($eventsData as &$yearObj) {
                    if ((string)$yearObj['year'] === (string)$eventYear) {
                        $yearExists  = true;
                        $eventExists = false;
                        foreach ($yearObj['events'] as &$e) {
                            if ($e['id'] === $id) { $e = $currentEvent; $eventExists = true; break; }
                        }
                        unset($e);
                        if (!$eventExists) $yearObj['events'][] = $currentEvent;
                        break;
                    }
                }
                unset($yearObj);
                if (!$yearExists) {
                    $eventsData[] = ['year' => (string)$eventYear, 'events' => [$currentEvent]];
                    debug_log("Created new year entry: $eventYear");
                }

                // Remove from old year if year changed
                if ($year !== '' && (string)$year !== (string)$eventYear) {
                    foreach ($eventsData as &$yearObj) {
                        if ((string)$yearObj['year'] === (string)$year) {
                            $yearObj['events'] = array_values(array_filter($yearObj['events'], function($e) use ($id) {
                                return $e['id'] !== $id;
                            }));
                            break;
                        }
                    }
                    unset($yearObj);
                }

                usort($eventsData, function($a,$b){ return (int)$b['year'] <=> (int)$a['year']; });

                if (save_json(EVENTS_FILE, $eventsData)) {
                    debug_log("JSON saved. errors=" . count($errors));
                    if (empty($errors)) {
                        $_SESSION['flash_message'] = 'Event saved successfully.';
                        header("Location: events.php?year=" . urlencode($eventYear));
                        exit;
                    }
                    // Upload errors exist — PRG to self to show errors
                    $_SESSION['flash_message'] = 'Event metadata saved. Some files had errors (see below).';
                    $_SESSION['flash_errors']  = $errors;
                    header("Location: event-edit.php?year=" . urlencode($eventYear) . "&id=" . urlencode($id));
                    exit;
                } else {
                    $errors[] = 'Failed to write events.json. Check permissions: chmod 775 ' . dirname(EVENTS_FILE);
                    $_SESSION['flash_errors'] = $errors;
                    header("Location: event-edit.php?year=" . urlencode($eventYear) . "&id=" . urlencode($id));
                    exit;
                }
            } else {
                $_SESSION['flash_errors'] = $errors;
                header("Location: event-edit.php?year=" . urlencode($eventYear) . "&id=" . urlencode($id));
                exit;
            }

        } else {
            debug_log("Unknown POST action: '$postAction'");
        }
    }
}

/* ── Sort helper: images by height asc, videos after ── */
function sort_photos($a, $b) {
    $av = strtolower(pathinfo($a['src'], PATHINFO_EXTENSION)) === 'mp4' ? 1 : 0;
    $bv = strtolower(pathinfo($b['src'], PATHINFO_EXTENSION)) === 'mp4' ? 1 : 0;
    if ($av !== $bv) return $av - $bv;
    return ($a['height'] ?? 0) <=> ($b['height'] ?? 0);
}

/* ── WebP converter ── */
function convertToWebP($src, $dst, $q = 82) {
    if (!extension_loaded('gd')) { debug_log("GD not loaded"); return false; }
    $info = @getimagesize($src);
    if (!$info) { debug_log("getimagesize failed: $src"); return false; }
    switch ($info['mime']) {
        case 'image/jpeg': $img = @imagecreatefromjpeg($src); break;
        case 'image/gif':  $img = @imagecreatefromgif($src);  break;
        case 'image/png':  $img = @imagecreatefrompng($src);  break;
        case 'image/webp': $img = @imagecreatefromwebp($src); break;
        default: debug_log("Unsupported mime: " . $info['mime']); return false;
    }
    if (!$img) { debug_log("imagecreatefrom* failed: $src"); return false; }
    imagepalettetotruecolor($img);
    imagealphablending($img, true);
    imagesavealpha($img, true);
    if (!function_exists('imagewebp')) { debug_log("imagewebp() missing"); imagedestroy($img); return false; }
    $ok = imagewebp($img, $dst, $q);
    imagedestroy($img);
    if (!$ok) debug_log("imagewebp() returned false: $dst");
    return $ok;
}

$displayYear = ($id !== 'new' && $year !== '') ? $year : date('Y');
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['year'])) {
    $displayYear = $_POST['year'];
}
$maxYear = (int)date('Y') + 10;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo $id === 'new' ? 'New Event' : 'Edit Event'; ?> - Admin</title>
    <link rel="stylesheet" href="./assets/css/bootstrap.css">
    <link rel="stylesheet" href="./assets/css/font-awesome-all.css">
    <style>
        :root { --orange: #ff6a00; }
        body { background: #f8f9fa; padding-bottom: 60px; }
        .navbar { background: var(--orange); margin-bottom: 2rem; }
        .navbar-brand, .navbar a { color: #fff !important; }
        .btn-orange { background: #fff; border-color: #000; color: #000; }
        .btn-orange:hover { background: #e55f00 !important; border-color: #e55f00 !important; color: #fff !important; }
        .card { border: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,.07); }
        .media-thumb { position: relative; width: 100px; height: 100px; display: inline-block; margin: 0 8px 8px 0; }
        .media-thumb img, .media-thumb video { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block; background: #eee; }
        .del-btn { position: absolute; top: -7px; right: -7px; width: 22px; height: 22px; border-radius: 50%; background: #dc3545; color: #fff; border: 2px solid #fff; font-size: 14px; line-height: 19px; text-align: center; cursor: pointer; padding: 0; }
        .del-btn:hover { background: #a71d2a; }
        .type-badge { position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,.65); color: #fff; font-size: 9px; padding: 1px 5px; border-radius: 3px; pointer-events: none; }
        .hint { font-size: .8rem; color: #6c757d; }
        .limit-pill { font-size: .75rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 2px 7px; display: inline-block; }
    </style>
</head>
<body>
<nav class="navbar navbar-expand-lg">
    <div class="container">
        <a class="navbar-brand fw-bold" href="dashboard.php">Midas Admin</a>
        <div class="ms-auto d-flex gap-2">
            <a href="dashboard.php" class="btn btn-outline-light btn-sm">Jobs</a>
            <a href="events.php" class="btn btn-outline-light btn-sm">Events</a>
            <a href="clients.php" class="btn btn-outline-light btn-sm">Clients</a>
            <a href="logout.php" class="btn btn-outline-light btn-sm">Logout</a>
        </div>
    </div>
</nav>

<div class="container">
    <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="events.php<?php echo $year ? '?year='.urlencode($year) : ''; ?>">Events</a></li>
            <li class="breadcrumb-item active"><?php echo $id === 'new' ? 'New Event' : 'Edit Event'; ?></li>
        </ol>
    </nav>

    <?php if ($message): ?>
        <div class="alert alert-success alert-dismissible fade show">
            <i class="fas fa-check-circle me-2"></i><?php echo htmlspecialchars($message); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <strong><i class="fas fa-exclamation-triangle me-2"></i>Error<?php echo count($errors) > 1 ? 's' : ''; ?>:</strong>
            <ul class="mb-0 mt-1">
                <?php foreach ($errors as $e): ?>
                    <li><?php echo htmlspecialchars($e); ?></li>
                <?php endforeach; ?>
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <div class="card">
        <div class="card-body p-4">

            <!-- MAIN SAVE FORM -->
            <form method="POST" enctype="multipart/form-data" id="event-form">
                <input type="hidden" name="action" value="save_event">

                <div class="mb-3">
                    <label class="form-label fw-semibold">Event Name <span class="text-danger">*</span></label>
                    <input type="text" name="title" id="field-title" class="form-control"
                           value="<?php echo htmlspecialchars($_POST['title'] ?? $currentEvent['title'] ?? ''); ?>"
                           placeholder="e.g. Annual Company Gala">
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Event Year <span class="text-danger">*</span></label>
                    <input type="number" name="year" id="field-year" class="form-control"
                           value="<?php echo htmlspecialchars($displayYear); ?>"
                           min="1900" max="<?php echo $maxYear; ?>"
                           placeholder="<?php echo date('Y'); ?>">
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Meta Description <span class="text-muted fw-normal">(optional)</span></label>
                    <input type="text" name="meta" class="form-control"
                           value="<?php echo htmlspecialchars($_POST['meta'] ?? $currentEvent['meta'] ?? ''); ?>"
                           placeholder="e.g. 2026 · Cultural Celebration">
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Add Media Files</label>
                    <input type="file" name="media[]" id="field-media" class="form-control"
                           multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4">
                    <div class="hint mt-1">
                        Images (JPG/PNG/GIF/WebP)<br>
                        Videos: MP4 only · max <strong>2 MB each</strong> · max <strong>4 per event</strong>.<br>
                        <!-- Upload limit:
                        <span class="limit-pill"><?php echo ini_get('upload_max_filesize'); ?>/file</span>
                        <span class="limit-pill"><?php echo ini_get('post_max_size'); ?>/total</span>
                        <?php if (php_size_to_bytes(ini_get('upload_max_filesize')) < 5*1024*1024): ?>
                            <span class="badge bg-danger ms-1">⚠ Limit too low — use start-server.sh</span>
                        <?php endif; ?> -->
                    </div>
                    <div id="preview-new" class="d-flex flex-wrap mt-2"></div>
                    <div id="preview-errors" class="mt-1"></div>
                </div>

                <!-- Existing photos -->
                <?php if (!empty($currentEvent['photos'])): ?>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">
                            Existing Media
                            <span class="badge bg-secondary ms-1"><?php echo count($currentEvent['photos']); ?></span>
                        </label>
                        <p class="hint mb-2">Click <strong>&times;</strong> to remove a photo.</p>
                        <div class="d-flex flex-wrap" id="existing-media">
                            <?php foreach ($currentEvent['photos'] as $media): ?>
                                <?php
                                $rawSrc     = $media['src'];
                                $previewSrc = (strpos($rawSrc, '/') === 0) ? '..' . $rawSrc : $rawSrc;
                                $isVideo    = strtolower(pathinfo($rawSrc, PATHINFO_EXTENSION)) === 'mp4';
                                ?>
                                <div class="media-thumb">
                                    <?php if ($isVideo): ?>
                                        <video src="<?php echo htmlspecialchars($previewSrc); ?>" preload="metadata"></video>
                                        <span class="type-badge">MP4</span>
                                    <?php else: ?>
                                        <img src="<?php echo htmlspecialchars($previewSrc); ?>"
                                             alt="<?php echo htmlspecialchars($media['alt'] ?? ''); ?>"
                                             loading="lazy"
                                             onerror="this.style.opacity='.2';">
                                    <?php endif; ?>
                                    <button type="button" class="del-btn"
                                            data-src="<?php echo htmlspecialchars($rawSrc); ?>"
                                            title="Delete this photo">&times;</button>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <hr>
                <div class="d-flex justify-content-between">
                    <a href="events.php<?php echo $year ? '?year='.urlencode($year) : ''; ?>" class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-left me-1"></i>Cancel
                    </a>
                    <button type="submit" class="btn btn-orange">
                        <i class="fas fa-save me-1"></i>Save Event
                    </button>
                </div>
            </form>

            <!-- DELETE MEDIA FORM — kept OUTSIDE the main form (nested forms break HTML) -->
            <form method="POST" id="del-media-form" style="display:none;">
                <input type="hidden" name="action"   value="delete_media">
                <input type="hidden" name="year"     value="<?php echo htmlspecialchars($year); ?>">
                <input type="hidden" name="event_id" value="<?php echo htmlspecialchars($id); ?>">
                <input type="hidden" name="src"      id="del-src" value="">
            </form>

        </div>
    </div>
</div>

<script src="./assets/js/jquery.js"></script>
<script src="./assets/js/bootstrap.min.js"></script>
<script>
(function () {
    // ── Delete photo buttons ──────────────────────────────────────
    var delForm = document.getElementById('del-media-form');
    var delSrc  = document.getElementById('del-src');

    document.querySelectorAll('.del-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!confirm('Delete this photo?')) return;
            delSrc.value = this.getAttribute('data-src');
            delForm.submit();
        });
    });

    // ── Save form: lightweight validation only (no preventDefault on valid) ──
    document.getElementById('event-form').addEventListener('submit', function (e) {
        var title = document.getElementById('field-title').value.trim();
        var year  = document.getElementById('field-year').value.trim();
        var y     = parseInt(year, 10);
        var ok    = true;

        if (!title) {
            document.getElementById('field-title').style.border = '2px solid red';
            ok = false;
        } else {
            document.getElementById('field-title').style.border = '';
        }

        if (!year || isNaN(y) || y < 1900 || y > <?php echo $maxYear; ?>) {
            document.getElementById('field-year').style.border = '2px solid red';
            ok = false;
        } else {
            document.getElementById('field-year').style.border = '';
        }

        if (!ok) {
            e.preventDefault();
            window.scrollTo(0, 0);
        }
    });

    // ── New file preview + client-side size check ─────────────────
    document.getElementById('field-media').addEventListener('change', function () {
        var box    = document.getElementById('preview-new');
        var errBox = document.getElementById('preview-errors');
        box.innerHTML = '';
        errBox.innerHTML = '';

        var existingVideos = <?php
            $vc = 0;
            if (!empty($currentEvent['photos'])) {
                foreach ($currentEvent['photos'] as $p) {
                    if (strtolower(pathinfo($p['src'], PATHINFO_EXTENSION)) === 'mp4') $vc++;
                }
            }
            echo $vc;
        ?>;

        var vidCount = existingVideos;
        var errs = [];

        Array.from(this.files).forEach(function (f) {
            var ext = f.name.split('.').pop().toLowerCase();
            var isVid = ext === 'mp4';
            var isImg = ['jpg','jpeg','png','webp','gif'].indexOf(ext) !== -1;

            if (!isVid && !isImg) { errs.push(f.name + ': unsupported type'); return; }
            if (isVid && vidCount >= 4)       { errs.push(f.name + ': max 4 videos per event'); return; }
            if (isVid && f.size > 2097152)    { errs.push(f.name + ': video exceeds 2 MB (' + (f.size/1048576).toFixed(1) + ' MB)'); return; }
            if (isVid) vidCount++;

            var wrap = document.createElement('div');
            wrap.style.cssText = 'width:80px;height:80px;margin:0 6px 6px 0;border-radius:6px;overflow:hidden;background:#ddd;flex-shrink:0;';
            var el = document.createElement(isVid ? 'video' : 'img');
            el.src = URL.createObjectURL(f);
            el.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            wrap.appendChild(el);
            box.appendChild(wrap);
        });

        if (errs.length) {
            errBox.innerHTML = errs.map(function(e) {
                return '<div class="alert alert-warning py-1 px-2 mb-1 small">' + e + '</div>';
            }).join('');
        }
    });
})();
</script>
</body>
</html>
