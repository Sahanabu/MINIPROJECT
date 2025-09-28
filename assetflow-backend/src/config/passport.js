import passport from 'passport';

// Serialize user for session (if needed for future OAuth)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (if needed for future OAuth)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
