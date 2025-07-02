function scroll() {
  window.addEventListener("scroll", () => {
    const headerTop = document.querySelector(".header__top");
    const headerBtn = document.getElementById("header-btn-1");
    const screenWidth = window.innerWidth;

    if (window.scrollY > 820 && screenWidth > 768) {
      headerTop.classList.add("fixed");
      headerBtn.classList.add("btn-nav--fixed");
    } else {
      headerTop.classList.remove("fixed");
      headerBtn.classList.remove("btn-nav--fixed");
    }
  });
}

export default scroll;
