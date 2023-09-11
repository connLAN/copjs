<?php
$dir = 'public/img';
$images = array();

if (is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
            if (!is_dir($dir . '/' . $file) && preg_match('/\.(jpg|jpeg|png|gif)$/', $file)) {
                $images[] = array(
                    'url' => 'img/' . $file,
                    'alt' => pathinfo($file, PATHINFO_FILENAME)
                );
            }
        }
        closedir($dh);
    }
}

header('Content-Type: application/json');
echo json_encode($images);
?>
