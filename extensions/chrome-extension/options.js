const input = document.getElementById("appUrl");
const saveButton = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get(["appUrl"]).then((data) => {
  input.value = data.appUrl || "https://myai-phi.vercel.app";
});

saveButton.addEventListener("click", async () => {
  const appUrl = input.value.trim();
  await chrome.storage.sync.set({ appUrl });
  status.textContent = "Saved.";
  setTimeout(() => { status.textContent = ""; }, 1200);
});

