(function initProfileAvatar() {
  var MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
  var ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  var avatarUrlCache = new Map();

  function hasWorker() {
    return window.claimProofStorage && typeof window.claimProofStorage.hasWorkerUrl === "function"
      ? window.claimProofStorage.hasWorkerUrl()
      : false;
  }

  function getR2() {
    if (!window.claimProofStorage) {
      throw new Error("claim-proof-storage.js must be loaded before profile-avatar.js.");
    }
    return window.claimProofStorage;
  }

  function buildAvatarKey(userId) {
    var randomPart = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      ? crypto.randomUUID()
      : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    return "r2/" + userId + "/profile/avatar-" + randomPart + ".jpg";
  }

  function isR2Key(value) {
    return typeof value === "string" && value.startsWith("r2/");
  }

  function validateImageFile(file) {
    if (!file) {
      throw new Error("Please choose an image file first.");
    }
    var mimeType = String(file.type || "").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error("Only JPG, PNG, and WebP images are allowed for profile avatars.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Avatar image is too large. Maximum size is 2 MB.");
    }
  }

  async function getSupabase() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }
    return window.supabaseClient;
  }

  async function uploadProfileAvatar(file) {
    if (!hasWorker()) {
      throw new Error("Cloudflare Worker URL is not configured for avatar uploads.");
    }
    if (!file) {
      throw new Error("Please choose an image file first.");
    }
    validateImageFile(file);

    var r2 = getR2();
    var user = await r2.getCurrentUserSafe();
    if (!user) {
      throw new Error("Please log in before uploading a profile avatar.");
    }

    var token = await r2.getAccessToken();
    var objectKey = buildAvatarKey(user.id);
    var workerBase = r2.getWorkerBaseUrl();

    var uploadGrant = await r2.postJson(
      workerBase + "/api/claim-proofs/upload-token",
      {
        objectKey: objectKey,
        contentType: file.type || "image/jpeg",
        sizeBytes: Number(file.size || 0),
      },
      token
    );

    var uploadUrl = uploadGrant && uploadGrant.uploadUrl;
    if (!uploadUrl) {
      throw new Error("Upload token response was missing uploadUrl.");
    }

    var uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      var uploadMessage = "Upload failed (" + uploadResponse.status + ")";
      try {
        var uploadPayload = await uploadResponse.json();
        uploadMessage = uploadPayload && (uploadPayload.error || uploadPayload.message) || uploadMessage;
      } catch (e) {}
      throw new Error(uploadMessage);
    }

    var resolvedKey = uploadGrant.objectKey || objectKey;

    var supabase = await getSupabase();
    var updateResult = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_r2_key: resolvedKey }, { onConflict: "id" });

    if (updateResult.error) {
      throw new Error("Could not save avatar to profile: " + (updateResult.error.message || "unknown error"));
    }

    var signed = await r2.signR2ObjectKey(resolvedKey, token, 60 * 60);
    avatarUrlCache.set(resolvedKey, signed.signedUrl || "");
    avatarUrlCache.set(user.id, signed.signedUrl || "");

    return {
      key: resolvedKey,
      previewUrl: signed.signedUrl || "",
    };
  }

  async function resolveAvatarUrl(storedValue) {
    var value = String(storedValue || "").trim();
    if (!value) return "";

    if (/^data:/i.test(value)) return value;
    if (/^https?:\/\//i.test(value)) return value;

    if (isR2Key(value)) {
      var cached = avatarUrlCache.get(value);
      if (cached) return cached;

      if (!hasWorker()) return "";

      var r2 = getR2();
      var token;
      try {
        token = await r2.getAccessToken();
      } catch (e) {
        return "";
      }
      var signed = await r2.signR2ObjectKey(value, token, 60 * 60);
      var url = signed && signed.signedUrl ? signed.signedUrl : "";
      if (url) {
        avatarUrlCache.set(value, url);
      }
      return url;
    }

    return "";
  }

  async function removeProfileAvatar() {
    var r2 = getR2();
    var user = await r2.getCurrentUserSafe();
    if (!user) {
      throw new Error("Please log in before removing your avatar.");
    }

    var supabase = await getSupabase();
    var updateResult = await supabase
      .from("profiles")
      .update({ avatar_r2_key: null })
      .eq("id", user.id);

    if (updateResult.error) {
      throw new Error("Could not remove avatar: " + (updateResult.error.message || "unknown error"));
    }

    avatarUrlCache.delete(user.id);
  }

  async function hydrateAvatarEl(imgElement, profile) {
    if (!imgElement || !(imgElement instanceof HTMLImageElement)) return;

    var avatarKey = profile && profile.avatar_r2_key ? String(profile.avatar_r2_key).trim() : "";

    if (!avatarKey) {
      imgElement.src = "";
      imgElement.alt = "No profile avatar";
      imgElement.style.display = "none";
      return;
    }

    var url = await resolveAvatarUrl(avatarKey);
    if (url) {
      imgElement.src = url;
      imgElement.alt = (profile && profile.full_name) ? profile.full_name : "Profile avatar";
      imgElement.style.display = "";
      imgElement.onerror = function () {
        imgElement.style.display = "none";
      };
    } else {
      imgElement.src = "";
      imgElement.style.display = "none";
    }
  }

  async function hydrateHeaderAvatar(containerEl, options) {
    if (!containerEl) return;

    var profile;
    if (window.getCurrentProfile && typeof window.getCurrentProfile === "function") {
      profile = await window.getCurrentProfile();
    } else {
      return;
    }

    var size = (options && options.size) || 40;
    var existingImg = containerEl.querySelector(".header-avatar-img");

    if (profile && profile.avatar_r2_key) {
      var url = await resolveAvatarUrl(profile.avatar_r2_key);
      if (url) {
        if (!existingImg) {
          var img = document.createElement("img");
          img.className = "header-avatar-img";
          img.width = size;
          img.height = size;
          img.alt = (profile.full_name || "Profile") + " avatar";
          img.style.cssText = "width:" + size + "px;height:" + size + "px;border-radius:999px;object-fit:cover;vertical-align:middle;margin-right:2px;";
          img.onerror = function () {
            img.style.display = "none";
          };
          img.onerror = function () { img.style.display = "none"; img.removeAttribute("src"); };
          containerEl.prepend(img);
          img.src = url;
        } else {
          existingImg.src = url;
          existingImg.style.display = "";
        }
        return;
      }
    }

    if (existingImg) {
      existingImg.style.display = "none";
    }
  }

  async function hydrateAvatarsForItems(items, imgSelectorFn) {
    if (!items || !items.length) return;

    var r2 = getR2();
    var supabase = await getSupabase();

    var employeeIds = [];
    items.forEach(function (item) {
      var eid = item.employee_id || item.employeeId || item.id;
      if (eid && employeeIds.indexOf(eid) === -1) {
        employeeIds.push(eid);
      }
    });

    if (!employeeIds.length) return;

    var profileMap = {};
    for (var i = 0; i < employeeIds.length; i++) {
      var uid = employeeIds[i];
      var result = await supabase
        .from("profiles")
        .select("id, avatar_r2_key, full_name")
        .eq("id", uid)
        .maybeSingle();

      if (result.data) {
        profileMap[uid] = result.data;
      }
    }

    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var eid2 = item.employee_id || item.employeeId || item.id;
      var prof = profileMap[eid2];
      if (!prof) continue;

      var img = typeof imgSelectorFn === "function" ? imgSelectorFn(item) : null;
      if (!img || !(img instanceof HTMLImageElement)) continue;

      if (prof.avatar_r2_key) {
        var url = await resolveAvatarUrl(prof.avatar_r2_key);
        if (url) {
          img.src = url;
          img.alt = (prof.full_name || "Employee") + " avatar";
          img.style.display = "";
          img.onerror = function () { img.style.display = "none"; img.removeAttribute("src"); };
        }
      }
    }
  }

  window.profileAvatar = {
    uploadProfileAvatar: uploadProfileAvatar,
    resolveAvatarUrl: resolveAvatarUrl,
    removeProfileAvatar: removeProfileAvatar,
    hydrateAvatarEl: hydrateAvatarEl,
    hydrateHeaderAvatar: hydrateHeaderAvatar,
    hydrateAvatarsForItems: hydrateAvatarsForItems,
    isR2Key: isR2Key,
  };
})();
