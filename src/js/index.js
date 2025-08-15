import scroll from "./modules/scroll.js";
scroll();

import mobileNav from "./modules/mobile-nav.js";
mobileNav();

import popup from "./modules/popup.js";
popup(".dialog-1", "header-btn-1");
popup(".dialog-2", "header-btn-2", true);
popup(".dialog-2", "comfort-btn", true);

import toggleServicesTabs from "./modules/services-tabs.js";
toggleServicesTabs();

//Слайдер-----------------
import Swiper from "swiper/bundle";
import "swiper/css/bundle";

const swiper = new Swiper("#swiper-1", {
  loop: true,
  speed: 600,
  spaceBetween: 24,
  slidesPerView: "auto",
  centeredSlides: false,

  navigation: {
    nextEl: "#slideNext1",
    prevEl: "#sliderPrev1",
  },
});
