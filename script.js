const navToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const reviewsRoot = document.querySelector("[data-google-reviews]");
const reviewsViewport = document.querySelector("[data-reviews-viewport]");
const reviewsList = document.querySelector("[data-reviews-list]");
const reviewsPrev = document.querySelector("[data-reviews-prev]");
const reviewsNext = document.querySelector("[data-reviews-next]");
const reviewConfig = window.SLEEK_GOOGLE_REVIEWS || {};
let renderedReviews = [];
let currentReviewPage = 0;
const mockReviews = [
  {
    author: "Jordan M.",
    rating: 5,
    meta: "Interior detail",
    text:
      "My SUV looked and smelled fresh again. The seats, dash, and floor mats all came back looking much cleaner than I expected."
  },
  {
    author: "Ashley R.",
    rating: 5,
    meta: "Mobile appointment",
    text:
      "Scheduling was simple and the mobile setup made it easy to get the car cleaned while I was at home. The finish on the paint looked great."
  },
  {
    author: "Daniel T.",
    rating: 5,
    meta: "Full detail package",
    text:
      "The full detail made a big difference before a weekend trip. Wheels, glass, and interior all looked sharp and ready to go."
  },
  {
    author: "Melissa C.",
    rating: 5,
    meta: "Exterior wash",
    text:
      "Fast, professional, and the exterior came out glossy without feeling rushed. The tire finish pulled the whole look together."
  },
  {
    author: "Chris P.",
    rating: 5,
    meta: "Repeat customer",
    text:
      "I booked again because the first visit set the standard. Consistent work, clear communication, and a clean result every time."
  },
  {
    author: "Sofia L.",
    rating: 5,
    meta: "Pre-sale cleanup",
    text:
      "Needed the car cleaned up before listing it and the detail absolutely helped. The cabin looked brighter and the exterior photos came out better."
  }
];

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function renderStars(ratingValue) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(ratingValue) || 0)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function createReviewCard(review) {
  const card = document.createElement("article");
  card.className = "review-card";

  const header = document.createElement("div");
  header.className = "review-card__header";

  const author = document.createElement("strong");
  author.className = "review-card__author";
  author.textContent =
    review.authorAttribution?.displayName || review.author || "Customer";

  const stars = document.createElement("p");
  stars.className = "review-card__stars";
  stars.textContent = renderStars(review.rating);

  const service = document.createElement("p");
  service.className = "review-card__service";
  service.textContent = review.meta || review.relativePublishTimeDescription || "";

  header.append(author, stars);

  if (service.textContent) {
    header.append(service);
  }

  const body = document.createElement("p");
  body.className = "review-card__text";
  body.textContent =
    review.text?.text ||
    review.originalText?.text ||
    review.text ||
    "Read this review on Google.";

  card.append(header, body);

  if (review.authorAttribution?.uri || review.url) {
    const link = document.createElement("a");
    link.className = "review-card__link";
    link.href = review.authorAttribution?.uri || review.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = review.linkLabel || "View profile";
    card.append(link);
  }

  return card;
}

function getVisibleReviewCount() {
  if (window.matchMedia("(max-width: 760px)").matches) {
    return 1;
  }

  if (window.matchMedia("(max-width: 980px)").matches) {
    return 2;
  }

  return 3;
}

function syncReviewCarousel() {
  if (!reviewsList || !reviewsViewport) {
    return;
  }

  const visibleReviewCount = getVisibleReviewCount();
  const pageCount = Math.max(
    1,
    Math.ceil(renderedReviews.length / visibleReviewCount)
  );

  currentReviewPage = Math.max(0, Math.min(currentReviewPage, pageCount - 1));
  reviewsList.style.transform = `translateX(-${
    currentReviewPage * reviewsViewport.clientWidth
  }px)`;

  if (reviewsPrev) {
    reviewsPrev.disabled = currentReviewPage === 0;
  }

  if (reviewsNext) {
    reviewsNext.disabled = currentReviewPage >= pageCount - 1;
  }
}

function renderReviews(reviews, maxReviews) {
  if (!reviewsList) {
    return;
  }

  renderedReviews = reviews.slice(0, maxReviews);
  reviewsList.innerHTML = "";
  renderedReviews.forEach((review) => {
    reviewsList.append(createReviewCard(review));
  });

  currentReviewPage = 0;
  window.requestAnimationFrame(syncReviewCarousel);
}

function renderReviewFallback() {
  if (!reviewsRoot || !reviewsList) {
    return;
  }

  const { maxReviews = 6 } = reviewConfig;
  renderReviews(mockReviews, maxReviews);
}

async function loadGoogleReviews() {
  if (!reviewsRoot || !reviewsList) {
    return;
  }

  const { apiKey, placeId, maxReviews = 6 } = reviewConfig;

  if (!apiKey || !placeId) {
    renderReviewFallback();
    return;
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,reviews"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places request failed with ${response.status}`);
    }

    const place = await response.json();
    const reviews = Array.isArray(place.reviews) ? place.reviews : [];

    renderReviews(reviews, maxReviews);

    if (!reviews.length) {
      renderReviewFallback();
    }
  } catch (error) {
    renderReviewFallback();
  }
}

if (reviewsPrev) {
  reviewsPrev.addEventListener("click", () => {
    currentReviewPage -= 1;
    syncReviewCarousel();
  });
}

if (reviewsNext) {
  reviewsNext.addEventListener("click", () => {
    currentReviewPage += 1;
    syncReviewCarousel();
  });
}

window.addEventListener("resize", syncReviewCarousel);

loadGoogleReviews();
