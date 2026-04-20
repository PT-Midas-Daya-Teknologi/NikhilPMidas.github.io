<?php
require_once 'auth.php';
checkAuth();

$jobs = json_decode(file_get_contents(JOBS_FILE), true);

$message = '';
if (isset($_GET['msg']) && $_GET['msg'] === 'success') {
    $message = 'Job listing saved successfully.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'delete') {
        $idToDelete = $_POST['id'];
        $jobs = array_filter($jobs, function($job) use ($idToDelete) {
            return $job['id'] != $idToDelete;
        });
        file_put_contents(JOBS_FILE, json_encode(array_values($jobs), JSON_PRETTY_PRINT));
        $message = 'Job deleted successfully.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Midas Teknologi</title>
    <link rel="stylesheet" href="../assets/css/bootstrap.css">
    <link rel="stylesheet" href="../assets/css/font-awesome-all.css">
    <style>
        :root { --midas-orange: #ff6a00; }
        body { background: #f8f9fa; }
        .navbar { background-color: var(--midas-orange); color: white; margin-bottom: 2rem; }
        .navbar-brand { color: white !important; font-weight: bold; }
        .card { border-radius: 10px; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .btn-midas { background-color: var(--midas-orange); border-color: var(--midas-orange); color: white; }
        .btn-midas:hover { background-color: #e55f00; border-color: #e55f00; color: white; }
        .job-link { color: inherit; text-decoration: none; display: block; }
        .job-link:hover { color: var(--midas-orange); }
        .table thead { background: #f1f1f1; }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg">
        <div class="container">
            <a class="navbar-brand" href="#">Midas Admin</a>
            <div class="ms-auto">
                <a href="logout.php" class="btn btn-outline-light btn-sm">Logout</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <?php if ($message): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <?php echo $message; ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>Job Listings Management</h3>
            <a href="job-details.php?id=new" class="btn btn-midas"><i class="fas fa-plus mr-2"></i> Create New Job</a>
        </div>

        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Job Title (Click to Edit)</th>
                                <th>Location</th>
                                <th>Skill Set</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($jobs)): ?>
                                <tr>
                                    <td colspan="4" class="text-center p-4">No job listings found.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($jobs as $job): ?>
                                    <tr>
                                        <td>
                                            <a href="job-details.php?id=<?php echo $job['id']; ?>" class="job-link">
                                                <strong><?php echo htmlspecialchars($job['title']); ?></strong>
                                            </a>
                                        </td>
                                        <td><?php echo htmlspecialchars($job['location']); ?></td>
                                        <td>
                                            <?php foreach ($job['skills'] as $skill): ?>
                                                <span class="badge bg-secondary mb-1"><?php echo htmlspecialchars($skill); ?></span>
                                            <?php endforeach; ?>
                                        </td>
                                        <td>
                                            <form method="POST" data-confirm="Are you sure you want to delete this job?">
                                                <input type="hidden" name="action" value="delete">
                                                <input type="hidden" name="id" value="<?php echo $job['id']; ?>">
                                                <button type="submit" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="../assets/js/jquery.js"></script>
    <script src="../assets/js/bootstrap.min.js"></script>
    <script src="admin.js"></script>
</body>
</html>
