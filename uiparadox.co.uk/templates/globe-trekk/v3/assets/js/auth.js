import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const panel = document.querySelector("[data-auth-panel]");

if (panel) {
  const tabs = [...panel.querySelectorAll("[data-auth-tab]")];
  const views = [...panel.querySelectorAll("[data-auth-view]")];
  const notice = panel.querySelector("[data-firebase-notice]");
  const formsHost = panel.querySelector("[data-auth-forms]");
  const status = panel.querySelector("[data-auth-status]");
  const userPanel = panel.querySelector("[data-auth-user]");
  const userName = panel.querySelector("[data-user-name]");
  const userEmail = panel.querySelector("[data-user-email]");
  const protectedBlocks = [...panel.querySelectorAll("[data-auth-required]")];

  const showStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  const showView = (name) => {
    tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.authTab === name)));
    views.forEach((view) => {
      view.hidden = view.dataset.authView !== name;
    });
    showStatus("");
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.authTab)));

  const friendlyError = (error) => {
    const messages = {
      "auth/email-already-in-use": "An account already uses this email address.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/weak-password": "Choose a stronger password that meets the Firebase policy.",
      "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
      "auth/network-request-failed": "The network request failed. Check your connection and try again.",
      "auth/operation-not-allowed": "Email and password sign-in is not enabled in Firebase Console.",
    };

    return messages[error?.code] || "Firebase could not complete the request. Check the console configuration and try again.";
  };

  const setBusy = (form, busy) => {
    const button = form.querySelector("button[type='submit']");
    button.disabled = busy;
    button.setAttribute("aria-busy", String(busy));
  };

  const startAuth = async () => {
    if (!isFirebaseConfigured) {
      panel.querySelectorAll("form button[type='submit']").forEach((button) => {
        button.disabled = true;
        button.title = "Add the Firebase web configuration first";
      });
      showStatus("Complete FIREBASE_SETUP.md before testing authentication.", true);
      return;
    }

    try {
      const [{ initializeApp }, authModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
      ]);

      const {
        browserLocalPersistence,
        createUserWithEmailAndPassword,
        getAuth,
        onAuthStateChanged,
        sendPasswordResetEmail,
        setPersistence,
        signInWithEmailAndPassword,
        signOut,
        updateProfile,
      } = authModule;

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);
      notice.hidden = true;

      const loginForm = panel.querySelector("[data-login-form]");
      const registerForm = panel.querySelector("[data-register-form]");
      const resetForm = panel.querySelector("[data-reset-form]");
      const logoutButton = panel.querySelector("[data-logout]");

      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setBusy(loginForm, true);
        showStatus("Signing in...");
        const data = new FormData(loginForm);
        try {
          await signInWithEmailAndPassword(auth, data.get("email").trim(), data.get("password"));
          loginForm.reset();
        } catch (error) {
          showStatus(friendlyError(error), true);
        } finally {
          setBusy(loginForm, false);
        }
      });

      registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(registerForm);
        const password = data.get("password");
        const confirmation = data.get("confirmPassword");

        if (password !== confirmation) {
          showStatus("The password confirmation does not match.", true);
          return;
        }

        setBusy(registerForm, true);
        showStatus("Creating your account...");
        try {
          const credential = await createUserWithEmailAndPassword(auth, data.get("email").trim(), password);
          await updateProfile(credential.user, { displayName: data.get("name").trim() });
          registerForm.reset();
          showStatus("Your account is ready.");
        } catch (error) {
          showStatus(friendlyError(error), true);
        } finally {
          setBusy(registerForm, false);
        }
      });

      resetForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setBusy(resetForm, true);
        showStatus("Requesting a reset email...");
        const data = new FormData(resetForm);
        try {
          await sendPasswordResetEmail(auth, data.get("email").trim());
          resetForm.reset();
          showStatus("If the address belongs to an account, Firebase will send password reset instructions.");
        } catch (error) {
          showStatus(friendlyError(error), true);
        } finally {
          setBusy(resetForm, false);
        }
      });

      logoutButton.addEventListener("click", async () => {
        try {
          await signOut(auth);
          showStatus("You have signed out.");
        } catch (error) {
          showStatus(friendlyError(error), true);
        }
      });

      onAuthStateChanged(auth, (user) => {
        formsHost.hidden = Boolean(user);
        userPanel.hidden = !user;
        protectedBlocks.forEach((block) => {
          block.hidden = !user;
        });

        if (user) {
          userName.textContent = user.displayName || "Your PanaRoots account";
          userEmail.textContent = user.email || "";
        } else {
          userName.textContent = "Your account";
          userEmail.textContent = "";
        }
      });
    } catch (error) {
      notice.hidden = false;
      notice.textContent = "Firebase could not load. Confirm that you are online, using a local web server and that the configuration is valid.";
      showStatus(friendlyError(error), true);
    }
  };

  startAuth();
}
