// Set a persistent cookie with the user's login status
function setLoginStatus(status, email) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    document.cookie = `loginStatus=${status}; email=${email}; expires=${expires.toUTCString()}; path=/`;
}

// Get the user's login status and email from the persistent cookie
function getLoginStatus() {
    const cookies = document.cookie.split("; ");
    let loginStatus = null;
    let email = null;
    for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "loginStatus") {
            loginStatus = value;
        }
        if (name === "email") {
            email = value;
        }
    }
    return { loginStatus, email };
}

/*
The function returns an object containing both the loginStatus and email values, 
so the possible return values are:

{ loginStatus: "loggedIn", email: "user@example.com" }
{ loginStatus: null, email: "user@example.com" }
{ loginStatus: "loggedIn", email: null }
{ loginStatus: null, email: null }
*/

// // Example usage
// setLoginStatus("loggedIn", email);
// console.log(getLoginStatus()); // "loggedIn"