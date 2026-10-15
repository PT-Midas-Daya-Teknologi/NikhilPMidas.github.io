/**
 * Wowoni Site - Consolidated Main JavaScript (main.js)
 * 
 * TABLE OF CONTENTS
 * ==========================================================================
 * 1. CORE & SHARED UTILITIES (Global)
 *    - Component Fragment Loader (Header, Footer, Mobile Menu)
 *    - Route Matching & Active Navigation
 *    - Header Sticking, Dropdown Toggle & Mobile Offcanvas Drawer
 *    - Preloader, Scroll-to-Top & Window Listeners
 *    - Global Theme Plugins (Owl Carousel, Fancybox, WOW, Isotope, NiceSelect)
 * 
 * 2. HOME PAGE (index.html)
 *    - 2.1 Service Cards Scroll Reveal Animation
 *    - 2.2 Partners Auto-Rotating Carousel & Dot Navigation
 * 
 * 3. SERVICES OVERVIEW (services/service.html)
 *    - 3.1 Who We Are Section Intro Reveal Animation
 *    - 3.2 Services Grid OwlCarousel with Interactive Progress Track & Controls
 * 
 * 4. DIGITAL TRANSFORMATION & TESTING SERVICES
 *    (services/digital-transformation.html & services/testing-services.html)
 *    - 4.1 Shared Scroll Reveal Engine ([data-dt-reveal])
 *    - 4.2 Staggered Drivers & Challenges Delay Computation
 * 
 * 5. ELITE IT RESOURCES (services/elite-it-resources.html)
 *    - 5.1 Elite IT Resources Staggered Reveal Engine ([data-elite-reveal])
 * 
 * 6. CORE BANKING, APPLICATION DEVELOPMENT & INFRASTRUCTURE MANAGEMENT
 *    (services/core-banking-transformation.html,
 *     services/application-development.html,
 *     services/application-and-infrastructure-management.html)
 *    - 6.1 Platform & Technology Mastery Interactive Accordions (.cbt-pm-card)
 * 
 * 7. CAREER (career/career.html)
 *    - 7.1 Career Path & Company Culture Scroll Reveal Engine ([data-career-reveal])
 * 
 * 8. CONTACT US (contact/contact.html)
 *    - 8.1 Contact Form First & Last Name Sync to Hidden Username Field
 *    - 8.2 Interactive Leaflet Map with Custom Marker Pins, 7 Worldwide Office
 *          Locations, Map/Satellite Switcher, Fullscreen, Compass Pan, Zoom,
 *          and Pegman Street View
 * ==========================================================================
 */

