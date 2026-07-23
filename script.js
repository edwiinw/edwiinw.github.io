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
  const portrait = document.querySelector("[data-portrait]");
  const cursor = document.querySelector(".cursor-dot");
  const magnets = document.querySelectorAll(".magnetic");
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener("pointermove", (event) => {
    cursor.style.opacity = "1";
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;

    const rect = portrait.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
    const y = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
    targetX = Math.max(-1, Math.min(1, x * 2));
    targetY = Math.max(-1, Math.min(1, y * 2));
  });

  const renderPortrait = () => {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    portrait.style.transform = `perspective(1000px) rotateY(${currentX * 6}deg) rotateX(${-currentY * 5}deg) translate3d(${currentX * 6}px, ${currentY * 5}px, 0)`;
    requestAnimationFrame(renderPortrait);
  };
  renderPortrait();

  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
    link.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
  });

  magnets.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}
