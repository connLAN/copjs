<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <style>
        /* Styles for page layout */
        body {
            font-family: Arial, sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 4px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            position: relative;
        }
        /* Styles for profile menu */
        .profile-menu {
            position: absolute;
            top: 20px;
            right: 20px;
            display: inline-block;
        }
        .profile-menu-content {
            display: none;
            position: absolute;
            z-index: 1;
            top: 100%;
            right: 0;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            padding: 12px 16px;
        }
        .profile-menu:hover .profile-menu-content {
            display: block;
        }
        .profile-menu a {
            display: block;
            margin-bottom: 10px;
            color: #333;
            text-decoration: none;
        }
        /* Styles for page headings */
        h1 {
            font-size: 36px;
            margin-top: 40px;
            margin-bottom: 20px;
            text-align: center;
        }
        h2 {
            font-size: 24px;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        /* Styles for page content */
        p {
            font-size: 16px;
            margin-bottom: 10px;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="profile-menu">
            <img src="profile.jpg" alt="Profile Picture" width="50" height="50">
            <div class="profile-menu-content">
                <a href="#" id="my-profile-link">My Profile</a>
                <a href="#">Settings</a>
                <a href="#">Logout</a>
            </div>
        </div>
        <h1>Test Page</h1>
        <h2>Section 1</h2>
        <p>This is some sample text for section 1.</p>
        <p><a href="#">Learn more</a></p>
        <h2>Section 2</h2>
        <p>This is some sample text for section 2.</p>
        <p><a href="#">Learn more</a></p>
        <h2>Section 3</h2>
        <p>This is some sample text for section 3.</p>
        <p><a href="#">Learn more</a></p>
    </div>
    <script>
        // Show/hide profile menu on click
        const profileLink = document.getElementById("my-profile-link");
        profileLink.addEventListener("click", function() {
            alert("You clicked on My Profile!");
        });
    </script>
</body>
</html>