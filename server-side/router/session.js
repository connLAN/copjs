const serverSessions = {};

function getSessionId(email) {
  return Promise.resolve(serverSessions[email]);
}

function storeSessionId(email, sessionId) {
  serverSessions[email] = sessionId;
}

// When the user logs out, delete the session data from the sessions object
function deleteSession(sessionID) {
  delete serverSessions[sessionID];
}

// Retrieve the session data associated with the given session ID from the sessions object
function getSessionData(sessionID) {
  const session = serverSessions[sessionID];
  if (session) {
    return session.userData;
  } else {
    return null;
  }
}

function checkSession(req, res, next) {
  const sessionId = req.session.id;
  const email = req.session.user.email;
  const rememberMeToken = req.cookies.rememberMe;

  if (rememberMeToken) {
    const storedUsername = rememberMeTokens[rememberMeToken];
    if (!storedUsername || storedUsername !== email) {
      req.session.destroy();
      // // res.clearCookie('rememberMe');
      // res.redirect('/login');
      return;
    }
  }

  const storedSessionId = serverSessions[email];
  if (!storedSessionId || storedSessionId !== sessionId) {
    req.session.destroy();
    // res.redirect('/login');
    return;
  }

  next();
}


function logoutOtherLogins(reqEmail) {
  console.log("logoutOtherLogins(" + reqEmail +") is called!");
  for (const email in serverSessions) {
    const sessionId = serverSessions[email];
    console.log(`Email: ${email}, Session ID: ${sessionId}`);
    if (email === reqEmail) {
      // remove the session ID from the serverSessions object
      delete serverSessions[email];
    }
  }
}

module.exports = {
  serverSessions,
  getSessionId,
  storeSessionId,
  deleteSession,
  getSessionData,
  checkSession,
  logoutOtherLogins
};