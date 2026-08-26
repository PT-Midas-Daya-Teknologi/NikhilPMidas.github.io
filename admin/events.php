<?php
require_once 'auth.php';
checkAuth();

$rawData    = @file_get_contents(EVENTS_FILE);
$eventsData = json_decode($rawData, true);

if ($eventsData === null) {
    debug_log("CRITICAL: Could not read/parse EVENTS_FILE: " . EVENTS_FILE);
    $eventsData = [];
}

$message = '';
$error   = '';

/* ═══════════════════════════════════════════════════════════════════
   POST handler
═══════════════════════════════════════════════════════════════════ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    debug_log("events.php POST: action='$action'");

    /* ── Delete entire event ── */
    if ($action === 'delete_event') {
        $postYear = $_POST['year']     ?? '';
        $eventId  = $_POST['event_id'] ?? '';
        debug_log("delete_event: id='$eventId' year='$postYear'");

        $updated = false;
        foreach ($eventsData as &$yearObj) {
            if ((string)$yearObj['year'] === (string)$postYear) {
                // Find and physically delete all media first
                foreach ($yearObj['events'] as $e) {
                    if ($e['id'] === $eventId) {
                        $photoCount = count($e['photos']);
                        debug_log("Deleting event '$eventId' with $photoCount media items");
                        foreach ($e['photos'] as $p) {
                            $ok = delete_file($p['src']);
                            debug_log("  delete_file('{$p['src']}'): " . ($ok ? 'OK' : 'NOT FOUND'));
                        }
                        break;
                    }
                }
                $before = count($yearObj['events']);
                $yearObj['events'] = array_values(array_filter($yearObj['events'], function($e) use ($eventId) {
                    return $e['id'] !== $eventId;
                }));
                if (count($yearObj['events']) < $before) {
                    $updated = true;
                    debug_log("Event removed from array");
                } else {
                    debug_log("WARNING: event_id '$eventId' not found in year '$postYear'");
                }
                break;
            }
        }
        unset($yearObj);

        if ($updated) {
            if (save_json(EVENTS_FILE, $eventsData)) {
                $message = 'Event and all associated media deleted successfully.';
            } else {
                $error = 'Event removed from memory but failed to save JSON. Check permissions on ' . EVENTS_FILE;
            }
        } else {
            $error = 'Event not found — it may have already been deleted.';
        }
    }

    /* ── Delete individual media item ── */
    if ($action === 'delete_media') {
        $postYear = $_POST['year']     ?? '';
        $eventId  = $_POST['event_id'] ?? '';
        $src      = $_POST['src']      ?? '';
        debug_log("delete_media: src='$src' event='$eventId' year='$postYear'");

        $updated = false;
        foreach ($eventsData as &$yearObj) {
            if ((string)$yearObj['year'] === (string)$postYear) {
                foreach ($yearObj['events'] as &$event) {
                    if ($event['id'] === $eventId) {
                        $before = count($event['photos']);
                        $event['photos'] = array_values(array_filter($event['photos'], function($p) use ($src) {
                            return $p['src'] !== $src;
                        }));
                        if (count($event['photos']) < $before) {
                            $fileOk = delete_file($src);
                            debug_log("Physical delete '$src': " . ($fileOk ? 'OK' : 'NOT FOUND on disk'));
                            // Re-sort remaining photos
                            usort($event['photos'], function($a, $b) {
                                $aV = strtolower(pathinfo($a['src'], PATHINFO_EXTENSION)) === 'mp4' ? 1 : 0;
                                $bV = strtolower(pathinfo($b['src'], PATHINFO_EXTENSION)) === 'mp4' ? 1 : 0;
                                if ($aV !== $bV) return $aV - $bV;
                                return ($a['height'] ?? 0) <=> ($b['height'] ?? 0);
                            });
                            $updated = true;
                        } else {
                            debug_log("WARNING: src '$src' not found in event photos");
                        }
                        break 2;
                    }
                }
            }
        }
        unset($yearObj, $event);

        if ($updated) {
            if (save_json(EVENTS_FILE, $eventsData)) {
                $message = 'Media deleted successfully.';
            } else {
                $error = 'Photo removed but failed to save JSON. Check permissions on ' . EVENTS_FILE;
            }
        } else {
            $error = 'Media item not found — it may have already been deleted.';
        }
    }
}

/* ── Build year list and filter ── */
$years = [];
if (!empty($eventsData)) {
    $years = array_unique(array_column($eventsData, 'year'));
    rsort($years);
}

$filterYear = $_GET['year'] ?? ($years[0] ?? '');

// Flash message from event-edit.php redirect
if (isset($_GET['msg']) && $_GET['msg'] === 'success' && $message === '') {
    $message = 'Event saved successfully.';
}

