// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});

document.getElementById("commentForm").addEventListener("submit", function (e) {
  e.preventDefault();
  alert("Terima kasih atas komentarnya!");
  this.reset();
});
