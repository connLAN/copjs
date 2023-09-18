

function getSessionData(sessionID) {
    // Send a GET request to the server to retrieve the session data
    let sessionID;

    return fetch(`/session/${sessionID}`)
        .then(response => response.json())
        .catch(error => {
            // Handle any errors that occur while retrieving the session data
            console.error(error);
        });
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

// get local cookie rememberMe
function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split("=");
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

// parse local cookie rememeberMe
function parseCookie(cookie) {
    const cookies = cookie.split("; ");
    let email = null;
    let token = null;
    let expires = null;
    let authType = null;
    for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "email") {
            email = value;
        }
        if (name === "token") {
            token = value;
        }
        if (name === "expires") {
            expires = value;
        }
        if (name === "authType") {
            authType = value;
        }
    }
    return { email, token, expires, authType };
} 

function getLocalData() {
    const cookie = getCookie("rememberMe");
    if (cookie) {
        return parseCookie(cookie);
    }
    return null;
}

// Example usage
// const data = getLocalData();
// if (data) {
//     console.log(data.email); // "user@example"
//     console.log(data.token); // "abc123"
//     console.log(data.expires); // "2021-01-01T00:00:00.000Z"
//     console.log(data.authType); // "local"
// }
