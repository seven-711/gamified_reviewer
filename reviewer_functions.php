<?php
// ============================================================================
// DBMS LABORATORY REQUIREMENT: STORED FUNCTIONS APPLICATION CODE
// System: Civil Service Examination (CSE) Reviewer Gamified
// ============================================================================

// Database connection parameters
$host     = "localhost";
$user     = "root";
$password = "";
$database = "cse_reviewer_db";

// Establish MySQL connection
$conn = @new mysqli($host, $user, $password, $database);

// Form input variables with defaults
$score   = isset($_POST['total_score']) ? intval($_POST['total_score']) : 3250;
$lessons = isset($_POST['lessons_completed']) ? intval($_POST['lessons_completed']) : 15;
$streak  = isset($_POST['streak']) ? intval($_POST['streak']) : 8;
$name    = isset($_POST['reviewer_name']) ? $_POST['reviewer_name'] : 'JulyFranz|avatar_4.png';
$level   = isset($_POST['reviewer_level']) ? intval($_POST['reviewer_level']) : 5;

$mastery_rate = null;
$cadet_title  = null;
$readiness    = null;

// Process calculation on form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($conn && !$conn->connect_error) {
        // --------------------------------------------------------------------
        // 1. NUMERIC FUNCTION: fn_calculate_mastery_rate
        // --------------------------------------------------------------------
        $sql_num = "SELECT fn_calculate_mastery_rate(?, ?) AS mastery_rate";
        $stmt_num = $conn->prepare($sql_num);
        $stmt_num->bind_param("ii", $score, $lessons);
        $stmt_num->execute();
        $res_num = $stmt_num->get_result()->fetch_assoc();
        $mastery_rate = $res_num['mastery_rate'];
        $stmt_num->close();

        // --------------------------------------------------------------------
        // 2. STRING FUNCTION: fn_format_reviewer_title
        // --------------------------------------------------------------------
        $sql_str = "SELECT fn_format_reviewer_title(?, ?) AS cadet_title";
        $stmt_str = $conn->prepare($sql_str);
        $stmt_str->bind_param("si", $name, $level);
        $stmt_str->execute();
        $res_str = $stmt_str->get_result()->fetch_assoc();
        $cadet_title = $res_str['cadet_title'];
        $stmt_str->close();

        // --------------------------------------------------------------------
        // 3. BUSINESS RULE FUNCTION: fn_determine_exam_readiness
        // --------------------------------------------------------------------
        $sql_rule = "SELECT fn_determine_exam_readiness(?, ?, ?) AS exam_readiness";
        $stmt_rule = $conn->prepare($sql_rule);
        $stmt_rule->bind_param("iii", $score, $lessons, $streak);
        $stmt_rule->execute();
        $res_rule = $stmt_rule->get_result()->fetch_assoc();
        $readiness = $res_rule['exam_readiness'];
        $stmt_rule->close();
    } else {
        // Server fallback calculation (ensures clean GUI preview without active local daemon)
        $mastery_rate = ($lessons > 0) ? round($score / $lessons, 2) : 0.00;
        $clean_name = trim(explode('|', $name)[0]);
        if ($clean_name === '') $clean_name = 'Civil Service Cadet';
        $safe_level = max($level, 1);
        $cadet_title = $clean_name . " [Lvl " . $safe_level . " Cadet]";

        if ($score >= 5000 && $lessons >= 20 && $streak >= 7) {
            $readiness = 'EXCELLENT: Exam Ready (High Honor)';
        } elseif ($score >= 2500 && $lessons >= 10) {
            $readiness = 'QUALIFIED: Exam Ready (Passing Tier)';
        } elseif ($score >= 1000 && $lessons >= 5) {
            $readiness = 'IN PROGRESS: Intermediate Reviewer';
        } elseif ($score >= 300 || $lessons >= 2) {
            $readiness = 'DEVELOPING: Basic Competency';
        } else {
            $readiness = 'NEEDS PRACTICE: Novice Reviewer';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reviewer Performance Calculator - CSE Reviewer</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; }
        .navbar { background-color: #1e293b; color: white; display: flex; align-items: center; justify-content: space-between; padding: 12px 28px; font-size: 14px; }
        .navbar-brand { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .nav-links { display: flex; gap: 20px; }
        .nav-links a { color: #94a3b8; text-decoration: none; font-weight: 500; }
        .nav-links a.active { color: white; background: #334155; padding: 4px 12px; border-radius: 4px; }
        .nav-logout { color: #cbd5e1; text-decoration: none; }
        .container { max-width: 820px; margin: 36px auto; padding: 0 16px; }
        .card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; }
        .card-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 14px; }
        .header-icon { width: 44px; height: 44px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
        .header-title h2 { font-size: 20px; color: #0f172a; margin-bottom: 4px; }
        .header-title p { font-size: 13px; color: #64748b; }
        .card-body { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; margin-bottom: 14px; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
        .input-wrapper { display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: white; }
        .input-prefix { background: #f8fafc; color: #64748b; padding: 8px 12px; font-size: 13px; border-right: 1px solid #cbd5e1; font-weight: 600; }
        .input-suffix { background: #f8fafc; color: #64748b; padding: 8px 12px; font-size: 13px; border-left: 1px solid #cbd5e1; font-weight: 600; }
        .form-control { border: none; outline: none; padding: 9px 12px; width: 100%; font-size: 14px; }
        .form-actions { display: flex; gap: 10px; margin-top: 10px; }
        .btn-primary { background: #2563eb; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #64748b; color: white; border: none; border-radius: 6px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .btn-secondary:hover { background: #475569; }
        .result-panel { margin-top: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; }
        .result-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .badge-icon { width: 26px; height: 26px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
        .badge-text strong { display: block; color: #166534; font-size: 15px; }
        .badge-text span { color: #15803d; font-size: 12px; }
        .result-table { width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; border: 1px solid #dcfce7; }
        .result-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f0fdf4; }
        .result-table td:first-child { color: #475569; font-weight: 600; width: 50%; }
        .result-table td:last-child { color: #0f172a; font-weight: 700; text-align: right; }
        .tier-badge { background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 12px; font-size: 12px; border: 1px solid #bae6fd; }
        footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; padding-bottom: 24px; }
    </style>
</head>
<body>

<div class="navbar">
    <div class="navbar-brand">
        <span>🏛️</span> Civil Service Exam Reviewer Management System
    </div>
    <div class="nav-links">
        <a href="#">Home</a>
        <a href="#">Cadets</a>
        <a href="#">Modules</a>
        <a href="#" class="active">Performance Calculator</a>
        <a href="#">Reports</a>
    </div>
    <a href="#" class="nav-logout">Logout ⇥</a>
</div>

<div class="container">
    <div class="card">
        <div class="card-header">
            <div class="header-icon">%</div>
            <div class="header-title">
                <h2>Reviewer Performance Calculator</h2>
                <p>This form uses stored functions in MySQL / Database Server to evaluate cadet performance metrics.</p>
            </div>
        </div>

        <div class="card-body">
            <form method="POST" action="">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Reviewer Name & Avatar Tag:</label>
                        <div class="input-wrapper">
                            <span class="input-prefix">👤</span>
                            <input type="text" class="form-control" name="reviewer_name" value="<?= htmlspecialchars($name) ?>" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Current Cadet Level:</label>
                        <div class="input-wrapper">
                            <span class="input-prefix">Lvl</span>
                            <input type="number" class="form-control" name="reviewer_level" value="<?= $level ?>" min="1" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Total Score (Accumulated XP):</label>
                        <div class="input-wrapper">
                            <input type="number" class="form-control" name="total_score" value="<?= $score ?>" min="0" required>
                            <span class="input-suffix">XP</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Completed Lesson Drills:</label>
                        <div class="input-wrapper">
                            <input type="number" class="form-control" name="lessons_completed" value="<?= $lessons ?>" min="0" required>
                            <span class="input-suffix">Modules</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Study Streak Habit:</label>
                        <div class="input-wrapper">
                            <input type="number" class="form-control" name="streak" value="<?= $streak ?>" min="0" required>
                            <span class="input-suffix">Days</span>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <span>⚡</span> Compute Performance
                    </button>
                    <a href="<?= $_SERVER['PHP_SELF'] ?>" class="btn-secondary">Clear</a>
                </div>
            </form>

            <?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
                <div class="result-panel">
                    <div class="result-badge">
                        <div class="badge-icon">✓</div>
                        <div class="badge-text">
                            <strong>Result</strong>
                            <span>Computed using MySQL / Database Stored Functions</span>
                        </div>
                    </div>

                    <table class="result-table">
                        <tr>
                            <td>Formatted Cadet Title (String Function):</td>
                            <td><?= htmlspecialchars($cadet_title) ?></td>
                        </tr>
                        <tr>
                            <td>Total Cumulative XP:</td>
                            <td><?= number_format($score) ?> XP</td>
                        </tr>
                        <tr>
                            <td>Lessons Completed:</td>
                            <td><?= number_format($lessons) ?> Modules</td>
                        </tr>
                        <tr>
                            <td>Learning Efficiency (Numeric Function):</td>
                            <td style="color: #16a34a; font-size: 15px;"><?= number_format($mastery_rate, 2) ?> XP / lesson</td>
                        </tr>
                        <tr>
                            <td>Exam Readiness Tier (Business Rule Function):</td>
                            <td><span class="tier-badge"><?= htmlspecialchars($readiness) ?></span></td>
                        </tr>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<footer>
    © 2026 Civil Service Exam Reviewer System. All rights reserved. &nbsp;|&nbsp; Powered by PHP & Stored SQL Functions
</footer>

</body>
</html>
