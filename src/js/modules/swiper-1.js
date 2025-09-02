import Swiper from "swiper/bundle";
import "swiper/css/bundle";

function swipe1() {
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
}

export default swipe1;
