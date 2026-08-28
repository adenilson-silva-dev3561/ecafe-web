function setupToast(toast) {
  if (!toast) return () => {};

  const messageElement = toast.querySelector(".auth-toast__message");
  const closeButton = toast.querySelector(".auth-toast__close");

  function hideToast() {
    toast.classList.add("is-closing");
    window.setTimeout(
      () => toast.classList.remove("is-visible", "is-closing"),
      260,
    );
  }

  function showToast(message) {
    if (!messageElement) return;

    messageElement.textContent = message;
    toast.classList.remove("is-visible", "is-closing");
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(hideToast, 4200);
  }

  closeButton?.addEventListener("click", () => {
    clearTimeout(showToast.timeoutId);
    hideToast();
  });

  return showToast;
}

export { setupToast };