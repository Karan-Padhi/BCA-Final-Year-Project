// =========================================
// 1. CONFIGURATION
// =========================================

const API_BASE_URL = "https://bca-final-year-project-2.onrender.com";

// =========================================
// 2. UI, MENU & SWIPER LOGIC
// =========================================
var swiper = new Swiper(".mySwiper", {
  loop: true,
  navigation: { nextEl: "#next", prevEl: "#prev" },
});

const cartIcon = document.querySelector(".cart-icon");
const cartTab = document.querySelector(".cart-tab");
const closeBtn = document.querySelector(".close-btn");
const cardList = document.querySelector(".card-list");
const cartList = document.querySelector(".cart-list");
const cartTotal = document.querySelector(".cart-total");
const cartValue = document.querySelector(".cart-value");
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const bars = document.querySelector(".fa-bars");

cartIcon.addEventListener("click", (e) => {
  e.preventDefault();
  cartTab.classList.add("cart-tab-active");
});
closeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  cartTab.classList.remove("cart-tab-active");
});

hamburger.addEventListener("click", (e) => {
  e.preventDefault();
  mobileMenu.classList.toggle("mobile-menu-active");
  if (bars.classList.contains("fa-bars")) {
    bars.classList.replace("fa-bars", "fa-xmark");
  } else {
    bars.classList.replace("fa-xmark", "fa-bars");
  }
});

// =========================================
// 3. CART & PRODUCT LOGIC
// =========================================
let productList = [];
let cartProduct = [];

const updateTotals = () => {
  let totalPrice = 0,
    totalQuantity = 0;
  document.querySelectorAll(".item").forEach((item) => {
    const quantity = parseInt(
      item.querySelector(".quantity-value").textContent,
    );
    const price = parseFloat(
      item.querySelector(".item-total").textContent.replace("$", ""),
    );
    totalPrice += price;
    totalQuantity += quantity;
  });
  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
  cartValue.textContent = totalQuantity;
};

const showCard = () => {
  productList.forEach((product) => {
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card");
    orderCard.innerHTML = `
      <div class="card-image"><img src="${product.image}" alt="" /></div>
      <h4>${product.name}</h4>
      <h4 class="price">${product.price}</h4>
      <a href="#" class="btn card-btn">Add to cart</a>`;
    cardList.appendChild(orderCard);
    orderCard.querySelector(".card-btn").addEventListener("click", (e) => {
      e.preventDefault();
      addToCard(product);
    });
  });
};

const addToCard = (product) => {
  if (cartProduct.find((item) => item.id === product.id)) {
    alert("Item already in your cart!");
    return;
  }
  cartProduct.push(product);
  let quantity = 1;
  let price = parseFloat(product.price.replace("$", ""));

  const cartItem = document.createElement("div");
  cartItem.classList.add("item");
  cartItem.innerHTML = `
    <div class="item-image"><img src="${product.image}" alt="" /></div>
    <div class="detail"><h4>${product.name}</h4><h4 class="item-total">${product.price}</h4></div>
    <div class="flex">
      <a href="#" class="quantity-btn minus"><i class="fa-solid fa-minus"></i></a>
      <h4 class="quantity-value">${quantity}</h4>
      <a href="#" class="quantity-btn plus"><i class="fa-solid fa-plus"></i></a>
    </div>`;

  cartList.appendChild(cartItem);
  updateTotals();

  cartItem.querySelector(".plus").addEventListener("click", (e) => {
    e.preventDefault();
    quantity++;
    cartItem.querySelector(".quantity-value").textContent = quantity;
    cartItem.querySelector(".item-total").textContent =
      `$${(price * quantity).toFixed(2)}`;
    updateTotals();
  });

  cartItem.querySelector(".minus").addEventListener("click", (e) => {
    e.preventDefault();
    if (quantity > 1) {
      quantity--;
      cartItem.querySelector(".quantity-value").textContent = quantity;
      cartItem.querySelector(".item-total").textContent =
        `$${(price * quantity).toFixed(2)}`;
      updateTotals();
    } else {
      cartItem.classList.add("slide-out");
      setTimeout(() => {
        cartItem.remove();
        cartProduct = cartProduct.filter((item) => item.id !== product.id);
        updateTotals();
      }, 300);
    }
  });
};

const initApp = () => {
  fetch("products.json")
    .then((res) => res.json())
    .then((data) => {
      productList = data;
      showCard();
    });
};
initApp();

// =========================================
// 4. USER AUTHENTICATION
// =========================================
const authModal = document.getElementById("auth-modal");
const signInBtn = document.querySelector(".desktop-icon .btn");
const authForm = document.getElementById("auth-form");
let isLoginMode = true;

signInBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!localStorage.getItem("userName")) authModal.classList.add("active");
});

document
  .getElementById("close-auth")
  .addEventListener("click", () => authModal.classList.remove("active"));