(function($) {
	"use strict";

	/* ==========================================================================
	   1. CORE & SHARED UTILITIES (Global)
	   ========================================================================== */

	function loadWowoniComponents() {
		var scriptUrl = document.currentScript && document.currentScript.src
			? new URL(document.currentScript.src)
			: new URL("assets/js/main.js", window.location.href);
		var siteRoot = new URL("../../", scriptUrl);
		var slots = Array.prototype.slice.call(document.querySelectorAll("[data-wowoni-include]"));

		if (!slots.length) {
			return Promise.resolve();
		}

		var mainCss = document.querySelector("link[href*='main.css']");
		var sharedCss = document.querySelector("link[data-wowoni-shared-css]") || mainCss;
		if (!sharedCss) {
			sharedCss = document.createElement("link");
			sharedCss.rel = "stylesheet";
			sharedCss.href = new URL("assets/css/main.css", siteRoot).href;
			sharedCss.setAttribute("data-wowoni-shared-css", "");
			document.head.appendChild(sharedCss);
		}

		var cssReady = new Promise(function(resolve) {
			if (sharedCss.sheet) {
				resolve();
			} else {
				sharedCss.addEventListener("load", resolve, { once: true });
				sharedCss.addEventListener("error", resolve, { once: true });
			}
		});

		var routes = {
			home: "index.html",
			services: "services/service.html",
			about: "about/about.html",
			career: "career/career.html",
			"open-positions": "career/open-positions.html",
			contact: "contact/contact.html",
			"core-banking-transformation": "services/core-banking-transformation.html",
			"digital-transformation": "services/digital-transformation.html",
			"application-development": "services/application-development.html",
			"application-infrastructure-management": "services/application-and-infrastructure-management.html",
			"elite-it-resources": "services/elite-it-resources.html",
			"testing-services": "services/testing-services.html"
		};
		var pageName = window.location.pathname.split("/").filter(Boolean).pop() || "";
		var currentSubRoute = pageName === "digital-transformation.html" ? "digital-transformation"
			: pageName === "elite-it-resources.html" ? "elite-it-resources"
			: pageName === "testing-services.html" ? "testing-services"
			: pageName === "open-positions.html" ? "open-positions"
			: pageName === "core-banking-transformation.html" ? "core-banking-transformation"
			: pageName === "application-development.html" ? "application-development"
			: pageName === "application-and-infrastructure-management.html" ? "application-infrastructure-management" : "";
		var currentRoute = currentSubRoute && currentSubRoute !== "open-positions" ? "services"
			: pageName.indexOf("contact") === 0 ? "contact"
			: pageName === "career.html" || pageName === "open-positions.html" ? "career"
			: pageName.indexOf("about") === 0 ? "about"
			: pageName.indexOf("service") === 0 || pageName === "services" ? "services"
			: pageName.indexOf("index") === 0 || pageName === "" ? "home" : "";
		document.body.classList.toggle("home-page", currentRoute === "home");

		function prepareFragment(fragment) {
			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-route]"), function(link) {
				var route = link.getAttribute("data-wowoni-route");
				if (routes[route]) {
					link.href = new URL(routes[route], siteRoot).href;
				}
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-asset]"), function(asset) {
				asset.src = new URL(asset.getAttribute("data-wowoni-asset"), siteRoot).href;
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-bg]"), function(element) {
				element.style.backgroundImage = "url(\"" + new URL(element.getAttribute("data-wowoni-bg"), siteRoot).href + "\")";
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-nav]"), function(item) {
				if (item.getAttribute("data-wowoni-nav") === currentRoute) {
					item.classList.add("current");
				}
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-subnav]"), function(item) {
				if (item.getAttribute("data-wowoni-subnav") === currentSubRoute) {
					item.classList.add("current");
					var currentLink = item.querySelector("a");
					if (currentLink) {
						currentLink.setAttribute("aria-current", "page");
					}
				}
			});
		}

		var componentsReady = Promise.all(slots.map(function(slot) {
			var component = slot.getAttribute("data-wowoni-include");
			return fetch(new URL("component/" + component + ".html", siteRoot).href)
				.then(function(response) {
					if (!response.ok) {
						return fetch(new URL("inc/" + component + ".html", siteRoot).href);
					}
					return response;
				})
				.then(function(response) {
					if (!response.ok) {
						throw new Error("Unable to load shared component: " + component);
					}
					return response.text();
				})
				.then(function(markup) {
					var template = document.createElement("template");
					template.innerHTML = markup;
					prepareFragment(template.content);
					if (component === "header") {
						slot.classList.add("shared-header-slot");
						if (currentRoute === "home") {
							slot.classList.add("home-header-slot");
						}
					}
					slot.replaceChildren(template.content);
				});
		}));

		return Promise.all([componentsReady, cssReady]).then(function() {
			var mainMenu = document.querySelector(".shared-header .main-menu");
			if (mainMenu) {
				var menuMarkup = mainMenu.innerHTML;
				var mobileMenu = document.querySelector(".mobile-menu .menu-outer");
				var stickyMenu = document.querySelector(".shared-header .sticky-header .main-menu");
				if (mobileMenu) {
					mobileMenu.innerHTML = menuMarkup;
				}
				if (stickyMenu) {
					stickyMenu.innerHTML = menuMarkup;
				}
			}

			$(document).off("click.wowoniShared", ".mobile-nav-toggler")
				.on("click.wowoniShared", ".mobile-nav-toggler", function() {
					$("body").addClass("mobile-menu-visible");
				})
				.off("keydown.wowoniShared", ".mobile-nav-toggler")
				.on("keydown.wowoniShared", ".mobile-nav-toggler", function(event) {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						$(this).trigger("click");
					}
				});

			$(document).off("click.wowoniShared", ".mobile-menu .menu-backdrop, .mobile-menu .close-btn")
				.on("click.wowoniShared", ".mobile-menu .menu-backdrop, .mobile-menu .close-btn", function() {
					$("body").removeClass("mobile-menu-visible");
				});

			$(document).off("click.wowoniShared", ".mobile-menu .dropdown-btn")
				.on("click.wowoniShared", ".mobile-menu .dropdown-btn", function() {
					var isOpen = !$(this).hasClass("open");
					$(this).toggleClass("open", isOpen).attr("aria-expanded", String(isOpen)).prev("ul").slideToggle(350);
					$(this).prev(".megamenu").slideToggle(900);
				});

			$(document).off("click.wowoniShared", ".main-header .main-menu li.dropdown > .dropdown-btn")
				.on("click.wowoniShared", ".main-header .main-menu li.dropdown > .dropdown-btn", function() {
					var button = $(this);
					var item = button.parent();
					var isOpen = !item.hasClass("is-open");
					$(".main-header .main-menu li.dropdown").not(item).removeClass("is-open").children(".dropdown-btn").removeClass("open").attr("aria-expanded", "false");
					item.toggleClass("is-open", isOpen);
					button.toggleClass("open", isOpen).attr("aria-expanded", String(isOpen));
				});

			headerStyle();
		}).catch(function(error) {
			console.error(error);
		});
	}

	loadWowoniComponents();
	
	// Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.loader-wrap').length){
			$('.loader-wrap').delay(1000).fadeOut(500);
		}
	}

	if ($(".preloader-close").length) {
        $(".preloader-close").on("click", function(){
            $('.loader-wrap').delay(200).fadeOut(500);
        });
    }
	
	// Update Header Style and Scroll to Top
	function headerStyle() {
		if($('.main-header').length){
			var windowpos = $(window).scrollTop();
			var siteHeader = $('.main-header');
			var scrollLink = $('.scroll-top');
			if (windowpos >= 110) {
				siteHeader.addClass('fixed-header');
				scrollLink.addClass('open');
			} else {
				siteHeader.removeClass('fixed-header');
				scrollLink.removeClass('open');
			}
		}
	}
	
	headerStyle();

	// Submenu Dropdown Toggle
	if($('.main-header li.dropdown ul').length){
		$('.main-header .navigation li.dropdown').append('<div class="dropdown-btn"><span class="fas fa-angle-down"></span></div>');
	}

	// Mobile Nav Hide Show
	if($('.mobile-menu').length){
		$('.mobile-menu .menu-box');
		var mobileMenuContent = $('.main-header .menu-area .main-menu').html();
		$('.mobile-menu .menu-box .menu-outer').append(mobileMenuContent);
		$('.sticky-header .main-menu').append(mobileMenuContent);
		
		// Dropdown Button
		$('.mobile-menu li.dropdown .dropdown-btn').on('click', function() {
			$(this).toggleClass('open');
			$(this).prev('ul').slideToggle(500);
		});
		$('.mobile-menu li.dropdown .dropdown-btn').on('click', function() {
			$(this).prev('.megamenu').slideToggle(900);
		});
		// Menu Toggle Btn
		$('.mobile-nav-toggler').on('click', function() {
			$('body').addClass('mobile-menu-visible');
		});
		// Menu Toggle Btn
		$('.mobile-menu .menu-backdrop,.mobile-menu .close-btn').on('click', function() {
			$('body').removeClass('mobile-menu-visible');
		});
	}

	// Scroll to a Specific Div
	if($('.scroll-to-target').length){
		$(".scroll-to-target").on('click', function() {
			var target = $(this).attr('data-target');
			$('html, body').animate({
				scrollTop: $(target).offset().top
			}, 1000);
		});
	}

	// Elements Animation
	if ($('.service-card-reveal').length) {
		var wowoniServiceCardAnimation = new WOW({
			boxClass: 'service-card-reveal',
			mobile: true,
			live: false
		});
		wowoniServiceCardAnimation.init();
	}

	if($('.wow').length){
		var wow = new WOW({
			mobile: false
		});
		wow.init();
	}

	// Contact Form Validation
	if($('#contact-form').length){
		$('#contact-form').validate({
			rules: {
				username: { required: true },
				email: { required: true, email: true },
				phone: { required: true },
				subject: { required: true },
				message: { required: true }
			}
		});
	}

	// Fact Counter + Text Count
	if($('.count-box').length){
		$('.count-box').appear(function(){
			var $t = $(this),
				n = $t.find(".count-text").attr("data-stop"),
				r = parseInt($t.find(".count-text").attr("data-speed"), 10);
				
			if (!$t.hasClass("counted")) {
				$t.addClass("counted");
				$({
					countNum: $t.find(".count-text").text()
				}).animate({
					countNum: n
				}, {
					duration: r,
					easing: "linear",
					step: function() {
						$t.find(".count-text").text(Math.floor(this.countNum));
					},
					complete: function() {
						$t.find(".count-text").text(this.countNum);
					}
				});
			}
		},{accY: 0});
	}

	// Progress Bar
	if ($('.count-bar').length) {
		$('.count-bar').appear(function(){
			var el = $(this);
			var percent = el.data('percent');
			$(el).css('width',percent).addClass('counted');
		},{accY: -50});
	}

	// LightBox / Fancybox
	if($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect  : 'fade',
			closeEffect : 'fade',
			helpers : {
				media : {}
			}
		});
	}

	// Tabs Box
	if($('.tabs-box').length){
		$('.tabs-box .tab-buttons .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));
			if ($(target).is(':visible')){
				return false;
			} else {
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab');
				$(target).fadeIn(100);
				$(target).addClass('active-tab');
			}
		});
	}

	// Accordion Box
	if($('.accordion-box').length){
		$(".accordion-box").on('click', '.acc-btn', function() {
			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');
			if($(this).hasClass('active')!==true){
				$(outerBox).find('.accordion .acc-btn').removeClass('active');
			}
			if ($(this).next('.acc-content').is(':visible')){
				return false;
			} else {
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				target.addClass('active-block');
				$(this).next('.acc-content').slideDown(300);	
			}
		});	
	}

	// Banner Carousel
	if ($('.banner-carousel').length) {
        $('.banner-carousel').owlCarousel({
            loop: true,
			margin: 0,
			nav: true,
			animateOut: 'fadeOut',
    		animateIn: 'fadeIn',
    		active: true,
			smartSpeed: 1000,
			autoplay: 6000,
            navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
            responsive:{
                0:{ items:1 },
                600:{ items:1 },
                800:{ items:1 },
                1024:{ items:1 }
            }
        });
    }

    // Single Item Carousel
	if ($('.single-item-carousel').length) {
		$('.single-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{ items:1 },
				480:{ items:1 },
				600:{ items:1 },
				800:{ items:1 },			
				1200:{ items:1 }
			}
		});    		
	}

	// Two Item Carousel
	if ($('.two-item-carousel').length) {
		$('.two-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{ items:1 },
				480:{ items:1 },
				600:{ items:1 },
				800:{ items:2 },			
				1200:{ items:2 }
			}
		});    		
	}

    // Three Item Carousel
	if ($('.three-item-carousel').length) {
		$('.three-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{ items:1 },
				480:{ items:1 },
				600:{ items:2 },
				800:{ items:2 },			
				1200:{ items:3 }
			}
		});    		
	}

	// Four Item Carousel
	if ($('.four-item-carousel').length) {
		$('.four-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{ items:1 },
				480:{ items:1 },
				600:{ items:2 },
				800:{ items:3 },			
				1200:{ items:4 }
			}
		});    		
	}

	// Project Carousel
	if ($('.project-carousel').length) {
		$('.project-carousel').owlCarousel({
			loop: true,
			margin: 0,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{ items:1 },
				480:{ items:1 },
				600:{ items:2 },
				800:{ items:3 },			
				1200:{ items:4 }
			}
		});    		
	}

	// Five Item Carousel
	if ($('.five-item-carousel').length) {
		$('.five-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{ items:1 },
				480:{ items:2 },
				600:{ items:3 },
				800:{ items:4 },			
				1200:{ items:5 }
			}
		});    		
	}

	// One Page Nav
	if($('.scroll-nav').length) {
		$('.scroll-nav').onePageNav();
	}

	// Page Direction
	function directionswitch() {
	  	if ($('.page_direction').length) {
	    	$('.direction_switch button').on('click', function() {
			   $('body').toggleClass(function(){
			      return $(this).is('.rtl, .ltr') ? 'rtl ltr' : 'rtl';
			  });
			});
	  	}
	}

	// Nice Select
	$(document).ready(function() {
      $('select:not(.ignore)').niceSelect();
    });

    // Scroll Animations
	var $containers = $('[data-animation]:not([data-animation-text]), [data-animation-box]');
	if ($containers.length && $.fn.scrollAnimations) {
		$containers.scrollAnimations();
	}

	// Testimonial bxSliders
	if ($('.testimonial-section .bxslider').length) {
		$('.testimonial-section .bxslider').bxSlider({
	        nextText: '<i class="icon-22"></i>',
	        prevText: '<i class="icon-21"></i>',
	        mode: 'fade',
	        auto: true,
	        speed: 700,
	        pagerCustom: '.testimonial-section .slider-pager .thumb-box'
	    });
	}

	if ($('.testimonial-style-two .bxslider').length) {
		$('.testimonial-style-two .bxslider').bxSlider({
	        nextText: '<i class="icon-22"></i>',
	        prevText: '<i class="icon-21"></i>',
	        mode: 'fade',
	        auto: true,
	        speed: 700,
	        pagerCustom: '.testimonial-style-two .slider-pager .thumb-box'
	    });
	}

	// Search Popup
	if($('#search-popup').length){
		$('.search-toggler').on('click', function() {
			$('#search-popup').addClass('popup-visible');
		});
		$(document).keydown(function(e){
	        if(e.keyCode === 27) {
	            $('#search-popup').removeClass('popup-visible');
	        }
	    });
		$('.close-search,.search-popup .overlay-layer').on('click', function() {
			$('#search-popup').removeClass('popup-visible');
		});
	}

	// Scroll top button
    $('.scroll-top-inner').on("click", function () {
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });

    function handleScrollbar() {
        const bHeight = $('body').height();
        const scrolled = $(window).innerHeight() + $(window).scrollTop();
        let percentage = ((scrolled / bHeight) * 100);
        if (percentage > 100) percentage = 100;
        $('.scroll-top-inner .bar-inner').css('width', percentage + '%');
    }

    // Sortable Masonry with Filters
	function enableMasonry() {
		if($('.sortable-masonry').length){
			var winDow = $(window);
			var $container = $('.sortable-masonry .items-container');
			var $filter = $('.filter-btns');
	
			$container.isotope({
				filter:'*',
				masonry: {
					columnWidth : '.masonry-item.small-column'
				},
				animationOptions:{
					duration: 500,
					easing: 'linear'
				}
			});
	
			$filter.find('li').on('click', function(){
				var selector = $(this).attr('data-filter');
				try {
					$container.isotope({ 
						filter: selector,
						animationOptions: {
							duration: 500,
							easing: 'linear',
							queue: false
						}
					});
				} catch(err) {}
				return false;
			});
	
			winDow.on('resize', function(){
				var selector = $filter.find('li.active').attr('data-filter');
				$container.isotope({ 
					filter: selector,
					animationOptions: {
						duration: 500,
						easing: 'linear',
						queue: false
					}
				});
			});
	
			var filterItemA = $('.filter-btns li');
			filterItemA.on('click', function(){
				var $this = $(this);
				if (!$this.hasClass('active')) {
					filterItemA.removeClass('active');
					$this.addClass('active');
				}
			});
		}
	}

	if($('.timer').length){
	   $(function(){
		    $('[data-countdown]').each(function() {
		   var $this = $(this), finalDate = $(this).data('countdown');
		   $this.countdown(finalDate, function(event) {
		     $this.html(event.strftime('%D days %H:%M:%S'));
		   });
		 });
		});

	   $('.cs-countdown').countdown('').on('update.countdown', function(event) {
		  var $this = $(this).html(event.strftime('<div class="count-col"><span>%D</span><h6>days</h6></div> <div class="count-col"><span>%H</span><h6>Hours</h6></div> <div class="count-col"><span>%M</span><h6>Minutes</h6></div> <div class="count-col"><span>%S</span><h6>Seconds</h6></div>'));
		});
	}


	/* ==========================================================================
	   2. HOME PAGE (index.html)
	   ========================================================================== */
	function initHomePage() {
		// 2.1 Service Cards Scroll Reveal Animation
		var cards = Array.prototype.slice.call(document.querySelectorAll(".service-cards .service-card-reveal"));
		if (cards.length) {
			var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

			function revealAllCards() {
				cards.forEach(function(card) {
					card.classList.remove("is-pending");
					card.classList.add("is-visible");
				});
			}

			if (motionPreference.matches || !("IntersectionObserver" in window)) {
				revealAllCards();
			} else {
				var cardObserver = new IntersectionObserver(function(entries) {
					entries.forEach(function(entry) {
						if (!entry.isIntersecting) return;
						var card = entry.target;
						card.classList.remove("is-pending");
						card.classList.add("is-visible");
						cardObserver.unobserve(card);
					});
				}, { threshold: 0.18, rootMargin: "0px 0px -32px 0px" });

				cards.forEach(function(card) {
					var delay = parseInt(card.getAttribute("data-wow-delay"), 10) || 0;
					card.style.setProperty("--wowoni-service-reveal-delay", delay + "ms");
					card.classList.add("is-pending");
					cardObserver.observe(card);
				});

				var discoverMore = document.querySelector('.hero .theme-btn.btn-three[href="#services"]');
				if (discoverMore) {
					discoverMore.addEventListener("click", function() {
						if (motionPreference.matches) return;
						cards.forEach(function(card) {
							card.classList.remove("is-visible");
							card.classList.add("is-pending");
							card.classList.add("is-restarting");
						});
						void cards[0].offsetWidth;
						cards.forEach(function(card) {
							card.classList.remove("is-restarting");
						});
						void cards[0].offsetWidth;
						cards.forEach(function(card) {
							card.classList.remove("is-pending");
							card.classList.add("is-visible");
						});
					});
				}

				if (motionPreference.addEventListener) {
					motionPreference.addEventListener("change", function(event) {
						if (event.matches) {
							cardObserver.disconnect();
							revealAllCards();
						}
					});
				}
			}
		}

		// 2.2 Partners Auto-Rotating Carousel & Dot Navigation
		var carousel = document.querySelector("[data-partner-carousel]");
		if (carousel) {
			var logos = Array.prototype.slice.call(carousel.querySelectorAll(".partner-stage img, .wowoni-partner-stage img"));
			var dots = Array.prototype.slice.call(carousel.querySelectorAll(".partner-dots button, .wowoni-partner-dots button"));
			var activeIndex = 0;
			var timer;

			function showLogo(index) {
				if (!logos.length) return;
				activeIndex = index;
				logos.forEach(function(logo, logoIndex) {
					var isActive = logoIndex === activeIndex;
					logo.classList.toggle("is-active", isActive);
					logo.setAttribute("aria-hidden", String(!isActive));
				});
				dots.forEach(function(dot, dotIndex) {
					var isActive = dotIndex === activeIndex;
					dot.classList.toggle("is-active", isActive);
					dot.setAttribute("aria-pressed", String(isActive));
				});
			}

			function restartTimer() {
				window.clearInterval(timer);
				if (logos.length > 1) {
					timer = window.setInterval(function() {
						showLogo((activeIndex + 1) % logos.length);
					}, 3000);
				}
			}

			dots.forEach(function(dot, index) {
				dot.addEventListener("click", function() {
					showLogo(index);
					restartTimer();
				});
			});

			restartTimer();
		}
	}


	/* ==========================================================================
	   3. SERVICES OVERVIEW (services/service.html)
	   ========================================================================== */
	function initServicesPage() {
		// 3.1 Intro Reveal (Who We Are section)
		var introReveals = Array.prototype.slice.call(document.querySelectorAll(".intro-copy-reveal, .intro-value-reveal, .intro-image-reveal, .services-intro-visual"));
		if (introReveals.length) {
			function revealIntro() {
				introReveals.forEach(function(el) {
					el.classList.add("is-visible");
					el.classList.add("animated");
				});
			}

			if ("IntersectionObserver" in window) {
				var introObserver = new IntersectionObserver(function(entries, obs) {
					entries.forEach(function(entry) {
						if (entry.isIntersecting) {
							entry.target.classList.add("is-visible");
							entry.target.classList.add("animated");
							obs.unobserve(entry.target);
						}
					});
				}, { threshold: 0.1 });

				introReveals.forEach(function(el) {
					introObserver.observe(el);
				});

				setTimeout(revealIntro, 1200);
			} else {
				revealIntro();
			}
		}

		// 3.2 Services Grid Carousel & Card Reveal
		var $region = $("[data-services-carousel], [data-wowoni-services-carousel]");
		if (!$region.length) return;

		var $carousel = $region.find(".services-grid, .wowoni-services-grid");
		var serviceCards = $region.find(".service-card-reveal, .wowoni-service-card-reveal").get();
		var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (reducedMotion || !("IntersectionObserver" in window)) {
			serviceCards.forEach(function(card) {
				card.classList.add("is-visible");
			});
		} else {
			var cardObserver = new IntersectionObserver(function(entries, observer) {
				entries.forEach(function(entry) {
					if (!entry.isIntersecting) return;
					entry.target.classList.remove("is-pending");
					entry.target.classList.add("is-visible");
					observer.unobserve(entry.target);
				});
			}, { threshold: 0.12 });

			serviceCards.forEach(function(card, index) {
				card.style.setProperty("--services-delay", index * 100 + "ms");
				card.style.setProperty("--wowoni-services-delay", index * 100 + "ms");
				card.classList.add("is-pending");
				cardObserver.observe(card);
			});

			setTimeout(function() {
				serviceCards.forEach(function(card) {
					card.classList.remove("is-pending");
					card.classList.add("is-visible");
				});
			}, 1500);
		}

		if (!$carousel.length || !$.fn.owlCarousel) {
			return;
		}

		var $previous = $region.find("[data-services-prev]");
		var $next = $region.find("[data-services-next]");
		var $progress = $region.find("[data-services-progress]");
		var $progressTrack = $progress.parent();
		var autoplayResumeTimer = null;
		var pointerNavigation = false;

		function updateControls(event) {
			var carouselInstance = event.related || $carousel.data("owl.carousel");
			if (!carouselInstance) return;

			var totalItems = carouselInstance.items().length;
			var visibleItems = carouselInstance.settings.items || 1;
			var currentPosition = carouselInstance.current();
			var currentItem = currentPosition === null ? 0 : carouselInstance.relative(currentPosition);
			var lastItem = Math.max(totalItems - visibleItems, 0);

			currentItem = Math.min(Math.max(currentItem, 0), lastItem);
			$progress.css({
				left: (currentItem / totalItems) * 100 + "%",
				width: (visibleItems / totalItems) * 100 + "%"
			});
			$progressTrack.attr("aria-valuemax", lastItem + 1);
			$progressTrack.attr("aria-valuenow", currentItem + 1);
			$previous.prop("disabled", currentItem === 0);
			$next.prop("disabled", currentItem >= lastItem);

			if (currentItem >= lastItem) {
				$carousel.trigger("stop.owl.autoplay");
			}
		}

		function pauseAutoplay() {
			window.clearTimeout(autoplayResumeTimer);
			$carousel.trigger("stop.owl.autoplay");
		}

		function resumeAutoplay() {
			var supportsHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
			var hasFocusedControl = $region.find(":focus").length > 0;
			var carouselInstance = $carousel.data("owl.carousel");

			if (reducedMotion || (supportsHover && ($region.is(":hover") || (hasFocusedControl && !pointerNavigation))) || !carouselInstance) {
				return;
			}

			var currentItem = carouselInstance.relative(carouselInstance.current());
			var lastItem = Math.max(carouselInstance.items().length - (carouselInstance.settings.items || 1), 0);
			if (currentItem >= lastItem) {
				return;
			}

			window.clearTimeout(autoplayResumeTimer);
			$carousel.trigger("play.owl.autoplay", [6500, 600]);
		}

		function scheduleAutoplayResume() {
			window.clearTimeout(autoplayResumeTimer);
			autoplayResumeTimer = window.setTimeout(resumeAutoplay, 3500);
		}

		$carousel.on("initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel", updateControls);
		$carousel.owlCarousel({
			items: 3,
			margin: 0,
			slideBy: 1,
			loop: false,
			rewind: false,
			nav: false,
			dots: false,
			smartSpeed: 600,
			autoplay: !reducedMotion,
			autoplayTimeout: 6500,
			autoplaySpeed: 600,
			autoplayHoverPause: false,
			touchDrag: true,
			mouseDrag: true,
			stagePadding: 0,
			responsiveRefreshRate: 100,
			responsive: {
				0: { items: 1, margin: 20, stagePadding: 0 },
				768: { items: 2, margin: 12, stagePadding: 0 },
				992: { items: 3, margin: 12, stagePadding: 0 }
			}
		});

		$previous.on("click", function(event) {
			pauseAutoplay();
			pointerNavigation = !!(event.originalEvent && event.originalEvent.detail > 0);
			$carousel.trigger("prev.owl.carousel", [600]);
			scheduleAutoplayResume();
		});

		$next.on("click", function(event) {
			pauseAutoplay();
			pointerNavigation = !!(event.originalEvent && event.originalEvent.detail > 0);
			$carousel.trigger("next.owl.carousel", [600]);
			scheduleAutoplayResume();
		});

		$region.on("mouseenter.servicesCarousel focusin.servicesCarousel", pauseAutoplay);
		$region.on("mouseleave.servicesCarousel", resumeAutoplay);
		$region.on("focusout.servicesCarousel", function(event) {
			if (!this.contains(event.relatedTarget)) {
				pointerNavigation = false;
				resumeAutoplay();
			}
		});
	}


	/* ==========================================================================
	   4. DIGITAL TRANSFORMATION & TESTING SERVICES
	      (services/digital-transformation.html & services/testing-services.html)
	   ========================================================================== */
	function initDigitalTransformationAndTesting() {
		var revealItems = Array.prototype.slice.call(document.querySelectorAll("[data-dt-reveal]"));
		if (!revealItems.length) return;

		var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

		function revealAll() {
			revealItems.forEach(function(item) {
				item.classList.add("is-visible");
			});
		}

		revealItems.forEach(function(item) {
			var benefitIndex = item.classList.contains("dt-benefit")
				? Array.prototype.indexOf.call(item.parentNode.children, item)
				: 0;
			var delay = item.classList.contains("dt-benefit") ? benefitIndex * 70 : 0;
			item.style.setProperty("--dt-reveal-delay", delay + "ms");
		});

		if (motionPreference.matches || !("IntersectionObserver" in window)) {
			revealAll();
			return;
		}

		var observerHasReported = false;
		var observer = new IntersectionObserver(function(entries) {
			if (!observerHasReported) {
				observerHasReported = true;
				window.clearTimeout(revealFallback);
			}

			entries.forEach(function(entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			});
		}, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });

		revealItems.forEach(function(item) {
			observer.observe(item);
		});

		var revealFallback = window.setTimeout(function() {
			observer.disconnect();
			revealAll();
		}, 1200);

		if (motionPreference.addEventListener) {
			motionPreference.addEventListener("change", function(event) {
				if (event.matches) {
					observer.disconnect();
					revealAll();
				}
			});
		}
	}


	/* ==========================================================================
	   5. ELITE IT RESOURCES (services/elite-it-resources.html)
	   ========================================================================== */
	function initEliteItResources() {
		var items = Array.prototype.slice.call(document.querySelectorAll("[data-elite-reveal]"));
		if (!items.length) return;

		var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

		function revealAll() {
			items.forEach(function(item) {
				item.classList.add("is-visible");
			});
		}

		items.forEach(function(item) {
			var siblings = Array.prototype.slice.call(item.parentNode.children).filter(function(sibling) {
				return sibling.matches("[data-elite-reveal]");
			});
			item.style.setProperty("--elite-reveal-delay", siblings.indexOf(item) * 90 + "ms");
		});

		if (motionPreference.matches || !("IntersectionObserver" in window)) {
			revealAll();
			return;
		}

		var observerHasReported = false;
		var observer = new IntersectionObserver(function(entries) {
			if (!observerHasReported) {
				observerHasReported = true;
				window.clearTimeout(revealFallback);
			}

			entries.forEach(function(entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			});
		}, { threshold: 0.14, rootMargin: "0px 0px -36px 0px" });

		items.forEach(function(item) {
			observer.observe(item);
		});

		var revealFallback = window.setTimeout(function() {
			observer.disconnect();
			revealAll();
		}, 1200);

		if (motionPreference.addEventListener) {
			motionPreference.addEventListener("change", function(event) {
				if (event.matches) {
					observer.disconnect();
					revealAll();
				}
			});
		}
	}


	/* ==========================================================================
	   6. CORE BANKING, APP DEV & INFRASTRUCTURE MANAGEMENT
	      (services/core-banking-transformation.html,
	       services/application-development.html,
	       services/application-and-infrastructure-management.html)
	   ========================================================================== */
	function initPlatformMasteryAccordions() {
		$(document).on("click", ".cbt-pm-card .cbt-pm-header", function(e) {
			e.preventDefault();
			var $card = $(this).closest(".cbt-pm-card");
			var $body = $card.find(".cbt-pm-body");
			var $btn = $card.find(".cbt-pm-toggle-btn");
			var $icon = $btn.find("i");

			if ($card.hasClass("active")) {
				$body.slideUp(300);
				$card.removeClass("active");
				$icon.removeClass("fa-minus").addClass("fa-plus");
			} else {
				$body.slideDown(300);
				$card.addClass("active");
				$icon.removeClass("fa-plus").addClass("fa-minus");
			}
		});
	}


	/* ==========================================================================
	   7. CAREER (career/career.html)
	   ========================================================================== */
	function initCareerPage() {
		var items = Array.prototype.slice.call(document.querySelectorAll("[data-career-reveal]"));
		if (!items.length) return;

		var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

		function revealAll() {
			items.forEach(function(item) {
				item.classList.add("is-visible");
			});
		}

		if (motionPreference.matches || !("IntersectionObserver" in window)) {
			revealAll();
			return;
		}

		var observerHasReported = false;
		var observer = new IntersectionObserver(function(entries) {
			if (!observerHasReported) {
				observerHasReported = true;
				window.clearTimeout(revealFallback);
			}

			entries.forEach(function(entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			});
		}, { threshold: 0.15, rootMargin: "0px 0px -36px 0px" });

		items.forEach(function(item) {
			observer.observe(item);
		});

		var revealFallback = window.setTimeout(function() {
			observer.disconnect();
			revealAll();
		}, 1200);

		if (motionPreference.addEventListener) {
			motionPreference.addEventListener("change", function(event) {
				if (event.matches) {
					observer.disconnect();
					revealAll();
				}
			});
		}
	}


	/* ==========================================================================
	   8. CONTACT US (contact/contact.html)
	   ========================================================================== */
	function initContactPage() {
		// 8.1 Contact Form Full Name Sync
		var fn = document.getElementById("contact-firstname");
		var ln = document.getElementById("contact-lastname");
		var un = document.getElementById("hidden-username");
		if (fn && un) {
			function syncName() {
				var fullName = ((fn.value || "") + " " + (ln ? ln.value : "")).trim();
				un.value = fullName || "Valued Customer";
			}
			fn.addEventListener("input", syncName);
			if (ln) ln.addEventListener("input", syncName);
		}

		// 8.2 Interactive Leaflet Map
		var mapContainer = document.getElementById("contact-google-map");
		if (!mapContainer) return;

		function setupMap() {
			if (typeof L === "undefined") return;

			var isSmallScreen = window.innerWidth < 768;
			var initialZoom = isSmallScreen ? 1 : 2;
			var initialCenter = isSmallScreen ? [10, 80] : [12, 85];

			var map = L.map(mapContainer, {
				center: initialCenter,
				zoom: initialZoom,
				minZoom: 1,
				maxZoom: 18,
				zoomControl: false,
				attributionControl: false,
				worldCopyJump: false
			});

			var roadmapLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
				maxZoom: 20
			});
			var satelliteLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
				maxZoom: 20
			});

			roadmapLayer.addTo(map);

			var pinSvg = "data:image/svg+xml;utf8," + encodeURIComponent(
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 43" width="28" height="43">' +
					'<defs>' +
						'<filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">' +
							'<feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.35"/>' +
						'</filter>' +
					'</defs>' +
					'<path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 29 14 29s14-18.5 14-29c0-7.732-6.268-14-14-14z" fill="#ea4335" stroke="#c5221f" stroke-width="0.8" filter="url(#shadow)"/>' +
					'<circle cx="14" cy="14" r="5" fill="#762723"/>' +
				'</svg>'
			);

			var gmapPinIcon = L.icon({
				iconUrl: pinSvg,
				iconSize: [28, 43],
				iconAnchor: [14, 43],
				popupAnchor: [0, -42]
			});

			var officeLocations = [
				{
					name: "Midas Headquarter",
					countryBadge: "Indonesia (Global HQ)",
					coords: [-6.2130, 106.8310],
					address: "Gd. Setiabudi 2, Lt.2 Suite No.203A, JL. H.R. Rasuna Said Kav.62, Kuningan, Setiabudi, Jakarta Selatan 12940, Indonesia.",
					mapsUrl: "https://maps.google.com/?q=Gd.+Setiabudi+2,+Kuningan,+Jakarta+Selatan,+Indonesia"
				},
				{
					name: "Nashik Office",
					countryBadge: "India (Tech Center)",
					coords: [19.9975, 73.7898],
					address: "203, Amar Arcade, Second floor, Kulkarni colony, Sadhu Waswani Road, Nashik - 422002, Maharashtra, India.",
					mapsUrl: "https://maps.google.com/?q=Amar+Arcade+Sadhu+Waswani+Road+Nashik"
				},
				{
					name: "Madurai Office",
					countryBadge: "India (Regional Center)",
					coords: [9.9252, 78.1198],
					address: "No 167, 2nd floor East Veli Street, Madurai – 625001, Tamil Nadu, India.",
					mapsUrl: "https://maps.google.com/?q=East+Veli+Street+Madurai+625001"
				},
				{
					name: "Singapore Office",
					countryBadge: "Singapore (Regional HQ)",
					coords: [1.3187, 103.8931],
					address: "60, Paya Lebar Road #09-43, Paya Lebar Square, Singapore 409051.",
					mapsUrl: "https://maps.google.com/?q=Paya+Lebar+Square+Singapore"
				},
				{
					name: "Malaysia Office",
					countryBadge: "Malaysia (Regional Office)",
					coords: [3.1073, 101.6366],
					address: "Lorong 14/37B, Seksyen 14, Selangor 46100, Malaysia.",
					mapsUrl: "https://maps.google.com/?q=Seksyen+14+Selangor+46100+Malaysia"
				},
				{
					name: "Bangladesh Office",
					countryBadge: "Bangladesh (Branch Office)",
					coords: [23.7489, 90.4031],
					address: "136, New Circular Road, Bara Moghbazar, Dhaka - 1217, Flat # A1, Noorjahan Tower (2nd Floor), Dhaka 1217, Bangladesh.",
					mapsUrl: "https://maps.google.com/?q=Noorjahan+Tower+Bara+Moghbazar+Dhaka"
				},
				{
					name: "New Zealand Office",
					countryBadge: "New Zealand (Oceania Office)",
					coords: [-36.8688, 174.6534],
					address: "39 Kirby Street, Glendene, Auckland - 0602, New Zealand.",
					mapsUrl: "https://maps.google.com/?q=39+Kirby+Street+Glendene+Auckland"
				}
			];

			officeLocations.forEach(function(office) {
				var marker = L.marker(office.coords, {
					icon: gmapPinIcon,
					title: office.name
				}).addTo(map);

				var popupContent =
					'<div style="font-family: Roboto, Arial, sans-serif; min-width: 220px; max-width: 280px; padding: 2px;">' +
						'<div style="font-weight: 700; font-size: 15px; color: #1a73e8; margin-bottom: 2px;">' + office.name + '</div>' +
						'<div style="font-weight: 600; color: #5f6368; font-size: 12px; margin-bottom: 6px;">' + office.countryBadge + '</div>' +
						'<div style="color: #3c4043; font-size: 12px; line-height: 1.5; margin-bottom: 10px;">' + office.address + '</div>' +
						'<a href="' + office.mapsUrl + '" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; font-weight: 600; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">' +
							'View on Google Maps &rarr;' +
						'</a>' +
					'</div>';

				marker.bindPopup(popupContent);
			});

			// Map / Satellite Switcher
			var btnRoadmap = document.getElementById("btn-map-roadmap");
			var btnSatellite = document.getElementById("btn-map-satellite");

			if (btnRoadmap && btnSatellite) {
				btnRoadmap.addEventListener("click", function() {
					if (map.hasLayer(satelliteLayer)) {
						map.removeLayer(satelliteLayer);
					}
					if (!map.hasLayer(roadmapLayer)) {
						map.addLayer(roadmapLayer);
					}
					btnRoadmap.classList.add("active");
					btnSatellite.classList.remove("active");
				});

				btnSatellite.addEventListener("click", function() {
					if (map.hasLayer(roadmapLayer)) {
						map.removeLayer(roadmapLayer);
					}
					if (!map.hasLayer(satelliteLayer)) {
						map.addLayer(satelliteLayer);
					}
					btnSatellite.classList.add("active");
					btnRoadmap.classList.remove("active");
				});
			}

			// Fullscreen Button
			var btnFullscreen = document.getElementById("btn-map-fullscreen");
			var mapWrapper = document.querySelector(".contact-map-wrapper");

			if (btnFullscreen && mapWrapper) {
				btnFullscreen.addEventListener("click", function() {
					if (!document.fullscreenElement) {
						if (mapWrapper.requestFullscreen) {
							mapWrapper.requestFullscreen();
						} else if (mapWrapper.webkitRequestFullscreen) {
							mapWrapper.webkitRequestFullscreen();
						} else if (mapWrapper.msRequestFullscreen) {
							mapWrapper.msRequestFullscreen();
						}
					} else {
						if (document.exitFullscreen) {
							document.exitFullscreen();
						} else if (document.webkitExitFullscreen) {
							document.webkitExitFullscreen();
						} else if (document.msExitFullscreen) {
							document.msExitFullscreen();
						}
					}
				});

				document.addEventListener("fullscreenchange", function() {
					setTimeout(function() {
						map.invalidateSize();
					}, 200);
				});
			}

			// Compass Pan Buttons
			var panStep = 140;
			var btnPanUp = document.getElementById("btn-pan-up");
			var btnPanDown = document.getElementById("btn-pan-down");
			var btnPanLeft = document.getElementById("btn-pan-left");
			var btnPanRight = document.getElementById("btn-pan-right");

			if (btnPanUp) btnPanUp.addEventListener("click", function() { map.panBy([0, -panStep]); });
			if (btnPanDown) btnPanDown.addEventListener("click", function() { map.panBy([0, panStep]); });
			if (btnPanLeft) btnPanLeft.addEventListener("click", function() { map.panBy([-panStep, 0]); });
			if (btnPanRight) btnPanRight.addEventListener("click", function() { map.panBy([panStep, 0]); });

			// Zoom Buttons
			var btnZoomIn = document.getElementById("btn-map-zoom-in");
			var btnZoomOut = document.getElementById("btn-map-zoom-out");

			if (btnZoomIn) btnZoomIn.addEventListener("click", function() { map.zoomIn(); });
			if (btnZoomOut) btnZoomOut.addEventListener("click", function() { map.zoomOut(); });

			// Pegman Street View Button
			var btnPegman = document.getElementById("btn-map-pegman");
			if (btnPegman) {
				btnPegman.addEventListener("click", function() {
					window.open("https://www.google.com/maps/@-6.2130,106.8310,3a,75y,90t/data=!3m6!1e1", "_blank");
				});
			}

			window.addEventListener("resize", function() {
				map.invalidateSize();
			});
			setTimeout(function() {
				map.invalidateSize();
			}, 500);
		}

		if (typeof L !== "undefined") {
			setupMap();
		} else {
			window.addEventListener("load", setupMap);
		}
	}


	/* ==========================================================================
	   EXECUTION LIFECYCLE (Ready, Scroll, Load)
	   ========================================================================== */

	$(function() {
		directionswitch();
		enableMasonry();

		// Initialize Page-Specific Handlers
		initHomePage();
		initServicesPage();
		initDigitalTransformationAndTesting();
		initEliteItResources();
		initPlatformMasteryAccordions();
		initCareerPage();
		initContactPage();
	});

	$(window).on('scroll', function() {
		headerStyle();
		handleScrollbar();
		if ($(window).scrollTop() > 200) {
			$('.scroll-top-inner').addClass('visible');
		} else {
			$('.scroll-top-inner').removeClass('visible');
		}
	});

	$(window).on('load', function() {
		handlePreloader();
	});

})(window.jQuery);
