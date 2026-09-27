<?php
// Database connection
$host = "localhost";
$user = "root";
$password = "";
$database = "cse_reviewer_db";

$conn = @new mysqli($host, $user, $password, $database);
if ($conn && $conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get total score and completed lessons from form
$score = 0;
$lessons = 0;
if (isset($_POST['score']) && isset($_POST['lessons'])) {
    $score = intval($_POST['score']);
    $lessons = intval($_POST['lessons']);
}

$mastery_rate = 0.00;
if ($lessons > 0) {
    if ($conn && !$conn->connect_error) {
        // Call the stored function from MySQL / Database Server
        $sql = "SELECT fn_calculate_mastery_rate(?, ?) AS mastery_rate";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $score, $lessons); // 'ii' means two integers
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $mastery_rate = $row['mastery_rate'];
        $stmt->close();
    } else {
        // Fallback calculation for standalone evaluation
        $mastery_rate = round($score / $lessons, 2);
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Compute Mastery Rate using Stored Function</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
        .box { background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; max-width: 500px; }
        .result { margin-top: 15px; padding: 12px; background: #dcfce7; border: 1px solid #86efac; border-radius: 6px; }
        input[type="number"] { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; width: 100px; margin-right: 10px; }
        button { background: #2563eb; color: white; border: none; padding: 7px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    </style>
</head>
<body>

<div class="box">
    <h3>Compute Learning Efficiency using Stored Function</h3>
    <form method="POST">
        <label>Total Score (XP):</label>
        <input type="number" name="score" value="<?= $score ?: 3250 ?>" required>
        <label>Lessons:</label>
        <input type="number" name="lessons" value="<?= $lessons ?: 15 ?>" required>
        <button type="submit">Compute</button>
    </form>

    <?php if ($lessons > 0): ?>
        <div class="result">
            <p><strong>Total Score:</strong> <?= number_format($score) ?> XP</p>
            <p><strong>Completed Lessons:</strong> <?= number_format($lessons) ?> Modules</p>
            <p><strong>Mastery Rate (Computed via Stored Function):</strong> <?= number_format($mastery_rate, 2) ?> XP/lesson</p>
        </div>
    <?php endif; ?>
</div>

</body>
</html>
