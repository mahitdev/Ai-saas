const MENU_ID = "myai-send-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Send to MyAI",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const { appUrl } = await chrome.storage.sync.get(["appUrl"]);
  const baseUrl = appUrl || "https://myai-phi.vercel.app";
  const target = `${baseUrl}/dashboard?quickText=${encodeURIComponent(info.selectionText)}`;
  await chrome.tabs.create({ url: target });
});

