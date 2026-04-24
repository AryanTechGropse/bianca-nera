document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".headersearchinput input");
  const showSearchBox = document.querySelector(".showsearchbox");
  const cancelBtn = document.querySelector(".searchtop a");

  /* 
    // LEGACY HANDLERS - Disabled to avoid conflicts with React state
    // Show search box on input click
    searchInput.addEventListener("focus", function () {
      showSearchBox.classList.add("active");
    });
  
    // Hide search box on Cancel click
    cancelBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showSearchBox.classList.remove("active");
    });
  */
});

document.addEventListener("DOMContentLoaded", function () {
  const profileToggle = document.querySelector(".profiletoggle");
  const profileMenu = document.querySelector(".profilemenuss");

  /*
    profileToggle.addEventListener("click", function (e) {
      e.preventDefault();
      // toggle active
      profileMenu.classList.toggle("active");
    });
  */
});

document.addEventListener("DOMContentLoaded", function () {
  const barsBtn = document.querySelector(".barsbtn");
  const mainMenu = document.querySelector(".mainmenu");

  /*
    barsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // toggle active
      mainMenu.classList.toggle("active");
    });
  */
});


document.addEventListener("DOMContentLoaded", function () {
  // Select all filter headers
  const filterHeads = document.querySelectorAll(".fiterboxhead");

  filterHeads.forEach(head => {
    head.addEventListener("click", function () {
      // Toggle active class on the parent filterbox
      this.parentElement.classList.toggle("active");
    });
  });
});
