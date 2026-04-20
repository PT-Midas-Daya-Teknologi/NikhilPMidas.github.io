<?php
require_once 'auth.php';
checkAuth();

$jobs = json_decode(file_get_contents(JOBS_FILE), true);
$id = $_GET['id'] ?? null;
$job = null;

if ($id) {
    foreach ($jobs as $j) {
        if ($j['id'] == $id) {
            $job = $j;
            break;
        }
    }
}

// Redirect if job not found and not creating new
if (!$job && $id !== 'new') {
    header('Location: dashboard.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'];
    $title = $_POST['title'];
    $location = $_POST['location'];
    $description = $_POST['description'];
    $skills = isset($_POST['skills']) ? json_decode($_POST['skills'], true) : [];

    // Validation
    $errors = [];
    if (empty($title)) $errors[] = "Title is required.";
    if (str_word_count($description) < 15) $errors[] = "Description must be at least 15 words.";

    if (empty($errors)) {
        if ($id === 'new') {
            $newJob = [
                'id' => time(),
                'title' => $title,
                'location' => $location,
                'skills' => $skills,
                'description' => $description
            ];
            $jobs[] = $newJob;
        } else {
            foreach ($jobs as &$j) {
                if ($j['id'] == $id) {
                    $j['title'] = $title;
                    $j['location'] = $location;
                    $j['skills'] = $skills;
                    $j['description'] = $description;
                    break;
                }
            }
        }
        file_put_contents(JOBS_FILE, json_encode(array_values($jobs), JSON_PRETTY_PRINT));
        header('Location: dashboard.php?msg=success');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $job ? 'Edit' : 'New'; ?> Job - Midas Admin</title>
    <link rel="stylesheet" href="../assets/css/bootstrap.css">
    <link rel="stylesheet" href="../assets/css/font-awesome-all.css">
    <style>
        :root { --midas-orange: #ff6a00; --dark-text: #1e1e1e; --radius: 14px; --white: #fff; }
        body { background: #f8f9fa; font-family: 'Ubuntu', sans-serif; }
        .navbar { background-color: var(--midas-orange); color: white; margin-bottom: 2rem; }
        .navbar-brand { color: white !important; font-weight: bold; }
        .card { border-radius: var(--radius); border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        
        .theme-btn {
            display: inline-block;
            padding: 12px 20px;
            background: var(--white);
            color: var(--dark-text) !important;
            border-radius: 8px;
            border:1px solid #000;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .theme-btn:hover {
            background: #e55f00;
            transform: translateY(-2px);
            color: #fff !important;
            border: none;
        }

        /* Chip Styles */
        #skillsContainer {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            background: #f1f3f5;
            border: 1px solid #dee2e6;
            border-radius: 50px;
            font-size: 14px;
            color: #495057;
            gap: 8px;
        }

        .chip-remove {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background: none;
            border: none;
            color: #adb5bd;
            cursor: pointer;
            transition: color 0.2s;
        }

        .chip-remove:hover {
            color: #fa5252;
        }

        .suggestions { position: absolute; background: white; border: 1px solid #ddd; width: 100%; z-index: 1000; border-radius: 4px; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .suggestion-item { padding: 10px 15px; cursor: pointer; transition: background 0.2s; }
        .suggestion-item:hover { background: #f8f9fa; color: var(--midas-orange); }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg">
        <div class="container">
            <a class="navbar-brand" href="dashboard.php">Midas Admin</a>
            <div class="ms-auto">
                <a href="dashboard.php" class="btn btn-outline-light btn-sm">Back to Dashboard</a>
            </div>
        </div>
    </nav>

    <div class="container pb-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-body p-4">
                        <h4 class="card-title mb-4 text-dark"><?php echo $job ? 'Edit' : 'Create New'; ?> Job Listing</h4>
                        
                        <?php if (!empty($errors)): ?>
                            <div class="alert alert-danger border-0 shadow-sm">
                                <ul class="mb-0">
                                    <?php foreach ($errors as $error): ?>
                                        <li><?php echo $error; ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endif; ?>

                        <form method="POST" id="jobForm">
                            <input type="hidden" name="id" value="<?php echo $id; ?>">
                            <input type="hidden" name="skills" id="skillsInput" value='<?php echo json_encode($job['skills'] ?? []); ?>'>

                            <div class="mb-4">
                                <label class="form-label font-weight-bold">Job Title</label>
                                <input type="text" name="title" class="form-control" required value="<?php echo htmlspecialchars($job['title'] ?? ''); ?>" placeholder="e.g. Senior Backend Engineer">
                            </div>

                            <div class="mb-4">
                                <label class="form-label font-weight-bold">Location</label>
                                <select name="location" class="form-control" required>
                                    <option value="Remote" <?php echo ($job['location'] ?? '') === 'Remote' ? 'selected' : ''; ?>>Remote</option>
                                    <option value="DKI Jakarta" <?php echo ($job['location'] ?? '') === 'DKI Jakarta' ? 'selected' : ''; ?>>DKI Jakarta</option>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="form-label font-weight-bold">Skill Set (Type and select to add)</label>
                                <div class="position-relative">
                                    <input type="text" id="skillSearch" class="form-control" placeholder="Type a skill (e.g. React, Node.js) and press Enter">
                                    <div id="suggestions" class="suggestions"></div>
                                </div>
                                <div id="skillsContainer">
                                    <!-- Chips will appear here -->
                                </div>
                            </div>

                            <div class="mb-4">
                                <label class="form-label font-weight-bold">Job Description</label>
                                <textarea name="description" class="form-control" rows="8" required placeholder="Describe the responsibilities, requirements, and benefits..."><?php echo htmlspecialchars($job['description'] ?? ''); ?></textarea>
                                <div class="d-flex justify-content-between mt-2">
                                    <small class="text-muted">Minimum 15 words required</small>
                                    <small class="font-weight-bold" id="wordCount">0 words</small>
                                </div>
                            </div>

                            <div class="text-end pt-3">
                                <button type="submit" class="theme-btn">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../assets/js/jquery.js"></script>
    <script src="job-details.js"></script>
</body>
</html>
