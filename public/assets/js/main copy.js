document.addEventListener("DOMContentLoaded", function () {
      const searchInput = document.querySelector(".headersearchinput input");
      const showSearchBox = document.querySelector(".showsearchbox");
      const cancelBtn = document.querySelector(".searchtop a");
      const html = document.documentElement; // <html> element
      const body = document.body;

      // Show search box on input click
      searchInput.addEventListener("focus", function () {
         showSearchBox.classList.add("active");
         html.style.overflow = "hidden"; 
         body.style.overflow = "hidden"; 
      });

      // Hide search box on Cancel click
      cancelBtn.addEventListener("click", function (e) {
         e.preventDefault();
         showSearchBox.classList.remove("active");
         html.style.overflow = ""; 
         body.style.overflow = ""; 
      });
   });


   document.addEventListener("DOMContentLoaded", function () {
    const profileToggle = document.querySelector(".profiletoggle");
    const profileMenu = document.querySelector(".profilemenuss");
    const html = document.documentElement;
    const body = document.body;

    profileToggle.addEventListener("click", function (e) {
      e.preventDefault();

      // toggle active
      profileMenu.classList.toggle("active");

      if (profileMenu.classList.contains("active")) {
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
      } else {
        html.style.overflow = "";
        body.style.overflow = "";
      }
    });
  });


  document.addEventListener("DOMContentLoaded", function () {
    const barsBtn = document.querySelector(".barsbtn");
    const mainMenu = document.querySelector(".mainmenu");
    const html = document.documentElement;
    const body = document.body;

    barsBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // toggle active
      mainMenu.classList.toggle("active");

      if (mainMenu.classList.contains("active")) {
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
      } else {
        html.style.overflow = "";
        body.style.overflow = "";
      }
    });
  });