document.getElementById("toggle-auth").addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  document.getElementById("auth-title").textContent = isLoginMode
    ? "Sign In"
    : "Create Account";
  document.getElementById("submit-btn").textContent = isLoginMode
    ? "Login"
    : "Register";
  document.getElementById("name-group").style.display = isLoginMode
    ? "none"
    : "block";
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const endpoint = isLoginMode ? "login" : "signup";
  const userData = {
    email: document.getElementById("auth-email").value.trim(),
    password: document.getElementById("auth-password").value,
  };
  if (!isLoginMode)
    userData.full_name = document.getElementById("full-name").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const result = await res.json();
    if (res.ok) {
      const name = isLoginMode ? result.full_name : userData.full_name;
      localStorage.setItem("userName", name);
      updateAuthUI(name);
      authModal.classList.remove("active");
      alert(isLoginMode ? `Welcome back, ${name}!` : "Account created! 🌶️");
    } else {
      alert(result.error);
    }
  } catch (err) {
    alert("Server error. Check backend connection.");
  }
});

const updateAuthUI = (name) => {
  if (name) {
    signInBtn.innerHTML = `<div class="user-info-container"><span>Hi, ${name}</span><span id="logout-link" style="text-decoration:underline; cursor:pointer; margin-left:10px;">Logout</span></div>`;
    document.getElementById("logout-link").onclick = () => {
      localStorage.removeItem("userName");
      location.reload();
    };
  }
};

window.addEventListener("load", () => {
  const name = localStorage.getItem("userName");
  if (name) updateAuthUI(name);
});

// =========================================
// 5. NEWSLETTER & SERVICE LOGIC
// =========================================
const subsBtn = document.getElementById("subs-btn");
const subsEmail = document.getElementById("subs-email");

subsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (subsEmail.value.includes("@")) {
    subsBtn.textContent = "Subscribed! ✓";
    subsBtn.style.background = "#28a745";
    subsEmail.value = "";
    alert("Thank you for subscribing!");
    setTimeout(() => {
      subsBtn.textContent = "Subscribe";
      subsBtn.style.background = "";
    }, 3000);
  } else {
    alert("Please enter a valid email.");
  }
});

const heroOrderBtn = document.getElementById("hero-order-btn");
if (heroOrderBtn) {
  heroOrderBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector("#menu").scrollIntoView({ behavior: "smooth" });
  });
}

// Service Card Quick Add
setTimeout(() => {
  const serviceBtns = document.querySelectorAll(".service-card .btn");
  serviceBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (productList.length > 0) {
        addToCard(productList[0]);
        const originalText = btn.innerHTML;
        btn.innerHTML = "Added! <i class='fa-solid fa-check'></i>";
        btn.style.backgroundColor = "#28a745";
        cartTab.classList.add("cart-tab-active");
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.backgroundColor = "";
        }, 2000);
      }
    });
  });
}, 500);

// =========================================
// 6. CHECKOUT & CONTACT LOGIC
// =========================================
const checkoutModal = document.getElementById("checkout-modal");
const checkoutBtn = document.querySelector(".cart-tab .btn:last-child");
const orderSummary = document.getElementById("order-summary");
const checkoutForm = document.getElementById("checkout-form");

checkoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (cartProduct.length === 0) {
    alert("Cart is empty! 🌶️");
    return;
  }
  orderSummary.innerHTML = `<div style="background:var(--hint-yellow); padding:1rem; border-radius:1rem; margin-bottom:1rem;"><p>Items: <strong>${cartValue.textContent}</strong></p><p>Total: <strong style="color:var(--gold-finger);">${cartTotal.textContent}</strong></p></div>`;
  cartTab.classList.remove("cart-tab-active");
  checkoutModal.classList.add("active");
});

document.getElementById("close-checkout").onclick = () =>
  checkoutModal.classList.remove("active");

checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const deliveryTime = Math.floor(Math.random() * 21) + 30;
  const modalContent = document.querySelector("#checkout-modal .modal-content");
  modalContent.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fa-solid fa-truck-fast" style="font-size:4.5rem; color:#28a745;"></i><h2>Order Placed!</h2><div style="background:#fdf2f2; padding:15px; border-radius:10px;"><h3>${deliveryTime} Minutes</h3></div><button class="btn" onclick="location.reload()">Continue Shopping</button></div>`;
  cartProduct = [];
  cartList.innerHTML = "";
  updateTotals();
});

document
  .getElementById("contact-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const contactData = {
      name: document.getElementById("contact-name").value,
      email: document.getElementById("contact-email").value,
      message: document.getElementById("contact-message").value,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });
      if (res.ok) {
        alert("Message Sent! 🌶️");
        e.target.reset();
      }
    } catch (error) {
      alert("Connection error.");
    }
  });

// Smooth Scroll
document.querySelectorAll('a[href="#about"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    if (mobileMenu.classList.contains("mobile-menu-active")) {
      mobileMenu.classList.remove("mobile-menu-active");
      bars.classList.replace("fa-xmark", "fa-bars");
    }
    document
      .querySelector(this.getAttribute("href"))
      .scrollIntoView({ behavior: "smooth" });
  });
});
