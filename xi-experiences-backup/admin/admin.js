/* XI events admin: confirm deletes, preview a chosen upload. No inline JS (CSP). */
(function () {
  document.querySelectorAll("form[data-confirm]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      if (!window.confirm(f.getAttribute("data-confirm"))) e.preventDefault();
    });
  });
  var up = document.getElementById("f-upload");
  if (up) {
    up.addEventListener("change", function () {
      var file = up.files && up.files[0];
      var old = document.querySelector(".adm-preview.is-new");
      if (old) old.remove();
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert("That image is larger than 5 MB. Please choose a smaller file.");
        up.value = "";
        return;
      }
      var fig = document.createElement("figure");
      fig.className = "adm-preview is-new";
      var img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.alt = "";
      var cap = document.createElement("figcaption");
      cap.textContent = "New upload: " + file.name;
      fig.appendChild(img);
      fig.appendChild(cap);
      up.closest(".field").after(fig);
    });
  }
})();
