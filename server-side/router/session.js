const serverSessions = {};

function getSessionId(email) {
  return Promise.resolve(serverSessions[email]);
}

function storeSessionId(email, sessionId) {
  serverSessions[email] = sessionId;
}

function checkSession(req, res, next) {
  const sessionId = req.session.id;
  const email = req.session.user.email;
  const rememberMeToken = req.cookies.rememberMe;

  if (rememberMeToken) {
    const storedUsername = rememberMeTokens[rememberMeToken];
    if (!storedUsername || storedUsername !== email) {
      req.session.destroy();
      res.clearCookie('rememberMe');
      res.redirect('/login');
      return;
    }
  }

  const storedSessionId = serverSessions[email];
  if (!storedSessionId || storedSessionId !== sessionId) {
    req.session.destroy();
    res.redirect('/login');
    return;
  }

  next();
}


function logoutOtherLogins(reqEmail) {
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
  checkSession,
  logoutOtherLogins
};