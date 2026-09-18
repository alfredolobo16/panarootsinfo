import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const page = document.querySelector("[data-profile-page]");

if (page) {
  const notice = page.querySelector("[data-profile-notice]");
  const content = page.querySelector("[data-profile-content]");
  const guest = page.querySelector("[data-profile-guest]");
  const name = page.querySelector("[data-profile-name]");
  const email = page.querySelector("[data-profile-email]");
  const displayName = page.querySelector("[data-profile-display-name]");
  const detailEmail = page.querySelector("[data-profile-detail-email]");
  const verification = page.querySelector("[data-profile-verification]");
  const initial = page.querySelector("[data-profile-initial]");
  const avatarImage = page.querySelector("[data-profile-avatar-image]");
  const avatarCanva = page.querySelector("[data-profile-avatar-canva]");
  const photoForm = page.querySelector("[data-profile-photo-form]");
  const photoInput = photoForm.querySelector("[name='photoURL']");
  const photoStatus = page.querySelector("[data-profile-photo-status]");
  const removePhotoButton = page.querySelector("[data-profile-photo-remove]");
  const logoutButton = page.querySelector("[data-profile-logout]");
  let currentUser = null;
  let avatarCanvaRevealTimer = 0;

  const setPhotoStatus = (message, isError = false) => {
    photoStatus.textContent = message;
    photoStatus.classList.toggle("is-error", isError);
  };

  const setPhotoBusy = (busy) => {
    photoForm.querySelector("button[type='submit']").disabled = busy;
    removePhotoButton.disabled = busy;
  };

  const syncProfilePhoto = (url) => {
    try {
      if (url) window.localStorage.setItem("panarootsProfilePhoto", url);
      else window.localStorage.removeItem("panarootsProfilePhoto");
    } catch (error) {
      // The page and header still update when browser storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent("panaroots:profile-photo", { detail: { url } }));
  };

  const getCanvaEmbedUrl = (value) => {
    try {
      const url = new URL(value);
      const isCanva = ["canva.com", "www.canva.com"].includes(url.hostname.toLowerCase());
      const isPublicView = /^\/design\/[^/]+\/(?:[^/]+\/)?view\/?$/.test(url.pathname);
      return isCanva && isPublicView ? `${url.origin}${url.pathname}?embed` : "";
    } catch (error) {
      return "";
    }
  };

  const renderPhoto = (url, userName) => {
    window.clearTimeout(avatarCanvaRevealTimer);
    initial.textContent = userName.trim().charAt(0).toUpperCase() || "P";
    removePhotoButton.hidden = !url;
    avatarImage.onload = null;
    avatarImage.onerror = null;
    avatarCanva.onload = null;

    if (!url) {
      avatarImage.hidden = true;
      avatarImage.removeAttribute("src");
      avatarCanva.hidden = true;
      avatarCanva.classList.remove("is-loading");
      avatarCanva.removeAttribute("src");
      initial.hidden = false;
      return;
    }

    const canvaEmbedUrl = getCanvaEmbedUrl(url);
    if (canvaEmbedUrl) {
      avatarImage.hidden = true;
      avatarImage.removeAttribute("src");
      avatarCanva.hidden = false;
      avatarCanva.classList.add("is-loading");
      const revealCanva = () => {
        if (avatarCanva.src !== canvaEmbedUrl) return;
        avatarCanva.classList.remove("is-loading");
        initial.hidden = true;
      };
      avatarCanva.onload = revealCanva;
      avatarCanva.src = canvaEmbedUrl;
      avatarCanvaRevealTimer = window.setTimeout(revealCanva, 1500);
      return;
    }

    avatarCanva.hidden = true;
    avatarCanva.classList.remove("is-loading");
    avatarCanva.removeAttribute("src");
    avatarImage.onload = () => {
      avatarImage.hidden = false;
      initial.hidden = true;
    };
    avatarImage.onerror = () => {
      avatarImage.hidden = true;
      initial.hidden = false;
      setPhotoStatus("The saved image could not be loaded. Add another public image URL.", true);
    };
    avatarImage.src = url;
  };

  const normalizePhotoUrl = (value) => {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error("invalid-protocol");
    return url.href;
  };

  const verifyImage = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error("image-timeout")), 10000);
    image.referrerPolicy = "no-referrer";
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("image-load-failed"));
    };
    image.src = url;
  });

  const showError = (message) => {
    notice.hidden = false;
    notice.textContent = message;
    content.hidden = true;
    guest.hidden = true;
  };

  const startProfile = async () => {
    if (!isFirebaseConfigured) {
      showError("Firebase is not configured yet. Complete the web app configuration before opening a profile.");
      return;
    }

    try {
      const [{ initializeApp }, authModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
      ]);

      const { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, signOut, updateProfile } = authModule;
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      photoForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!currentUser) return;

        setPhotoBusy(true);
        setPhotoStatus("Checking image...");
        try {
          const url = normalizePhotoUrl(photoInput.value.trim());
          if (!getCanvaEmbedUrl(url)) await verifyImage(url);
          await updateProfile(currentUser, { photoURL: url });
          photoInput.value = url;
          renderPhoto(url, currentUser.displayName || "Your PanaRoots account");
          syncProfilePhoto(url);
          setPhotoStatus("Your profile photo has been saved.");
        } catch (error) {
          setPhotoStatus("Use a direct public image URL or a public Canva design link ending in /view.", true);
        } finally {
          setPhotoBusy(false);
        }
      });

      removePhotoButton.addEventListener("click", async () => {
        if (!currentUser) return;

        setPhotoBusy(true);
        setPhotoStatus("Removing photo...");
        try {
          await updateProfile(currentUser, { photoURL: null });
          photoInput.value = "";
          renderPhoto("", currentUser.displayName || "Your PanaRoots account");
          syncProfilePhoto("");
          setPhotoStatus("Your profile photo has been removed.");
        } catch (error) {
          setPhotoStatus("PanaRoots could not remove the photo. Please try again.", true);
        } finally {
          setPhotoBusy(false);
        }
      });

      logoutButton.addEventListener("click", async () => {
        try {
          await signOut(auth);
          window.location.href = "account.html";
        } catch (error) {
          showError("PanaRoots could not sign you out. Please try again.");
        }
      });

      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        notice.hidden = true;
        content.hidden = !user;
        guest.hidden = Boolean(user);

        if (!user) {
          syncProfilePhoto("");
          return;
        }

        const userName = user.displayName || "Your PanaRoots account";
        const userEmail = user.email || "No email available";
        name.textContent = userName;
        email.textContent = userEmail;
        displayName.textContent = user.displayName || "Not added yet";
        detailEmail.textContent = userEmail;
        verification.textContent = user.emailVerified ? "Verified" : "Not verified yet";
        photoInput.value = user.photoURL || "";
        renderPhoto(user.photoURL || "", userName);
        syncProfilePhoto(user.photoURL || "");
      });
    } catch (error) {
      showError("Firebase could not load. Check your connection and web app configuration, then try again.");
    }
  };

  startProfile();
}
