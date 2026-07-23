const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

if (!reducedMotion) {
  const reveals = [...document.querySelectorAll(".reveal")];
  reveals.forEach((element) => element.classList.add("is-pending"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  reveals.forEach((element) => observer.observe(element));
}

if (finePointer && !reducedMotion) {
  const cursor = document.querySelector(".cursor-dot");
  const magnets = document.querySelectorAll(".magnetic");

  window.addEventListener("pointermove", (event) => {
    cursor.style.opacity = "1";
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });

  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
    link.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
  });

  magnets.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate3d(${x * 0.1}px, ${y * 0.1}px, 0)`;
    });
    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}
