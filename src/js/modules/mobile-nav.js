function mobileNav() {
  // Mobile nav button
  const navBtn = document.querySelector(".mobile-nav-btn");
  const nav = document.querySelector(".mobile-nav");

  navBtn.addEventListener("click", () => {
    nav.classList.toggle("mobile-nav--open");
    navBtn.classList.toggle("mobile-nav-btn--active");
    document.body.classList.toggle("no-scroll");
  });
}

export default mobileNav;
