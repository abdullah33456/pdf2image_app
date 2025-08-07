// frontend/script.js
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const convertBtn = document.getElementById("convertBtn");
  const progressBar = document.getElementById("progressBar");
  const statusText = document.getElementById("statusText");
  const previewContainer = document.getElementById("previewContainer");
  const emptyState = document.querySelector('.empty-state');

  function setStatus(text, color) {
    statusText.textContent = text;
    if (color) statusText.style.color = color;
  }

  convertBtn.addEventListener("click", () => {
    if (!fileInput.files || fileInput.files.length === 0) {
      setStatus("Please select a PDF file first", "var(--warning)");
      fileInput.classList.add("pulse");
      setTimeout(()=> fileInput.classList.remove("pulse"), 800);
      return;
    }
    uploadAndConvert(fileInput.files[0]);
  });

  function uploadAndConvert(file) {
    const fd = new FormData();
    fd.append("file", file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/convert-pdf", true);
    xhr.responseType = "blob"; // we expect a zip blob back

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = `${Math.min(90, percent)}%`; // up to 90 while uploading
        setStatus(`Uploading... ${percent}%`);
      }
    };

    xhr.onprogress = (e) => {
      // progress for download (zip arriving) - show between 90-100
      // Not always reliable; mostly upload progress is what matters
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get filename from Content-Disposition
        const cd = xhr.getResponseHeader("Content-Disposition");
        let filename = "converted_images.zip";
        if (cd) {
          const m = cd.match(/filename="?([^"]+)"?/);
          if (m) filename = m[1];
        }

        // Download the zip
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // Read headers for preview
        const reqId = xhr.getResponseHeader("X-Req-Id");
        const pageCount = parseInt(xhr.getResponseHeader("X-Page-Count") || "0", 10);

        setStatus(`Conversion complete — download started (${filename})`, "var(--success)");
        progressBar.style.width = "100%";

        // populate previews if reqId present
        if (reqId && pageCount > 0) {
          populatePreviews(reqId, pageCount);
        }
      } else {
        // server error - try show text
        const reader = new FileReader();
        reader.onload = () => {
          const txt = reader.result;
          setStatus(`Conversion failed: ${txt}`, "var(--warning)");
        };
        reader.readAsText(xhr.response);
      }
    };

    xhr.onerror = () => {
      setStatus("Upload failed. Check connection.", "var(--warning)");
    };

    // start upload
    progressBar.style.width = "2%";
    setStatus("Starting upload...");
    xhr.send(fd);
  }

  function populatePreviews(reqId, pageCount) {
    // Remove empty state
    if (emptyState) emptyState.style.display = "none";

    // Clear previous previews
    previewContainer.innerHTML = "";

    for (let i=1; i<=pageCount; i++) {
      const padded = String(i).padStart(3, "0");
      const imageUrl = `/outputs/${reqId}/page_${padded}.png`;

      const previewItem = document.createElement("div");
      previewItem.className = "preview-item";
      previewItem.innerHTML = `
        <div class="preview-img"><img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" alt="Page ${i}" /></div>
        <div class="preview-info">
          <h4>Page ${i}</h4>
          <p>Format: PNG</p>
          <div class="preview-actions">
            <button class="action-btn download-btn"><i class="fas fa-download"></i> Download</button>
            <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
      previewContainer.appendChild(previewItem);

      // download button
      const dlBtn = previewItem.querySelector(".download-btn");
      dlBtn.addEventListener("click", () => {
        // download the single image
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = `page_${padded}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });

      // delete button
      const delBtn = previewItem.querySelector(".delete-btn");
      delBtn.addEventListener("click", () => {
        previewItem.remove();
        if (previewContainer.children.length === 0 && emptyState) emptyState.style.display = "block";
      });
    }
  }
});
