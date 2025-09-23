function mobileNav() {
  // Mobile nav button
  const navBtn = document.querySelector(".mobile-nav-btn");
  const nav = document.querySelector(".mobile-nav");
  const navLinks = document.querySelectorAll(".mobile-nav__list a");

  navBtn.addEventListener("click", () => {
    nav.classList.toggle("mobile-nav--open");
    navBtn.classList.toggle("mobile-nav-btn--active");
    document.body.classList.toggle("no-scroll");
  });

  navLinks.forEach((item) => {
    item.addEventListener("click", () => {
      nav.classList.remove("mobile-nav--open");
      navBtn.classList.remove("mobile-nav-btn--active");
      document.body.classList.remove("no-scroll");
    });
  });
}

export default mobileNav;