$filteredEvents = [];
foreach ($eventsData as $yearObj) {
    if ((string)$yearObj['year'] === (string)$filterYear) {
        $filteredEvents = $yearObj['events'];
        break;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Events - Midas Admin</title>
    <link rel="stylesheet" href="../assets/css/bootstrap.css">
    <link rel="stylesheet" href="../assets/css/font-awesome-all.css">
    <style>
        :root { --midas-orange: #ff6a00; }
        body { background: #f8f9fa; }
        .navbar { background-color: var(--midas-orange); margin-bottom: 2rem; }
        .navbar-brand { color: #fff !important; font-weight: 700; }
        .btn-orange { background: var(--orange); border-color: var(--orange); color: #fff; }
        .btn-orange:hover { background: #e55f00; border-color: #e55f00; color: #fff; }
        .card { border: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,.07); margin-bottom: 20px; }
        .media-thumb { position: relative; width: 100px; height: 100px; display: inline-block; margin: 0 8px 8px 0; }
        .media-thumb img,
        .media-thumb video { width: 100%; height: 100%; object-fit: cover; border-radius: 5px; display: block; background: #eee; }
        .media-thumb .del-btn {
            position: absolute; top: -7px; right: -7px;
            width: 22px; height: 22px; border-radius: 50%;
            background: #dc3545; color: #fff; border: 2px solid #fff;
            font-size: 13px; line-height: 18px; text-align: center;
            cursor: pointer; padding: 0;
        }
        .media-thumb .del-btn:hover { background: #a71d2a; }
        .type-badge {
            position: absolute; bottom: 4px; left: 4px;
            background: rgba(0,0,0,.65); color: #fff;
            font-size: 9px; padding: 1px 5px; border-radius: 3px; pointer-events: none;
        }
    </style>
</head>
<body>
<nav class="navbar navbar-expand-lg">
    <div class="container">
        <a class="navbar-brand" href="dashboard.php">Midas Admin</a>
        <div class="ms-auto">
            <a href="dashboard.php" class="btn btn-outline-light btn-sm me-2">Jobs</a>
            <a href="events.php" class="btn btn-light btn-sm me-2">Events</a>
            <a href="clients.php" class="btn btn-outline-light btn-sm me-2">Clients</a>
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

    <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="mb-0">Event Management</h3>
        <a href="event-edit.php?id=new" class="btn btn-midas">
            <i class="fas fa-plus me-2"></i>Create New Event
        </a>
    </div>

    <!-- Year Filter -->
    <div class="card mb-4">
        <div class="card-body py-3">
            <form method="GET" class="row g-3 align-items-center">
                <div class="col-auto">
                    <label for="year" class="col-form-label">Filter by Year:</label>
                </div>
                <div class="col-auto">
                    <select name="year" id="year" class="form-select" onchange="this.form.submit()">
                        <?php foreach ($years as $y): ?>
                            <option value="<?php echo htmlspecialchars($y); ?>"
                                <?php echo (string)$y === (string)$filterYear ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($y); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </form>
        </div>
    </div>

    <?php if (empty($filteredEvents)): ?>
        <div class="alert alert-info">No events found for <?php echo htmlspecialchars($filterYear); ?>.</div>
    <?php else: ?>
        <?php foreach ($filteredEvents as $event): ?>
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h4 class="card-title mb-1"><?php echo htmlspecialchars($event['title']); ?></h4>
                            <p class="text-muted mb-0 small"><?php echo htmlspecialchars($event['meta'] ?? ''); ?></p>
                        </div>
                        <div class="d-flex gap-2 flex-shrink-0 ms-3">
                            <a href="event-edit.php?year=<?php echo urlencode($filterYear); ?>&id=<?php echo urlencode($event['id']); ?>"
                               class="btn btn-sm btn-primary">
                                <i class="fas fa-edit me-1"></i>Edit / Add Photos
                            </a>
                            <form method="POST" data-confirm="Delete this entire event and ALL its photos?">
                                <input type="hidden" name="action"   value="delete_event">
                                <input type="hidden" name="year"     value="<?php echo htmlspecialchars($filterYear); ?>">
                                <input type="hidden" name="event_id" value="<?php echo htmlspecialchars($event['id']); ?>">
                                <button type="submit" class="btn btn-sm btn-danger">
                                    <i class="fas fa-trash me-1"></i>Delete Event
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Media strip -->
                    <div>
                        <div class="d-flex align-items-center mb-2">
                            <span class="fw-semibold small me-2">Media</span>
                            <span class="badge bg-secondary"><?php echo count($event['photos']); ?></span>
                        </div>
                        <?php if (empty($event['photos'])): ?>
                            <p class="text-muted small mb-0">No media yet — click Edit / Add Photos.</p>
                        <?php else: ?>
                            <div class="d-flex flex-wrap">
                                <?php foreach ($event['photos'] as $media): ?>
                                    <?php
                                    $rawSrc     = $media['src'];
                                    $previewSrc = (strpos($rawSrc, '/') === 0) ? '..' . $rawSrc : $rawSrc;
                                    $isVideo    = strtolower(pathinfo($rawSrc, PATHINFO_EXTENSION)) === 'mp4';
                                    ?>
                                    <div class="media-thumb">
                                        <?php if ($isVideo): ?>
                                            <video src="<?php echo htmlspecialchars($previewSrc); ?>" preload="none"></video>
                                            <span class="type-badge">MP4</span>
                                        <?php else: ?>
                                            <img src="<?php echo htmlspecialchars($previewSrc); ?>" alt=""
                                                 loading="lazy"
                                                 onerror="this.style.opacity='.25'; this.title='Not found: <?php echo htmlspecialchars($previewSrc); ?>';">
                                        <?php endif; ?>
                                        <form method="POST" class="del-form" data-confirm="Delete this media item?">
                                            <input type="hidden" name="action"   value="delete_media">
                                            <input type="hidden" name="year"     value="<?php echo htmlspecialchars($filterYear); ?>">
                                            <input type="hidden" name="event_id" value="<?php echo htmlspecialchars($event['id']); ?>">
                                            <input type="hidden" name="src"      value="<?php echo htmlspecialchars($rawSrc); ?>">
                                            <button type="submit" class="del-btn" title="Delete">&times;</button>
                                        </form>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<script src="../assets/js/jquery.js"></script>
<script src="../assets/js/bootstrap.min.js"></script>
<script src="admin.js"></script>
</body>
</html>
